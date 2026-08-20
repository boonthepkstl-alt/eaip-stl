# Software License Management — Acceptance Criteria (Phase 5C)

อ้างอิงจาก [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]]. ✅ = verified จริง (test อัตโนมัติ และ/หรือ browser check ที่รันจริงในรอบนี้)

## License List (`frontend/src/pages/Licenses/index.tsx`, route `/licenses`)

- ✅ User can open the Software License desk — browser check: `/licenses` แสดง 10 licenses พร้อม KPI ทั้ง 4 การ์ด (Total Annual Spend, Seat Utilization, Upcoming Renewals, Potential SaaS Savings)
- ✅ Search works — `licenseService.listLicenses({search})` ทดสอบใน `license-service.test.ts`
- ✅ Filter chips (All/Expiring Soon/High Spend/Audit Risk) — preserved ตรงกับ legacy
- ✅ Table/Grid/Waste Scanner view toggle — preserved
- ✅ Add License modal → `licenseService.createLicense` — ทดสอบใน `license-service.test.ts` (auto-generated `licenseCode`, computed `costPerSeat`)
- ✅ Allocate Seat modal → `licenseService.allocateSeat` — ทดสอบใน `license-service.test.ts` (resolves real employee/asset)
- ✅ Renew Contract modal → `licenseService.renewLicense` — ทดสอบใน `license-service.test.ts`
- ✅ User can navigate to License Detail — ทดสอบผ่าน `App.navigation.test.tsx` (คลิก sidebar จริง) + browser check

## License Detail (`frontend/src/pages/LicenseDetail/index.tsx`, route `/licenses/:licenseId`)

- ✅ User can open a license — `LicenseDetail/index.test.tsx` + browser check (`/licenses/l1`)
- ✅ License key & activation, financials & contract, renewal/expiry, seat utilization — ตรวจแล้วครบ
- ✅ 5-consolidated-tab structure (Overview รวม SaaS Optimization sidebar card, Allocated Seats, Installed Assets, IT Tickets, History & Audit) — ตรวจแล้วถูกต้อง, การ consolidate บันทึกไว้ใน [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]] หัวข้อ 5
- ✅ Allocate Seat action — ยืนยันจริงผ่าน browser และ `license-service.test.ts` (`allocateSeat`)
- ✅ Revoke Seat action — ทดสอบผ่าน `license-service.test.ts` (`releaseSeat`)
- ✅ Renew Contract action — ทดสอบผ่าน `license-service.test.ts` (`renewLicense`)
- ✅ Copy license key — preserved เป็น client-side clipboard action (ไม่ผ่าน service เพราะไม่ mutate ข้อมูล)
- ✅ IT Tickets tab — ผ่าน `ticketService`/`useTickets` ตั้งแต่ต้น (ไม่ต้อง defer เหมือน AssetDetail/EmployeeDetail's ticket tab ใน phase ก่อนหน้า เพราะ Ticket domain มีอยู่แล้ว)
- ✅ Not-found state — ทดสอบแล้ว (`LicenseDetail/index.test.tsx`)

## Cross-Domain Regression (ตามข้อกำหนด section 22/23 ของ phase นี้)

- ✅ License → Employee: คลิก allocated seat's employee name บน LicenseDetail นำไปหน้า EmployeeDetail ที่ถูกต้อง — ทดสอบผ่าน `App.license-cross-domain.test.tsx` + browser check (Sarah Chen/EMP-0001)
- ✅ License → Asset: คลิก installed asset บน LicenseDetail นำไปหน้า AssetDetail ที่ถูกต้อง — ทดสอบผ่าน `App.license-cross-domain.test.tsx` + browser check (MacBook Pro 16" M3/AST-0001)
- ✅ Employee → License: EmployeeDetail's "Software & SaaS" tab **refactor ในรอบนี้** ให้ผ่าน `licenseService`/`useLicenses` (เดิมอ่าน fixture ตรง ไม่มี navigation) คลิกแถว license นำไปหน้า LicenseDetail ที่ถูกต้อง — ทดสอบผ่าน `App.license-cross-domain.test.tsx` + browser check (แสดง 4 license จริงของ Sarah Chen)
- ✅ Asset → License: AssetDetail's "License" tab **refactor ในรอบนี้** ให้ผ่าน `licenseService`/`useLicenses` (เดิมอ่าน `mockData.ts`'s `softwareLicenses.slice(0, 2)` แบบสุ่มไม่ผูกกับ asset จริงเลย) คลิกแถว license นำไปหน้า LicenseDetail ที่ถูกต้อง — ทดสอบผ่าน `App.license-cross-domain.test.tsx` + browser check (แสดง 3 license จริงของ AST-0001 ที่ตรงกับ `installedAssets` binding)
- ✅ Sidebar "Software License" navigates to the real Licenses page, not a 404 — explicit regression test added per this phase's own instruction (section 16), matching the pattern that caught the Phase 5A routing bug
- ✅ Regression: Asset List, Employee List, Maintenance sidebar navigation ทั้งหมดยังทำงานถูกต้อง (46/46 test เดิม + 16 test ใหม่ = 62/62 ผ่าน, browser spot-check บน `/employees` และ `/maintenance`)

## สรุป

ทุกเกณฑ์ยอมรับในสโคปของ Phase 5C **ผ่านจริง** ไม่มีจุดที่ยังไม่รองรับ (ต่างจาก Phase 5B ที่มี Edit Ticket scope fields ค้างไว้) ยืนยันด้วย 62 automated test (19 test file) และ browser check สดที่ทดสอบ cross-domain navigation ครบทั้ง 4 ทิศทาง (License↔Employee, License↔Asset) รวมถึง regression check บนโมดูลอื่นทั้งหมด
