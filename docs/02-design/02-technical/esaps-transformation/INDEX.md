# ESAPS → RAISE Production Transformation — Index

เอกสารชุดนี้เป็นผลการวิเคราะห์แอป **ESAPS (Enterprise Smart Asset & Procurement System)** ที่มีอยู่จริงที่ root ของ repo (`src/`, `server.ts`, `package.json` ชื่อ `react-example`) เทียบกับมาตรฐานเทคโนโลยีบังคับของ CIO (`template/react-template-main/`, `template/go-template-main/`) และแนวทาง agent/skill ของ starter-kit (`.claude/`) เพื่อวางแผนยกระดับจาก Prototype/MVP ไปสู่ระบบ Production จริงภายใต้แนวคิด **RAISE — Enterprise Asset Management + AI Asset Intelligence**

**สถานะ:** ยังไม่มีการแก้ไข source code ใดๆ ในขั้นนี้ เป็นเอกสารวิเคราะห์และแผนสำหรับใช้อ้างอิงเมื่อเริ่มงานพัฒนาจริงเท่านั้น การเปลี่ยนแปลงจริงต่อ source ต้องรอการอนุมัติจากผู้ใช้ก่อนเสมอ (โดยเฉพาะเพราะ permission ของ account ที่เชื่อมต่อกับ `boonthep-lamduan/esaps_ai_gemini` ปัจจุบันมีแค่ `pull`)

**หมายเหตุตำแหน่งไฟล์:** ณ ตอนที่เขียนเอกสารนี้ (2026-08-19) โฟลเดอร์ `react-template-main/` และ `go-template-main/` ที่ root ถูกย้ายเข้าไปอยู่ใต้ `template/` แล้ว (`template/react-template-main/`, `template/go-template-main/`) เอกสารชุดนี้อ้างอิง path ใหม่นี้ตลอด — ถ้าพบว่า path เปลี่ยนอีกในอนาคต ให้ตรวจสอบตำแหน่งจริงก่อนอ้างอิง

## เอกสารในชุดนี้

0. [[IMPLEMENTATION-READINESS-REVIEW|IMPLEMENTATION-READINESS-REVIEW.md]] — ตรวจความพร้อมของ 4 แหล่งอ้างอิง (react-template/go-template/starter-kit/esaps) ก่อนเริ่ม migrate code จริง พร้อมหลักฐานที่ใช้ปิด database decision
1. [[ARCHITECTURE-COMPARISON|ARCHITECTURE-COMPARISON.md]] — เทียบสถาปัตยกรรมของ ESAPS ปัจจุบัน vs. `react-template-main`/`go-template-main`/starter-kit ทีละด้าน พร้อมข้อสรุป (Keep/Migrate/Refactor/Replace/Remove/New)
2. [[ARCHITECTURE|ARCHITECTURE.md]] — สถาปัตยกรรมเป้าหมายของ RAISE
3. [[DOMAIN-MODEL|DOMAIN-MODEL.md]] — โมเดลข้อมูล/เอนทิตีเชิงธุรกิจที่ต้องมีจริง
4. [[DATABASE-DESIGN|DATABASE-DESIGN.md]] — การนำโมเดลข้อมูลไปสร้างจริงบน PostgreSQL ตามแนวทาง `go-template-main`
5. [[API-SPECIFICATION|API-SPECIFICATION.md]] — สัญญา REST API เป้าหมาย เทียบกับ endpoint ที่มีจริงใน `server.ts` วันนี้
6. [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]] — สถาปัตยกรรม AI เป้าหมาย (5 engine) ต่อยอดจากโค้ด Gemini integration + fallback ที่มีอยู่
7. [[AUTH-RBAC|AUTH-RBAC.md]] — แผน Authentication/RBAC จริง แทนที่ profile จำลองปัจจุบัน
8. [[SECURITY|SECURITY.md]] — ข้อกำหนดความปลอดภัยที่ต้องปิดช่องว่างก่อนขึ้น production
9. [[TEST-STRATEGY|TEST-STRATEGY.md]] — กลยุทธ์ทดสอบ frontend/backend/AI
10. [[MIGRATION-PLAN|MIGRATION-PLAN.md]] — แผน migration แบบ incremental 12 phase
11. [[DEVELOPMENT-GUIDE|DEVELOPMENT-GUIDE.md]] — กติกาการพัฒนาต่อจากนี้ (คำสั่ง, โครงสร้างโฟลเดอร์เป้าหมาย, สิ่งที่ห้ามทำ)
12. โฟลเดอร์ [[ADR-001-architecture|DECISIONS/]] — Architecture Decision Records 4 ฉบับ
13. [[FRONTEND-MIGRATION-ANALYSIS|FRONTEND-MIGRATION-ANALYSIS.md]] — Phase 3: วิเคราะห์ `template/react-template-main` vs. ESAPS frontend จาก source จริง ทีละ area พร้อมค้นพบสำคัญเรื่อง design system ที่ขัดกับ `DESIGN.md`
14. [[FRONTEND-MIGRATION-BOUNDARY|FRONTEND-MIGRATION-BOUNDARY.md]] — จัดกลุ่มไฟล์เป็น FOUNDATION/BUSINESS/SHARED/LEGACY พร้อม route mapping เต็ม 28 route
15. [[FRONTEND-SCAFFOLD-RESULT|FRONTEND-SCAFFOLD-RESULT.md]] — ผลจริงของการ scaffold `frontend/` (install/typecheck/build/lint/test/browser check) พร้อม Definition of Done ที่ตรวจแล้ว
16. [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]] — Phase 4: migrate Asset Management vertical slice (List/Detail/Create/Assignment) เข้า `frontend/` จริง พร้อม KEEP/MIGRATE/REFACTOR breakdown และบั๊กที่พบจากการทดสอบจริง
17. [[ASSET-MANAGEMENT-API-CONTRACT|ASSET-MANAGEMENT-API-CONTRACT.md]] — สัญญา service ฝั่ง frontend (`assetService`) ที่ implement จริงแล้ว + target Go endpoint ที่ยังไม่ implement
18. [[ASSET-MANAGEMENT-ACCEPTANCE|ASSET-MANAGEMENT-ACCEPTANCE.md]] — เกณฑ์ยอมรับของ Asset Management vertical slice พร้อมสถานะ verified จริงต่อข้อ
19. [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]] — Phase 5A: migrate Employee Management vertical slice เข้า `frontend/` จริง พร้อมพิสูจน์ว่า Asset↔Employee relationship ไม่มี circular dependency และ DEFER User/Role Management อย่างมีเหตุผล
20. [[EMPLOYEE-MANAGEMENT-API-CONTRACT|EMPLOYEE-MANAGEMENT-API-CONTRACT.md]] — สัญญา service ฝั่ง frontend (`employeeService`) ที่ implement จริงแล้ว + target Go endpoint ที่ยังไม่ implement
21. [[EMPLOYEE-MANAGEMENT-ACCEPTANCE|EMPLOYEE-MANAGEMENT-ACCEPTANCE.md]] — เกณฑ์ยอมรับของ Employee Management vertical slice พร้อมสถานะ verified จริงต่อข้อ
22. [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]] — Phase 5B: migrate IT Requisition & Maintenance vertical slice เข้า `frontend/` จริง พร้อมข้อค้นพบสำคัญว่า "IT Requisition"/"Maintenance"/"Ticket" เป็นโดเมนเดียว (Ticket) ไม่ใช่ 3 โดเมนแยกตามที่สมมติไว้แต่แรก
23. [[MAINTENANCE-API-CONTRACT|MAINTENANCE-API-CONTRACT.md]] — สัญญา service ฝั่ง frontend (`ticketService`) ที่ implement จริงแล้ว + target Go endpoint ที่ยังไม่ implement
24. [[MAINTENANCE-ACCEPTANCE|MAINTENANCE-ACCEPTANCE.md]] — เกณฑ์ยอมรับของ IT Requisition & Maintenance vertical slice พร้อมสถานะ verified จริงต่อข้อ
25. [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]] — Phase 5C: migrate Software License Management vertical slice เข้า `frontend/` จริง พร้อมปิด known cross-domain coupling จาก Phase 4/5A (AssetDetail's License tab, EmployeeDetail's Software & SaaS tab) ที่ทิ้งไว้ตั้งแต่ก่อน License domain มีอยู่
26. [[SOFTWARE-LICENSE-API-CONTRACT|SOFTWARE-LICENSE-API-CONTRACT.md]] — สัญญา service ฝั่ง frontend (`licenseService`) ที่ implement จริงแล้ว + target Go endpoint ที่ยังไม่ implement
27. [[SOFTWARE-LICENSE-ACCEPTANCE|SOFTWARE-LICENSE-ACCEPTANCE.md]] — เกณฑ์ยอมรับของ Software License Management vertical slice พร้อมสถานะ verified จริงต่อข้อ
28. [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]] — Phase 6: migrate Administration vertical slice (User Management, Role Management) เข้า `frontend/` จริง พร้อมข้อค้นพบว่า User/Role เป็นคู่ domain แรกที่ไม่มี cross-domain dependency เลย
29. [[ADMINISTRATION-API-CONTRACT|ADMINISTRATION-API-CONTRACT.md]] — สัญญา service ฝั่ง frontend (`userService`, `roleService`) ที่ implement จริงแล้ว + target Go endpoint ที่ยังไม่ implement
30. [[ADMINISTRATION-ACCEPTANCE|ADMINISTRATION-ACCEPTANCE.md]] — เกณฑ์ยอมรับของ Administration vertical slice พร้อมสถานะ verified จริงต่อข้อ
31. [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]] — Phase 7: migrate System Settings เข้า `frontend/` จริง — domain แรกที่ legacy ไม่มี fixture ข้อมูลใดๆ เลย (ทุก field เป็น local state + hardcoded defaultValue) จึงต้องออกแบบ `PlatformSettings` เป็น record เดียวขึ้นใหม่เพื่อให้ Save Changes persist จริง
32. [[SYSTEM-SETTINGS-API-CONTRACT|SYSTEM-SETTINGS-API-CONTRACT.md]] — สัญญา service ฝั่ง frontend (`settingsService`) ที่ implement จริงแล้ว + target Go endpoint ที่ยังไม่ implement
33. [[SYSTEM-SETTINGS-ACCEPTANCE|SYSTEM-SETTINGS-ACCEPTANCE.md]] — เกณฑ์ยอมรับของ System Settings vertical slice พร้อมสถานะ verified จริงต่อข้อ

## สรุปภาพรวม (TL;DR)

ESAPS ปัจจุบันเป็น **high-fidelity frontend prototype ที่ดีมาก** (UI/UX ~9/10, component reuse ~8/10) หุ้มด้วย backend แบบ lightweight (Express ไฟล์เดียว) ที่ต่อ Gemini API พร้อม fallback logic เชิงตัวเลขที่ออกแบบมาดี แต่ **ยังไม่มี database, authentication, authorization จริง และข้อมูลทั้งหมดยัง hardcode อยู่ใน `src/data/`** แนวทางที่แนะนำคือ **เก็บ UI ปัจจุบันไว้เป็นฐาน แล้วสร้าง technical foundation ใหม่ทั้งหมดตามมาตรฐาน CIO** (React ตาม `react-template-main`, backend ย้ายจาก Express ไป Go/Fiber ตาม `go-template-main`, DB จริงบน PostgreSQL) — ไม่ใช่การ rewrite UI ใหม่ทั้งหมด

ข้อสังเกตสำคัญ: **starter-kit (`.claude/agents`, `.claude/skills`) เป็นมาตรฐานสำหรับ "เขียนเอกสารและ orchestrate การพัฒนา" ไม่ใช่มาตรฐานสถาปัตยกรรม AI ระดับ runtime ของแอป** (ไม่มี model abstraction/prompt versioning/AI observability framework ให้อ้างอิงจริง) ดังนั้นสถาปัตยกรรม AI ใน [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]] เป็นการออกแบบใหม่โดยอิงจาก pattern ที่ดีอยู่แล้วใน `server.ts` (fallback engine) ไม่ใช่การ migrate ตามมาตรฐานที่มีอยู่แล้ว

**Database decision ปิดแล้ว** (2026-08-19): เลือก PostgreSQL ผ่าน `DBManager` ของ `go-template-main` (ไม่ใช้ Supabase) หลังตรวจ implementation จริงแล้วว่า abstraction มีคุณภาพเพียงพอ — ดูหลักฐานใน [[IMPLEMENTATION-READINESS-REVIEW|IMPLEMENTATION-READINESS-REVIEW.md]] และ [[ADR-003-database|DECISIONS/ADR-003-database.md]] (สถานะ Accepted)

**Frontend foundation scaffold เสร็จแล้ว** (2026-08-20): สร้าง `frontend/` ที่ root จาก `template/react-template-main` + UI kit/AppShell ของ ESAPS ผ่าน install/typecheck/build/lint/test/browser check ครบทุกขั้นจริง (ไม่ใช่แค่เอกสาร) — ดู [[FRONTEND-SCAFFOLD-RESULT|FRONTEND-SCAFFOLD-RESULT.md]] `src/`/`server.ts` เดิมยังอยู่ครบ ไม่ได้แก้ไข

**Asset Management vertical slice เสร็จแล้ว** (2026-08-20): migrate `AssetList`/`AssetDetail`/`CreateAsset`/`Assignment` เข้า `frontend/` จริง พร้อม service boundary (`assetService`) ที่ swap เป็น Go backend ได้โดยไม่แก้ UI — ดู [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]] แผน migration ถูกปรับใหม่เป็น **frontend vertical slice ทุกโมดูลก่อน แล้วค่อยทำ Go/PostgreSQL ทีเดียวท้ายสุด** (Phase 5-8 ใน [[MIGRATION-PLAN|MIGRATION-PLAN.md]]) ไม่ใช่แผนเดิมที่ทำ backend ก่อน

**Employee Management vertical slice เสร็จแล้ว** (2026-08-20): migrate `EmployeeDetail` (ใหม่) + refactor `pages/Employees` (Phase 4) ให้ผ่าน `employeeService` จริง — พิสูจน์แล้วว่าสถาปัตยกรรมของ Phase 4 ใช้ซ้ำกับโดเมนอื่นได้โดยไม่มี circular dependency (Employee → Asset ทางเดียว) — ดู [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]] `UserManagement`/`RoleManagement` ถูก DEFER อย่างมีเหตุผล (คนละโดเมน: User/Identity และ RBAC ไม่ใช่ Employee)

**Phase 5A post-completion fix** (2026-08-20): พบและแก้บั๊ก 404 จริงตอนคลิก sidebar "Employee Management"/"AI Decision Center" (nav id ไม่ตรงกับ route path — ดู [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]] หัวข้อ "Post-completion fix") เพิ่ม regression test ที่คลิก sidebar จริงแทนการเรียก `navigate()` ตรงๆ

**IT Requisition & Maintenance vertical slice เสร็จแล้ว** (2026-08-20): migrate `Maintenance.tsx`/`TicketDetail.tsx` เข้า `frontend/` จริง พร้อมข้อค้นพบสำคัญว่า "IT Requisition"/"Maintenance"/"Ticket" ที่ prompt สมมติว่าเป็น 3 โดเมน แท้จริงเป็น **โดเมนเดียว (Ticket)** ที่ไหลผ่าน 4-stage workflow — ดู [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]] ปิด known cross-domain coupling จาก Phase 4/5A ด้วย (AssetDetail/EmployeeDetail's ticket tabs ตอนนี้ผ่าน `ticketService` จริง)

**Software License Management vertical slice เสร็จแล้ว** (2026-08-20): migrate `SoftwareLicense.tsx`/`LicenseDetail.tsx` เข้า `frontend/` จริง พร้อม `licenseService` ของตัวเอง (ทิศทางเดียว License→Employee, License→Asset ไม่มี circular dependency) — ดู [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]] ปิด known cross-domain coupling จาก Phase 4/5A ด้วย (AssetDetail's License tab, EmployeeDetail's Software & SaaS tab ตอนนี้ผ่าน `licenseService` จริง พร้อม navigation ไปหน้า LicenseDetail ที่เดิมไม่มีเลย) **Phase 5 (Employee/Maintenance/License) เสร็จสมบูรณ์ทั้ง 3 sub-phase แล้ว**

**Administration vertical slice เสร็จแล้ว** (2026-08-20): migrate `Administration.tsx`/`UserManagement.tsx`/`RoleManagement.tsx` เข้า `frontend/` จริง ตามคำขอผู้ใช้โดยตรงหลัง Phase 5C ("Administration ยังไม่ได้ปรับปรุง") — ดู [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]] ข้อค้นพบสำคัญ: User/Role เป็นคู่ domain แรกในโปรเจกต์นี้ที่**ไม่มี cross-domain dependency เลยทั้งสองทิศทาง** (ต่างจาก Employee→Asset, Ticket→Employee+Asset, License→Employee+Asset) เพราะ `User.role` เป็น free-text label ไม่ใช่ FK ไปยัง `Role.id` จริง Departments/Locations/Master Data drill-down (ที่ไม่มีปลายทางจริงแม้แต่ใน legacy) แสดง "Coming Soon" toast แทนการปล่อยให้เป็น 404 ใหม่

**System Settings vertical slice เสร็จแล้ว** (2026-08-20): migrate `Settings.tsx` เข้า `frontend/` จริง ตามคำขอผู้ใช้ต่อจาก Administration โดยตรง — ดู [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]] ข้อค้นพบสำคัญ: legacy ไม่มี fixture ข้อมูลเลยสักบรรทัด (ทุก field เป็น local state + hardcoded defaultValue, ปุ่ม Save เดิมแค่ยิง toast โดยไม่ persist อะไรจริง) — สร้าง `PlatformSettings` เป็น single-record domain ใหม่พร้อม `settingsService` เพื่อให้ Save Changes กลายเป็นการ mutate จริงในรอบ session ยืนยันด้วย browser check ที่แก้ Organization Name แล้ว persist จริง
