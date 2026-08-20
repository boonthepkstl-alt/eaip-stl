# Architecture Documentation — go-template-2026

## Overview

This project is a **production-grade Go REST API template** built on [Fiber](https://gofiber.io/), following **Clean Architecture** principles. It demonstrates enterprise patterns including multi-database support, JWT authentication, secrets management, and structured logging.

---

## Directory Structure

```
go-template-2026/
├── main.go              # Entry point: DB init, Fiber app, graceful shutdown
├── go.mod               # Go 1.23 module definition
├── .env / app.env       # Environment configuration
│
├── controller/          # Layer 1: HTTP request handlers
├── service/             # Layer 2: Business logic
├── repository/          # Layer 3: Data access (4 databases)
├── handler/             # External HTTP service clients
├── model/               # Data models and SQL query constants
├── middleware/           # JWT auth, panic recovery
├── router/              # Route definitions and DI wiring
├── logger/              # Logrus wrapper
├── util/                # Config loading, JWT utils, helpers
└── sql/                 # DB migration scripts (pg, mssql, oracle, tt)
```

---

## Application Startup Flow

```
main()
 1. util.Init()              → Load config from .env / Infisical
 2. InitMSSQLPool()          → MS SQL Server connection pool
 3. InitTarantoolPool()      → Tarantool connection pool
 4. InitPostgresPool()       → PostgreSQL connection pool
 5. InitOraclePoolWithOptions() → Oracle connection pool
 6. NewDBManager(...)        → Aggregate all pools into one facade
 7. fiber.New() + CORS       → HTTP server setup
 8. router.SetupRoutes()     → Wire dependencies, register routes
 9. Graceful shutdown        → SIGINT/SIGTERM → DBManager.Close()
10. app.Listen(SERVER_PORT)  → Start serving
```

---

## Architectural Layers

### Clean Architecture Dependency Flow

```
HTTP Request
     ↓
[ Controller ]  ←  handles HTTP parsing, validation, response
     ↓
[  Service   ]  ←  business logic, orchestration
     ↓
[ Repository ]  ←  data access abstraction
     ↓
[ Database   ]  ←  PostgreSQL / MSSQL / Oracle / Tarantool
```

Each layer depends only on the layer below it through **interfaces**, not concrete types.

---

### Layer 1 — Controller

**Location:** `controller/`

Responsible for HTTP parsing and response formatting only. No business logic.

| File                  | Interface          | Endpoints                            |
| --------------------- | ------------------ | ------------------------------------ |
| `sampleController.go` | `SampleController` | Ping, Health, CRUD /samples, /sample |
| `authController.go`   | `AuthController`   | POST /auth/login                     |

```go
type SampleController interface {
    Ping(c *fiber.Ctx) error
    Health(c *fiber.Ctx) error
    CreateSample(c *fiber.Ctx) error
    GetSampleByID(c *fiber.Ctx) error
    UpdateSample(c *fiber.Ctx) error
    DeleteSample(c *fiber.Ctx) error
    ListSamples(c *fiber.Ctx) error
    SampleControllerFunction(c *fiber.Ctx) error
}
```

**Error responses** use standard HTTP codes (400, 401, 404, 500) with a JSON body:

```json
{ "status": "ERROR", "message": "..." }
```

---

### Layer 2 — Service

**Location:** `service/`

Contains all business logic. Orchestrates repositories and external handlers. Has no knowledge of HTTP.

| File               | Interface       | Responsibilities                                   |
| ------------------ | --------------- | -------------------------------------------------- |
| `sampleService.go` | `SampleService` | CRUD logic, pagination, UUID generation, DB health |
| `authService.go`   | `AuthService`   | Credential validation, JWT generation              |

```go
type SampleService interface {
    Health() map[string]string
    CreateSample(data model.SampleModel) (model.SampleModel, error)
    GetSample(id string) (model.SampleModel, error)
    UpdateSample(id string, data model.SampleModel) (string, error)
    DeleteSample(id string) (string, error)
    ListSamples(page, limit int) (*model.PaginatedResponse, error)
    SampleServiceFunction(data model.SampleModel) (string, error)
    CallAllRepositories(id string, data model.SampleModel) (map[string]interface{}, error)
}
```

---

### Layer 3 — Repository

**Location:** `repository/`

Abstracts all data access. Uses the **Facade + Strategy** pattern to unify 4 database implementations behind a single interface.

```
SampleRepository (facade interface)
├── SamplePGRepository       → PostgreSQL  (primary CRUD DB)
├── SampleMSSQLRepository    → MS SQL Server
├── SampleTTRepository       → Tarantool
└── SampleOracleRepository   → Oracle
```

Each implementation speaks the database's native parameter dialect:

| Database   | Parameter Style | Example         |
| ---------- | --------------- | --------------- |
| PostgreSQL | Positional      | `$1, $2, $3`    |
| MS SQL     | Named           | `@id, @column1` |
| Oracle     | Positional      | `:1, :2, :3`    |
| Tarantool  | Positional      | `?`             |

The facade `SampleRepository` routes primary CRUD to PostgreSQL and exposes per-database methods for cross-DB use cases.

---

### Handler (External HTTP Clients)

**Location:** `handler/`

Isolated layer for calling **external APIs**. Keeps HTTP client code out of the service layer.

```go
type SampleHandler interface {
    SampleFunction(data string) (model.SampleModel, error)
}
```

---

## Database Management

**File:** `repository/dbManager.go`

`DBManager` is a single struct holding all database connection pools, passed throughout the app via dependency injection.

```go
type DBManager struct {
    MSSQLDb  *sql.DB
    PGDb     *sql.DB
    OracleDb *sql.DB
    TTPool   *pool.ConnectionPool  // Tarantool
}
```

**Connection pool settings (configurable via env):**

| Setting         | Default   |
| --------------- | --------- |
| MaxOpenConns    | 100       |
| MaxIdleConns    | 20        |
| ConnMaxLifetime | 5 minutes |
| ConnMaxIdleTime | 2 minutes |

`DBManager.Health()` pings all configured connections and returns a status map used by the `/health` endpoint.

---

## Dependency Injection

Manual constructor-based DI. All wiring happens in `router/sampleRouter.go`:

```
router.SetupRoutes(app, dbManager)
│
├── NewSamplePGRepository(dbManager)     ─┐
├── NewSampleMSSQLRepository(dbManager)   ├─ NewSampleRepository(...)  → facade
├── NewSampleTTRepository(dbManager)      |
├── NewSampleOracleRepository(dbManager) ─┘
│
├── NewSampleHandler()
├── NewSampleService(handler, dbManager, sampleRepo)
├── NewSampleController(sampleService)
│
├── NewAuthService()
└── NewAuthController(authService)
```

No DI framework (e.g., Wire) is used. Dependencies are explicit in constructors, making them easy to swap for mocks in tests.

---

## Routing

**Public routes** (no auth):

```
POST  /auth/login
GET   /ping
GET   /health
```

**Protected routes** (require JWT Bearer token):

```
POST   /samples
GET    /samples
GET    /samples/:id
PUT    /samples/:id
DELETE /samples/:id
POST   /sample
```

---

## Middleware

| Middleware | File                     | Purpose                                           |
| ---------- | ------------------------ | ------------------------------------------------- |
| CORS       | `main.go`                | Allow all origins (configurable)                  |
| JWTAuth    | `middleware/jwtAuth.go`  | Validate Bearer token, inject claims into context |
| Recovery   | `middleware/recovery.go` | Catch panics, log stack trace, return 500         |

**JWT flow:**

```
Authorization: Bearer <token>
     ↓
Parse & validate signature (JWT_SECRET)
     ↓
Extract: userID, username → fiber.Ctx locals
     ↓
Pass to controller / service
```

Set `BYPASS_JWT=true` in env to skip JWT validation during development.

---

## Configuration

**File:** `util/init.go`

Config is loaded in order:

1. `.env` file (Viper)
2. Infisical secrets manager (if `INFISICAL=TRUE`)

Key configuration groups:

| Group      | Key Variables                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Server     | `SERVER_PORT`, `ENV`, `INSTANCE`                                                                                     |
| PostgreSQL | `DB_PG_SERVER`, `DB_PG_USER`, `DB_PG_PASS`, `DB_PG_INST`, `DB_PG_PORT`, `DB_PG_SCHEMA`                               |
| MS SQL     | `DB_MSSQL_SERVER`, `DB_MSSQL_USER`, `DB_MSSQL_PASS`, `DB_MSSQL_INST`, `DB_MSSQL_PORT`                                |
| Oracle     | `DB_ORACLE_SERVER`, `DB_ORACLE_USER`, `DB_ORACLE_PASS`, `DB_ORACLE_SERVICE`, `DB_ORACLE_PORT`                        |
| Tarantool  | `DB_TT_SERVER`, `DB_TT_USER`, `DB_TT_PASS`, `DB_TT_PORT`                                                             |
| JWT        | `JWT_SECRET`, `JWT_EXPIRE_HOURS`, `BYPASS_JWT`                                                                       |
| Logging    | `LOG_LEVEL`, `LOG_FILE`, `APP_NAME`                                                                                  |
| Logstash   | `LOGSTASH_ENABLED`, `LOGSTASH_HOST`, `LOGSTASH_PORT`                                                                 |
| Infisical  | `INFISICAL`, `INFISICAL_URL`, `INFISICAL_CLIENTID`, `INFISICAL_CLIENTSECRET`, `INFISICAL_PROJECTID`, `INFISICAL_ENV` |

---

## Logging

**File:** `logger/logger.go`

Built on [Logrus](https://github.com/sirupsen/logrus) with:

- Nested formatter (shows component/function context)
- File rotation (daily, configurable retention)
- Logstash TCP hook with auto-reconnection
- Machine IP included in every log entry
- Caller file and line number attached automatically

Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`

---

## Data Models

**File:** `model/sampleModel.go`

```go
type SampleModel struct {
    ID      string `db:"id"      json:"ID"`
    Column1 string `db:"column1" json:"Column1"`
    Column2 string `db:"column2" json:"Column2"`
}

type PaginatedResponse struct {
    Data       []SampleModel
    Page       int
    Limit      int
    TotalPages int
}
```

SQL query constants per database are defined in the model file to keep queries co-located with the data they operate on.

---

## Error Handling Strategy

| Layer      | Pattern                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| Repository | Return `(result, error)` — status strings: `"COMPLETE"`, `"NOT_FOUND"`, `"ERROR"` |
| Service    | Wrap errors with `fmt.Errorf("context: %w", err)`, return typed errors            |
| Controller | Map service errors → HTTP status codes + JSON response                            |
| Global     | Recovery middleware catches panics → 500 + log stack trace                        |

---

## Key Dependencies (go.mod)

| Package                     | Purpose                        |
| --------------------------- | ------------------------------ |
| `gofiber/fiber/v2`          | HTTP web framework             |
| `spf13/viper`               | Configuration management       |
| `golang-jwt/jwt/v5`         | JWT tokens                     |
| `sirupsen/logrus`           | Structured logging             |
| `lib/pq`                    | PostgreSQL driver              |
| `denisenkom/go-mssqldb`     | MS SQL Server driver           |
| `sijms/go-ora/v2`           | Oracle driver                  |
| `tarantool/go-tarantool/v2` | Tarantool driver               |
| `google/uuid`               | UUID generation                |
| `blockloop/scan`            | SQL row → struct mapping       |
| `infisical/go-sdk`          | Secrets management             |
| `ggwhite/go-masker`         | Sensitive data masking in logs |
| `stretchr/testify`          | Test assertions                |

---

## Design Principles Applied

| Principle                  | How Applied                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| **Single Responsibility**  | Each layer has one job: HTTP, business logic, or data access                      |
| **Dependency Inversion**   | All layers depend on interfaces, not concrete types                               |
| **Open/Closed**            | Add a new database by implementing the interface — no existing code changes       |
| **Explicit Dependencies**  | Constructor injection makes all dependencies visible                              |
| **Separation of Concerns** | HTTP, business logic, data, config, logging — all in separate packages            |
| **Fail Fast**              | Panic on startup if critical config/DB missing; recover at runtime via middleware |

---

## Testing

- Unit tests: `controller/sampleController_test.go`
- Coverage report: `go test -v -coverprofile=coverage.out -coverpkg=./... ./...`
- SonarQube: `sonar-project.properties`
- Mocking: inject interface mocks into constructors

---

Secrets in production are managed via **Infisical** — no credentials in deployment scripts.
