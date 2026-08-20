package repository

import (
	"context"
	"fmt"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"

	"github.com/blockloop/scan"
)

type SampleOracleRepository interface {
	GetSomeOracleData(id string) (model.SampleModel, error)
	AddSomeOracleData(someData model.SampleModel) (string, error)
	UpdateSomeOracleData(id string, someData model.SampleModel) (string, error)
	DeleteSomeOracleData(id string) (string, error)
	ListSomeOracleData(page, limit int) ([]model.SampleModel, int, error)
}

type sampleOracleRepository struct {
	DBManager *DBManager
}

func NewSampleOracleRepository(dbManager *DBManager) SampleOracleRepository {
	return &sampleOracleRepository{
		DBManager: dbManager,
	}
}

func (r *sampleOracleRepository) GetSomeOracleData(id string) (model.SampleModel, error) {
	log := logger.GetLogger()
	log.Debugf("input ==>%s ", id)

	db := r.DBManager.GetOracleDb()
	if db == nil {
		return model.SampleModel{}, fmt.Errorf("oracle connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return model.SampleModel{}, err
	}

	rows, err := db.QueryContext(ctx, model.SQL_simple_oracle_get_data, id)
	if err != nil {
		log.Errorf(" %#v", err)
		return model.SampleModel{}, err
	}
	defer rows.Close()

	var someData model.SampleModel
	err = scan.Row(&someData, rows)
	if err != nil {
		log.Errorf(" %#v", err)
		return model.SampleModel{}, err
	}
	log.Infof("data %#v", someData)

	return someData, nil
}

func (r *sampleOracleRepository) AddSomeOracleData(someData model.SampleModel) (string, error) {
	log := logger.GetLogger()

	log.Debugf("input : %v", someData)
	db := r.DBManager.GetOracleDb()
	if db == nil {
		return "ERROR", fmt.Errorf("oracle connection not available")
	}

	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return "NONE", err
	}

	stmt, err := db.Prepare(model.SQL_simple_oracle_add)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	_, err = stmt.Exec(someData.ID, someData.Column1, someData.Column2)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}

	return "COMPLETE", nil
}

func (r *sampleOracleRepository) UpdateSomeOracleData(id string, someData model.SampleModel) (string, error) {
	log := logger.GetLogger()
	log.Debugf("update id: %s, data: %v", id, someData)

	db := r.DBManager.GetOracleDb()
	if db == nil {
		return "ERROR", fmt.Errorf("oracle connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return "NONE", err
	}

	stmt, err := db.PrepareContext(ctx, model.SQL_simple_oracle_update)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	result, err := stmt.ExecContext(ctx, someData.Column1, someData.Column2, id)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return "ERROR", err
	}
	if rowsAffected == 0 {
		return "NOT_FOUND", nil
	}

	return "COMPLETE", nil
}

func (r *sampleOracleRepository) DeleteSomeOracleData(id string) (string, error) {
	log := logger.GetLogger()
	log.Debugf("delete id: %s", id)

	db := r.DBManager.GetOracleDb()
	if db == nil {
		return "ERROR", fmt.Errorf("oracle connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return "NONE", err
	}

	stmt, err := db.PrepareContext(ctx, model.SQL_simple_oracle_delete)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	result, err := stmt.ExecContext(ctx, id)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return "ERROR", err
	}
	if rowsAffected == 0 {
		return "NOT_FOUND", nil
	}

	return "COMPLETE", nil
}

func (r *sampleOracleRepository) ListSomeOracleData(page, limit int) ([]model.SampleModel, int, error) {
	log := logger.GetLogger()
	log.Debugf("list page: %d, limit: %d", page, limit)

	db := r.DBManager.GetOracleDb()
	if db == nil {
		return nil, 0, fmt.Errorf("oracle connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return nil, 0, err
	}

	var total int
	err = db.QueryRowContext(ctx, model.SQL_simple_oracle_count).Scan(&total)
	if err != nil {
		log.Errorf("count query: %#v", err)
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := db.QueryContext(ctx, model.SQL_simple_oracle_list, offset, limit)
	if err != nil {
		log.Errorf(" %#v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var items []model.SampleModel
	err = scan.Rows(&items, rows)
	if err != nil {
		log.Errorf(" %#v", err)
		return nil, 0, err
	}

	return items, total, nil
}
