# Development Guide — RAISE

อ้างอิงจาก [[MIGRATION-PLAN|MIGRATION-PLAN.md]]

## โครงสร้าง backend เป้าหมาย (ปรับจาก `template/go-template-main`)

```text
backend/
├── main.go
├── app.env
├── controller/        # HTTP handler ต่อ module (ตาม sampleController.go)
├── service/            # business logic (ตาม sampleService.go)
├── repository/         # DB access ผ่าน DBManager (ตาม dbManager.go)
├── model/              # struct request/response/domain
├── middleware/          # jwtAuth.go, recovery.go, tracing.go (ใช้ของ template ตรงๆ)
├── handler/             # เหมือน template (เรียก external system เช่น Oracle FA)
├── logger/
├── util/
└── sql/pg/              # migration (Flyway-style: V{n}__{description}.sql)
```

จัดกลุ่ม controller/service/repository ต่อ domain (asset, employee, license, maintenance, procurement, audit, reconciliation, workflow, ai) ไม่ต้องสร้างโฟลเดอร์ `internal/{module}/` แยกจาก layer เดิมของ template ถ้าจำนวน endpoint ยังจัดการได้ในโครง flat แบบ template — ขยายเป็น `internal/` module-based เมื่อจำนวนไฟล์ต่อ layer เริ่มมากเกินจะดูแลได้ง่าย (อย่า over-engineer ก่อนถึงจุดนั้น)

## โครงสร้าง frontend — scaffold จริงแล้วที่ `frontend/` (ไม่ใช่แค่แผนแล้ว — ดู [[FRONTEND-SCAFFOLD-RESULT|FRONTEND-SCAFFOLD-RESULT.md]])

```text
frontend/
├── src/
│   ├── pages/{Feature}/index.tsx + _components/   # ตาม convention ของ template — Assets/AssetDetail/CreateAsset (Phase 4), Employees/EmployeeDetail (Phase 5A), Maintenance/TicketDetail (Phase 5B), Licenses/LicenseDetail (Phase 5C), Administration/UserManagement/RoleManagement (Phase 5D), Settings (Phase 5E) เป็นของจริงแล้ว, reconciliation/ai ยังเป็น placeholder ใน pages/modules.tsx
│   ├── components/            # UI kit จาก ESAPS (Button, Card, Modal, ... ทั้งชุด) + AppShell + DataTable
│   ├── data/fixtures/         # mock data ที่ copy มาจาก src/data/ ตรงๆ — repository/service เท่านั้นที่ import จากตรงนี้ได้ ห้ามให้หน้าธุรกิจ import ตรง
│   ├── hooks/{useAssets,useAsset}.ts  # domain state (loading/error/data) แยกจาก UI state ในหน้า
│   ├── services/{domain}-repository.ts + {domain}-service.ts  # ทุก entity ใหม่ทำตาม pattern นี้ — repository interface + Mock impl ก่อน, หน้าเรียกผ่าน service เท่านั้น
│   ├── contexts/               # AuthContext จาก template
│   ├── types/{domain}.ts
│   └── config/constants.ts
└── package.json, tsconfig.json, vite.config.ts, vitest.config.ts, .eslintrc.cjs, .prettierrc
```

**Service boundary pattern ที่ใช้จริงแล้ว 7 ครั้ง** (`services/asset-repository.ts`/`asset-service.ts` จาก Phase 4, `services/employee-repository.ts`/`employee-service.ts` จาก Phase 5A, `services/ticket-repository.ts`/`ticket-service.ts` จาก Phase 5B, `services/license-repository.ts`/`license-service.ts` จาก Phase 5C, `services/user-repository.ts`/`user-service.ts` + `services/role-repository.ts`/`role-service.ts` จาก Phase 5D, `services/settings-repository.ts`/`settings-service.ts` จาก Phase 5E — พิสูจน์แล้วว่า pattern นี้ generalize ได้แม้กับ single-record domain ที่ไม่มี fixture ต้นทางเลย ไม่ใช่แค่ domain ที่มี collection) — ทำซ้ำ pattern นี้ทุก domain ใหม่ (Phase 6 เป็นต้นไปของ [[MIGRATION-PLAN|MIGRATION-PLAN.md]]):
1. ประกาศ `{Domain}Repository` interface ใน `services/{domain}-repository.ts`
2. Implement `Mock{Domain}Repository` โดย seed จาก `data/fixtures/*` (ตัด field ที่เป็น presentation concern ทิ้ง เช่น icon)
3. `services/{domain}-service.ts` wire repository เป็น singleton แล้ว export function ระดับ business (ไม่ export repository ตรง)
4. หน้า/hook เรียกผ่าน service เท่านั้น — ห้าม import fixture ตรงจากหน้าธุรกิจ (ยกเว้น reference data ที่ยังไม่มี service เช่น `departments`/`locations` ซึ่งเป็น tech debt ที่บันทึกไว้แล้วใน [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]])
5. **ถ้า domain ใหม่ต้องอ่านข้อมูลจากอีก domain** (เช่น Employee ต้องรู้ asset ที่ตัวเองถืออยู่) ให้ import service ของอีกฝั่งแบบทางเดียวเท่านั้น (`employee-service.ts` import `asset-service.ts` ได้ แต่ `asset-service.ts` ต้อง**ไม่**import อะไรจาก employee — ตรวจสอบทิศทางนี้ทุกครั้งก่อน commit เพื่อไม่ให้เกิด circular dependency ดู [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]] หัวข้อ 5 เป็นตัวอย่าง)

เมื่อ migrate business module ใหม่ ให้เพิ่มไฟล์ลงใน `frontend/src/` นี้ตรงๆ — **ไม่ต้อง scaffold ใหม่อีกรอบ**

## คำสั่งที่ใช้ (แยกกันชัดเจนระหว่าง frontend/backend หลัง scaffold)

```bash
# Backend (จาก template/go-template-main)
go mod edit -module singer/{module_name}
go mod tidy
go run .
go test -v -coverprofile=coverage.out -coverpkg=./... -covermode=set ./...

# Frontend (จาก template/react-template-main, รันจริงแล้วที่ frontend/ — ดู FRONTEND-SCAFFOLD-RESULT.md)
cd frontend
npm install
npm run dev      # http://localhost:5173 — หรือเปิดผ่าน .claude/launch.json config "raise-frontend"
npm run build
npm run lint
npm run test      # vitest — เพิ่มใหม่ ไม่มีในทั้ง ESAPS/template เดิม
npm run format
```

**อย่าใช้คำสั่งของแอป ESAPS เดิมที่ root** (`npm run dev` ที่รัน `tsx server.ts`) ต่อไปเมื่อ scaffold โปรเจกต์จริงแล้ว — นั่นเป็นคำสั่งของ prototype เดิม ไม่ใช่ของโปรเจกต์ใหม่ที่ scaffold จาก template

## สิ่งที่ไม่ควรทำ (Rule จาก analysis เดิม + มาตรฐานของ template)

1. **ห้าม** rewrite UI ที่ทำงานอยู่แล้วโดยไม่มีเหตุผล — `src/components/ui/*` และ `AppShell` เป็นจุดแข็งที่สุดของ ESAPS อย่าทิ้ง
2. **ห้าม** เพิ่มหน้าใหม่/mock data ใหม่/AI prompt ใหม่เข้าไปใน prototype เดิมต่อไปเรื่อยๆ ก่อนที่ foundation (DB/Auth/API) จะพร้อม — จะทำให้ prototype ใหญ่ขึ้นโดยที่ business backend ไม่โตตาม
3. **ห้าม** แก้ไฟล์ใน `template/react-template-main/` หรือ `template/go-template-main/` ตรงๆ — เป็นโค้ดอ้างอิงเท่านั้น ต้อง copy ไปเริ่มโปรเจกต์ใหม่ตามที่ CLAUDE.md ระบุไว้
4. **ห้าม** เก็บ production business data ไว้ hardcode ใน React component ต่อไป — ย้าย mock data ที่มีประโยชน์ไปเป็น `tests/fixtures/`/`seed/` แทนการลบทิ้งเฉยๆ
5. **ห้าม** ให้ AI แก้ record สำคัญโดยไม่ผ่าน human approval (ดู [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]])
6. **ห้าม** สร้าง microservice แยกโดยไม่มีเหตุผลด้าน scale/team ชัดเจน — เริ่มจาก modular monolith ตาม [[ARCHITECTURE|ARCHITECTURE.md]]
7. ทุกการตัดสินใจสถาปัตยกรรมสำคัญ ให้บันทึกเป็น ADR ในโฟลเดอร์ `DECISIONS/` (ดู [[ADR-001-architecture|ADR-001-architecture.md]])

## ลำดับความสำคัญ (สรุปจาก MIGRATION-PLAN)

```text
P0: Go/React template integration, PostgreSQL, Auth, RBAC
P1: Asset, Employee, Assignment, Maintenance, License
P2: Oracle FA Reconciliation, Workflow, Audit, Procurement, Document
P3: AI Decision Center ย้ายเข้า AI Architecture ใหม่, Predictive Maintenance, Cost Optimization, Executive Copilot
P4: Analytics, Reports, Notifications ขั้นสูง
```
