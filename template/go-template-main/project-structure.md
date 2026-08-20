# Project Structure

```text
go-template-new-2026/
├── main.go
├── app.env
├── README.md
├── architecture.md
├── sonar-prepare.md
├── sonar-project.properties
├── go.mod
├── go.sum
├── controller/
│   ├── authController.go
│   ├── sampleController.go
│   └── sampleController_test.go
├── handler/
│   └── sampleHandler.go
├── logger/
│   └── logger.go
├── middleware/
│   ├── jwtAuth.go
│   ├── recovery.go
│   ├── serviceAuth.go
│   └── tracing.go
├── model/
│   ├── authModel.go
│   └── sampleModel.go
├── repository/
│   ├── dbManager.go
│   ├── sampleMSSQLRepository.go
│   ├── sampleOracleRepository.go
│   ├── samplePGRepository.go
│   ├── sampleRepository.go
│   └── sampleTTRepository.go
├── router/
│   └── sampleRouter.go
├── service/
│   ├── authService.go
│   └── sampleService.go
├── sql/
│   ├── mssql/
│   │   └── V0__Initial_Table.sql
│   ├── oracle/
│   │   ├── V0_Prepare_Schema.sql
│   │   └── V1_Initial_Table.sql
│   ├── pg/
│   │   └── V0__Initial_Table.sql
│   └── tt/
│       └── V0__Initial_Table.txt
└── util/
    ├── infisicalUtils.go
    ├── init.go
    ├── jwtUtils.go
    ├── sampleutils.go
    ├── tokenBlacklist.go
    └── tracing.go
```

## Overview

- `controller`, `service`, `repository`, and `model` follow a layered Go API structure.
- `middleware` contains authentication, recovery, and tracing concerns.
- `sql` is organized by database engine: `pg`, `oracle`, `mssql`, and `tt`.
- `util` and `logger` contain shared helper and infrastructure code.
