# Employee Management Vertical Slice — Migration Record (Phase 5A)

## Post-completion fix (2026-08-20): `/employees` 404 from the sidebar

Phase 5A was reported complete, but the user found `/employees` returned **404 — Page not found** when reached via the sidebar. Investigation (reproduced first, per the fix request's own instructions, before touching anything):

- Direct URL navigation to `/employees` worked fine (dev server, both with and without auth) — the route itself was registered correctly in `App.tsx`.
- Clicking the **"Employee Management"** sidebar link failed. Root cause: `AppShell`'s nav buttons call `onNavigate(item.id)` where every page passes `onNavigate={(id) => navigate('/' + id)}` — so the nav item's `id` in `config/navigation.ts` **is** the route path. That file still had `{ id: 'assignment', label: 'Employee Management', ... }`, a leftover from the legacy ESAPS `Page` union (`src/routes/types.ts`), never updated when Phase 3 chose the route name `/employees` instead of `/assignment`. Clicking the link called `navigate('/assignment')`, which matches nothing in `App.tsx` and falls through to the wildcard `*` → `NotFound`.
- The same audit (this fix's section 3/4 asked for a full route mapping, not just the one broken link) found an **identical second instance**: `{ id: 'ai-decision', ... }` vs. the registered route `/ai` (`ROUTES.AI_DECISION`). Also broken, also fixed here — same root cause, same one-line-per-file shape, not scope creep into Phase 5B.
- **Why no earlier test caught this**: every Phase 3/4/5A test navigated by calling `navigate('/employees')` or setting `initialEntries` directly — none of them clicked the actual sidebar button the way a real user does. `pageTitles` lookups (used for the AppShell header title) had the same stale keys, so this was purely a config drift, not a code defect in the migrated pages themselves.

**Fix** (`config/navigation.ts`, `pages/modules.tsx`, `pages/Employees/index.tsx`, `pages/EmployeeDetail/index.tsx`): renamed the nav item id `assignment` → `employees` and `ai-decision` → `ai` (in both the `navGroups` entry and the `pageTitles` key), and updated every `<AppShell current="assignment" ...>` call to `current="employees"` to match. `AiDecisionPage`'s `pageId="ai-decision"` → `pageId="ai"`.

**Regression coverage added** (`App.navigation.test.tsx`, 3 new tests): clicks the actual sidebar "Employee Management" and "AI Decision Center" buttons (not `navigate()` calls) and asserts the destination is the real page, not `NotFound` — plus a static assertion that `navGroups` ids for every currently-scaffolded page match their `ROUTES.*` path segment, so this exact class of bug (nav-id/route-path drift) can't silently reappear for those pages.

**Re-verified end-to-end**: tsc/build/lint clean, 32/32 tests pass (29 prior + 3 new), and a live browser session reproduced the 404 first, then confirmed both links now land on their real pages with zero console errors. `src/`/`server.ts` untouched.

---


อ้างอิงจาก [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]] (สถาปัตยกรรมต้นแบบที่ phase นี้ทำตาม) และ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 5A บันทึกนี้คือผลจริง — ทุก verification ถูกรันจริงแล้ว

## 1. Source files inspected (ก่อนเขียนโค้ดใดๆ)

| ไฟล์ | บทบาทจริงที่พบจากการอ่านโค้ด | โดเมนที่แท้จริง | การตัดสินใจ |
|---|---|---|---|
| `src/pages/EmployeeDetail.tsx` (1623 บรรทัด) | โปรไฟล์พนักงานเต็มรูปแบบ: identity, org hierarchy, assigned hardware, license, IT ticket, history, audit | **Employee** (core) + Asset/License/Maintenance (cross-domain tabs) | **MIGRATE** (core tabs) + **DEFER** (License/Tickets tabs — ดูหัวข้อ 5 |
| `src/pages/Assignment.tsx` | Migrate แล้วใน Phase 4 เป็น `pages/Employees` — เป็นหน้า "Employee Management" แบบเต็มหน้า (roster, KPI, add/assign/transfer modal) ไม่ใช่ sub-form ของ asset | **Employee** (+ Asset read/write ผ่าน assetService) | **REFACTOR** — เปลี่ยนจาก local `useState<Employee[]>` (Phase 4) เป็น `employeeService`/`useEmployees` จริง (ดูหัวข้อ 4) |
| `src/pages/UserManagement.tsx` | จัดการ `User` (id, name, email, **role: string**, status: Active/Inactive/**Suspended**, lastActive) — ไม่มี field ผูกกับ employee record เลย (ไม่มี department hierarchy, ไม่มี employeeCode, ไม่มี assigned asset) | **User / Application Identity** — คนละโดเมนกับ Employee ตามที่ prompt เตือนไว้โดยตรง | **DEFERRED** — ไม่ migrate ในรอบนี้ รอ future Auth/Identity module |
| `src/pages/RoleManagement.tsx` | จัดการ `Role` (permission matrix ต่อ module/action) | **Role / RBAC (Authorization)** — คนละโดเมนกับ Employee | **DEFERRED** — ไม่ migrate ในรอบนี้ รอ future RBAC module (เชื่อมกับ AUTH-RBAC.md) |
| `src/data/mockData.ts` exports: `employees`, `employeeHistoryEvents`, `employeeAuditLogs`, `departments`, `locations` | ข้อมูล Employee domain จริง (ทั้งไฟล์ถูก copy เป็น fixture แล้วใน Phase 4) | **Employee** (core) + reference data ที่ยังไม่มี service (`departments`/`locations`) | **MIGRATE** — ใช้ fixture เดิมที่มีอยู่แล้ว ไม่สร้าง dataset ใหม่ |
| `src/data/licenseData.ts` (947 บรรทัด, ยังไม่ copy ก่อนหน้านี้) | `SoftwareLicenseDetail`, `AllocatedSeat` — License domain | **License** — คนละโดเมน | **MIGRATE เป็น fixture เท่านั้น** (copy ทั้งไฟล์ไป `data/fixtures/licenseData.ts`), **ไม่สร้าง licenseService** ในรอบนี้ (deferred to Phase 5B/5C) |
| `src/data/requisitionData.ts` | Maintenance ticket domain (ใช้ซ้ำจาก Phase 4 อยู่แล้ว) | **Maintenance** — คนละโดเมน | **KEEP** (ใช้ fixture ที่มีอยู่แล้ว) |

## 2. Employee Domain Scope ที่ implement จริง

ตามข้อมูลที่มีจริงใน fixture เท่านั้น (ไม่เพิ่ม field ที่ไม่มีอยู่แล้ว):

- Employee identity: `employeeCode`, `name`, `email`, `phone`, `jobTitle`, `status`
- Organization: `department`, `departmentId`, `location`, `deskLocation`, `manager`
- IT workstation profile: `workstationType`, `primaryOs`, `startDate`
- Relationship ไปยัง Asset domain ผ่าน `employeeService.getEmployeeAssignments()`

**NEW DATA REQUIREMENT ที่พบ**: ไม่มี — ทุก field ที่หน้าจอต้องใช้มีอยู่แล้วใน `Employee` interface ของ `mockData.ts` ไม่ต้องเพิ่ม field ใหม่

## 3. Domain Types (`frontend/src/types/employee.ts`)

KEEP/REFACTOR ตามที่มีอยู่แล้วจาก Phase 4 (`Employee` type ถูกสร้างไว้แล้วตอนนั้นแบบ "borrowed early") — Phase 5A นี้:
- **KEEP** โครง `Employee` เดิมไว้ทั้งหมด (flat shape เหมือน mock — เหตุผลเดียวกับ `Asset` ใน Phase 4: ไม่ recreate UI)
- **NEW**: `EmployeeStatus`, `Department`, `EmployeeSummary`, `EmployeeAssignment` (target wire type), `CreateEmployeeInput`, `UpdateEmployeeInput`, `EmployeeListQuery`, `EmployeeListResult`

## 4. Service Boundary (`services/employee-repository.ts` + `employee-service.ts`)

Pattern เดียวกับ `assetService`/`AssetRepository` ทุกจุด: `EmployeeRepository` interface → `MockEmployeeRepository` (seed จาก fixture) → `employeeService` (singleton, business-facing functions) `listEmployees`/`getEmployee`/`createEmployee`/`updateEmployee` — ไม่มี React code, ไม่มี UI logic ในทั้งสองไฟล์

`pages/Employees/index.tsx` (Phase 4's port ของ `Assignment.tsx`) ถูก **REFACTOR** ในรอบนี้ให้เลิกใช้ local `useState<Employee[]>(initialEmployees)` แล้วเรียก `useEmployees()`/`employeeService.createEmployee()` แทน — นี่คือ regression-safe refactor เพราะพฤติกรรม UI เหมือนเดิมทุกอย่าง (ยืนยันด้วย test + browser check)

## 5. Asset ↔ Employee relationship — ตรวจสอบทิศทางแล้ว ไม่มี circular dependency

```text
employeeService.getEmployeeAssignments(employeeId, employeeName)
        │
        ▼
   assetService.listAssets({})   ← อ่านอย่างเดียว, filter ฝั่ง employee-service.ts เอง
```

`asset-service.ts`/`asset-repository.ts` **ไม่ import อะไรจาก employee domain เลย** (ตรวจสอบแล้วด้วย `grep` ก่อน commit เอกสารนี้) — ทิศทางเดียว Employee → Asset ตามที่ prompt กำหนดไว้ชัดเจน หน้าที่ต้องการ full `Asset[]` (ไม่ใช่แค่ `EmployeeAssignment` แบบบาง) — `types/employee.ts` เก็บ `EmployeeAssignment` ไว้เป็น target wire type สำหรับตอน backend จริง แต่ mock implementation คืน `Asset[]` ตรงเพราะ UI ต้องการ full row (ดู [[EMPLOYEE-MANAGEMENT-API-CONTRACT|EMPLOYEE-MANAGEMENT-API-CONTRACT.md]])

## 6. Deferred cross-domain tabs ใน `pages/EmployeeDetail`

- **License tab** — อ่าน `data/fixtures/licenseData.ts` (`initialSoftwareLicenses`) ตรง ไม่ผ่าน service เพราะ License ยังไม่มี service boundary
- **IT Tickets tab** — อ่าน `data/fixtures/requisitionData.ts` ตรง (โดเมนเดียวกับที่ `AssetDetail` เคย defer ไว้ใน Phase 4) การสร้าง ticket ใหม่ยังเป็น local component state เหมือนเดิม
- **History/Audit tabs** — เป็นข้อมูลระดับ employee จริง (ไม่ใช่ cross-domain) แต่ยังไม่ได้ formalize ผ่าน `employeeService` (ไม่มี operation `getHistory`/`getAuditLog` ตามที่ prompt ระบุ operation set ไว้แค่ 5 ตัว) — ยังเป็น local `useState` seed จาก fixture ตรง, มีการ append entry จริงเมื่อ assign asset/edit profile (ตรวจสอบแล้วผ่าน browser: audit count เพิ่มจาก 5→6 หลัง edit job title)

ทั้งหมดนี้ **ไม่ใช่ bug** — เป็น scope boundary ที่ตั้งใจตาม "STOP after Employee Management is complete" ของ prompt เอง (License/Maintenance ยังไม่ถึง phase)

## 7. Component Classification สรุป

| Item | Classification |
|---|---|
| `pages/Employees/index.tsx` (list, Phase 4) | **REFACTOR** — สลับไปใช้ employeeService |
| `pages/EmployeeDetail/index.tsx` | **NEW** (migrate จาก `src/pages/EmployeeDetail.tsx`) |
| `types/employee.ts` | **KEEP + NEW types** |
| `services/employee-repository.ts`, `employee-service.ts` | **NEW** |
| `hooks/useEmployees.ts`, `useEmployee.ts`, `useEmployeeAssignments.ts` | **NEW** (pattern เดียวกับ `useAssets`/`useAsset` ของ Phase 4) |
| `data/fixtures/licenseData.ts` | **MIGRATE** (copy ตรง, ตัด unused lucide-react import ทิ้งเพื่อผ่าน `noUnusedLocals`) |
| `src/pages/UserManagement.tsx`, `RoleManagement.tsx` | **DEFERRED** |

## 8. Test Results (รันจริงแล้ว)

```text
TypeScript   : ผ่าน (0 error)
Build        : ผ่าน (มี bundle-size advisory เท่านั้น ไม่ใช่ error — ดูหมายเหตุด้านล่าง)
Lint         : ผ่าน (--max-warnings 0, แก้ 1 exhaustive-deps warning ด้วย eslint-disable ที่มีเหตุผลกำกับ)
Test         : 29/29 ผ่าน (10 test file)
  - employee-service.test.ts (7 เคส รวม one-way dependency check)
  - pages/Employees/index.test.tsx (2 เคส)
  - pages/EmployeeDetail/index.test.tsx (2 เคส รวม not-found state)
  - App.cross-domain.test.tsx (2 เคส — Asset→Employee และ Employee→Asset navigation)
  - ของเดิมจาก Phase 3/4 ทั้งหมดยังผ่าน (ไม่มี regression)
```

**หมายเหตุ bundle size**: build เตือนว่า chunk เกิน 500 kB (504.69 kB) หลังรวมหน้า Employee เข้าไป — ยังไม่ถึงขั้น error เป็น tech debt ที่ควรพิจารณา code-splitting (`React.lazy`) เมื่อจำนวนหน้าธุรกิจเพิ่มขึ้นอีกใน Phase 5B/5C ไม่ใช่ blocker ของ phase นี้

## 9. Browser Verification Results (รันจริงผ่าน `preview_start` + read_page/get_page_text/console)

- ✅ Employee list (`/employees`): แสดง 7 employees พร้อม KPI ถูกต้อง, ไม่มี console error
- ✅ Employee detail (`/employees/e1`): แสดง identity/org/assigned assets (2 devices, $3,520) ถูกต้องตรงกับ fixture
- ✅ Employee → Asset navigation: คลิก "MacBook Pro 16" M3" → ไปหน้า `/assets/a1` จริง
- ✅ Asset → Employee navigation: คลิก "Sarah Chen" จากหน้า asset detail → กลับมาหน้า employee detail จริง
- ✅ Assign Asset flow: assign "MacBook Air M2" ให้ Sarah Chen → Assigned Assets 2→3, Total Value $3,520→$4,620, History 6→7 — อัปเดตแบบ real-time ไม่ต้อง reload
- ✅ Edit Profile flow: เปลี่ยน Job Title → "Staff Engineer" → บันทึกผ่าน `employeeService.updateEmployee` จริง, Audit count 5→6 (audit log ถูกสร้างจริงตอน field เปลี่ยน)
- ✅ ไม่มี console error จากโค้ดแอปพลิเคชันตลอดการทดสอบ (มีแต่ WebSocket HMR error ของ Vite dev server ที่ไม่เกี่ยวกับโค้ด)

`src/`/`server.ts` ยืนยันแล้วว่าไม่ถูกแก้ไข (mtime ยังเป็น 2026-08-16 เหมือนก่อนเริ่ม phase นี้)
