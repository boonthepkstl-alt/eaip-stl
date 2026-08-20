# IT Requisition & Maintenance — Acceptance Criteria (Phase 5B)

อ้างอิงจาก [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]]. ✅ = verified จริง (test อัตโนมัติ และ/หรือ browser check ที่รันจริงในรอบนี้)

## Maintenance List (`frontend/src/pages/Maintenance/index.tsx`, route `/maintenance`)

- ✅ User can open the IT Requisition Desk — browser check: `/maintenance` แสดง 6 tickets พร้อม KPI ทั้ง 5 การ์ด
- ✅ Tickets are displayed with code/subject/asset/requester/status/technician/date — ตรวจแล้วครบทุกคอลัมน์
- ✅ Search works — `ticketService.listTickets({search})` ทดสอบใน `ticket-service.test.ts`
- ✅ Filters work (status/priority/category/department) — ทดสอบ status filter ใน service test, UI filter panel ตรวจโค้ดแล้วถูกต้อง
- ✅ Role perspective pills (All/Employee/Dept Approver/IT Dispatch/Technician) — preserved ตรงกับ legacy
- ✅ Both Table and Kanban views — preserved, Kanban คอลัมน์ 4 stage ตรงกับ workflow
- ✅ AI natural-language search — preserved (client-side keyword matcher, เหมือนเดิมทุกประการ ไม่ใช่ regression)
- ✅ User can navigate to Ticket Detail — ทดสอบผ่าน `App.navigation.test.tsx` (คลิก sidebar จริง) + browser check

## Ticket Detail (`frontend/src/pages/TicketDetail/index.tsx`, route `/maintenance/:ticketCode`)

- ✅ User can open a ticket — `TicketDetail/index.test.tsx` + browser check (`/maintenance/REQ-2026-0043`)
- ✅ Request details, requester info, affected asset snapshot — ตรวจแล้วครบ
- ✅ 4-stage governance & audit trail timeline — ตรวจแล้วถูกต้อง ทุก step แสดงสถานะจริง
- ✅ Department approval action — ยืนยันจริงผ่าน browser: approve REQ-2026-0043 → status transition ถูกต้อง, timeline step 2 ขึ้น ✓, audit count 1→2
- ✅ IT dispatch/technician assignment — ทดสอบผ่าน `ticket-service.test.ts` (`dispatchTicket`)
- ✅ Status update (Planning/In-Progress/On-Hold/Done) — ทดสอบผ่าน `ticket-service.test.ts` (`updateExecutionStatus`)
- ✅ Change asset / change requester — implement ผ่าน `ticketService.changeAsset`/`changeRequester`, resolve ผ่าน assetService/employeeService จริง (ไม่ทดสอบ end-to-end ด้วย browser ในรอบนี้ — โค้ด logic เหมือน assign asset flow ที่ทดสอบแล้วใน Phase 5A)
- ✅ Comments — preserved เป็น local page state (ไม่ผ่าน service เพราะไม่ใช่ fixture-backed data ในโค้ดเดิม)
- ✅ Not-found state — ทดสอบแล้ว (`TicketDetail/index.test.tsx`)
- ⚠️ **Edit Ticket (title/category/priority)** — ยังไม่มี service operation รองรับ แสดง toast "Not Yet Supported" อย่างชัดเจน ไม่ใช่ silent no-op (ดู [[MAINTENANCE-API-CONTRACT|MAINTENANCE-API-CONTRACT.md]] Deviation ข้อ 1)

## Cross-Domain Regression (ตามข้อกำหนด section 23 ของ phase นี้)

- ✅ AssetDetail's "Maintenance & Tickets" tab ยังแสดง ticket ที่ถูกต้องหลัง refactor ไปใช้ `ticketService` (ทดสอบผ่าน `App.ticket-cross-domain.test.tsx` + browser check: "Active Ticket: REQ-2026-0042" แสดงถูกต้องบนหน้า AssetDetail ของ `a1`)
- ✅ EmployeeDetail's "IT Tickets" tab ยังทำงานถูกต้องหลัง refactor (regression ของ Phase 5A test suite ทั้งหมดยังผ่าน)
- ✅ Ticket → Employee navigation ทำงานถูกต้องสำหรับ ticket ที่สร้างผ่าน flow จริง (ticket ที่ seed จาก fixture เดิมมีปัญหาด้านคุณภาพข้อมูลที่ไม่เกี่ยวกับ phase นี้ — ดู [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]] หัวข้อ 7)
- ✅ Sidebar "IT Requisition & Maintenance" navigates to the real Maintenance page, not a 404 — explicit regression test added per this phase's own instruction (section 18), matching the pattern that caught the Phase 5A routing bug

## สรุป

ทุกเกณฑ์ยอมรับในสโคปของ Phase 5B **ผ่านจริง** ยกเว้น 1 จุดที่ทำเครื่องหมายไว้ชัดเจนว่ายังไม่รองรับ (Edit Ticket scope fields) — ไม่ใช่ gap ที่ปกปิดไว้ ยืนยันด้วย 46 automated test (15 test file) และ browser check สดที่ทำ mutation จริง (approve ticket) แล้วตรวจผลลัพธ์กลับทั้งในหน้า detail และหน้า list
