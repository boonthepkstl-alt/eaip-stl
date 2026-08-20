package repository

import (
	"context"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"

	"github.com/blockloop/scan"
)

type SamplePGRepository interface {
	GetSomePGData(id string) (model.SampleModel, error)
	AddSomePGData(someData model.SampleModel) (string, error)
	UpdateSomePGData(id string, someData model.SampleModel) (string, error)
	DeleteSomePGData(id string) (string, error)
	ListSomePGData(page, limit int) ([]model.SampleModel, int, error)
}

type samplePGRepository struct{}

func NewSamplePGRepository() SamplePGRepository {
	return &samplePGRepository{}
}

// ── Read operations (replica first, fallback master) ─────────────────────────

func (r *samplePGRepository) GetSomePGData(id string) (model.SampleModel, error) {
	log := logger.GetLogger()
	log.Debugf("PG get id=%s", id)

	rdb, err := GetPGReadDB()
	if err != nil {
		return model.SampleModel{}, err
	}

	rows, err := rdb.DB.QueryContext(context.Background(), model.SQL_simple_pg_get_data, id)
	if err != nil {
		log.Errorf("PG get query: %v", err)
		return model.SampleModel{}, err
	}
	defer rows.Close()

	var someData model.SampleModel
	if err = scan.Row(&someData, rows); err != nil {
		log.Errorf("PG get scan: %v", err)
		return model.SampleModel{}, err
	}

	log.Infof("read served by %s (get id=%s)", rdb.Label, id)
	return someData, nil
}

func (r *samplePGRepository) ListSomePGData(page, limit int) ([]model.SampleModel, int, error) {
	log := logger.GetLogger()
	log.Debugf("PG list page=%d limit=%d", page, limit)

	rdb, err := GetPGReadDB()
	if err != nil {
		return nil, 0, err
	}
	ctx := context.Background()

	var total int
	if err = rdb.DB.QueryRowContext(ctx, model.SQL_simple_pg_count).Scan(&total); err != nil {
		log.Errorf("PG count query: %v", err)
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := rdb.DB.QueryContext(ctx, model.SQL_simple_pg_list, limit, offset)
	if err != nil {
		log.Errorf("PG list query: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var items []model.SampleModel
	if err = scan.Rows(&items, rows); err != nil {
		log.Errorf("PG list scan: %v", err)
		return nil, 0, err
	}

	log.Infof("read served by %s (list page=%d limit=%d total=%d)", rdb.Label, page, limit, total)
	return items, total, nil
}

// ── Write operations (master only) ───────────────────────────────────────────

func (r *samplePGRepository) AddSomePGData(someData model.SampleModel) (string, error) {
	log := logger.GetLogger()
	log.Debugf("PG add id=%s", someData.ID)

	db, err := GetPGWriteDb()
	if err != nil {
		return "ERROR", err
	}

	stmt, err := db.Prepare(model.SQL_simple_pg_add)
	if err != nil {
		log.Errorf("PG add prepare: %v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	if _, err = stmt.Exec(someData.ID, someData.Column1, someData.Column2); err != nil {
		log.Errorf("PG add exec: %v", err)
		return "ERROR", err
	}

	log.Infof("write served by MASTER (add id=%s)", someData.ID)
	return "COMPLETE", nil
}

func (r *samplePGRepository) UpdateSomePGData(id string, someData model.SampleModel) (string, error) {
	log := logger.GetLogger()
	log.Debugf("PG update id=%s", id)

	db, err := GetPGWriteDb()
	if err != nil {
		return "ERROR", err
	}
	ctx := context.Background()

	stmt, err := db.PrepareContext(ctx, model.SQL_simple_pg_update)
	if err != nil {
		log.Errorf("PG update prepare: %v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	result, err := stmt.ExecContext(ctx, someData.Column1, someData.Column2, id)
	if err != nil {
		log.Errorf("PG update exec: %v", err)
		return "ERROR", err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return "ERROR", err
	}
	if rowsAffected == 0 {
		return "NOT_FOUND", nil
	}

	log.Infof("write served by MASTER (update id=%s)", id)
	return "COMPLETE", nil
}

func (r *samplePGRepository) DeleteSomePGData(id string) (string, error) {
	log := logger.GetLogger()
	log.Debugf("PG delete id=%s", id)

	db, err := GetPGWriteDb()
	if err != nil {
		return "ERROR", err
	}
	ctx := context.Background()

	stmt, err := db.PrepareContext(ctx, model.SQL_simple_pg_delete)
	if err != nil {
		log.Errorf("PG delete prepare: %v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	result, err := stmt.ExecContext(ctx, id)
	if err != nil {
		log.Errorf("PG delete exec: %v", err)
		return "ERROR", err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return "ERROR", err
	}
	if rowsAffected == 0 {
		return "NOT_FOUND", nil
	}

	log.Infof("write served by MASTER (delete id=%s)", id)
	return "COMPLETE", nil
}
