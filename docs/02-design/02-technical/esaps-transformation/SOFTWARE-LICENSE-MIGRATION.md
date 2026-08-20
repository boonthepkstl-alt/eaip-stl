# Software License Management Vertical Slice — Migration Record (Phase 5C)

อ้างอิงจาก [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]] (สถาปัตยกรรมต้นแบบ) และ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 5C บันทึกนี้คือผลจริง

## 1. Source files inspected ก่อนเขียนโค้ดใดๆ

| ไฟล์ | บทบาทจริง | โดเมน | การตัดสินใจ |
|---|---|---|---|
| `src/pages/SoftwareLicense.tsx` (1373 บรรทัด) | List page: KPI (annual spend, seat utilization, upcoming renewals, waste savings), Table/Grid/Optimization view toggle, search + filter chips, Add License/Allocate Seat/Renew Contract modals | **License** | **MIGRATE** |
| `src/pages/LicenseDetail.tsx` (1900+ บรรทัด) | Detail page ของ license เดียว, 6 tab (Overview, Allocated Seats, Installed Assets, IT Tickets, SaaS Optimization, History & Audit) | **License** | **MIGRATE** (consolidate 6 tab เหลือ 5 — ดูหัวข้อ 5) |
| `src/data/fixtures/licenseData.ts` (คัดลอกเป็น fixture ตั้งแต่ Phase 3 แล้ว) | ข้อมูล License ทั้งหมด (`SoftwareLicenseDetail`, `AllocatedSeat`, `InstalledAssetBinding`, `LicenseHistoryEvent`) | **License** | **MIGRATE** (ใช้ fixture เดิม ไม่สร้างชุดใหม่) |

ไม่พบข้อค้นพบด้านโดเมนที่ผิดจากสมมติฐาน (ต่างจาก Phase 5B ที่พบว่า Ticket ต้องเป็นโดเมนเดียว) — "Software License" เป็นโดเมนเดียวจริงตามที่ prompt กำหนดไว้แต่แรก มี 2 ความสัมพันธ์ข้ามโดเมน (Employee ผ่าน allocated seat, Asset ผ่าน installed asset binding) ไม่ใช่ 3 เหมือน Ticket

## 2. Cross-domain relationships — ตรวจสอบทิศทางแล้ว ไม่มี circular dependency

```text
licenseService.allocateSeat(id, { employeeId, assetId?, allocationRole })
        │
        ├──▶ employeeService.getEmployee(employeeId)   // อ่านอย่างเดียว, throw ถ้าไม่พบ
        └──▶ assetService.getAsset(assetId)             // อ่านอย่างเดียว, optional (seat อาจเป็น Cloud/SSO only)
```

`employeeService`/`assetService` **ไม่ import อะไรจาก `license-service.ts`/`license-repository.ts` เลย** (ตรวจด้วย grep ก่อนเขียนเอกสารนี้) — ทิศทางเดียว License → Employee และ License → Asset เหมือน pattern ของ Ticket ใน Phase 5B ทุกประการ `AllocatedSeat`/`InstalledAssetBinding` เป็น **embedded snapshot** (employeeName/employeeCode/department ฯลฯ ถูก resolve และเก็บไว้ตอน allocate) ไม่ใช่แค่ id reference — เหตุผลเดียวกับ Ticket: ต้องแสดงชื่อ/แผนกของพนักงาน ณ **ขณะจัดสรร seat** แม้ภายหลังพนักงานย้ายแผนกหรือลาออก (audit-trail integrity)

## 3. Domain Types (`types/license.ts`)

Re-export ชนิดจาก fixture (`SoftwareLicenseDetail as SoftwareLicense`, `LicenseCategory`, `LicenseType`, `LicenseStatus`, `ComplianceStatus`, `AllocatedSeat`, `InstalledAssetBinding`, `LicenseHistoryEvent`, `LicenseAuditLog`) แทนการ redefine โครงสร้างซ้ำ (`SoftwareLicenseDetail` มี field ซ้อนหลายชั้นและยาวกว่า 100 บรรทัด) เพิ่มชนิดใหม่เฉพาะที่ operation ต้องใช้จริง: `CreateLicenseInput`, `UpdateLicenseInput`, `RenewLicenseInput`, `AllocateSeatInput` (รับ `employeeId`/`assetId` เป็น reference ไม่ใช่ embedded object — ตาม pattern เดียวกับ `CreateTicketInput`), `LicenseListQuery`

## 4. Service Boundary

`services/license-repository.ts` (`SoftwareLicenseRepository` interface + `MockSoftwareLicenseRepository`) + `services/license-service.ts` (business-facing: `listLicenses`, `getLicense`, `createLicense`, `updateLicense`, `renewLicense`, `allocateSeat`, `releaseSeat`) — pattern เดียวกับ `assetService`/`employeeService`/`ticketService` ทุกจุด `pages/Licenses`, `pages/LicenseDetail` เรียกผ่านนี้เท่านั้น ไม่ import fixture ตรง

**ปิด known cross-domain coupling ที่ทิ้งไว้จาก Phase 4/5A/5B**: `pages/EmployeeDetail`'s "Software & SaaS" tab และ `pages/AssetDetail`'s "License" tab **ทั้งสองถูก refactor ในรอบนี้** ให้เรียก `useLicenses({})`/`licenseService` แทนการอ่าน `data/fixtures/licenseData.ts` (หรือ `mockData.ts` ในกรณีของ AssetDetail ซึ่งเดิมอ้างสำเนาคนละไฟล์และแสดงแค่ `.slice(0, 2)` แบบไม่ผูกกับ asset จริงเลย) ตรง — ทั้งสอง tab ตอนนี้ filter ตาม entity จริง (Employee: `allocatedSeats` ที่มี `employeeId` ตรงกัน, Asset: `installedAssets` ที่มี `assetId` ตรงกัน) และ**เพิ่ม row-click navigation ไปหน้า `LicenseDetail` จริง** (เดิมทั้งสอง tab ไม่มี navigation เลย เป็นแค่ display) ยืนยันว่าทำงานถูกต้องด้วย test ที่มีอยู่เดิมทั้งหมดยังผ่าน (ไม่มี regression) และ browser check (ดูหัวข้อ 8)

Unlike LicenseDetail's "IT Tickets" tab — ซึ่งใน phase นี้เขียนให้ผ่าน `ticketService`/`useTickets` **ตั้งแต่ต้น** (ไม่ต้องรอ deferred-then-fix เหมือน Employee/AssetDetail's tab อื่นๆ ใน phase ก่อนหน้า) เพราะ Ticket domain มีอยู่แล้วตั้งแต่ Phase 5B — ปิดช่องว่างเชิงรุกแทนที่จะทิ้งไว้ก่อน

## 5. UI Simplification ที่บันทึกไว้ (ไม่ใช่การตัดทิ้งเงียบๆ)

Consolidate 6 tab เดิมของ `LicenseDetail.tsx` (Overview, Allocated Seats, Installed Assets, IT Tickets, SaaS Optimization, History & Audit) เหลือ **5 tab** — พับ "SaaS Optimization" (แสดง dormant seat + potential savings) เข้าเป็น sidebar card ภายใน Overview tab แทน เพราะเนื้อหาสั้น (การ์ดเดียว) และเกี่ยวข้องโดยตรงกับ Seat Utilization card ที่อยู่ใน Overview อยู่แล้ว ตรงกับ pattern การ consolidate ที่ใช้แล้วใน AssetDetail/TicketDetail (Phase 4/5B) — ข้อมูลครบเหมือนเดิม เพียงจัดกลุ่มใหม่ ปุ่ม "Review Seats" ใน card นี้ยังเปลี่ยน tab ไปหน้า Allocated Seats ได้เหมือนเดิม

## 6. Data quality note

Fixture `l1` (Microsoft 365 Enterprise) มี `allocatedSeats[0].employeeId = 'e1'` ตรงกับ `Employee.id` จริงใน `mockData.ts` (ต่างจาก Ticket fixture ใน Phase 5B ที่มี `emp-1` ไม่ตรงกัน) และ `installedAssets` อ้าง `assetId` เช่น `'a1'`/`'a3'`/`'a6'` ตรงกับ `Asset.id` จริงเช่นกัน — ไม่มีปัญหาคุณภาพข้อมูลแบบที่พบใน Phase 5B ทุก seed ticket/asset link นำทางได้ถูกต้องทันทีโดยไม่ต้องสร้าง entity ใหม่ผ่าน service ก่อนทดสอบ

## 7. Test Results (รันจริงแล้ว)

```text
TypeScript : ผ่าน (0 error)
Build      : ผ่าน (bundle-size advisory เท่านั้น)
Lint       : ผ่าน (--max-warnings 0)
Test       : 62/62 ผ่าน (19 test file)
  - license-service.test.ts (8 เคส รวม create/allocateSeat/releaseSeat/renew และ unknown-employee-id rejection)
  - pages/Licenses/index.test.tsx, pages/LicenseDetail/index.test.tsx (component tests รวม not-found state)
  - App.navigation.test.tsx ขยายเพิ่ม: คลิก sidebar "Software License" จริง ยืนยันไม่ 404
  - App.license-cross-domain.test.tsx (ใหม่): License↔Employee และ License↔Asset นำทางถูกต้องทั้งสองทิศทาง (4 เคส)
  - ของเดิมจาก Phase 3/4/5A/5B ทั้งหมดยังผ่าน (ไม่มี regression จากการ refactor AssetDetail/EmployeeDetail)
```

## 8. Browser Verification Results

- ✅ License list (`/licenses`): 10 licenses, KPI ถูกต้อง (Total Annual Spend $871.8K/yr, Seat Utilization 1810/2008 90%, 2 Upcoming Renewals)
- ✅ License detail (`/licenses/l1`): Microsoft 365 Enterprise, tab count ถูกต้อง (6 seats, 2 devices, 1 ticket, 2 history)
- ✅ License → Employee: คลิก "Sarah Chen" ใน Allocated Seats tab → EmployeeDetail (EMP-0001) ถูกต้อง
- ✅ Employee → License: คลิก "Microsoft 365 Enterprise" ใน Sarah Chen's Software & SaaS tab (แสดง 4 รายการจริงผ่าน service, ไม่ใช่ fixture ตรง) → LicenseDetail ถูกต้อง
- ✅ License → Asset: คลิก "MacBook Pro 16" M3" ใน Installed Assets tab → AssetDetail (AST-0001) ถูกต้อง
- ✅ Asset → License: คลิก "Microsoft 365 Enterprise" ใน AST-0001's License tab (แสดง 3 รายการจริงผ่าน service ตรงกับ `installedAssets` — เดิมโชว์แค่ 2 รายการแรกแบบสุ่มไม่ผูกกับ asset) → LicenseDetail ถูกต้อง
- ✅ Regression: Employee list (`/employees`), Maintenance (`/maintenance`) ยังทำงานถูกต้องหลัง refactor
- ✅ ไม่มี console error จากโค้ดแอปพลิเคชันตลอดการทดสอบ (มีแค่ WebSocket HMR error ของ dev server เอง ไม่เกี่ยวกับโค้ดแอป)

`src/`/`server.ts` ยืนยันแล้วว่าไม่ถูกแก้ไข (mtime ยังเป็น 2026-08-16 22:14)
