package repository

import (
	"context"
	"database/sql"
	"fmt"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"

	"github.com/blockloop/scan"
)

type SampleMSSQLRepository interface {
	GetSomeMSSQLData(id string) (model.SampleModel, error)
	AddSomeMSSQLData(someData model.SampleModel) (string, error)
	UpdateSomeMSSQLData(id string, someData model.SampleModel) (string, error)
	DeleteSomeMSSQLData(id string) (string, error)
	ListSomeMSSQLData(page, limit int) ([]model.SampleModel, int, error)
}

type sampleMSSQLRepository struct {
	DBManager *DBManager
}

func NewSampleMSSQLRepository(dbManager *DBManager) SampleMSSQLRepository {
	return &sampleMSSQLRepository{
		DBManager: dbManager,
	}
}

func (r *sampleMSSQLRepository) GetSomeMSSQLData(id string) (model.SampleModel, error) {
	log := logger.GetLogger()
	log.Debugf("input ==>%s ", id)

	db := r.DBManager.GetMSSQLDb()
	if db == nil {
		return model.SampleModel{}, fmt.Errorf("mssql connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return model.SampleModel{}, err
	}

	rows, err := db.QueryContext(ctx, model.SQL_simple_mssql_get_data, sql.Named("id", id))
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

func (r *sampleMSSQLRepository) AddSomeMSSQLData(someData model.SampleModel) (string, error) {
	log := logger.GetLogger()

	log.Debugf("input : %v", someData)
	db := r.DBManager.GetMSSQLDb()
	if db == nil {
		return "ERROR", fmt.Errorf("mssql connection not available")
	}

	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return "NONE", err
	}

	stmt, err := db.Prepare(model.SQL_simple_mssql_add)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	_, err = stmt.Exec(
		sql.Named("id", someData.ID),
		sql.Named("column1", someData.Column1),
		sql.Named("column2", someData.Column2))
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}

	return "COMPLETE", nil
}

func (r *sampleMSSQLRepository) UpdateSomeMSSQLData(id string, someData model.SampleModel) (string, error) {
	log := logger.GetLogger()
	log.Debugf("update id: %s, data: %v", id, someData)

	db := r.DBManager.GetMSSQLDb()
	if db == nil {
		return "ERROR", fmt.Errorf("mssql connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return "NONE", err
	}

	stmt, err := db.PrepareContext(ctx, model.SQL_simple_mssql_update)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	result, err := stmt.ExecContext(ctx,
		sql.Named("column1", someData.Column1),
		sql.Named("column2", someData.Column2),
		sql.Named("id", id))
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

func (r *sampleMSSQLRepository) DeleteSomeMSSQLData(id string) (string, error) {
	log := logger.GetLogger()
	log.Debugf("delete id: %s", id)

	db := r.DBManager.GetMSSQLDb()
	if db == nil {
		return "ERROR", fmt.Errorf("mssql connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return "NONE", err
	}

	stmt, err := db.PrepareContext(ctx, model.SQL_simple_mssql_delete)
	if err != nil {
		log.Errorf(" %#v", err)
		return "ERROR", err
	}
	defer stmt.Close()

	result, err := stmt.ExecContext(ctx, sql.Named("id", id))
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

func (r *sampleMSSQLRepository) ListSomeMSSQLData(page, limit int) ([]model.SampleModel, int, error) {
	log := logger.GetLogger()
	log.Debugf("list page: %d, limit: %d", page, limit)

	db := r.DBManager.GetMSSQLDb()
	if db == nil {
		return nil, 0, fmt.Errorf("mssql connection not available")
	}
	ctx := context.Background()

	err := db.PingContext(ctx)
	if err != nil {
		log.Errorf("#%v", err)
		return nil, 0, err
	}

	var total int
	err = db.QueryRowContext(ctx, model.SQL_simple_mssql_count).Scan(&total)
	if err != nil {
		log.Errorf("count query: %#v", err)
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := db.QueryContext(ctx, model.SQL_simple_mssql_list,
		sql.Named("offset", offset),
		sql.Named("limit", limit))
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
