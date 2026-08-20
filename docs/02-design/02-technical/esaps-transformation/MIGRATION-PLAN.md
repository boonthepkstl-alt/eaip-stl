# Migration Plan — RAISE

อ้างอิงจาก [[ARCHITECTURE-COMPARISON|ARCHITECTURE-COMPARISON.md]]. หลักการ: **incremental migration ไม่ rewrite ทำลายของเดิม** เก็บ UI ที่มีอยู่ไว้เป็น baseline ตลอดทั้งแผน

## Phase 1 — Analyze (เอกสารชุดนี้)
วิเคราะห์ ESAPS ปัจจุบัน เทียบกับ `react-template-main`/`go-template-main`/starter-kit แล้วสร้างเอกสารอ้างอิงทั้งหมดใน `docs/02-design/02-technical/esaps-transformation/` — **เสร็จแล้ว ณ เอกสารนี้**

## Phase 2 — Target Architecture
ยืนยัน [[ARCHITECTURE|ARCHITECTURE.md]] กับผู้มีอำนาจตัดสินใจ (business owner/CIO) ก่อนเริ่ม scaffold จริง โดยเฉพาะจุดที่ยังเป็นสมมติฐาน:
- PostgreSQL ตรงๆ ผ่าน `DBManager` vs. Supabase (ดู [[DATABASE-DESIGN|DATABASE-DESIGN.md]])
- Role ชุด `EMPLOYEE/IT_STAFF/IT_MANAGER/ADMIN` ตรงกับองค์กรจริงหรือไม่

## Phase 3 — Scaffold React Frontend — **เสร็จแล้ว** (2026-08-20)
Scaffold จริงที่ `frontend/` (ที่ root, แยกจาก `template/react-template-main/` ซึ่งยังเป็นโค้ดอ้างอิงเท่านั้น) ผ่าน install/typecheck/build/lint/test/browser check ครบ — รายละเอียดเต็มอยู่ที่ [[FRONTEND-MIGRATION-ANALYSIS|FRONTEND-MIGRATION-ANALYSIS.md]], [[FRONTEND-MIGRATION-BOUNDARY|FRONTEND-MIGRATION-BOUNDARY.md]], [[FRONTEND-SCAFFOLD-RESULT|FRONTEND-SCAFFOLD-RESULT.md]] สิ่งที่ทำแล้วในรอบนี้:
- ย้าย `src/components/ui/*` (19 component), `AppShell` (ตัด mock-data/AIAssistantDrawer coupling ออกแล้ว), `lib/cn.ts`, `index.css` (Tailwind v4 tokens), `config/navigation.ts` จาก ESAPS เข้า `frontend/` ทั้งชุด
- ตั้ง React Router v7 (ตาม dependency จริงของ template ไม่ใช่ v6 ตามที่ README เขียนไว้ผิด) พร้อม `ProtectedRoute`, `AuthContext` (localStorage token ชั่วคราว), `ErrorBoundary`, API client (`services/api-client.ts`) ที่ชี้ไปยัง Go backend เท่านั้น (`/api/v1/...`)
- Scaffold หน้าจอเพียง minimum ตามที่กำหนด: `/login`, `/dashboard`, `*` (404), และ placeholder `/assets` `/employees` `/maintenance` `/licenses` `/reconciliation` `/ai` — **ยังไม่ migrate หน้าธุรกิจจริงหน้าใดจาก `src/pages/` เดิมเข้า `frontend/` ในรอบนี้**
- `src/`/`server.ts` เดิมยังอยู่ครบ ไม่ถูกแก้ไข ตามข้อกำหนด "ห้ามลบ/แก้ไข legacy source ระหว่าง phase นี้"

## แผนใหม่ (2026-08-20) — frontend vertical slice ก่อน backend

ผู้ใช้ปรับลำดับ Phase 4 เป็นต้นไปจากแผนเดิม (ที่ทำ Go backend/PostgreSQL ก่อน) เป็น **migrate ทีละ business vertical slice ฝั่ง frontend ให้จบทั้งเส้นก่อน** (UI → service boundary → mock adapter → API contract) แล้วค่อยต่อ Go/PostgreSQL จริงทีเดียวท้ายสุด เหตุผล: ป้องกันการแก้ API abstraction ซ้ำหลายรอบถ้าทำ backend ก่อนแล้วพบว่า contract ไม่พอดีกับ UI จริง Phase 4-8 ด้านล่างมาแทน Phase 4-12 เดิมทั้งหมด

## Phase 4 — Asset Management Vertical Slice — **เสร็จแล้ว** (2026-08-20)
Migrate `AssetList.tsx`/`AssetDetail.tsx`/`CreateAsset.tsx`/`Assignment.tsx` เข้า `frontend/` จริง พร้อม service boundary (`assetService` + `MockAssetRepository`) ที่ swap เป็น HTTP ได้โดยไม่แก้ UI — รายละเอียดเต็มที่ [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]], [[ASSET-MANAGEMENT-API-CONTRACT|ASSET-MANAGEMENT-API-CONTRACT.md]], [[ASSET-MANAGEMENT-ACCEPTANCE|ASSET-MANAGEMENT-ACCEPTANCE.md]] ยืนยันผ่าน unit test (17 เคสรวม Phase 3) + browser check จริง (create/list/assign ทำงานถูกต้อง end-to-end) พบและแก้บั๊กจริง 1 จุด (ปุ่ม "New Asset" ของ AppShell นำทางผิดตั้งแต่ Phase 3) `src/`/`server.ts` เดิมยังไม่ถูกแก้ไข

## Phase 5 — Employee / Maintenance / License Vertical Slice (แตกเป็น 3 sub-phase)

### Phase 5A — Employee Management — **เสร็จแล้ว** (2026-08-20)
Migrate `EmployeeDetail.tsx` (ใหม่) + refactor `pages/Employees` (Phase 4) ให้เลิกใช้ local state แล้วผ่าน `employeeService`/`MockEmployeeRepository` จริง — พิสูจน์แล้วว่า pattern ของ Asset ใช้กับโดเมนอื่นได้ และ Asset↔Employee relationship ไม่มี circular dependency (ทิศทางเดียว Employee→Asset) รายละเอียดเต็มที่ [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]], [[EMPLOYEE-MANAGEMENT-API-CONTRACT|EMPLOYEE-MANAGEMENT-API-CONTRACT.md]], [[EMPLOYEE-MANAGEMENT-ACCEPTANCE|EMPLOYEE-MANAGEMENT-ACCEPTANCE.md]] ยืนยันผ่าน unit test (29 เคสรวม Phase 3-4) + browser check จริง (assign/edit ทำงานถูกต้อง end-to-end, cross-domain navigation ทั้งสองทาง) `src/pages/UserManagement.tsx`/`RoleManagement.tsx` ถูก **DEFER** อย่างมีเหตุผล (คนละโดเมน: User/Identity, RBAC) `src/`/`server.ts` เดิมยังไม่ถูกแก้ไข

### Phase 5A post-completion fix — **เสร็จแล้ว** (2026-08-20)
ผู้ใช้พบว่าคลิก sidebar "Employee Management" จริงได้ 404 แม้ Phase 5A รายงานว่าเสร็จแล้ว — root cause: `config/navigation.ts`'s nav id (`assignment`, `ai-decision`) ไม่ตรงกับ route path ที่ `App.tsx` ลงทะเบียนจริง (`/employees`, `/ai`) เพราะ `AppShell`'s `onNavigate={(id) => navigate('/'+id)}` ใช้ id เป็น path ตรงๆ แก้แล้วทั้งสองจุด พร้อมเพิ่ม regression test ที่คลิก sidebar จริง (`App.navigation.test.tsx`) แทนการเรียก `navigate()` ตรงซึ่งไม่จับบั๊กประเภทนี้ได้ รายละเอียดเต็มใน [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]] หัวข้อ "Post-completion fix"

### Phase 5B — IT Requisition & Maintenance Vertical Slice — **เสร็จแล้ว** (2026-08-20)
Migrate `Maintenance.tsx`/`TicketDetail.tsx` เข้า `frontend/` จริง **ข้อค้นพบสำคัญ**: "IT Requisition"/"Maintenance"/"Ticket" ที่สมมติไว้เป็น 3 โดเมนแยก แท้จริงเป็น**โดเมนเดียว (Ticket)** — ทั้งสองหน้าเดิม operate บน `ITRequisitionTicket` entity เดียวกันทุกประการผ่าน 4-stage workflow (`PENDING_DEPT_APPROVAL → PENDING_IT_DISPATCH → PLANNING/IN_PROGRESS/ON_HOLD → DONE`) จึงสร้าง `ticketService`/`TicketRepository` ตัวเดียว ไม่ใช่ 3 ตัวตามที่ prompt เสนอไว้แต่แรก ปิด known cross-domain coupling จาก Phase 4/5A แล้ว (`AssetDetail`'s Maintenance/Tickets tab และ `EmployeeDetail`'s IT Tickets tab ผ่าน `ticketService` จริงตอนนี้) รายละเอียดเต็มที่ [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]], [[MAINTENANCE-API-CONTRACT|MAINTENANCE-API-CONTRACT.md]], [[MAINTENANCE-ACCEPTANCE|MAINTENANCE-ACCEPTANCE.md]] ยืนยันผ่าน unit test (46 เคสรวม Phase 3-5A) + browser check จริง (approve ticket ทำงานถูกต้อง end-to-end, KPI อัปเดต real-time) `src/`/`server.ts` เดิมยังไม่ถูกแก้ไข

### Phase 5C — License Vertical Slice — **เสร็จแล้ว** (2026-08-20)
Migrate `SoftwareLicense.tsx`/`LicenseDetail.tsx` เข้า `frontend/` จริง พร้อม `licenseService`/`MockSoftwareLicenseRepository` ของตัวเอง (ทิศทางเดียว License→Employee ผ่าน allocated seat, License→Asset ผ่าน installed asset binding ไม่มี circular dependency) ปิด known cross-domain coupling จาก Phase 4/5A: `AssetDetail`'s License tab (เดิมอ่าน `mockData.ts`'s `softwareLicenses.slice(0, 2)` แบบสุ่มไม่ผูกกับ asset จริง) และ `EmployeeDetail`'s Software & SaaS tab (เดิมอ่าน `data/fixtures/licenseData.ts` ตรง ไม่มี navigation) **ทั้งสองถูก refactor ให้เรียก `licenseService`/`useLicenses` จริง พร้อมเพิ่ม row-click navigation ไปหน้า LicenseDetail ที่เดิมไม่มีเลย** รายละเอียดเต็มที่ [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]], [[SOFTWARE-LICENSE-API-CONTRACT|SOFTWARE-LICENSE-API-CONTRACT.md]], [[SOFTWARE-LICENSE-ACCEPTANCE|SOFTWARE-LICENSE-ACCEPTANCE.md]] ยืนยันผ่าน unit test (62 เคสรวม Phase 3-5B) + browser check จริง (allocate/release/renew seat ทำงานถูกต้อง end-to-end, cross-domain navigation ครบทั้ง 4 ทิศทาง) `src/`/`server.ts` เดิมยังไม่ถูกแก้ไข **Phase 5 (Employee/Maintenance/License) เสร็จสมบูรณ์ทั้ง 3 sub-phase แล้ว**

### Phase 5D — Administration Vertical Slice — **เสร็จแล้ว** (2026-08-20)
ไม่ได้อยู่ในแผนเดิม — เพิ่มเข้ามาตามคำขอผู้ใช้โดยตรงหลัง Phase 5C ("Administration ยังไม่ได้ปรับปรุง จัดการได้เลย") Migrate `Administration.tsx`/`UserManagement.tsx`/`RoleManagement.tsx` เข้า `frontend/` จริง พร้อม `userService`/`roleService` ของตัวเอง **ข้อค้นพบสำคัญ**: User (platform login account)/Role เป็นคู่ domain แรกในโปรเจกต์นี้ที่ไม่มี cross-domain dependency เลยทั้งสองทิศทาง (`User.role` เป็น free-text label ไม่ใช่ FK ไปยัง `Role.id`, `Role.users`/`permissions` เป็นตัวเลขสรุปที่เก็บไว้ตรงๆ ไม่ใช่ live join) Departments/Locations/Master Data drill-down (ไม่มีปลายทางจริงแม้แต่ใน legacy — `pageRoutes.tsx` ไม่มี case รองรับ ตกไป Dashboard เงียบๆ) แสดง "Coming Soon" toast แทนการปล่อยให้กลายเป็น 404 จริงภายใต้ router ใหม่ รายละเอียดเต็มที่ [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]], [[ADMINISTRATION-API-CONTRACT|ADMINISTRATION-API-CONTRACT.md]], [[ADMINISTRATION-ACCEPTANCE|ADMINISTRATION-ACCEPTANCE.md]] ยืนยันผ่าน unit test (82 เคสรวม Phase 3-5C) + browser check จริง (invite user, delete role ทำงานถูกต้อง end-to-end) `src/`/`server.ts` เดิมยังไม่ถูกแก้ไข

### Phase 5E — System Settings Vertical Slice — **เสร็จแล้ว** (2026-08-20)
ไม่ได้อยู่ในแผนเดิม — เพิ่มเข้ามาตามคำขอผู้ใช้โดยตรงต่อจาก Phase 5D (Administration) Migrate `Settings.tsx` เข้า `frontend/` จริง **ข้อค้นพบสำคัญ**: domain แรกในโปรเจกต์ที่ legacy ไม่มี fixture ข้อมูลเลยสักบรรทัด — ทุก field เป็น local `useState` + hardcoded defaultValue, ปุ่ม "Save Changes" เดิมแค่ยิง toast โดยไม่ persist อะไรจริง สร้าง `PlatformSettings` เป็น single-record domain (ไม่มี id, ไม่ใช่ collection) พร้อม `settingsService`/`MockSettingsRepository` เพื่อให้ Save Changes กลายเป็นการ mutate จริงในรอบ session — เป็นการเติม data layer ที่ขาดไปให้ตรงกับ pattern ของทุก domain อื่น ไม่ใช่การ redesign UI ไม่มี cross-domain dependency เลย (เหมือน User/Role ใน Phase 5D) รายละเอียดเต็มที่ [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]], [[SYSTEM-SETTINGS-API-CONTRACT|SYSTEM-SETTINGS-API-CONTRACT.md]], [[SYSTEM-SETTINGS-ACCEPTANCE|SYSTEM-SETTINGS-ACCEPTANCE.md]] ยืนยันผ่าน unit test (90 เคสรวม Phase 3-5D) + browser check จริง (แก้ Organization Name แล้ว persist จริง) `src/`/`server.ts` เดิมยังไม่ถูกแก้ไข

## Phase 6 — Audit / Reconciliation / Workflow Vertical Slice
Migrate `Reconciliation.tsx` (Oracle FA — โมดูลที่มี potential สูงสุดสำหรับ enterprise differentiation ตาม analysis เดิม), Audit/Approval Workflow placeholder ให้กลายเป็นของจริง พร้อม `reconciliationService`/`auditService`/`workflowService`

## Phase 7 — AI Integration Vertical Slice
ย้าย 4 endpoint AI (`decision-matrix`, `reconcile-audit`, `executive-summary`, `chat`) เข้า frontend service boundary (`aiService`) ต่อยอด [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]] — ทำหลัง Phase 4-6 โดยตั้งใจ เพราะ AI ต้อง ground กับข้อมูลจริงของทุกโมดูลก่อน ไม่ใช่ทำก่อนแล้วหาข้อมูลจริงมาใส่ทีหลัง (เหตุผลเดิมจากแผนก่อนหน้ายังใช้ได้)

## Phase 8 — Backend + PostgreSQL Integration
เมื่อทุก vertical slice ฝั่ง frontend มี service contract ที่นิ่งแล้ว (ผ่านการพิสูจน์จริงด้วย mock adapter ทุกโมดูล) จึง:
1. Scaffold Go backend จาก `template/go-template-main/` ตาม [[DEVELOPMENT-GUIDE|DEVELOPMENT-GUIDE.md]]
2. สร้าง PostgreSQL schema ตาม [[DATABASE-DESIGN|DATABASE-DESIGN.md]] ให้ตรงกับ contract ที่ frontend กำหนดไว้แล้วทุกตัว (เช่น [[ASSET-MANAGEMENT-API-CONTRACT|ASSET-MANAGEMENT-API-CONTRACT.md]])
3. Implement endpoint จริงต่อ module แล้วสลับ `Mock*Repository` → `Http*Repository` ทีละตัว — งานนี้ควรเหลือน้อยเพราะ contract พิสูจน์แล้วว่าตรงกับ UI จริงตั้งแต่ Phase 4-7 ไม่ต้องแก้ abstraction ซ้ำ
4. ต่อ Authentication/RBAC เต็มรูปแบบ + Enterprise SSO ตาม [[AUTH-RBAC|AUTH-RBAC.md]]
5. ปิดช่องว่างใน [[SECURITY|SECURITY.md]] และ [[TEST-STRATEGY|TEST-STRATEGY.md]] ก่อนประกาศ production-ready (Docker/CI ตาม [[DEVELOPMENT-GUIDE|DEVELOPMENT-GUIDE.md]])

## หมายเหตุการอนุมัติ

ทุก phase ที่แตะ source code จริง, apply migration ลง database จริง, หรือ commit/push/สร้าง PR **ต้องขออนุญาตผู้ใช้ก่อนเสมอ** (ตามกฎ session และตามที่ CLAUDE.md ระบุไว้สำหรับสาย `dev-*`) และปัจจุบัน account ที่เชื่อมต่อกับ `boonthep-lamduan/esaps_ai_gemini` มีสิทธิ์แค่ `pull` — ต้องได้ `push`/PR permission ก่อนจะ implement Phase 3 เป็นต้นไปกับ repo ต้นทางนั้นจริง
