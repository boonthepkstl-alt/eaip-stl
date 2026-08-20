# Domain Model — RAISE

อ้างอิงจาก [[ARCHITECTURE|ARCHITECTURE.md]]. รายการเอนทิตีนี้สังเคราะห์จาก module ที่มีอยู่จริงใน `src/config/navigation.ts` และหน้าจอใน `src/pages/` ของ ESAPS (Dashboard, AssetList/Detail, EmployeeDetail, Assignment, Maintenance, SoftwareLicense/LicenseDetail, Inventory, AIDecisionCenter, Reconciliation, Reports, Administration, UserManagement, RoleManagement) — **ยังไม่มี schema จริงในโค้ดปัจจุบัน** ทุก field มาจากการอ่าน mock data ใน `src/data/*.ts` เท่านั้น ต้องตรวจกับผู้ใช้/business owner ก่อนสร้าง migration จริง

## กลุ่มเอนทิตีหลัก

### Identity & Access
- `users` — บัญชีผู้ใช้จริง (แทน profile "Alex Morgan" hardcode)
- `roles`, `permissions` — RBAC (`EMPLOYEE`, `IT_STAFF`, `IT_MANAGER`, `ADMIN` เป็นจุดเริ่มต้น ดู [[AUTH-RBAC|AUTH-RBAC.md]])
- `employees`, `departments` — ข้อมูลพนักงาน/หน่วยงาน (สอดคล้องกับหน้า `EmployeeDetail.tsx`)

### Asset Management
- `assets`, `asset_categories`, `asset_statuses`, `asset_locations`
- `asset_assignments`, `asset_transfers` (สอดคล้องกับหน้า `Assignment.tsx`, `AssetDetail.tsx`, `CreateAsset.tsx`)
- `maintenance_requests`, `maintenance_work_orders`, `maintenance_history` (หน้า `Maintenance.tsx`, `TicketDetail.tsx`)

### Software & Inventory
- `licenses`, `license_assignments`, `license_contracts` (หน้า `SoftwareLicense.tsx`, `LicenseDetail.tsx`)
- `inventory_items`, `inventory_transactions` (หน้า `Inventory.tsx`)

### Procurement (ปัจจุบันเป็น placeholder ในหน้าจอ — `ProcurementPlaceholder`)
- `vendors`, `purchase_orders`, `purchase_order_items`

### Audit & Reconciliation
- `asset_audits`, `audit_items`, `audit_discrepancies` (หน้า `AuditPlaceholder` — ยัง placeholder)
- `oracle_fa_records`, `reconciliation_runs`, `reconciliation_items` (หน้า `Reconciliation.tsx` — มี UI จริงแล้ว, backend/DB ยังไม่มี)

### Workflow
- `approval_requests`, `approval_steps` (หน้า `ApprovalsPlaceholder` — ยัง placeholder)
- `documents` (หน้า `DocumentsPlaceholder` — ยัง placeholder)
- `notifications` (หน้า `NotificationCenter.tsx` — มี UI จริงแล้ว)

### AI
- `ai_decision_runs`, `ai_recommendations`, `ai_feedback` — บันทึกทุกครั้งที่เรียก AI Decision Engine เพื่อ auditability (ดู [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]])

### Cross-cutting
- `audit_logs` — log การเปลี่ยนแปลงข้อมูลสำคัญทั้งหมด (แยกจาก `asset_audits` ซึ่งเป็น business audit ของสินทรัพย์)

## Field ตัวอย่างที่ยืนยันจาก mock data จริง (ต้อง validate กับ business owner)

จาก `src/services`/`server.ts` (payload ที่ `/api/ai/decision-matrix` รับ) เอนทิตี `assets` ควรมีอย่างน้อย:

```text
assetCode, assetName, category, purchaseCost, currentValue,
ageYears, expectedLifespanYears, condition,
cumulativeRepairCost, estimatedNextRepairCost, annualMaintenanceCost,
downtimeHours, newModelReplacementCost, estimatedSalvageValue
```

ผลลัพธ์ AI decision (ตาราง `ai_decision_runs`/`ai_recommendations`) ควรเก็บ:

```text
recommendation (REPAIR|REPLACE|REASSIGN|RETIRE|MAINTAIN), confidence,
healthScore, riskScore, paybackPeriodMonths,
tco3YearRepair, tco3YearReplace, costSavings3Year,
aiRationale, riskFactors[], actionItems[]
```

(field ชุดนี้ตรงกับ `generateFallbackDecision()` ใน `server.ts` ปัจจุบัน — เป็นหลักฐานที่แน่นอนที่สุดว่า output shape ของ AI Decision Engine ควรเป็นอย่างไร)

## ความสัมพันธ์หลัก (สรุปย่อ)

```text
employees 1--N asset_assignments N--1 assets
assets 1--N maintenance_requests
assets 1--N ai_decision_runs
assets N--1 asset_categories / asset_locations / asset_statuses
licenses 1--N license_assignments N--1 employees
reconciliation_runs 1--N reconciliation_items N--1 assets
approval_requests 1--N approval_steps
users N--N roles N--N permissions
```

ต่อไปเมื่อทำ [[DATABASE-DESIGN|DATABASE-DESIGN.md]] ให้ยึด field/relationship ชุดนี้เป็นจุดเริ่มต้น แล้วขยาย column ให้ครบตาม UI จริงในแต่ละหน้า (เช่น `AssetDetail.tsx`, `EmployeeDetail.tsx`) ก่อนเขียน migration จริง
