package controller

import (
	"net/http"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"
	"singer/go-template-new-2026-06/service"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

var version = "0.99.2025.10.06.001"

type SampleController interface {
	Ping(c *fiber.Ctx) error
	Health(c *fiber.Ctx) error
	SampleControllerFunction(c *fiber.Ctx) error
	CreateSample(c *fiber.Ctx) error
	GetSampleByID(c *fiber.Ctx) error
	UpdateSample(c *fiber.Ctx) error
	DeleteSample(c *fiber.Ctx) error
	ListSamples(c *fiber.Ctx) error
}

type sampleController struct {
	someService service.SampleService
}

func NewSampleController(sampleService service.SampleService) sampleController {
	return sampleController{someService: sampleService}
}

// Health checks all database connections
func (obj sampleController) Health(c *fiber.Ctx) error {
	dbStatus := obj.someService.Health()

	allHealthy := true
	for _, v := range dbStatus {
		if v != "healthy" && v != "not configured" {
			allHealthy = false
			break
		}
	}

	statusCode := http.StatusOK
	if !allHealthy {
		statusCode = http.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(fiber.Map{
		"status":    map[bool]string{true: "healthy", false: "unhealthy"}[allHealthy],
		"databases": dbStatus,
	})
}

// Ping Healthcheck
func (obj sampleController) Ping(c *fiber.Ctx) error {
	return c.Status(http.StatusOK).JSON(fiber.Map{
		"api":      "sample-service-api",
		"version":  version,
		"env":      viper.GetString("ENV"),
		"instance": viper.GetString("INSTANCE"),
	})
}

func (obj sampleController) SampleControllerFunction(c *fiber.Ctx) error {
	log := logger.GetLoggerWithFiber(c)

	log.Infof("-= Create Controller Logic Here =-")

	var input map[string]string
	if err := c.BodyParser(&input); err != nil {
		log.Errorf("failed to parse request body: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}
	log.Debugf("input: %#v", input)

	return c.Status(http.StatusOK).JSON(model.SampleModel{})
}

// CreateSample godoc
// POST /samples
func (obj sampleController) CreateSample(c *fiber.Ctx) error {
	log := logger.GetLoggerWithFiber(c)

	var input model.SampleModel
	if err := c.BodyParser(&input); err != nil {
		log.Errorf("CreateSample parse error: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	created, err := obj.someService.CreateSample(input)
	if err != nil {
		log.Errorf("CreateSample service error: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to create record",
			"error":   err.Error(),
		})
	}

	return c.Status(http.StatusCreated).JSON(created)
}

// GetSampleByID godoc
// GET /samples/:id
func (obj sampleController) GetSampleByID(c *fiber.Ctx) error {
	log := logger.GetLoggerWithFiber(c)

	id := c.Params("id")
	if id == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"message": "id is required",
		})
	}

	data, err := obj.someService.GetSample(id)
	if err != nil {
		log.Errorf("GetSampleByID error: %v", err)
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"message": "Record not found",
			"error":   err.Error(),
		})
	}

	return c.Status(http.StatusOK).JSON(data)
}

// UpdateSample godoc
// PUT /samples/:id
func (obj sampleController) UpdateSample(c *fiber.Ctx) error {
	log := logger.GetLoggerWithFiber(c)

	id := c.Params("id")
	if id == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"message": "id is required",
		})
	}

	var input model.SampleModel
	if err := c.BodyParser(&input); err != nil {
		log.Errorf("UpdateSample parse error: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	result, err := obj.someService.UpdateSample(id, input)
	if err != nil {
		log.Errorf("UpdateSample service error: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to update record",
			"error":   err.Error(),
		})
	}

	if result == "NOT_FOUND" {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"message": "Record not found",
		})
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{
		"message": "Updated successfully",
		"id":      id,
	})
}

// DeleteSample godoc
// DELETE /samples/:id
func (obj sampleController) DeleteSample(c *fiber.Ctx) error {
	log := logger.GetLoggerWithFiber(c)

	id := c.Params("id")
	if id == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"message": "id is required",
		})
	}

	result, err := obj.someService.DeleteSample(id)
	if err != nil {
		log.Errorf("DeleteSample service error: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to delete record",
			"error":   err.Error(),
		})
	}

	if result == "NOT_FOUND" {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"message": "Record not found",
		})
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{
		"message": "Deleted successfully",
		"id":      id,
	})
}

// ListSamples godoc
// GET /samples?page=1&limit=10
func (obj sampleController) ListSamples(c *fiber.Ctx) error {
	log := logger.GetLoggerWithFiber(c)

	var query model.PaginationQuery
	if err := c.QueryParser(&query); err != nil {
		log.Errorf("ListSamples parse error: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid query parameters",
			"error":   err.Error(),
		})
	}

	if query.Page <= 0 {
		query.Page = 1
	}
	if query.Limit <= 0 {
		query.Limit = 10
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	resp, err := obj.someService.ListSamples(query.Page, query.Limit)
	if err != nil {
		log.Errorf("ListSamples service error: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to retrieve records",
			"error":   err.Error(),
		})
	}

	return c.Status(http.StatusOK).JSON(resp)
}
