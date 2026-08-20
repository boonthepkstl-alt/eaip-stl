# IT Requisition & Maintenance — Frontend Service Contract & Target API (Phase 5B)

อ้างอิงจาก [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]], [[ASSET-MANAGEMENT-API-CONTRACT|ASSET-MANAGEMENT-API-CONTRACT.md]] (รูปแบบเดียวกัน), [[API-SPECIFICATION|API-SPECIFICATION.md]]

## Frontend contract ที่มีอยู่แล้ว (`frontend/src/services/ticket-repository.ts`)

```ts
interface TicketRepository {
  list(query: TicketListQuery): Promise<{ data: Ticket[]; total: number }>;
  getByCode(ticketCode: string): Promise<Ticket | null>;
  create(ticket: Ticket): Promise<Ticket>;
  decideApproval(id, input: ApprovalDecisionInput): Promise<Ticket>;
  dispatch(id, input: DispatchInput, tech: ITTechnician): Promise<Ticket>;
  updateExecutionStatus(id, input: StatusUpdateInput): Promise<Ticket>;
  changeAsset(id, asset): Promise<Ticket>;
  changeRequester(id, requester, location?): Promise<Ticket>;
  listTechnicians(): Promise<ITTechnician[]>;
}
```

`ticketService` wraps this with `createTicket` (resolves `requesterId`/`assetId` via employeeService/assetService before calling `repository.create`), plus thin pass-throughs for the rest.

## Target Go endpoint mapping (ยังไม่ implement)

| Frontend call | Go endpoint | หมายเหตุ |
|---|---|---|
| `ticketService.listTickets({ search, status, priority, category, department, requesterName })` | `GET /api/v1/tickets?...` | `status=ACTIVE` เป็น convenience shortcut ฝั่ง frontend (map เป็น `IN (PLANNING, IN_PROGRESS, ON_HOLD)`) — backend ควร expand เป็น query จริงไม่ใช่รับ enum "ACTIVE" ตรงๆ |
| `ticketService.getTicket(ticketCode)` | `GET /api/v1/tickets/:code` | ค้นด้วย `ticket_code` ไม่ใช่ id ภายใน |
| `ticketService.createTicket(input)` | `POST /api/v1/tickets` | รับ `requesterId`/`assetId` เท่านั้น (ไม่ใช่ embedded object) — backend join เอง แล้วเก็บ snapshot ที่ resolve แล้วลง DB (audit-trail-safe ต่อการเปลี่ยนแปลงในอนาคตของ Employee/Asset) |
| `ticketService.decideApproval(id, input)` | `POST /api/v1/tickets/:id/approval` | ต้องมี `RequireRole('IT_MANAGER', 'ADMIN')` หรือ department-head role ตาม AUTH-RBAC.md |
| `ticketService.dispatchTicket(id, input)` | `POST /api/v1/tickets/:id/dispatch` | รับ `technicianId` เท่านั้น backend join กับ technician table เอง |
| `ticketService.updateExecutionStatus(id, input)` | `PATCH /api/v1/tickets/:id/execution` | |
| `ticketService.changeAsset` / `changeRequester` | `PATCH /api/v1/tickets/:id/asset`, `PATCH /api/v1/tickets/:id/requester` | รับ id เดียว ไม่ใช่ object |
| `ticketService.listTechnicians()` | `GET /api/v1/technicians` | Technician เป็น reference data ของ Ticket domain — ไม่ใช่ Employee (ดู MAINTENANCE-MIGRATION.md หัวข้อ 2) |

## Response/Request shape

Ticket shape ตรงกับ `ITRequisitionTicket` ใน fixture เดิมทุกประการ (ดู [[MAINTENANCE-MIGRATION|MAINTENANCE-MIGRATION.md]]) — ไม่ทำซ้ำในเอกสารนี้เพราะยาวเกิน 100 บรรทัด อ้างอิง `frontend/src/data/fixtures/requisitionData.ts` เป็น source of truth ของ shape จนกว่าจะมีการปรับ

```ts
interface CreateTicketInput {
  requesterId: string; assetId: string;
  category: TicketCategory; priority: TicketPriority;
  title: string; description?: string; location?: string;
}
interface ApprovalDecisionInput { decision: 'Approve' | 'Reject'; approverName?: string; isDelegated?: boolean; delegatedBy?: string; comments?: string; }
interface DispatchInput { technicianId: string; estimatedCost?: number; targetResolutionDate?: string; notes?: string; }
interface StatusUpdateInput { status: 'Planning' | 'In-Progress' | 'On-Hold' | 'Done'; holdCategory?: string; holdReason?: string; diagnosticNotes?: string; resolutionNotes?: string; actualCost?: number; downtimeHours?: number; partsUsed?: string[]; }
```

## Deviation ที่ต้องบันทึกไว้

1. **Edit Ticket (title/category/priority) ไม่มี operation ใน service เลย** — `pages/TicketDetail`'s Edit Ticket modal แสดง toast "Not Yet Supported" แทนการเรียก API ปลอม ต้องเพิ่ม `PUT /api/v1/tickets/:id` และ `ticketService.updateTicketScope()` เมื่อ backend พร้อม
2. **`Ticket.requester.id`/`Ticket.asset` เป็น embedded snapshot ไม่ใช่ join แบบ live** — ตั้งใจ (audit-trail integrity) ไม่ใช่ tech debt ดู MAINTENANCE-MIGRATION.md หัวข้อ 3
3. **ข้อมูลคุณภาพ**: fixture เดิมมี `requester.id` ที่ไม่ตรงกับ Employee.id จริง (`emp-1` vs `e1`) — ต้อง normalize ตอน migrate ข้อมูลจริงลง PostgreSQL ไม่ใช่ copy ตรง (ดู MAINTENANCE-MIGRATION.md หัวข้อ 7)

## สถานะการ implement จริง ณ ตอนนี้

- **Frontend**: implement ครบ 9 operation, ทดสอบผ่าน unit test (8 เคส) + browser check จริง (list/detail/approve ทำงานถูกต้อง end-to-end, KPI อัปเดต real-time)
- **Backend (Go)**: ยังไม่ implement เลย — รอ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 8
