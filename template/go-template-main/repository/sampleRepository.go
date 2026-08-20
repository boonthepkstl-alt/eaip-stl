package repository

import "singer/go-template-new-2026-06/model"

// SampleRepository is a facade aggregating all DB-specific repositories.
// Primary CRUD operations are delegated to PostgreSQL.
// Per-DB methods (TTAdd, PGAdd, etc.) are available for cross-DB use cases.
type SampleRepository interface {
	// Primary CRUD (PostgreSQL)
	Create(someData model.SampleModel) (string, error)
	GetByID(id string) (model.SampleModel, error)
	Update(id string, someData model.SampleModel) (string, error)
	Delete(id string) (string, error)
	List(page, limit int) ([]model.SampleModel, int, error)

	// Per-database access
	TTAdd(someData model.SampleModel) (string, error)
	TTGet(id string) (model.SampleModel, error)
	PGAdd(someData model.SampleModel) (string, error)
	PGGet(id string) (model.SampleModel, error)
	OracleAdd(someData model.SampleModel) (string, error)
	OracleGet(id string) (model.SampleModel, error)
	MSSQLAdd(someData model.SampleModel) (string, error)
	MSSQLGet(id string) (model.SampleModel, error)
}

type sampleRepository struct {
	tt     SampleTTRepository
	pg     SamplePGRepository
	oracle SampleOracleRepository
	mssql  SampleMSSQLRepository
}

func NewSampleRepository(
	tt SampleTTRepository,
	pg SamplePGRepository,
	oracle SampleOracleRepository,
	mssql SampleMSSQLRepository,
) SampleRepository {
	return &sampleRepository{tt: tt, pg: pg, oracle: oracle, mssql: mssql}
}

// ─── Primary CRUD (PostgreSQL) ────────────────────────────────────────────────

func (r *sampleRepository) Create(someData model.SampleModel) (string, error) {
	return r.pg.AddSomePGData(someData)
}

func (r *sampleRepository) GetByID(id string) (model.SampleModel, error) {
	return r.pg.GetSomePGData(id)
}

func (r *sampleRepository) Update(id string, someData model.SampleModel) (string, error) {
	return r.pg.UpdateSomePGData(id, someData)
}

func (r *sampleRepository) Delete(id string) (string, error) {
	return r.pg.DeleteSomePGData(id)
}

func (r *sampleRepository) List(page, limit int) ([]model.SampleModel, int, error) {
	return r.pg.ListSomePGData(page, limit)
}

// ─── Per-database access ──────────────────────────────────────────────────────

func (r *sampleRepository) TTAdd(someData model.SampleModel) (string, error) {
	return r.tt.AddSomeTTData(someData)
}

func (r *sampleRepository) TTGet(id string) (model.SampleModel, error) {
	return r.tt.GetSomeTTData(id)
}

func (r *sampleRepository) PGAdd(someData model.SampleModel) (string, error) {
	return r.pg.AddSomePGData(someData)
}

func (r *sampleRepository) PGGet(id string) (model.SampleModel, error) {
	return r.pg.GetSomePGData(id)
}

func (r *sampleRepository) OracleAdd(someData model.SampleModel) (string, error) {
	return r.oracle.AddSomeOracleData(someData)
}

func (r *sampleRepository) OracleGet(id string) (model.SampleModel, error) {
	return r.oracle.GetSomeOracleData(id)
}

func (r *sampleRepository) MSSQLAdd(someData model.SampleModel) (string, error) {
	return r.mssql.AddSomeMSSQLData(someData)
}

func (r *sampleRepository) MSSQLGet(id string) (model.SampleModel, error) {
	return r.mssql.GetSomeMSSQLData(id)
}
