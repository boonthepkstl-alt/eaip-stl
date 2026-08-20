package service

import (
	"fmt"
	"math"
	"singer/go-template-new-2026-06/handler"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"
	"singer/go-template-new-2026-06/repository"

	"github.com/google/uuid"
)

type SampleService interface {
	Health() map[string]string
	SampleServiceFunction(someData model.SampleModel) (string, error)
	CallAllRepositories(id string, someData model.SampleModel) (map[string]interface{}, error)
	CreateSample(someData model.SampleModel) (model.SampleModel, error)
	GetSample(id string) (model.SampleModel, error)
	UpdateSample(id string, someData model.SampleModel) (string, error)
	DeleteSample(id string) (string, error)
	ListSamples(page, limit int) (*model.PaginatedResponse, error)
}

type sampleService struct {
	someHandler handler.SampleHandler
	dbManager   *repository.DBManager
	sampleRepo  repository.SampleRepository
}

func NewSampleService(
	someHandler handler.SampleHandler,
	dbManager *repository.DBManager,
	sampleRepo repository.SampleRepository,
) SampleService {
	return &sampleService{
		someHandler: someHandler,
		dbManager:   dbManager,
		sampleRepo:  sampleRepo,
	}
}

func (obj *sampleService) Health() map[string]string {
	return obj.dbManager.Health()
}

func (obj *sampleService) SampleServiceFunction(someData model.SampleModel) (string, error) {
	log := logger.GetLogger()

	log.Debugf("input : %v", someData)

	log.Debug("-= Sample Handler Call =-")
	handlerResult, err := obj.someHandler.SampleFunction("TEST")
	if err != nil {
		log.Errorf("Handler Error : %#v", err)
		return "ERROR", err
	}
	log.Debugf("handlerResult : %v", handlerResult)

	return "OK", nil
}

// CreateSample creates a new record via the facade (PostgreSQL). Generates a UUID if ID is empty.
func (obj *sampleService) CreateSample(someData model.SampleModel) (model.SampleModel, error) {
	log := logger.GetLogger()
	log.Infof("CreateSample - data: %v", someData)

	if someData.ID == "" {
		someData.ID = uuid.New().String()
	}

	result, err := obj.sampleRepo.Create(someData)
	if err != nil {
		log.Errorf("CreateSample error: %v", err)
		return model.SampleModel{}, err
	}
	if result == "ERROR" {
		return model.SampleModel{}, fmt.Errorf("failed to create record")
	}

	return someData, nil
}

// GetSample retrieves a record by ID via the facade.
func (obj *sampleService) GetSample(id string) (model.SampleModel, error) {
	log := logger.GetLogger()
	log.Infof("GetSample - id: %s", id)

	return obj.sampleRepo.GetByID(id)
}

// UpdateSample updates an existing record via the facade.
func (obj *sampleService) UpdateSample(id string, someData model.SampleModel) (string, error) {
	log := logger.GetLogger()
	log.Infof("UpdateSample - id: %s, data: %v", id, someData)

	return obj.sampleRepo.Update(id, someData)
}

// DeleteSample removes a record by ID via the facade.
func (obj *sampleService) DeleteSample(id string) (string, error) {
	log := logger.GetLogger()
	log.Infof("DeleteSample - id: %s", id)

	return obj.sampleRepo.Delete(id)
}

// ListSamples returns a paginated list of records via the facade.
func (obj *sampleService) ListSamples(page, limit int) (*model.PaginatedResponse, error) {
	log := logger.GetLogger()
	log.Infof("ListSamples - page: %d, limit: %d", page, limit)

	items, total, err := obj.sampleRepo.List(page, limit)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return &model.PaginatedResponse{
		Data:       items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// CallAllRepositories calls each database via the facade for demonstration.
func (obj *sampleService) CallAllRepositories(id string, someData model.SampleModel) (map[string]interface{}, error) {
	log := logger.GetLogger()
	log.Infof("CallAllRepositories - id: %s, data: %v", id, someData)

	results := make(map[string]interface{})
	errors := make(map[string]string)
	var hasError bool

	type step struct {
		key string
		fn  func() (interface{}, error)
	}

	steps := []step{
		{"tt_add", func() (interface{}, error) { return obj.sampleRepo.TTAdd(someData) }},
		{"tt_get", func() (interface{}, error) { return obj.sampleRepo.TTGet(id) }},
		{"pg_add", func() (interface{}, error) { return obj.sampleRepo.PGAdd(someData) }},
		{"pg_get", func() (interface{}, error) { return obj.sampleRepo.PGGet(id) }},
		{"oracle_add", func() (interface{}, error) { return obj.sampleRepo.OracleAdd(someData) }},
		{"oracle_get", func() (interface{}, error) { return obj.sampleRepo.OracleGet(id) }},
		{"mssql_add", func() (interface{}, error) { return obj.sampleRepo.MSSQLAdd(someData) }},
		{"mssql_get", func() (interface{}, error) { return obj.sampleRepo.MSSQLGet(id) }},
	}

	for _, s := range steps {
		log.Debugf("-= Calling %s =-", s.key)
		res, err := s.fn()
		if err != nil {
			log.Errorf("%s error: %v", s.key, err)
			errors[s.key] = err.Error()
			hasError = true
		} else {
			results[s.key] = res
			log.Debugf("%s result: %v", s.key, res)
		}
	}

	if hasError {
		results["errors"] = errors
		log.Errorf("Some repository calls failed: %v", errors)
	}

	log.Infof("CallAllRepositories completed - success: %v, results: %d", !hasError, len(results))
	return results, nil
}
