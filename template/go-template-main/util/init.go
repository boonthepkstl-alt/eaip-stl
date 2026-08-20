package util

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"strings"
	"sync"
	"time"

	nested "github.com/antonfisher/nested-logrus-formatter"
	rotatelogs "github.com/lestrrat/go-file-rotatelogs"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

var logFile = "/tmp/simple-services.log"
var logLevel = "DEBUG"
var logstashHookInstance *LogstashHook

// LogstashHook with auto-reconnection
type LogstashHook struct {
	address           string
	appName           string
	conn              net.Conn
	mu                sync.RWMutex
	connected         bool
	reconnectInterval time.Duration
	stopChan          chan struct{}
	lastAttempt       time.Time
}

func NewLogstashHook(address, appName string) *LogstashHook {
	hook := &LogstashHook{
		address:           address,
		appName:           appName,
		reconnectInterval: 10 * time.Second,
		stopChan:          make(chan struct{}),
	}

	// Try initial connection
	if err := hook.connect(); err != nil {
		log.Warnf("Initial Logstash connection failed: %v", err)
		log.Info("Starting background reconnection...")
	} else {
		log.Info("Connected to Logstash successfully")
	}

	// Start background reconnection routine
	go hook.reconnectLoop()

	return hook
}

func (h *LogstashHook) connect() error {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Close existing connection
	if h.conn != nil {
		h.conn.Close()
		h.conn = nil
	}

	conn, err := net.DialTimeout("tcp", h.address, 5*time.Second)
	if err != nil {
		h.connected = false
		h.lastAttempt = time.Now()
		return err
	}

	h.conn = conn
	h.connected = true
	h.lastAttempt = time.Now()

	return nil
}

func (h *LogstashHook) reconnectLoop() {
	ticker := time.NewTicker(h.reconnectInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			h.mu.RLock()
			isConnected := h.connected
			h.mu.RUnlock()

			if !isConnected {
				if err := h.connect(); err != nil {
					log.Debugf("Logstash reconnection failed: %v", err)
				} else {
					log.Info("Logstash reconnected successfully!")
				}
			}

		case <-h.stopChan:
			return
		}
	}
}

func (h *LogstashHook) Fire(entry *log.Entry) error {
	h.mu.RLock()
	conn := h.conn
	connected := h.connected
	h.mu.RUnlock()

	if !connected || conn == nil {
		return nil // Silent fail, don't block logging
	}

	// Prepare data
	data := map[string]interface{}{
		"@timestamp": entry.Time.Format(time.RFC3339),
		"message":    entry.Message,
		"level":      entry.Level.String(),
		"app":        h.appName,
		"appName":    h.appName,
		"host":       viper.GetString("MACHINE"),
	}

	for k, v := range entry.Data {
		data[k] = v
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil
	}
	jsonData = append(jsonData, '\n')

	// Try to write
	conn.SetWriteDeadline(time.Now().Add(3 * time.Second))
	_, err = conn.Write(jsonData)

	if err != nil {
		// Connection lost, mark as disconnected
		h.mu.Lock()
		h.connected = false
		if h.conn != nil {
			h.conn.Close()
			h.conn = nil
		}
		h.mu.Unlock()

		log.Debug("Lost connection to Logstash, will auto-reconnect...")

		// Try immediate reconnect (non-blocking)
		go func() {
			time.Sleep(100 * time.Millisecond)
			if err := h.connect(); err == nil {
				log.Debug("Quick reconnect to Logstash succeeded")
			}
		}()
	}

	return nil
}

func (h *LogstashHook) Levels() []log.Level {
	return log.AllLevels
}

func (h *LogstashHook) Close() error {
	close(h.stopChan)

	h.mu.Lock()
	defer h.mu.Unlock()

	if h.conn != nil {
		return h.conn.Close()
	}
	return nil
}

func (h *LogstashHook) IsConnected() bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.connected
}

func Init() {
	log.Infof("-= Init Env =-")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Error(err)
	}

	log.Infof("ENV_CONFIG => %s", viper.GetString("ENV"))
	log.Infof("INFISICAL => %s", viper.GetString("INFISICAL"))

	if strings.Compare("TRUE", viper.GetString("INFISICAL")) == 0 {
		GetInfisicalSecret(viper.GetString("INFISICAL_URL"),
			viper.GetString("INFISICAL_CLIENTID"),
			viper.GetString("INFISICAL_CLIENTSECRET"),
			viper.GetString("INFISICAL_SECRETKEY"),
			viper.GetString("INFISICAL_ENV"),
			viper.GetString("INFISICAL_PROJECTID"))
	}

	localIP, err := LocalIP()
	if err != nil {
		viper.Set("MACHINE", "127.0.0.1")
		localIP = net.ParseIP("127.0.0.1")
	}

	fmt.Println("local ip :", localIP)
	viper.Set("MACHINE", localIP.String())

	logLevel = viper.GetString("LOG_LEVEL")
	println("log:" + logLevel)

	// Set log level
	switch logLevel {
	case "DEBUG":
		log.SetLevel(log.DebugLevel)
	case "INFO":
		log.SetLevel(log.InfoLevel)
	case "WARN":
		log.SetLevel(log.WarnLevel)
	case "ERROR":
		log.SetLevel(log.ErrorLevel)
	default:
		log.SetLevel(log.ErrorLevel)
	}

	var mw io.Writer
	if len(viper.GetString("LOG_FILE")) > 1 {
		fmt.Println("log file :", viper.GetString("LOG_FILE"))
		logFile = viper.GetString("LOG_FILE")
		file, err := rotatelogs.New(
			fmt.Sprintf("%s.%s", logFile, "%Y-%m-%d"),
			rotatelogs.WithLinkName(logFile+".link"),
			rotatelogs.WithMaxAge(time.Hour*24*10),
			rotatelogs.WithRotationTime(time.Hour*24),
		)

		if err != nil {
			fmt.Printf("error opening file: %v", err)
			mw = io.MultiWriter(os.Stdout)
		} else {
			mw = io.MultiWriter(os.Stdout, file)
		}
	} else {
		fmt.Println("-= log to console =-")
		mw = io.MultiWriter(os.Stdout)
	}

	log.SetFormatter(&nested.Formatter{
		TimestampFormat: "2006-01-02 15:04:05.000",
		HideKeys:        true,
		NoColors:        false,
		FieldsOrder:     []string{"component", "function"},
	})

	log.SetOutput(mw)

	// Configure Logstash Hook with Auto-Reconnect
	logstashEnabled := strings.TrimSpace(viper.GetString("LOGSTASH_ENABLED"))
	if strings.EqualFold(logstashEnabled, "true") {
		logstashHost := strings.TrimSpace(viper.GetString("LOGSTASH_HOST"))
		logstashPort := strings.TrimSpace(viper.GetString("LOGSTASH_PORT"))
		appName := strings.TrimSpace(viper.GetString("APP_NAME"))

		if logstashHost == "" {
			logstashHost = "localhost"
		}
		if logstashPort == "" {
			logstashPort = "5044"
		}
		if appName == "" {
			appName = "simple-services"
		}

		logstashAddr := fmt.Sprintf("%s:%s", logstashHost, logstashPort)
		fmt.Printf("-= Configuring Logstash output: tcp://%s =-\n", logstashAddr)

		hook := NewLogstashHook(logstashAddr, appName)
		logstashHookInstance = hook
		log.AddHook(hook)

		// Optional: Custom reconnect interval
		if reconnectSec := viper.GetInt("LOGSTASH_RECONNECT_INTERVAL"); reconnectSec > 0 {
			hook.reconnectInterval = time.Duration(reconnectSec) * time.Second
		}

		// Test log after hook is added
		log.WithFields(log.Fields{
			"component": "init",
			"machine":   viper.GetString("MACHINE"),
		}).Info("Logstash hook configured with auto-reconnect")

		// Optional: Start health check logger
		go logstashHealthCheck(hook)
	}
}

// Optional: Periodic health check logging
func logstashHealthCheck(hook *LogstashHook) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if !hook.IsConnected() {
			log.Warn("Logstash health: DISCONNECTED (auto-reconnecting...)")
		}
	}
}

func LocalIP() (net.IP, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}
	for _, i := range ifaces {
		addrs, err := i.Addrs()
		if err != nil {
			return nil, err
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			if isPrivateIP(ip) {
				return ip, nil
			}
		}
	}

	return nil, errors.New("no IP")
}

func isPrivateIP(ip net.IP) bool {
	var privateIPBlocks []*net.IPNet
	for _, cidr := range []string{
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
	} {
		_, block, _ := net.ParseCIDR(cidr)
		privateIPBlocks = append(privateIPBlocks, block)
	}

	for _, block := range privateIPBlocks {
		if block.Contains(ip) {
			return true
		}
	}

	return false
}
