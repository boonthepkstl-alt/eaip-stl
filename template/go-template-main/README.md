# Go Template New 2026

Improved backend base template derived from `go-template-2026` and the newer production patterns in `stl-srp-neo`.

## Standard Highlights

- Fiber app with graceful shutdown, body limit, audit logging, and configurable CORS
- Jaeger-ready OpenTelemetry tracing with `trace_id` surfaced in request logs
- JWT auth that supports both Bearer tokens and `HttpOnly` cookies
- Logout with token blacklist support
- Generic protected sample CRUD routes under `/api`
- Multi-database template structure for PostgreSQL, Oracle, MSSQL, and Tarantool
- Health endpoint using the shared `DBManager`
- Demo auth bootstrapped from environment variables for fast scaffolding

## Bootstrap

After creating a real project from this template:

```bash
go mod edit -module singer/{module_name}
go mod tidy
```

## Run

```bash
export $(cat app.env | xargs)
go run .
```

## Test

```bash
go test -v -coverprofile=coverage.out -coverpkg=./... -covermode=set ./...
```

## API Shape

- `GET /api/ping`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/health`
- `POST /api/sample`
- `POST /api/samples`
- `GET /api/samples`
- `GET /api/samples/:id`
- `PUT /api/samples/:id`
- `DELETE /api/samples/:id`

## Auth Notes

This template still uses env-driven demo credentials for scaffolding:

```env
AUTH_DEMO_USERNAME=admin
AUTH_DEMO_PASSWORD=password
AUTH_DEMO_ROLE=admin
AUTH_DEMO_FULL_NAME=Template Admin
```

Replace the demo auth service with a repository-backed user lookup when starting a real project.

## CORS Notes

For browser clients with cookies, set:

```env
CORS_ALLOW_ORIGINS=https://your-frontend.example.com
```

Do not use `*` when credentials are required.

## Tracing Notes

This template can export traces to Jaeger through OTLP HTTP. Example local setup:

```env
OTEL_ENABLED=true
OTEL_SERVICE_NAME=your-service-name
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_INSECURE=true
```

If you already expose a Jaeger collector endpoint through a legacy `JAEGER_ENDPOINT` env, the template will use that value when `OTEL_EXPORTER_OTLP_ENDPOINT` is empty.

Request audit logs and controller logs will automatically include `trace_id` and `span_id` when tracing is enabled, which makes it straightforward to jump from logs into Jaeger.
