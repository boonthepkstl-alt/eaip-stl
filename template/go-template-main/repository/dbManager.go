package repository

import (
	"bufio"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	_ "github.com/lib/pq"
	_ "github.com/sijms/go-ora/v2"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"github.com/tarantool/go-tarantool/v2"
	"github.com/tarantool/go-tarantool/v2/pool"
)

// ── DBManager holds MSSQL and Oracle connections ─────────────────────────────
// PostgreSQL and Tarantool are managed via package-level dual pools that
// support hot-reload of replica membership without a service restart.
type DBManager struct {
	MSSQLDb  *sql.DB
	OracleDb *sql.DB
}

const (
	MSSQLConnStr  = "server=%s;user id=%s;password=%s;port=%d;database=%s;encrypt=disable"
	OracleConnStr = "oracle://%s:%s@%s:%d/%s"
)

type TxFn func(*sql.Tx) error

// ── Shared hot-config reload ──────────────────────────────────────────────────
// One file-mtime cache, one viper reload, covers all pools (TT + PG).

var (
	configReloadMu   sync.Mutex
	configReloadPath string
	configReloadTime time.Time
)

// hotConfigKeys lists every env key managed by the hot-reload mechanism.
// Only these keys are applied from the config file; all others stay as-is.
var hotConfigKeys = map[string]struct{}{
	// Tarantool
	"DB_TT_SERVER": {}, "DB_TT_PORT": {}, "DB_TT_REPLICAS": {},
	"DB_TT_USER": {}, "DB_TT_PASS": {}, "DB_TT_REPL_USER": {}, "DB_TT_REPL_PASS": {},
	// PostgreSQL
	"DB_PG_SERVER": {}, "DB_PG_PORT": {}, "DB_PG_REPLICAS": {},
	"DB_PG_USER": {}, "DB_PG_PASS": {}, "DB_PG_REPL_USER": {}, "DB_PG_REPL_PASS": {},
	"DB_PG_INST": {}, "DB_PG_SCHEMA": {}, "DB_PG_SSLMODE": {},
}

func parseEnvValue(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if unquoted, err := strconv.Unquote(value); err == nil {
		return unquoted
	}
	return strings.Trim(value, `"'`)
}

func applyHotConfigFileValues(configFile string) {
	file, err := os.Open(configFile)
	if err != nil {
		log.Warnf("hot-config override skipped; open %s failed: %v", configFile, err)
		return
	}
	defer file.Close()

	seen := make(map[string]struct{}, len(hotConfigKeys))
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if _, allowed := hotConfigKeys[key]; !allowed {
			continue
		}
		viper.Set(key, parseEnvValue(value))
		seen[key] = struct{}{}
	}
	if err := scanner.Err(); err != nil {
		log.Warnf("hot-config override read failed: %v", err)
	}
	// Clear replica lists if absent in the updated file
	for _, replicaKey := range []string{"DB_TT_REPLICAS", "DB_PG_REPLICAS"} {
		if _, ok := seen[replicaKey]; !ok {
			viper.Set(replicaKey, "")
		}
	}
}

// reloadConfigIfChanged re-reads the env file when its mtime changes, so
// DB_TT_REPLICAS / DB_PG_REPLICAS updates are picked up without a restart.
func reloadConfigIfChanged() {
	configFile := viper.ConfigFileUsed()
	if configFile == "" {
		return
	}
	info, err := os.Stat(configFile)
	if err != nil {
		log.Warnf("hot-config reload skipped; stat %s failed: %v", configFile, err)
		return
	}

	configReloadMu.Lock()
	defer configReloadMu.Unlock()

	if configFile == configReloadPath && info.ModTime().Equal(configReloadTime) {
		return
	}
	if err := viper.ReadInConfig(); err != nil {
		log.Warnf("hot-config reload skipped; read %s failed: %v", configFile, err)
		return
	}
	applyHotConfigFileValues(configFile)
	configReloadPath = configFile
	configReloadTime = info.ModTime()
	log.Infof("hot-config reloaded from %s (TT_REPLICAS=%s PG_REPLICAS=%s)",
		configFile,
		viper.GetString("DB_TT_REPLICAS"),
		viper.GetString("DB_PG_REPLICAS"),
	)
}

// ForceReloadConfig bypasses the mtime cache and immediately re-reads the
// config file. Next pool acquisition reconnects if membership changed.
func ForceReloadConfig() {
	configReloadMu.Lock()
	configReloadPath = ""
	configReloadTime = time.Time{}
	configReloadMu.Unlock()
	reloadConfigIfChanged()
}

// ── Tarantool dual-pool ───────────────────────────────────────────────────────
//
//	ttPool      writes  → pool.RW        (master only)   DB_TT_USER / DB_TT_PASS
//	ttReadPool  reads   → pool.PreferRO  (replica first) DB_TT_REPL_USER / DB_TT_REPL_PASS
//
// Falls back to single-credential / master-only when REPL_USER is empty.
const (
	ttDefaultPort    = "3301"
	ttCheckTimeout   = 3 * time.Second
	ttConnectTimeout = 5 * time.Second
	ttRequestTimeout = 1 * time.Second
	ttReconnectPause = 500 * time.Millisecond
	ttMaxReconnects  = 0
)

var (
	ttPool       *pool.ConnectionPool
	ttPoolConfig string
	ttReadPool   *pool.ConnectionPool
	ttReadConfig string
	ttPoolMu     sync.RWMutex
)

func ttAddrs() ([]string, error) {
	masterHost := viper.GetString("DB_TT_SERVER")
	masterPort := viper.GetString("DB_TT_PORT")
	replicas := viper.GetString("DB_TT_REPLICAS")
	if masterHost == "" {
		return nil, errors.New("missing DB_TT_SERVER")
	}
	if masterPort == "" {
		masterPort = ttDefaultPort
	}
	addrs := []string{fmt.Sprintf("%s:%s", masterHost, masterPort)}
	for _, r := range strings.Split(replicas, ",") {
		r = strings.TrimSpace(r)
		if r != "" {
			addrs = append(addrs, r)
		}
	}
	return addrs, nil
}

type ttLogger struct{}

func (ttLogger) Report(event tarantool.ConnLogKind, conn *tarantool.Connection, v ...interface{}) {
	switch event {
	case tarantool.LogReconnectFailed:
		if !viper.GetBool("TT_LOG_RECONNECT") {
			return
		}
		log.Debugf("tarantool: reconnect to %v failed: %v", conn.Addr(), v)
	case tarantool.LogLastReconnectFailed:
		log.Warnf("tarantool: last reconnect to %v failed: %v", conn.Addr(), v)
	default:
		log.Debugf("tarantool: conn event %d: %v", event, v)
	}
}

func ttInstances(addrs []string, user, pass string) []pool.Instance {
	opts := tarantool.Opts{
		Timeout:       ttRequestTimeout,
		Reconnect:     ttReconnectPause,
		MaxReconnects: ttMaxReconnects,
		Logger:        ttLogger{},
	}
	insts := make([]pool.Instance, 0, len(addrs))
	for _, a := range addrs {
		insts = append(insts, pool.Instance{
			Name:   a,
			Dialer: tarantool.NetDialer{Address: a, User: user, Password: pass},
			Opts:   opts,
		})
	}
	return insts
}

func ttReadCreds() (user, pass string, separate bool) {
	ru := viper.GetString("DB_TT_REPL_USER")
	rp := viper.GetString("DB_TT_REPL_PASS")
	if ru == "" {
		return viper.GetString("DB_TT_USER"), viper.GetString("DB_TT_PASS"), false
	}
	return ru, rp, true
}

func poolConfigKey(addrs []string, user, pass string) string {
	return strings.Join(addrs, "\x00") + "\x00" + user + "\x00" + pass
}

func ttConnected(p *pool.ConnectionPool) bool {
	if p == nil {
		return false
	}
	ok, _ := p.ConnectedNow(pool.ANY)
	return ok
}

func ttPoolUsable(p *pool.ConnectionPool, current, desired string) bool {
	return current == desired && ttConnected(p)
}

func ttDesiredConfig(user, pass string) ([]string, string, error) {
	addrs, err := ttAddrs()
	if err != nil {
		return nil, "", err
	}
	return addrs, poolConfigKey(addrs, user, pass), nil
}

func ttConnect(user, pass string, addrs []string) (*pool.ConnectionPool, error) {
	insts := ttInstances(addrs, user, pass)
	ctx, cancel := context.WithTimeout(context.Background(), ttConnectTimeout)
	defer cancel()
	return pool.ConnectWithOpts(ctx, insts, pool.Opts{CheckTimeout: ttCheckTimeout})
}

// GetTTPool returns the shared write pool (DB_TT_USER), lazily reconnecting.
func GetTTPool() (*pool.ConnectionPool, error) {
	reloadConfigIfChanged()
	user := viper.GetString("DB_TT_USER")
	pass := viper.GetString("DB_TT_PASS")
	addrs, desired, err := ttDesiredConfig(user, pass)
	if err != nil {
		return nil, err
	}

	ttPoolMu.RLock()
	if ttPoolUsable(ttPool, ttPoolConfig, desired) {
		p := ttPool
		ttPoolMu.RUnlock()
		return p, nil
	}
	ttPoolMu.RUnlock()

	ttPoolMu.Lock()
	defer ttPoolMu.Unlock()
	if ttPoolUsable(ttPool, ttPoolConfig, desired) {
		return ttPool, nil
	}
	oldPool := ttPool
	p, err := ttConnect(user, pass, addrs)
	if err != nil {
		log.Errorf("#### TT write pool connect failed: %v", err)
		if ttConnected(oldPool) {
			return oldPool, nil
		}
		if oldPool != nil {
			oldPool.Close()
		}
		ttPool, ttPoolConfig = nil, ""
		return nil, err
	}
	ttPool, ttPoolConfig = p, desired
	if oldPool != nil {
		oldPool.Close()
	}
	log.Infof("-= TT write pool connected (%d instances, user=%s): %s =-",
		len(addrs), user, strings.Join(addrs, ", "))
	return ttPool, nil
}

// GetTTReadPool returns the read pool (DB_TT_REPL_USER → pool.PreferRO).
// Aliases GetTTPool when no separate read user is configured.
func GetTTReadPool() (*pool.ConnectionPool, error) {
	reloadConfigIfChanged()
	user, pass, separate := ttReadCreds()
	if !separate {
		ttPoolMu.Lock()
		if ttReadPool != nil {
			ttReadPool.Close()
			ttReadPool, ttReadConfig = nil, ""
		}
		ttPoolMu.Unlock()
		return GetTTPool()
	}

	addrs, desired, err := ttDesiredConfig(user, pass)
	if err != nil {
		return nil, err
	}

	ttPoolMu.RLock()
	if ttPoolUsable(ttReadPool, ttReadConfig, desired) {
		p := ttReadPool
		ttPoolMu.RUnlock()
		return p, nil
	}
	ttPoolMu.RUnlock()

	ttPoolMu.Lock()
	defer ttPoolMu.Unlock()
	if ttPoolUsable(ttReadPool, ttReadConfig, desired) {
		return ttReadPool, nil
	}
	oldPool := ttReadPool
	p, err := ttConnect(user, pass, addrs)
	if err != nil {
		log.Errorf("#### TT read pool connect failed: %v", err)
		if ttConnected(oldPool) {
			return oldPool, nil
		}
		if oldPool != nil {
			oldPool.Close()
		}
		ttReadPool, ttReadConfig = nil, ""
		return nil, err
	}
	ttReadPool, ttReadConfig = p, desired
	if oldPool != nil {
		oldPool.Close()
	}
	log.Infof("-= TT read pool connected (%d instances, user=%s): %s =-",
		len(addrs), user, strings.Join(addrs, ", "))
	return ttReadPool, nil
}

// InitTT eagerly warms up both TT pools at startup.
func InitTT() {
	if strings.TrimSpace(viper.GetString("DB_TT_SERVER")) == "" {
		log.Info("Tarantool not configured; skipping pool init")
		return
	}
	if _, err := GetTTPool(); err != nil {
		log.Warnf("TT write pool unavailable at startup: %v", err)
	}
	if _, err := GetTTReadPool(); err != nil {
		log.Warnf("TT read pool unavailable at startup: %v", err)
	}
}

// CloseTTPool closes both TT pools gracefully.
func CloseTTPool() {
	ttPoolMu.Lock()
	defer ttPoolMu.Unlock()
	if ttReadPool != nil {
		log.Debug("-= closing TT read pool =-")
		ttReadPool.CloseGraceful()
		ttReadPool, ttReadConfig = nil, ""
	}
	if ttPool != nil {
		log.Debug("-= closing TT write pool =-")
		ttPool.CloseGraceful()
		ttPool, ttPoolConfig = nil, ""
	}
}

// ── PostgreSQL dual-pool ──────────────────────────────────────────────────────
//
//	pgWriteDb    writes  → master           DB_PG_USER / DB_PG_PASS
//	pgReadPools  reads   → replicas (RR)    DB_PG_REPL_USER / DB_PG_REPL_PASS
//
// DB_PG_REPLICAS: comma-separated "host:port" pairs.
// Falls back to master read when no replicas are configured.

// PGReadDB wraps a read *sql.DB with a human-readable label for logging.
type PGReadDB struct {
	DB    *sql.DB
	Label string // "MASTER" or "REPLICA:host:port"
}

// Write and read pools use separate mutexes so the read path can safely call
// GetPGWriteDb() for its master fallback without self-deadlocking on one RWMutex.
var (
	pgWriteDb   *sql.DB
	pgWriteConf string
	pgWriteMu   sync.RWMutex

	pgReadPools []*PGReadDB
	pgReadConf  string
	pgReadIdx   uint64
	pgReadMu    sync.RWMutex
)

// pgPoolTuning returns connection-pool sizing, env-overridable like Oracle.
func pgPoolTuning() (maxOpen, maxIdle int, maxLife, maxIdleTime time.Duration) {
	maxOpen = viper.GetInt("DB_PG_MAX_OPEN_CONNS")
	if maxOpen <= 0 {
		maxOpen = 100
	}
	maxIdle = viper.GetInt("DB_PG_MAX_IDLE_CONNS")
	if maxIdle <= 0 {
		maxIdle = 20
	}
	return maxOpen, maxIdle, 5 * time.Minute, 2 * time.Minute
}

// pgReadVerify reports whether each replica is health-checked before a read is
// routed to it. Defaults to true; set DB_PG_READ_VERIFY=false to skip the probe
// (one fewer round-trip per read, at the cost of read-time failover).
func pgReadVerify() bool {
	if !viper.IsSet("DB_PG_READ_VERIFY") {
		return true
	}
	return viper.GetBool("DB_PG_READ_VERIFY")
}

// pgReadPingTimeout is the per-replica health-check budget (DB_PG_READ_PING_MS).
func pgReadPingTimeout() time.Duration {
	if ms := viper.GetInt("DB_PG_READ_PING_MS"); ms > 0 {
		return time.Duration(ms) * time.Millisecond
	}
	return 800 * time.Millisecond
}

// pingDB runs a bounded liveness probe against a pooled *sql.DB.
func pingDB(db *sql.DB, timeout time.Duration) error {
	if db == nil {
		return errors.New("nil db handle")
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return db.PingContext(ctx)
}

func pgBuildConnStr(host string, port int, user, pass, db, sslMode, schema string) string {
	if sslMode == "" {
		sslMode = "disable"
	}
	if port == 0 {
		port = 5432
	}
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s search_path=%s",
		host, port, user, pass, db, sslMode, schema)
}

func pgMasterConnStr() string {
	return pgBuildConnStr(
		viper.GetString("DB_PG_SERVER"),
		viper.GetInt("DB_PG_PORT"),
		viper.GetString("DB_PG_USER"),
		viper.GetString("DB_PG_PASS"),
		viper.GetString("DB_PG_INST"),
		viper.GetString("DB_PG_SSLMODE"),
		viper.GetString("DB_PG_SCHEMA"),
	)
}

func pgWriteConfigKey() string {
	return strings.Join([]string{
		viper.GetString("DB_PG_SERVER"),
		viper.GetString("DB_PG_PORT"),
		viper.GetString("DB_PG_USER"),
		viper.GetString("DB_PG_PASS"),
		viper.GetString("DB_PG_INST"),
		viper.GetString("DB_PG_SSLMODE"),
		viper.GetString("DB_PG_SCHEMA"),
	}, "\x00")
}

func pgReadConfigKey() string {
	u, p, _ := pgReadCreds()
	return strings.Join([]string{
		viper.GetString("DB_PG_REPLICAS"),
		u, p,
		viper.GetString("DB_PG_INST"),
		viper.GetString("DB_PG_SSLMODE"),
		viper.GetString("DB_PG_SCHEMA"),
	}, "\x00")
}

func pgReadCreds() (user, pass string, separate bool) {
	ru := viper.GetString("DB_PG_REPL_USER")
	rp := viper.GetString("DB_PG_REPL_PASS")
	if ru == "" {
		return viper.GetString("DB_PG_USER"), viper.GetString("DB_PG_PASS"), false
	}
	return ru, rp, true
}

type pgReplicaInfo struct {
	connStr string
	label   string
}

func pgReplicaList() []pgReplicaInfo {
	raw := viper.GetString("DB_PG_REPLICAS")
	user, pass, _ := pgReadCreds()
	db := viper.GetString("DB_PG_INST")
	sslMode := viper.GetString("DB_PG_SSLMODE")
	schema := viper.GetString("DB_PG_SCHEMA")

	var list []pgReplicaInfo
	for _, r := range strings.Split(raw, ",") {
		r = strings.TrimSpace(r)
		if r == "" {
			continue
		}
		host := r
		port := 5432
		if idx := strings.LastIndex(r, ":"); idx > 0 {
			if p, err := strconv.Atoi(r[idx+1:]); err == nil {
				host = r[:idx]
				port = p
			}
		}
		list = append(list, pgReplicaInfo{
			connStr: pgBuildConnStr(host, port, user, pass, db, sslMode, schema),
			label:   fmt.Sprintf("REPLICA:%s:%d", host, port),
		})
	}
	return list
}

func openPGPool(connStr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	maxOpen, maxIdle, maxLife, maxIdleTime := pgPoolTuning()
	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)
	db.SetConnMaxLifetime(maxLife)
	db.SetConnMaxIdleTime(maxIdleTime)
	if err = db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

// GetPGWriteDb returns the master write pool, lazily reconnecting on config change.
func GetPGWriteDb() (*sql.DB, error) {
	reloadConfigIfChanged()
	desired := pgWriteConfigKey()

	pgWriteMu.RLock()
	if pgWriteDb != nil && pgWriteConf == desired {
		db := pgWriteDb
		pgWriteMu.RUnlock()
		return db, nil
	}
	pgWriteMu.RUnlock()

	pgWriteMu.Lock()
	defer pgWriteMu.Unlock()
	if pgWriteDb != nil && pgWriteConf == desired {
		return pgWriteDb, nil
	}

	db, err := openPGPool(pgMasterConnStr())
	if err != nil {
		log.Errorf("#### PG write pool connect failed: %v", err)
		if pgWriteDb != nil {
			log.Warn("Keeping existing PG write pool after rebuild failure")
			return pgWriteDb, nil
		}
		return nil, err
	}

	old := pgWriteDb
	pgWriteDb, pgWriteConf = db, desired
	if old != nil {
		old.Close()
	}
	log.Infof("-= PG write pool connected to %s =-", viper.GetString("DB_PG_SERVER"))
	return pgWriteDb, nil
}

// masterAsRead returns the master pool tagged as a read source. Must be called
// WITHOUT holding pgReadMu, since GetPGWriteDb takes pgWriteMu independently.
func masterAsRead() (*PGReadDB, error) {
	db, err := GetPGWriteDb()
	if err != nil {
		return nil, err
	}
	return &PGReadDB{DB: db, Label: "MASTER"}, nil
}

// pickLivePGRead rotates round-robin across the snapshot and returns the first
// replica that passes its health check (or the next candidate if verify is off).
// Returns nil only when every replica is unusable.
func pickLivePGRead(pools []*PGReadDB) *PGReadDB {
	n := len(pools)
	if n == 0 {
		return nil
	}
	verify := pgReadVerify()
	timeout := pgReadPingTimeout()
	start := atomic.AddUint64(&pgReadIdx, 1)
	for i := 0; i < n; i++ {
		p := pools[(start+uint64(i))%uint64(n)]
		if p == nil || p.DB == nil {
			continue
		}
		if !verify {
			return p
		}
		if err := pingDB(p.DB, timeout); err == nil {
			return p
		}
		log.Warnf("PG read replica %s failed health check; trying next", p.Label)
	}
	return nil
}

// GetPGReadDB returns a read pool round-robined across healthy replicas
// (REPLICA:host:port), falling back to master (MASTER) when no replicas are
// configured or every replica is currently unreachable. Cached replica pools are
// retained during an outage so reads recover automatically once a replica returns.
func GetPGReadDB() (*PGReadDB, error) {
	reloadConfigIfChanged()
	desired := pgReadConfigKey()

	pgReadMu.RLock()
	matched := pgReadConf == desired
	pools := pgReadPools
	pgReadMu.RUnlock()

	if matched && len(pools) > 0 {
		if p := pickLivePGRead(pools); p != nil {
			return p, nil
		}
		log.Warn("All PG replicas failed health check; serving reads from master")
		return masterAsRead()
	}

	// No replicas configured → alias master
	if strings.TrimSpace(viper.GetString("DB_PG_REPLICAS")) == "" {
		return masterAsRead()
	}

	// Build new replica pools under the write barrier, then release before any
	// master fallback so we never hold pgReadMu across a GetPGWriteDb call.
	pgReadMu.Lock()
	if pgReadConf == desired && len(pgReadPools) > 0 {
		p := pickLivePGRead(pgReadPools)
		pgReadMu.Unlock()
		if p != nil {
			return p, nil
		}
		log.Warn("All PG replicas failed health check; serving reads from master")
		return masterAsRead()
	}

	replicas := pgReplicaList()
	var newPools []*PGReadDB
	for _, r := range replicas {
		db, err := openPGPool(r.connStr)
		if err != nil {
			log.Warnf("PG read pool connect failed for %s: %v", r.label, err)
			continue
		}
		newPools = append(newPools, &PGReadDB{DB: db, Label: r.label})
	}

	// Close stale read pools
	for _, p := range pgReadPools {
		if p != nil && p.DB != nil {
			p.DB.Close()
		}
	}

	if len(newPools) == 0 {
		pgReadPools, pgReadConf = nil, ""
		pgReadMu.Unlock()
		log.Warn("All PG replicas unreachable; falling back to master for reads")
		return masterAsRead()
	}

	pgReadPools, pgReadConf = newPools, desired
	labels := make([]string, len(newPools))
	for i, p := range newPools {
		labels[i] = p.Label
	}
	p := pickLivePGRead(pgReadPools)
	pgReadMu.Unlock()

	log.Infof("-= PG read pools connected: %s =-", strings.Join(labels, ", "))
	if p != nil {
		return p, nil
	}
	log.Warn("Freshly built PG replicas all failed health check; serving reads from master")
	return masterAsRead()
}

// InitPG eagerly warms up both PG pools at startup.
func InitPG() {
	if strings.TrimSpace(viper.GetString("DB_PG_SERVER")) == "" {
		log.Info("PostgreSQL not configured; skipping pool init")
		return
	}
	if _, err := GetPGWriteDb(); err != nil {
		log.Warnf("PG write pool unavailable at startup: %v", err)
	}
	if _, err := GetPGReadDB(); err != nil {
		log.Warnf("PG read pool unavailable at startup: %v", err)
	}
}

// ClosePGPools closes all PG pools gracefully.
func ClosePGPools() {
	pgReadMu.Lock()
	for _, p := range pgReadPools {
		if p != nil && p.DB != nil {
			p.DB.Close()
		}
	}
	pgReadPools, pgReadConf = nil, ""
	pgReadMu.Unlock()

	pgWriteMu.Lock()
	if pgWriteDb != nil {
		pgWriteDb.Close()
		pgWriteDb, pgWriteConf = nil, ""
	}
	pgWriteMu.Unlock()
	log.Debug("-= PG pools closed =-")
}

// ── MSSQL / Oracle pool constructors ─────────────────────────────────────────

func InitMSSQLPool() (*sql.DB, error) {
	server := viper.GetString("DB_MSSQL_SERVER")
	user := viper.GetString("DB_MSSQL_USER")
	password := viper.GetString("DB_MSSQL_PASS")
	database := viper.GetString("DB_MSSQL_INST")
	port := viper.GetInt("DB_MSSQL_PORT")

	connString := fmt.Sprintf(MSSQLConnStr, server, user, password, port, database)
	log.Infof("-= Initializing MS SQL Connection Pool to %s =-", server)

	db, err := sql.Open("sqlserver", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to create MS SQL pool: %w", err)
	}
	db.SetMaxOpenConns(100)
	db.SetMaxIdleConns(20)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	if err = db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping MS SQL: %w", err)
	}
	log.Info("-= MS SQL Connection Pool initialized successfully =-")
	return db, nil
}

func InitOraclePoolWithOptions() (*sql.DB, error) {
	server := viper.GetString("DB_ORACLE_SERVER")
	user := viper.GetString("DB_ORACLE_USER")
	password := viper.GetString("DB_ORACLE_PASS")
	serviceName := viper.GetString("DB_ORACLE_SERVICE")
	port := viper.GetInt("DB_ORACLE_PORT")
	if port == 0 {
		port = 1521
	}

	connString := fmt.Sprintf(OracleConnStr, user, password, server, port, serviceName)
	log.Infof("-= Initializing Oracle Connection Pool to %s =-", server)

	db, err := sql.Open("oracle", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to create Oracle pool: %w", err)
	}

	maxOpen := viper.GetInt("DB_ORACLE_MAX_OPEN_CONNS")
	maxIdle := viper.GetInt("DB_ORACLE_MAX_IDLE_CONNS")
	if maxOpen == 0 {
		maxOpen = 100
	}
	if maxIdle == 0 {
		maxIdle = 20
	}
	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	if err = db.PingContext(context.Background()); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping Oracle: %w", err)
	}
	log.Info("-= Oracle Connection Pool initialized successfully =-")
	return db, nil
}

// InitTarantoolPool connects and returns the shared Tarantool write pool.
// Convenience wrapper for test setup.
func InitTarantoolPool() (*pool.ConnectionPool, error) {
	return GetTTPool()
}

// InitPostgresPool connects and returns the shared PostgreSQL write pool.
// Convenience wrapper for test setup.
func InitPostgresPool() (*sql.DB, error) {
	return GetPGWriteDb()
}

// ── DBManager ─────────────────────────────────────────────────────────────────

func NewDBManager(MSSQLDb *sql.DB, OracleDb *sql.DB) *DBManager {
	return &DBManager{
		MSSQLDb:  MSSQLDb,
		OracleDb: OracleDb,
	}
}

func (m *DBManager) Close() {
	log.Info("-= Shutting down database connections =-")
	if m.MSSQLDb != nil {
		m.MSSQLDb.Close()
	}
	if m.OracleDb != nil {
		m.OracleDb.Close()
	}
	ClosePGPools()
	CloseTTPool()
}

func (m *DBManager) GetMSSQLDb() *sql.DB  { return m.MSSQLDb }
func (m *DBManager) GetOracleDb() *sql.DB { return m.OracleDb }

func (m *DBManager) Health() map[string]string {
	status := make(map[string]string)

	if m.MSSQLDb != nil {
		if err := m.MSSQLDb.Ping(); err != nil {
			status["mssql"] = "unhealthy: " + err.Error()
		} else {
			status["mssql"] = "healthy"
		}
	} else {
		status["mssql"] = "not configured"
	}

	if m.OracleDb != nil {
		if err := m.OracleDb.Ping(); err != nil {
			status["oracle"] = "unhealthy: " + err.Error()
		} else {
			status["oracle"] = "healthy"
		}
	} else {
		status["oracle"] = "not configured"
	}

	// PostgreSQL: ping write pool
	if pgDb, err := GetPGWriteDb(); err != nil {
		status["postgres"] = "not configured"
	} else if err := pgDb.Ping(); err != nil {
		status["postgres"] = "unhealthy: " + err.Error()
	} else {
		status["postgres"] = "healthy"
		// Report read pool count, actively pinging each replica.
		pgReadMu.RLock()
		pools := pgReadPools
		pgReadMu.RUnlock()
		if len(pools) == 0 {
			status["postgres_replicas"] = "none (reads via master)"
		} else {
			healthy := 0
			for _, p := range pools {
				if p != nil && pingDB(p.DB, pgReadPingTimeout()) == nil {
					healthy++
				}
			}
			status["postgres_replicas"] = fmt.Sprintf("%d/%d replica(s) healthy", healthy, len(pools))
		}
	}

	// Tarantool: ping write pool
	if p, err := GetTTPool(); err != nil {
		status["tarantool"] = "not configured"
	} else {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		req := tarantool.NewPingRequest().Context(ctx)
		if _, pingErr := p.Do(req, pool.ANY).Get(); pingErr != nil {
			status["tarantool"] = "unhealthy: " + pingErr.Error()
		} else {
			status["tarantool"] = "healthy"
		}
	}

	return status
}

func (m *DBManager) WithTransaction(db *sql.DB, fn TxFn) (err error) {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if p := recover(); p != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				log.Errorf("tx rollback after panic failed: %v", rbErr)
			}
			panic(p) // re-raise so the panic is never silently swallowed
		}
	}()
	if err = fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("%w (rollback failed: %v)", err, rbErr)
		}
		return err
	}
	return tx.Commit()
}
