package router

import (
	"net/http"
	"singer/go-template-new-2026-06/controller"
	"singer/go-template-new-2026-06/handler"
	"singer/go-template-new-2026-06/middleware"
	"singer/go-template-new-2026-06/repository"
	"singer/go-template-new-2026-06/service"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

var version = "0.99.2026.04.26.001"

func SetupRoutes(app *fiber.App, dbManager *repository.DBManager) {
	app.Use(middleware.Tracing())
	app.Use(middleware.Recovery())

	sampleRepo := repository.NewSampleRepository(
		repository.NewSampleTTRepository(),
		repository.NewSamplePGRepository(),
		repository.NewSampleOracleRepository(dbManager),
		repository.NewSampleMSSQLRepository(dbManager),
	)

	sampleHandler := handler.NewSampleHandler()
	sampleService := service.NewSampleService(sampleHandler, dbManager, sampleRepo)
	sampleCtrl := controller.NewSampleController(sampleService)

	authService := service.NewAuthService()
	authCtrl := controller.NewAuthController(authService)

	api := app.Group("/api")

	api.Get("/ping", func(c *fiber.Ctx) error {
		return c.Status(http.StatusOK).JSON(fiber.Map{
			"status":   "ok",
			"message":  "go-template-new-2026-api",
			"instance": viper.GetString("INSTANCE"),
			"version":  version,
		})
	})

	api.Post("/auth/login", authCtrl.Login)

	protected := api.Group("", middleware.JWTAuth())
	protected.Get("/health", sampleCtrl.Health)
	protected.Post("/auth/logout", authCtrl.Logout)
	protected.Post("/sample", sampleCtrl.SampleControllerFunction)

	protected.Post("/samples", sampleCtrl.CreateSample)
	protected.Get("/samples", sampleCtrl.ListSamples)
	protected.Get("/samples/:id", sampleCtrl.GetSampleByID)
	protected.Put("/samples/:id", sampleCtrl.UpdateSample)
	protected.Delete("/samples/:id", sampleCtrl.DeleteSample)
}
