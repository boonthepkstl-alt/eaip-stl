# Employee Management — Frontend Service Contract & Target API (Phase 5A)

อ้างอิงจาก [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]], [[ASSET-MANAGEMENT-API-CONTRACT|ASSET-MANAGEMENT-API-CONTRACT.md]] (รูปแบบเดียวกัน), และ [[API-SPECIFICATION|API-SPECIFICATION.md]]

## Frontend contract ที่มีอยู่แล้ว (`frontend/src/services/employee-repository.ts`)

```ts
interface EmployeeRepository {
  list(query: EmployeeListQuery): Promise<EmployeeListResult>;
  getById(id: string): Promise<Employee | null>;
  create(input: CreateEmployeeInput): Promise<Employee>;
  update(id: string, input: UpdateEmployeeInput): Promise<Employee>;
}
```

`employeeService` exposes `listEmployees`, `getEmployee`, `createEmployee`, `updateEmployee`, `getEmployeeAssignments`, `getEmployeeSummary` — ทุกหน้าใน `pages/Employees`, `pages/EmployeeDetail` เรียกผ่านนี้เท่านั้น

## Target Go endpoint mapping (ยังไม่ implement)

| Frontend call | Go endpoint | หมายเหตุ |
|---|---|---|
| `employeeService.listEmployees({ search, department, location, status })` | `GET /api/v1/employees?search=&department=&location=&status=` | ตรงกับ `model.PaginationQuery`/`PaginatedResponse` ของ go-template-main |
| `employeeService.getEmployee(id)` | `GET /api/v1/employees/:id` | คืน 404 เมื่อไม่พบ |
| `employeeService.createEmployee(input)` | `POST /api/v1/employees` | ต้องมี `RequireRole('IT_MANAGER', 'ADMIN')` ตาม AUTH-RBAC.md |
| `employeeService.updateEmployee(id, input)` | `PUT /api/v1/employees/:id` | |
| `employeeService.getEmployeeAssignments(id, name)` | `GET /api/v1/employees/:id/assignments` | **สำคัญ**: mock implementation ปัจจุบันรับ `employeeName` เป็น parameter เพื่อ fallback-match กรณี `assignedEmployeeId` เป็น null ใน fixture (ข้อมูลเก่าบางแถวผูกด้วยชื่อ ไม่ใช่ id) — backend endpoint จริงควร join ด้วย `employee_id` ล้วนๆ ไม่ต้องรับชื่อจาก client เลย (data จริงในฐานข้อมูลจะไม่มีปัญหาแบบ fixture เก่า) |

## Response/Request shape

```ts
interface Employee {
  id: string; employeeCode: string; name: string; email: string; phone: string;
  jobTitle: string; title: string; department: string; departmentId: string;
  location: string; deskLocation: string; manager: string; managerId: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  avatarColor: string; initials: string; startDate: string;
  workstationType: string; primaryOs: string; assignedCount: number;
}

// GET /api/v1/employees → EmployeeListResult
interface EmployeeListResult { data: Employee[]; total: number }

// POST /api/v1/employees ← CreateEmployeeInput
interface CreateEmployeeInput {
  name: string; email: string; jobTitle?: string; phone?: string;
  department: string; location: string; deskLocation?: string; manager?: string;
  status?: Employee['status'];
}

// PUT /api/v1/employees/:id ← UpdateEmployeeInput (partial)
interface UpdateEmployeeInput {
  jobTitle?: string; department?: string; location?: string; deskLocation?: string;
  phone?: string; manager?: string; status?: Employee['status'];
}

// GET /api/v1/employees/:id/assignments → target shape (documented, not what the mock returns — see below)
interface EmployeeAssignment { employeeId: string; assetId: string; assignedAt: string; status: 'active' | 'returned' }
```

**Deviation ที่ต้องบันทึกไว้**: มี target type `EmployeeAssignment` ที่เบากว่า แต่ `employeeService.getEmployeeAssignments()` ของ mock **คืน `Asset[]` เต็มแถวจริง** (ไม่ใช่ `EmployeeAssignment[]`) เพราะหน้า UI (Assigned Assets tab) ต้องแสดงชื่อ/หมวดหมู่/สถานะ/มูลค่าของ asset เต็มรูปแบบ ไม่ใช่แค่ id คู่ วิธีนี้ตรงกับที่ [[ASSET-MANAGEMENT-API-CONTRACT|ASSET-MANAGEMENT-API-CONTRACT.md]] ทำไว้กับ `icon` field — เมื่อ backend จริง implement endpoint นี้ ให้เลือกอย่างใดอย่างหนึ่ง:
1. คืน `Asset[]` เต็มแถวตรงจาก join query (ตรงกับที่ frontend คาดหวังอยู่แล้ว ไม่ต้องแก้ frontend เลย) — **แนะนำแนวทางนี้**
2. คืน `EmployeeAssignment[]` แบบบาง แล้วให้ frontend เรียก `GET /api/v1/assets/:id` เพิ่มทีละตัว (N+1 request — ไม่แนะนำ)

## สถานะการ implement จริง ณ ตอนนี้

- **Frontend**: implement ครบ 6 operation, ทดสอบผ่าน unit test (7 เคส) + browser check จริง (list/detail/assign/edit ทำงานถูกต้อง)
- **Backend (Go)**: ยังไม่ implement เลย — ต้องรอ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 8
