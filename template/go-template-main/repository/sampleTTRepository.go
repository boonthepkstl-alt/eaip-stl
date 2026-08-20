package repository

import (
	"context"
	"fmt"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"
	"time"

	"github.com/tarantool/go-tarantool/v2"
	"github.com/tarantool/go-tarantool/v2/pool"
)

// Read requests prefer a replica; fall back to master only when no replica is
// available. Writes go to master only.
const (
	ttReadMode  = pool.PreferRO
	ttWriteMode = pool.RW
)

// ttReadEvalLua runs SQL on whichever node the pool picked and returns the
// serving node's role (box.info.ro), its identity, and the result rows.
// Params are bound by box.execute — no SQL injection.
const ttReadEvalLua = `local sql, params = ...
local res, err = box.execute(sql, params)
if err ~= nil then error(err) end
return box.info.ro, (os.getenv("TARANTOOL_INSTANCE_NAME") or box.info.uuid), res.rows`

// evalRead executes a SELECT via the read pool (PreferRO) and logs whether the
// serving node was a REPLICA or the MASTER.
func evalRead(sql string, args []interface{}) ([]interface{}, error) {
	log := logger.GetLogger()

	p, err := GetTTReadPool()
	if err != nil {
		return nil, fmt.Errorf("tarantool read pool not available: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := tarantool.NewEvalRequest(ttReadEvalLua).
		Args([]interface{}{sql, args}).
		Context(ctx)

	data, err := p.Do(req, ttReadMode).Get()
	if err != nil {
		log.Errorf("TT read failed: %v", err)
		return nil, err
	}

	// data[0] = box.info.ro (bool), data[1] = instance name, data[2] = rows
	role := "MASTER"
	if len(data) > 0 {
		if ro, ok := data[0].(bool); ok && ro {
			role = "REPLICA"
		}
	}
	node := "unknown"
	if len(data) > 1 {
		if name, ok := data[1].(string); ok && name != "" {
			node = name
		}
	}
	log.Infof("read served by %s (%s)", role, node)

	if len(data) > 2 {
		if rows, ok := data[2].([]interface{}); ok {
			return rows, nil
		}
	}
	return nil, nil
}

func decodeTuple(row interface{}) (model.SampleModel, bool) {
	tuple, ok := row.([]interface{})
	if !ok || len(tuple) < 3 {
		return model.SampleModel{}, false
	}
	return model.SampleModel{
		ID:      fmt.Sprintf("%s", tuple[0]),
		Column1: fmt.Sprintf("%s", tuple[1]),
		Column2: fmt.Sprintf("%s", tuple[2]),
	}, true
}

// ── Interface & constructor ──────────────────────────────────────────────────

type SampleTTRepository interface {
	GetSomeTTData(id string) (model.SampleModel, error)
	AddSomeTTData(someData model.SampleModel) (string, error)
	UpdateSomeTTData(id string, someData model.SampleModel) (string, error)
	DeleteSomeTTData(id string) (string, error)
	ListSomeTTData(page, limit int) ([]model.SampleModel, int, error)
}

type sampleTTRepository struct{}

func NewSampleTTRepository() SampleTTRepository {
	return &sampleTTRepository{}
}

// ── Read operations (pool.PreferRO → replica first) ─────────────────────────

func (r *sampleTTRepository) GetSomeTTData(id string) (model.SampleModel, error) {
	log := logger.GetLogger()
	log.Debugf("TT get id=%s", id)

	rows, err := evalRead(model.SQL_simple_tt_get_data, []interface{}{id})
	if err != nil {
		return model.SampleModel{}, err
	}
	for _, row := range rows {
		if item, ok := decodeTuple(row); ok {
			return item, nil
		}
	}
	return model.SampleModel{}, nil
}

func (r *sampleTTRepository) ListSomeTTData(page, limit int) ([]model.SampleModel, int, error) {
	log := logger.GetLogger()
	log.Debugf("TT list page=%d limit=%d", page, limit)

	countRows, err := evalRead(model.SQL_simple_tt_count, []interface{}{})
	if err != nil {
		return nil, 0, err
	}

	var total int
	if len(countRows) > 0 {
		if tuple, ok := countRows[0].([]interface{}); ok && len(tuple) > 0 {
			switch v := tuple[0].(type) {
			case uint64:
				total = int(v)
			case int64:
				total = int(v)
			case int32:
				total = int(v)
			case int16:
				total = int(v)
			case int8:
				total = int(v)
			case int:
				total = v
			}
		}
	}

	offset := (page - 1) * limit
	listRows, err := evalRead(model.SQL_simple_tt_list, []interface{}{limit, offset})
	if err != nil {
		return nil, 0, err
	}

	var items []model.SampleModel
	for _, row := range listRows {
		if item, ok := decodeTuple(row); ok {
			items = append(items, item)
		}
	}
	return items, total, nil
}

// ── Write operations (pool.RW → master only) ─────────────────────────────────

func (r *sampleTTRepository) AddSomeTTData(someData model.SampleModel) (string, error) {
	log := logger.GetLogger()
	log.Infof("TT add id=%s", someData.ID)

	p, err := GetTTPool()
	if err != nil {
		return "ERROR", fmt.Errorf("tarantool write pool not available: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tuple := []interface{}{someData.ID, someData.Column1, someData.Column2}
	req := tarantool.NewInsertRequest("SAMPLEMODEL").Tuple(tuple).Context(ctx)

	if _, err := p.Do(req, ttWriteMode).Get(); err != nil {
		log.Errorf("TT insert failed: %v", err)
		return "ERROR", err
	}
	log.Infof("write served by MASTER (add id=%s)", someData.ID)
	return "OK", nil
}

func (r *sampleTTRepository) UpdateSomeTTData(id string, someData model.SampleModel) (string, error) {
	log := logger.GetLogger()
	log.Debugf("TT update id=%s", id)

	p, err := GetTTPool()
	if err != nil {
		return "ERROR", fmt.Errorf("tarantool write pool not available: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := tarantool.NewExecuteRequest(model.SQL_simple_tt_update).
		Args([]interface{}{someData.Column1, someData.Column2, id}).
		Context(ctx)

	if _, err := p.Do(req, ttWriteMode).GetResponse(); err != nil {
		log.Errorf("TT update failed: %v", err)
		return "ERROR", err
	}
	log.Infof("write served by MASTER (update id=%s)", id)
	return "COMPLETE", nil
}

func (r *sampleTTRepository) DeleteSomeTTData(id string) (string, error) {
	log := logger.GetLogger()
	log.Debugf("TT delete id=%s", id)

	p, err := GetTTPool()
	if err != nil {
		return "ERROR", fmt.Errorf("tarantool write pool not available: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := tarantool.NewExecuteRequest(model.SQL_simple_tt_delete).
		Args([]interface{}{id}).
		Context(ctx)

	if _, err := p.Do(req, ttWriteMode).GetResponse(); err != nil {
		log.Errorf("TT delete failed: %v", err)
		return "ERROR", err
	}
	log.Infof("write served by MASTER (delete id=%s)", id)
	return "COMPLETE", nil
}
