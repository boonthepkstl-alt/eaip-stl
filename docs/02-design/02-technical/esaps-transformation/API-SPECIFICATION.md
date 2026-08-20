# API Specification — RAISE

อ้างอิงจาก [[DOMAIN-MODEL|DOMAIN-MODEL.md]]. Convention ยึดตาม `template/go-template-main` (Fiber, `fiber.Map{"message","error"}` สำหรับ error, `model.PaginationQuery`/`PaginatedResponse` สำหรับ list)

## Endpoint ที่มีอยู่จริงวันนี้ (`server.ts`, Express) — ต้อง migrate ไป Go

| Method | Path | สถานะปัจจุบัน |
|---|---|---|
| GET | `/api/health` | มีจริง — คืนสถานะ server (ไม่ผูก DB เพราะยังไม่มี DB) |
| POST | `/api/ai/decision-matrix` | มีจริง — รับ asset object, เรียก Gemini พร้อม fallback (`generateFallbackDecision`) |
| POST | `/api/ai/reconcile-audit` | มีจริง — AI root-cause สำหรับ reconciliation |
| POST | `/api/ai/executive-summary` | มีจริง — สรุปเชิงบริหาร |
| POST | `/api/ai/chat` | มีจริง — AI Assistant แบบ chat |

**ไม่มี CRUD endpoint ใดๆ สำหรับ asset/employee/license/maintenance ในโค้ดปัจจุบัน** — หน้าจอทั้งหมดอ่านจาก `src/data/*.ts` โดยตรง

## Endpoint เป้าหมาย (Go/Fiber, `/api/v1/...`)

### Auth (ตาม `authController.go`/`authService.go` ของ go-template)
```text
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Asset Management
```text
GET    /api/v1/assets?page=1&limit=10
GET    /api/v1/assets/:id
POST   /api/v1/assets
PUT    /api/v1/assets/:id
DELETE /api/v1/assets/:id
POST   /api/v1/assets/:id/assign
POST   /api/v1/assets/:id/transfer
```

### Employee
```text
GET    /api/v1/employees
GET    /api/v1/employees/:id
```

### Maintenance
```text
GET    /api/v1/maintenance/requests
POST   /api/v1/maintenance/requests
GET    /api/v1/maintenance/requests/:id
PUT    /api/v1/maintenance/requests/:id
```

### Software License
```text
GET    /api/v1/licenses
GET    /api/v1/licenses/:id
POST   /api/v1/licenses
```

### Inventory
```text
GET    /api/v1/inventory
```

### Reconciliation (Oracle FA)
```text
POST   /api/v1/reconciliation/runs
GET    /api/v1/reconciliation/runs/:id
GET    /api/v1/reconciliation/runs/:id/items
```

### Approval Workflow
```text
POST   /api/v1/approvals
GET    /api/v1/approvals/:id
POST   /api/v1/approvals/:id/decision
```

### AI (คงชื่อ endpoint เดิมไว้เพื่อลด breaking change ฝั่ง frontend, ย้าย implementation ไป Go)
```text
POST   /api/v1/ai/decision-matrix
POST   /api/v1/ai/reconcile-audit
POST   /api/v1/ai/executive-summary
POST   /api/v1/ai/chat
```

### Health
```text
GET    /api/v1/health   -- ใช้ DBManager.Health() แทน static response
```

## หลักการตอบกลับ

- Error: `{"message": "...", "error": "..."}` (status code ตาม HTTP semantics — 400/401/403/404/500) ตาม `sampleController.go`
- List: `{"data": [...], "total": n, "page": n, "limit": n, "totalPages": n}` ตาม `model.PaginatedResponse`
- ทุก endpoint ที่แก้ไขข้อมูล (POST/PUT/DELETE) ต้องผ่าน `JWTAuth()` + `RequireRole(...)` middleware — ไม่มี endpoint แก้ไขข้อมูลที่เปิดสาธารณะ

รายละเอียด request/response schema แต่ละ endpoint ให้ทำต่อผ่าน agent `api-db-writer` เมื่อ [[DOMAIN-MODEL|DOMAIN-MODEL.md]] ได้รับการยืนยัน field จริงจาก business owner แล้ว
