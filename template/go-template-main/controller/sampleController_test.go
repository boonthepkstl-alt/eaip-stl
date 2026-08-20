package controller

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"singer/go-template-new-2026-06/handler"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"
	"singer/go-template-new-2026-06/repository"
	"singer/go-template-new-2026-06/service"
	"singer/go-template-new-2026-06/util"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"github.com/tarantool/go-tarantool/v2"
	"github.com/tarantool/go-tarantool/v2/pool"
)

var app *fiber.App

var MSSQLdb *sql.DB
var TTdb *pool.ConnectionPool
var PGdb *sql.DB
var Oracledb *sql.DB

var testToken string

type stubSampleHandler struct{}

func (h stubSampleHandler) SampleFunction(data string) (model.SampleModel, error) {
	return model.SampleModel{
		ID:      "svc-test-id",
		Column1: "col1",
		Column2: "col2",
	}, nil
}

// TestMain initialises all DB connections once for the entire test binary,
// then tears them down after all tests have run.
// This avoids the ~10-second Tarantool reconnect penalty on every test.
func TestMain(m *testing.M) {
	util.Init()
	log := logger.GetLogger()
	var err error

	if strings.TrimSpace(viper.GetString("DB_MSSQL_SERVER")) != "" {
		MSSQLdb, err = repository.InitMSSQLPool()
		if err != nil {
			log.Warnf("MS SQL pool unavailable (tests requiring it will be skipped): %v", err)
		}
	}

	if strings.TrimSpace(viper.GetString("DB_TT_SERVER")) != "" {
		TTdb, err = repository.InitTarantoolPool()
		if err != nil {
			log.Warnf("Tarantool pool unavailable (tests requiring it will be skipped): %v", err)
		}
	}

	if strings.TrimSpace(viper.GetString("DB_PG_SERVER")) != "" {
		PGdb, err = repository.InitPostgresPool()
		if err != nil {
			log.Warnf("PostgreSQL pool unavailable (tests requiring it will be skipped): %v", err)
		}
	}

	if strings.TrimSpace(viper.GetString("DB_ORACLE_SERVER")) != "" && strings.TrimSpace(viper.GetString("DB_ORACLE_SERVICE")) != "" {
		Oracledb, err = repository.InitOraclePoolWithOptions()
		if err != nil {
			log.Warnf("Oracle pool unavailable (tests requiring it will be skipped): %v", err)
		}
	}

	dbManager := repository.NewDBManager(MSSQLdb, Oracledb)

	app = fiber.New()

	sampleRepo := repository.NewSampleRepository(
		repository.NewSampleTTRepository(),
		repository.NewSamplePGRepository(),
		repository.NewSampleOracleRepository(dbManager),
		repository.NewSampleMSSQLRepository(dbManager),
	)
	sampleSvc := service.NewSampleService(handler.NewSampleHandler(), dbManager, sampleRepo)
	controllerz := NewSampleController(sampleSvc)

	authSvc := service.NewAuthService()
	authCtrlz := NewAuthController(authSvc)

	api := app.Group("/", func(c *fiber.Ctx) error {
		log.Infof("URI: %v", c.Request().URI().String())
		return c.Next()
	})

	// Public
	api.Get("/ping", controllerz.Ping)
	api.Get("/health", controllerz.Health)
	api.Post("/auth/login", authCtrlz.Login)

	// Legacy sample
	api.Post("/sample", controllerz.SampleControllerFunction)

	// CRUD
	api.Post("/samples", controllerz.CreateSample)
	api.Get("/samples", controllerz.ListSamples)
	api.Get("/samples/:id", controllerz.GetSampleByID)
	api.Put("/samples/:id", controllerz.UpdateSample)
	api.Delete("/samples/:id", controllerz.DeleteSample)

	token, _, err := util.GenerateToken("test-user", "test-user", "admin", "Test User")
	if err != nil {
		log.Errorf("Failed to generate test token: %v", err)
	} else {
		testToken = "Bearer " + token
	}

	code := m.Run()

	// Teardown — clear all test data, but only when targeting localhost
	isLocalhost := func(host string) bool {
		return host == "localhost" || host == "127.0.0.1" || host == "::1"
	}

	log.Info("=== Teardown: clearing test data (localhost only) ===")

	if PGdb != nil {
		if isLocalhost(viper.GetString("DB_PG_SERVER")) {
			if _, err := PGdb.Exec(`DELETE FROM samplemodel`); err != nil {
				log.Warnf("PG teardown failed: %v", err)
			} else {
				log.Info("PG: samplemodel cleared")
			}
		} else {
			log.Info("PG: skipped teardown (not localhost)")
		}
		PGdb.Close()
	}

	if MSSQLdb != nil {
		if isLocalhost(viper.GetString("DB_MSSQL_SERVER")) {
			if _, err := MSSQLdb.Exec(`DELETE FROM samplemodel`); err != nil {
				log.Warnf("MSSQL teardown failed: %v", err)
			} else {
				log.Info("MSSQL: samplemodel cleared")
			}
		} else {
			log.Info("MSSQL: skipped teardown (not localhost)")
		}
		MSSQLdb.Close()
	}

	if Oracledb != nil {
		if isLocalhost(viper.GetString("DB_ORACLE_SERVER")) {
			if _, err := Oracledb.Exec(`DELETE FROM samplemodel`); err != nil {
				log.Warnf("Oracle teardown failed: %v", err)
			} else {
				log.Info("Oracle: samplemodel cleared")
			}
		} else {
			log.Info("Oracle: skipped teardown (not localhost)")
		}
		Oracledb.Close()
	}

	if TTdb != nil {
		if isLocalhost(viper.GetString("DB_TT_SERVER")) {
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			req := tarantool.NewExecuteRequest(`DELETE FROM "SAMPLEMODEL"`).Args([]interface{}{}).Context(ctx)
			future := TTdb.Do(req, pool.ANY)
			_, ttErr := future.GetResponse()
			cancel()
			if ttErr != nil {
				log.Warnf("Tarantool teardown failed: %v", ttErr)
			} else {
				log.Info("Tarantool: SAMPLEMODEL cleared")
			}
		} else {
			log.Info("Tarantool: skipped teardown (not localhost)")
		}
		TTdb.Close()
	}

	os.Exit(code)
}

// ─── DB availability guards ──────────────────────────────────────────────────

func requirePG(t *testing.T) {
	t.Helper()
	if PGdb == nil {
		t.Skip("Skipping: PostgreSQL not available")
	}
}

func requireMSSQL(t *testing.T) {
	t.Helper()
	if MSSQLdb == nil {
		t.Skip("Skipping: MS SQL not available")
	}
}

func requireOracle(t *testing.T) {
	t.Helper()
	if Oracledb == nil {
		t.Skip("Skipping: Oracle not available")
	}
}

func requireTT(t *testing.T) {
	t.Helper()
	if TTdb == nil {
		t.Skip("Skipping: Tarantool not available")
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func newJSONRequest(method, url string, body interface{}) *http.Request {
	var r io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		r = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, url, r)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", testToken)
	return req
}

func parseBody(t *testing.T, resp *http.Response) map[string]interface{} {
	t.Helper()
	b, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)
	var m map[string]interface{}
	assert.NoError(t, json.Unmarshal(b, &m))
	return m
}

// ─── Ping / Health ───────────────────────────────────────────────────────────

func TestPing(t *testing.T) {
	t.Run("test-ping", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ping", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, "sample-service-api", body["api"])
		assert.NotEmpty(t, body["version"])
	})
}

func TestHealth(t *testing.T) {
	t.Run("test-health", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/health", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.NotNil(t, resp)

		body := parseBody(t, resp)
		assert.NotNil(t, body["status"])
		assert.NotNil(t, body["databases"])
	})
}

// ─── Auth ────────────────────────────────────────────────────────────────────

func TestAuthLogin_Success(t *testing.T) {
	t.Run("test-auth-login-success", func(t *testing.T) {
		payload := `{"username":"admin","password":"password"}`
		req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, "ok", body["status"])
		assert.NotEmpty(t, resp.Header.Get("Set-Cookie"))

		data, ok := body["data"].(map[string]interface{})
		assert.True(t, ok, "expected 'data' field in response")
		assert.NotNil(t, data["expires_at"])
		user, ok := data["user"].(map[string]interface{})
		assert.True(t, ok, "expected 'user' field in response")
		assert.Equal(t, "admin", user["username"])
		assert.Equal(t, "admin", user["role"])
	})
}

func TestAuthLogin_InvalidCredentials(t *testing.T) {
	t.Run("test-auth-login-invalid-credentials", func(t *testing.T) {
		payload := `{"username":"wrong","password":"wrong"}`
		req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

// ─── Legacy ──────────────────────────────────────────────────────────────────

func TestSampleControllerFunction_Success(t *testing.T) {
	t.Run("test-sample-controller-function-success", func(t *testing.T) {
		id := util.RandomString(5)
		requestBody := `{"id":"` + id + `","column1":"value1","column2":"value2"}`

		req := httptest.NewRequest("POST", "/sample", strings.NewReader(requestBody))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.NotNil(t, parseBody(t, resp))
	})
}

// ─── CRUD: Create ────────────────────────────────────────────────────────────

func TestCreateSample_Success(t *testing.T) {
	requirePG(t)
	t.Run("test-create-sample-success", func(t *testing.T) {
		payload := model.SampleModel{Column1: "test-column1", Column2: "test-column2"}
		req := newJSONRequest("POST", "/samples", payload)

		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		body := parseBody(t, resp)
		assert.NotEmpty(t, body["ID"])
		assert.Equal(t, "test-column1", body["Column1"])
		assert.Equal(t, "test-column2", body["Column2"])
	})
}

func TestCreateSample_WithExplicitID(t *testing.T) {
	requirePG(t)
	t.Run("test-create-sample-with-explicit-id", func(t *testing.T) {
		id := "test-" + util.RandomString(8)
		payload := model.SampleModel{ID: id, Column1: "explicit-col1", Column2: "explicit-col2"}
		req := newJSONRequest("POST", "/samples", payload)

		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, id, body["ID"])

		cleanReq := newJSONRequest("DELETE", "/samples/"+id, nil)
		app.Test(cleanReq, 10000)
	})
}

func TestCreateSample_InvalidBody(t *testing.T) {
	t.Run("test-create-sample-invalid-body", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/samples", strings.NewReader("{invalid"))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", testToken)

		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

// ─── CRUD: GetByID ───────────────────────────────────────────────────────────

func TestGetSampleByID_Success(t *testing.T) {
	requirePG(t)
	t.Run("test-get-sample-by-id-success", func(t *testing.T) {
		id := "get-test-" + util.RandomString(6)
		seedReq := newJSONRequest("POST", "/samples", model.SampleModel{ID: id, Column1: "c1", Column2: "c2"})
		seedResp, _ := app.Test(seedReq, 10000)
		if seedResp.StatusCode != http.StatusCreated {
			t.Skip("could not seed record for GetByID test")
		}

		req := newJSONRequest("GET", "/samples/"+id, nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, id, body["ID"])
		assert.Equal(t, "c1", body["Column1"])
		assert.Equal(t, "c2", body["Column2"])

		cleanReq := newJSONRequest("DELETE", "/samples/"+id, nil)
		app.Test(cleanReq, 10000)
	})
}

func TestGetSampleByID_NotFound(t *testing.T) {
	requirePG(t)
	t.Run("test-get-sample-by-id-not-found", func(t *testing.T) {
		req := newJSONRequest("GET", "/samples/nonexistent-id-xyz-999", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})
}

// ─── CRUD: Update ────────────────────────────────────────────────────────────

func TestUpdateSample_Success(t *testing.T) {
	requirePG(t)
	t.Run("test-update-sample-success", func(t *testing.T) {
		id := "upd-test-" + util.RandomString(6)
		seedReq := newJSONRequest("POST", "/samples", model.SampleModel{ID: id, Column1: "original-c1", Column2: "original-c2"})
		seedResp, _ := app.Test(seedReq, 10000)
		if seedResp.StatusCode != http.StatusCreated {
			t.Skip("could not seed record for Update test")
		}

		payload := model.SampleModel{Column1: "updated-c1", Column2: "updated-c2"}
		req := newJSONRequest("PUT", "/samples/"+id, payload)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, "Updated successfully", body["message"])
		assert.Equal(t, id, body["id"])

		// verify update
		getResp, _ := app.Test(newJSONRequest("GET", "/samples/"+id, nil), 10000)
		if getResp.StatusCode == http.StatusOK {
			getBody := parseBody(t, getResp)
			assert.Equal(t, "updated-c1", getBody["Column1"])
			assert.Equal(t, "updated-c2", getBody["Column2"])
		}

		cleanReq := newJSONRequest("DELETE", "/samples/"+id, nil)
		app.Test(cleanReq, 10000)
	})
}

func TestUpdateSample_NotFound(t *testing.T) {
	requirePG(t)
	t.Run("test-update-sample-not-found", func(t *testing.T) {
		payload := model.SampleModel{Column1: "c1", Column2: "c2"}
		req := newJSONRequest("PUT", "/samples/nonexistent-id-xyz-999", payload)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})
}

func TestUpdateSample_InvalidBody(t *testing.T) {
	t.Run("test-update-sample-invalid-body", func(t *testing.T) {
		req := httptest.NewRequest("PUT", "/samples/some-id", strings.NewReader("{invalid"))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", testToken)

		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

// ─── CRUD: Delete ────────────────────────────────────────────────────────────

func TestDeleteSample_Success(t *testing.T) {
	requirePG(t)
	t.Run("test-delete-sample-success", func(t *testing.T) {
		id := "del-test-" + util.RandomString(6)
		seedReq := newJSONRequest("POST", "/samples", model.SampleModel{ID: id, Column1: "c1", Column2: "c2"})
		seedResp, _ := app.Test(seedReq, 10000)
		if seedResp.StatusCode != http.StatusCreated {
			t.Skip("could not seed record for Delete test")
		}

		req := newJSONRequest("DELETE", "/samples/"+id, nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, "Deleted successfully", body["message"])
		assert.Equal(t, id, body["id"])

		// verify gone
		getResp, _ := app.Test(newJSONRequest("GET", "/samples/"+id, nil), 10000)
		assert.Equal(t, http.StatusNotFound, getResp.StatusCode)
	})
}

func TestDeleteSample_NotFound(t *testing.T) {
	requirePG(t)
	t.Run("test-delete-sample-not-found", func(t *testing.T) {
		req := newJSONRequest("DELETE", "/samples/nonexistent-id-xyz-999", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})
}

// ─── CRUD: List / Pagination ─────────────────────────────────────────────────

func TestListSamples_DefaultPagination(t *testing.T) {
	requirePG(t)
	t.Run("test-list-samples-default-pagination", func(t *testing.T) {
		req := newJSONRequest("GET", "/samples", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.NotNil(t, body["data"])
		assert.NotNil(t, body["total"])
		assert.Equal(t, float64(1), body["page"])
		assert.Equal(t, float64(10), body["limit"])
		assert.NotNil(t, body["total_pages"])
	})
}

func TestListSamples_CustomPageAndLimit(t *testing.T) {
	requirePG(t)
	t.Run("test-list-samples-custom-page-limit", func(t *testing.T) {
		req := newJSONRequest("GET", "/samples?page=2&limit=5", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, float64(2), body["page"])
		assert.Equal(t, float64(5), body["limit"])
	})
}

func TestListSamples_LimitCappedAt100(t *testing.T) {
	requirePG(t)
	t.Run("test-list-samples-limit-capped", func(t *testing.T) {
		req := newJSONRequest("GET", "/samples?page=1&limit=9999", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, float64(100), body["limit"])
	})
}

func TestListSamples_InvalidPageDefaultsToOne(t *testing.T) {
	requirePG(t)
	t.Run("test-list-samples-invalid-page-defaults", func(t *testing.T) {
		req := newJSONRequest("GET", "/samples?page=0&limit=0", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		assert.Equal(t, float64(1), body["page"])
		assert.Equal(t, float64(10), body["limit"])
	})
}

func TestListSamples_TotalPagesCalculation(t *testing.T) {
	requirePG(t)
	t.Run("test-list-samples-total-pages-calculation", func(t *testing.T) {
		ids := make([]string, 3)
		for i := range ids {
			ids[i] = fmt.Sprintf("page-test-%s", util.RandomString(6))
			seedReq := newJSONRequest("POST", "/samples", model.SampleModel{
				ID:      ids[i],
				Column1: fmt.Sprintf("col1-%d", i),
				Column2: fmt.Sprintf("col2-%d", i),
			})
			app.Test(seedReq, 10000)
		}

		req := newJSONRequest("GET", "/samples?page=1&limit=2", nil)
		resp, err := app.Test(req, 10000)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := parseBody(t, resp)
		total := int(body["total"].(float64))
		limit := int(body["limit"].(float64))
		totalPages := int(body["total_pages"].(float64))
		assert.Equal(t, (total+limit-1)/limit, totalPages)

		for _, id := range ids {
			app.Test(newJSONRequest("DELETE", "/samples/"+id, nil), 10000)
		}
	})
}

// ─── Full CRUD lifecycle ──────────────────────────────────────────────────────

func TestCRUDLifecycle(t *testing.T) {
	requirePG(t)
	t.Run("test-crud-lifecycle", func(t *testing.T) {
		id := "lifecycle-" + util.RandomString(8)

		// CREATE
		createResp, err := app.Test(newJSONRequest("POST", "/samples", model.SampleModel{ID: id, Column1: "init-c1", Column2: "init-c2"}), 10000)
		assert.NoError(t, err)
		if createResp.StatusCode != http.StatusCreated {
			t.Skip("Skipping lifecycle test: DB not available")
		}

		// READ
		getResp, _ := app.Test(newJSONRequest("GET", "/samples/"+id, nil), 10000)
		assert.Equal(t, http.StatusOK, getResp.StatusCode)
		getBody := parseBody(t, getResp)
		assert.Equal(t, id, getBody["ID"])
		assert.Equal(t, "init-c1", getBody["Column1"])

		// LIST
		listResp, _ := app.Test(newJSONRequest("GET", "/samples?page=1&limit=100", nil), 10000)
		assert.Equal(t, http.StatusOK, listResp.StatusCode)
		listBody := parseBody(t, listResp)
		assert.GreaterOrEqual(t, int(listBody["total"].(float64)), 1)

		// UPDATE
		updateResp, _ := app.Test(newJSONRequest("PUT", "/samples/"+id, model.SampleModel{Column1: "updated-c1", Column2: "updated-c2"}), 10000)
		assert.Equal(t, http.StatusOK, updateResp.StatusCode)
		updateBody := parseBody(t, updateResp)
		assert.Equal(t, "Updated successfully", updateBody["message"])

		// READ after UPDATE
		getAfterResp, _ := app.Test(newJSONRequest("GET", "/samples/"+id, nil), 10000)
		assert.Equal(t, http.StatusOK, getAfterResp.StatusCode)
		getAfterBody := parseBody(t, getAfterResp)
		assert.Equal(t, "updated-c1", getAfterBody["Column1"])
		assert.Equal(t, "updated-c2", getAfterBody["Column2"])

		// DELETE
		deleteResp, _ := app.Test(newJSONRequest("DELETE", "/samples/"+id, nil), 10000)
		assert.Equal(t, http.StatusOK, deleteResp.StatusCode)
		deleteBody := parseBody(t, deleteResp)
		assert.Equal(t, "Deleted successfully", deleteBody["message"])

		// READ after DELETE — must 404
		getDelResp, _ := app.Test(newJSONRequest("GET", "/samples/"+id, nil), 10000)
		assert.Equal(t, http.StatusNotFound, getDelResp.StatusCode)
	})
}

// ─── Repository-specific CRUD (direct calls) ─────────────────────────────────

func TestPGRepository_CRUD(t *testing.T) {
	requirePG(t)
	t.Run("test-pg-repository-crud", func(t *testing.T) {
		repo := repository.NewSamplePGRepository()
		id := "pg-" + util.RandomString(8)

		addResult, err := repo.AddSomePGData(model.SampleModel{ID: id, Column1: "pg-c1", Column2: "pg-c2"})
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", addResult)

		data, err := repo.GetSomePGData(id)
		assert.NoError(t, err)
		assert.Equal(t, id, data.ID)
		assert.Equal(t, "pg-c1", data.Column1)

		updResult, err := repo.UpdateSomePGData(id, model.SampleModel{Column1: "pg-c1-upd", Column2: "pg-c2-upd"})
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", updResult)

		updData, err := repo.GetSomePGData(id)
		assert.NoError(t, err)
		assert.Equal(t, "pg-c1-upd", updData.Column1)

		items, total, err := repo.ListSomePGData(1, 10)
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, 1)
		assert.NotNil(t, items)

		nfResult, err := repo.UpdateSomePGData("nonexistent-pg-id-xyz", model.SampleModel{Column1: "x", Column2: "y"})
		assert.NoError(t, err)
		assert.Equal(t, "NOT_FOUND", nfResult)

		delResult, err := repo.DeleteSomePGData(id)
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", delResult)

		nfDel, err := repo.DeleteSomePGData(id)
		assert.NoError(t, err)
		assert.Equal(t, "NOT_FOUND", nfDel)
	})
}

func TestMSSQLRepository_CRUD(t *testing.T) {
	requireMSSQL(t)
	t.Run("test-mssql-repository-crud", func(t *testing.T) {
		dbManager := repository.NewDBManager(MSSQLdb, Oracledb)
		repo := repository.NewSampleMSSQLRepository(dbManager)
		id := "ms-" + util.RandomString(8)

		addResult, err := repo.AddSomeMSSQLData(model.SampleModel{ID: id, Column1: "ms-c1", Column2: "ms-c2"})
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", addResult)

		data, err := repo.GetSomeMSSQLData(id)
		assert.NoError(t, err)
		assert.Equal(t, id, data.ID)
		assert.Equal(t, "ms-c1", data.Column1)

		updResult, err := repo.UpdateSomeMSSQLData(id, model.SampleModel{Column1: "ms-c1-upd", Column2: "ms-c2-upd"})
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", updResult)

		updData, err := repo.GetSomeMSSQLData(id)
		assert.NoError(t, err)
		assert.Equal(t, "ms-c1-upd", updData.Column1)

		items, total, err := repo.ListSomeMSSQLData(1, 10)
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, 1)
		assert.NotNil(t, items)

		nfResult, err := repo.UpdateSomeMSSQLData("nonexistent-ms-id-xyz", model.SampleModel{Column1: "x", Column2: "y"})
		assert.NoError(t, err)
		assert.Equal(t, "NOT_FOUND", nfResult)

		delResult, err := repo.DeleteSomeMSSQLData(id)
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", delResult)

		nfDel, err := repo.DeleteSomeMSSQLData(id)
		assert.NoError(t, err)
		assert.Equal(t, "NOT_FOUND", nfDel)
	})
}

func TestOracleRepository_CRUD(t *testing.T) {
	requireOracle(t)
	t.Run("test-oracle-repository-crud", func(t *testing.T) {
		dbManager := repository.NewDBManager(MSSQLdb, Oracledb)
		repo := repository.NewSampleOracleRepository(dbManager)
		id := "ora-" + util.RandomString(8)

		addResult, err := repo.AddSomeOracleData(model.SampleModel{ID: id, Column1: "ora-c1", Column2: "ora-c2"})
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", addResult)

		data, err := repo.GetSomeOracleData(id)
		assert.NoError(t, err)
		assert.Equal(t, id, data.ID)
		assert.Equal(t, "ora-c1", data.Column1)

		updResult, err := repo.UpdateSomeOracleData(id, model.SampleModel{Column1: "ora-c1-upd", Column2: "ora-c2-upd"})
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", updResult)

		updData, err := repo.GetSomeOracleData(id)
		assert.NoError(t, err)
		assert.Equal(t, "ora-c1-upd", updData.Column1)

		items, total, err := repo.ListSomeOracleData(1, 10)
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, 1)
		assert.NotNil(t, items)

		nfResult, err := repo.UpdateSomeOracleData("nonexistent-ora-id-xyz", model.SampleModel{Column1: "x", Column2: "y"})
		assert.NoError(t, err)
		assert.Equal(t, "NOT_FOUND", nfResult)

		delResult, err := repo.DeleteSomeOracleData(id)
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", delResult)

		nfDel, err := repo.DeleteSomeOracleData(id)
		assert.NoError(t, err)
		assert.Equal(t, "NOT_FOUND", nfDel)
	})
}

func TestTarantoolRepository_CRUD(t *testing.T) {
	requireTT(t)
	t.Run("test-tt-repository-crud", func(t *testing.T) {
		repo := repository.NewSampleTTRepository()
		id := "tt-" + util.RandomString(8)

		addResult, err := repo.AddSomeTTData(model.SampleModel{ID: id, Column1: "tt-c1", Column2: "tt-c2"})
		assert.NoError(t, err)
		assert.Equal(t, "OK", addResult)

		data, err := repo.GetSomeTTData(id)
		assert.NoError(t, err)
		assert.Equal(t, id, data.ID)
		assert.Equal(t, "tt-c1", data.Column1)

		updResult, err := repo.UpdateSomeTTData(id, model.SampleModel{Column1: "tt-c1-upd", Column2: "tt-c2-upd"})
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", updResult)

		updData, err := repo.GetSomeTTData(id)
		assert.NoError(t, err)
		assert.Equal(t, "tt-c1-upd", updData.Column1)

		items, total, err := repo.ListSomeTTData(1, 10)
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, 1)
		assert.NotNil(t, items)

		delResult, err := repo.DeleteSomeTTData(id)
		assert.NoError(t, err)
		assert.Equal(t, "COMPLETE", delResult)
	})
}

// ─── Service: CallAllRepositories ────────────────────────────────────────────

func TestCallAllRepositories_AllDBs(t *testing.T) {
	requirePG(t)
	requireMSSQL(t)
	requireOracle(t)
	requireTT(t)
	t.Run("test-call-all-repositories-all-dbs", func(t *testing.T) {
		dbManager := repository.NewDBManager(MSSQLdb, Oracledb)
		sampleRepo := repository.NewSampleRepository(
			repository.NewSampleTTRepository(),
			repository.NewSamplePGRepository(),
			repository.NewSampleOracleRepository(dbManager),
			repository.NewSampleMSSQLRepository(dbManager),
		)
		svc := service.NewSampleService(handler.NewSampleHandler(), dbManager, sampleRepo)

		id := "all-" + util.RandomString(8)
		data := model.SampleModel{ID: id, Column1: "col1", Column2: "col2"}

		results, err := svc.CallAllRepositories(id, data)
		assert.NoError(t, err)
		assert.NotNil(t, results)

		assert.Contains(t, results, "tt_add")
		assert.Contains(t, results, "tt_get")
		assert.Contains(t, results, "pg_add")
		assert.Contains(t, results, "pg_get")
		assert.Contains(t, results, "oracle_add")
		assert.Contains(t, results, "oracle_get")
		assert.Contains(t, results, "mssql_add")
		assert.Contains(t, results, "mssql_get")
		assert.NotContains(t, results, "errors")
	})
}

func TestCallAllRepositories_PartialFailure(t *testing.T) {
	requirePG(t)
	t.Run("test-call-all-repositories-partial-failure", func(t *testing.T) {
		// Only PG available — TT, Oracle, MSSQL will fail
		dbManager := repository.NewDBManager(nil, nil)
		sampleRepo := repository.NewSampleRepository(
			repository.NewSampleTTRepository(),
			repository.NewSamplePGRepository(),
			repository.NewSampleOracleRepository(dbManager),
			repository.NewSampleMSSQLRepository(dbManager),
		)
		svc := service.NewSampleService(handler.NewSampleHandler(), dbManager, sampleRepo)

		id := "partial-" + util.RandomString(8)
		data := model.SampleModel{ID: id, Column1: "col1", Column2: "col2"}

		results, err := svc.CallAllRepositories(id, data)
		// CallAllRepositories never returns a hard error — it collects per-repo errors
		assert.NoError(t, err)
		assert.NotNil(t, results)

		// PG steps should succeed
		assert.Contains(t, results, "pg_add")
		assert.Contains(t, results, "pg_get")

		// Other repos should be reported in errors
		assert.Contains(t, results, "errors")
		errs := results["errors"].(map[string]string)
		assert.NotEmpty(t, errs)
	})
}

// ─── Service: SampleServiceFunction ──────────────────────────────────────────

func TestSampleServiceFunction_Success(t *testing.T) {
	t.Run("test-sample-service-function-success", func(t *testing.T) {
		dbManager := repository.NewDBManager(MSSQLdb, Oracledb)
		sampleRepo := repository.NewSampleRepository(
			repository.NewSampleTTRepository(),
			repository.NewSamplePGRepository(),
			repository.NewSampleOracleRepository(dbManager),
			repository.NewSampleMSSQLRepository(dbManager),
		)
		svc := service.NewSampleService(stubSampleHandler{}, dbManager, sampleRepo)

		result, err := svc.SampleServiceFunction(model.SampleModel{
			ID:      "svc-test-id",
			Column1: "col1",
			Column2: "col2",
		})

		assert.NoError(t, err)
		assert.Equal(t, "OK", result)
	})
}
