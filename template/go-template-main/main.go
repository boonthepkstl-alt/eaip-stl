//go:debug x509negativeserial=1
package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"os/signal"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/repository"
	"singer/go-template-new-2026-06/router"
	"singer/go-template-new-2026-06/util"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/spf13/viper"
)

func init() {
	fmt.Println("-= Init =-")
	util.Init()
}

func main() {
	log := logger.GetLogger()
	shutdownTracing, traceErr := util.InitTracing(context.Background())
	if traceErr != nil {
		log.Errorf("Failed to initialize tracing: %v", traceErr)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := shutdownTracing(ctx); err != nil {
			log.Errorf("Failed to shutdown tracing cleanly: %v", err)
		}
	}()

	var (
		mssqlDb  *sql.DB
		oracleDb *sql.DB
		err      error
	)

	// TT + PG: dual-pool (write master + read replicas), hot-reload replica
	// membership from config file without restart.
	repository.InitTT()
	repository.InitPG()

	if strings.TrimSpace(viper.GetString("DB_MSSQL_SERVER")) != "" {
		mssqlDb, err = repository.InitMSSQLPool()
		if err != nil {
			log.Errorf("Failed to initialize MS SQL pool: %v", err)
		}
	} else {
		log.Info("MS SQL connection not configured; skipping initialization")
	}

	if strings.TrimSpace(viper.GetString("DB_ORACLE_SERVER")) != "" && strings.TrimSpace(viper.GetString("DB_ORACLE_SERVICE")) != "" {
		oracleDb, err = repository.InitOraclePoolWithOptions()
		if err != nil {
			log.Errorf("Failed to initialize Oracle pool: %v", err)
		}
	} else {
		log.Info("Oracle connection not configured; skipping initialization")
	}

	dbManager := repository.NewDBManager(mssqlDb, oracleDb)
	defer dbManager.Close()

	app := fiber.New(fiber.Config{
		BodyLimit: 50 * 1024 * 1024,
	})

	allowOrigins := strings.TrimSpace(viper.GetString("CORS_ALLOW_ORIGINS"))
	if allowOrigins == "" {
		allowOrigins = "http://localhost:3000,http://localhost:5173"
	}
	allowCredentials := allowOrigins != "*"
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: allowCredentials,
	}))

	app.Use(fiberlogger.New(fiberlogger.Config{
		Format:     "[AUDIT] ${time} | ${trace_id} | ${ip} | ${user} | ${role} | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
		CustomTags: map[string]fiberlogger.LogFunc{
			"trace_id": func(buf fiberlogger.Buffer, c *fiber.Ctx, _ *fiberlogger.Data, _ string) (int, error) {
				traceID, _ := c.Locals("trace_id").(string)
				if strings.TrimSpace(traceID) == "" {
					traceID = "-"
				}
				return buf.WriteString(traceID)
			},
			"user": func(buf fiberlogger.Buffer, c *fiber.Ctx, _ *fiberlogger.Data, _ string) (int, error) {
				username, _ := c.Locals("username").(string)
				if strings.TrimSpace(username) == "" {
					username = "anonymous"
				}
				return buf.WriteString(username)
			},
			"role": func(buf fiberlogger.Buffer, c *fiber.Ctx, _ *fiberlogger.Data, _ string) (int, error) {
				role, _ := c.Locals("role").(string)
				if strings.TrimSpace(role) == "" {
					role = "-"
				}
				return buf.WriteString(role)
			},
		},
	}))

	log.Info("-= Start Service =-")
	router.SetupRoutes(app, dbManager)

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan
		log.Info("-= Received shutdown signal =-")
		app.Shutdown()
	}()

	serverPort := viper.GetString("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8000"
	}
	log.Infof("-= starting on port %s =-", serverPort)
	if err := app.Listen(":" + serverPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
	log.Info("-= Server stopped gracefully =-")
}
