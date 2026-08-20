# IT Requisition & Maintenance Vertical Slice — Migration Record (Phase 5B)

อ้างอิงจาก [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]] และ [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]] (สถาปัตยกรรมต้นแบบ) และ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 5B บันทึกนี้คือผลจริง

## 1. Business Domain Boundary — ค้นพบจากการอ่านโค้ดจริง (ก่อนเขียนโค้ดใดๆ)

Prompt ของ phase นี้ตั้งสมมติฐานว่า "IT Requisition", "Maintenance", "Ticket" เป็น 3 โดเมนแยกกัน แต่จากการอ่าน `src/pages/Maintenance.tsx` (2199 บรรทัด) และ `src/pages/TicketDetail.tsx` (1927 บรรทัด) จริงแล้วพบว่า **ทั้งสองหน้าทำงานกับ entity เดียวกันทุกประการ**: `ITRequisitionTicket` (นิยามใน `src/data/requisitionData.ts`) หนึ่ง object มี field เดียวกันหมด (`status: RequisitionStatus`, `departmentApproval`, `itAssignment`, `itExecution`, `timeline`) ไหลผ่าน state เดียวกันตั้งแต่สร้างจนปิดงาน:

```text
PENDING_DEPT_APPROVAL → PENDING_IT_DISPATCH → PLANNING/IN_PROGRESS/ON_HOLD → DONE
                      ↘ REJECTED_BY_DEPT
```

"IT Requisition" คือมุมมองช่วงต้น (การขอ+อนุมัติ), "Maintenance" คือมุมมองช่วงหลัง (dispatch+ซ่อม) ของ **ticket เดียวกัน** ไม่ใช่ entity คนละตัว — `Maintenance.tsx` คือหน้า list/board, `TicketDetail.tsx` คือหน้า detail ของ ticket ตัวเดียวกันนั้นเอง ยืนยันด้วย `RolePerspective` (ALL/USER/DEPT_APPROVER/IT_MANAGER/IT_TECH) ที่กรอง ticket ชุดเดียวกันคนละมุมมอง ไม่ใช่คนละ dataset

**การตัดสินใจ**: สร้าง **domain เดียวคือ Ticket** (`types/ticket.ts`, `services/ticket-repository.ts`, `services/ticket-service.ts`) ไม่แยก `ITRequisitionRepository`/`MaintenanceRepository`/`TicketRepository` สามตัวตามที่ prompt เสนอไว้ในตอนแรก — การแยกเช่นนั้นจะสร้าง repository สามตัวที่ operate บนข้อมูลชุดเดียวกันเป๊ะๆ ซึ่งขัดกับกฎของ phase นี้เองข้อ 3 ("Do NOT assume the filename represents the domain... Read the actual implementation and determine business responsibility")

## 2. Source files inspected

| ไฟล์ | บทบาทจริง | โดเมน | การตัดสินใจ |
|---|---|---|---|
| `src/pages/Maintenance.tsx` | List/Kanban ของ Ticket ทั้งหมด พร้อม KPI, role-perspective, AI search, workflow modal (approve/dispatch/status-update/delegation) | **Ticket** | **MIGRATE** |
| `src/pages/TicketDetail.tsx` | Detail view ของ Ticket ตัวเดียว พร้อม governance timeline, comments, change-asset/requester | **Ticket** | **MIGRATE** (7 tab เดิม consolidate เหลือ 4 — ดูหัวข้อ 6) |
| `src/data/requisitionData.ts` (`initialRequisitions`, `initialTechnicians`, `initialDelegationSettings`) | ข้อมูล Ticket ทั้งหมด (คัดลอกเป็น fixture ตั้งแต่ Phase 4 แล้ว) | **Ticket** | **MIGRATE** (ใช้ fixture เดิม ไม่สร้างชุดใหม่) |
| `ITTechnician` (technician list) | ช่างเทคนิค IT — ไม่มี field เชื่อมกับ `Employee.id` เลยใน fixture (เป็น pool แยกต่างหาก) | **Ticket/Maintenance** (ไม่ใช่ Employee) | **KEEP** เป็น reference data ของ Ticket domain ผ่าน `ticketService.listTechnicians()` |

## 3. Cross-domain relationships — ตรวจสอบทิศทางแล้ว ไม่มี circular dependency

```text
ticketService.createTicket({ requesterId, assetId, ... })
        │
        ├──▶ employeeService.getEmployee(requesterId)   // อ่านอย่างเดียว
        └──▶ assetService.getAsset(assetId)              // อ่านอย่างเดียว
```

`employeeService`/`assetService` **ไม่ import อะไรจาก `ticket-service.ts`/`ticket-repository.ts` เลย** (ตรวจด้วย grep ก่อนเขียนเอกสารนี้) — ทิศทางเดียว Ticket → Employee และ Ticket → Asset ตรงตามที่ prompt กำหนด (section 12: "Do NOT create: Maintenance Service → Employee Service → Asset Service → Ticket Service") `Ticket.requester`/`Ticket.asset` ยังคงเป็น **embedded snapshot** (ไม่ใช่แค่ id reference) เหมือน fixture เดิม — เหตุผล: UI ทั้งสองหน้าต้องแสดงชื่อ/แผนก/รหัสทรัพย์สินที่ **ขณะยื่นคำขอ** (audit trail ต้องคงที่แม้ภายหลังพนักงานย้ายแผนกหรือ asset ถูก reassign) ซึ่งเป็นพฤติกรรมที่ถูกต้องของระบบ ticket ทั่วไป ไม่ใช่การ duplicate logic โดยไม่จำเป็น — `ticketService` เป็นผู้ populate snapshot นี้จาก Employee/Asset ตอนสร้าง/แก้ไข ไม่ใช่ให้หน้าธุรกิจ import fixture ของ Employee/Asset มาประกอบเอง

## 4. Domain Types (`types/ticket.ts`)

Re-export ชนิดจาก fixture (`ITRequisitionTicket as Ticket`, `RequisitionStatus as TicketStatus`, `PriorityLevel as TicketPriority`, `TicketCategory`, `TimelineEvent`, `ITTechnician`, `DelegatedApproverSetting`) แทนการ redefine โครงสร้างซ้ำ (ตามกฎ "avoid duplicate models" — โครงสร้างนี้มีซ้อน 4 ชั้นและยาวกว่า 100 บรรทัด, re-export คือทางเลือกที่ไม่ duplicate) เพิ่มชนิดใหม่เฉพาะที่ operation ต้องใช้จริง: `CreateTicketInput`, `ApprovalDecisionInput`, `DispatchInput`, `StatusUpdateInput`, `TicketListQuery`

## 5. Service Boundary

`services/ticket-repository.ts` (`TicketRepository` interface + `MockTicketRepository`) + `services/ticket-service.ts` (business-facing: `listTickets`, `getTicket`, `createTicket`, `decideApproval`, `dispatchTicket`, `updateExecutionStatus`, `changeAsset`, `changeRequester`, `listTechnicians`, `listDelegationSettings`) — pattern เดียวกับ `assetService`/`employeeService` ทุกจุด `pages/Maintenance`, `pages/TicketDetail` เรียกผ่านนี้เท่านั้น ไม่ import fixture ตรง

**ปิด known cross-domain coupling ที่ทิ้งไว้จาก Phase 4/5A**: `pages/AssetDetail`'s "Maintenance & Tickets" tab และ `pages/EmployeeDetail`'s "IT Tickets" tab **ทั้งสองถูก refactor ในรอบนี้** ให้เรียก `useTickets({})`/`ticketService` แทนการอ่าน `data/fixtures/requisitionData.ts` ตรง — ยืนยันว่าทำงานถูกต้องด้วย test ที่มีอยู่เดิมทั้งหมดยังผ่าน (ไม่มี regression) และ browser check (ดูหัวข้อ 9)

## 6. UI Simplification ที่บันทึกไว้ (ไม่ใช่การตัดทิ้งเงียบๆ)

1. **Maintenance list**: ตัด inline slide-over Drawer quick-view ออก — ใช้การ navigate ไปหน้า `pages/TicketDetail` (route `/maintenance/:ticketCode`) แทน เพราะตอนนี้มีหน้า detail แบบเต็มจริงแล้ว (legacy app ใช้ client-state page swap ไม่ใช่ URL จริง จึง Drawer แบบ quick-view มีเหตุผลตอนนั้น — ตอนนี้ไม่จำเป็นเพราะ URL routing ทำงานได้แล้ว)
2. **TicketDetail**: consolidate 7 tab เดิม (Overview, Request Details, Affected Asset, Approval & Governance, Assignment & Work Order, Audit Trail, Comments) เหลือ 4 tab (Overview ผนวก Request Details + governance timeline + SLA/support-group sidebar, Affected Asset, Audit Trail, Comments) — Overview tab ที่รวมแล้วมีข้อมูลครบเหมือนเดิม เพียงจัดกลุ่มใหม่ ตรงกับ pattern การ consolidate ที่ใช้แล้วใน AssetDetail/EmployeeDetail (Phase 4/5A)
3. **Edit Ticket modal**: ยังไม่ผูกกับ `ticketService` จริง (ยังไม่มี operation แก้ title/category/priority ใน service) — แสดง toast "Not Yet Supported" แทนการ silently no-op เป็น documented gap ไม่ใช่ silent failure — จะเพิ่มเมื่อ backend endpoint `PUT /api/v1/tickets/:id` ถูก implement

## 7. ข้อค้นพบด้านคุณภาพข้อมูล (ไม่ใช่บั๊กของ phase นี้ แต่ค้นพบระหว่างเขียน test)

`Ticket.requester.id` ใน fixture เดิม (`initialRequisitions`) เก็บเป็น `'emp-1'`, `'emp-2'`, ... ซึ่ง **ไม่ตรงกับ `Employee.id`** จริง (`'e1'`, `'e2'`, ...) ใน `mockData.ts` เลยสักตัว — เป็นความไม่สอดคล้องของข้อมูลตัวอย่างเดิมที่มีอยู่ก่อน phase นี้ (ไม่ใช่สิ่งที่ phase นี้สร้างขึ้น) ผลคือ: การคลิกชื่อ requester จาก ticket ที่ seed มาจาก fixture เดิมจะนำไปสู่หน้า "Employee not found" แทนที่จะเจอ Sarah Chen จริง ticket ที่สร้างผ่าน `ticketService.createTicket()` (flow จริงของ phase นี้) **ไม่มีปัญหานี้** เพราะ resolve `requesterId` เป็น employee จริงเสมอ — บันทึกไว้เป็น backlog สำหรับตอน migrate ข้อมูลจริงลง PostgreSQL (Phase 8) ต้อง normalize id เหล่านี้ให้ตรงกัน ไม่ใช่ copy fixture ตรงๆ

## 8. Test Results (รันจริงแล้ว)

```text
TypeScript : ผ่าน (0 error)
Build      : ผ่าน (bundle-size advisory เท่านั้น)
Lint       : ผ่าน (--max-warnings 0)
Test       : 46/46 ผ่าน (15 test file)
  - ticket-service.test.ts (8 เคส รวม create/approve/dispatch/status-update และ unknown-id rejection)
  - pages/Maintenance/index.test.tsx, pages/TicketDetail/index.test.tsx (component tests รวม not-found state)
  - App.navigation.test.tsx ขยายเพิ่ม: คลิก sidebar "IT Requisition & Maintenance" จริง ยืนยันไม่ 404 (ตามข้อกำหนด section 18 ของ phase นี้)
  - App.ticket-cross-domain.test.tsx (ใหม่): Asset↔Ticket และ Ticket↔Employee นำทางถูกต้อง
  - ของเดิมจาก Phase 3/4/5A ทั้งหมดยังผ่าน (ไม่มี regression จากการ refactor AssetDetail/EmployeeDetail)
```

## 9. Browser Verification Results

- ✅ Maintenance list (`/maintenance`): 6 tickets, KPI ถูกต้อง (1 Dept Approval, 1 IT Dispatch, 2 In-Progress, 1 On-Hold, 1 Resolved)
- ✅ Ticket detail (`/maintenance/REQ-2026-0043`): governance timeline, SLA card, support group card ตรวจแล้วถูกต้อง
- ✅ Department Approval flow: approve REQ-2026-0043 → status "1. Pending Dept Approval" → "2. Pending IT Dispatch" จริง, Audit Trail count 1→2, governance step 2 ขึ้น ✓ "Just now"
- ✅ ยืนยัน state ยังคงอยู่ข้าม navigation ภายใน SPA session เดียวกัน (client-side back → list KPI อัปเดตจาก 1→0 / 1→2 ทันที) และ reset เมื่อ full page reload (ข้อจำกัดของ mock ที่ตั้งใจ เหมือน Phase 4/5A)
- ✅ ไม่มี console error จากโค้ดแอปพลิเคชันตลอดการทดสอบ

`src/`/`server.ts` ยืนยันแล้วว่าไม่ถูกแก้ไข (mtime ยังเป็น 2026-08-16)
