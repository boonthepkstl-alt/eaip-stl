# Administration — Frontend Service Contract & Target API (Phase 6)

อ้างอิงจาก [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]], [[SOFTWARE-LICENSE-API-CONTRACT|SOFTWARE-LICENSE-API-CONTRACT.md]] (รูปแบบเดียวกัน), [[API-SPECIFICATION|API-SPECIFICATION.md]]

## Frontend contract ที่มีอยู่แล้ว

```ts
// frontend/src/services/user-repository.ts
interface UserRepository {
  list(query: UserListQuery): Promise<UserListResult>;
  getById(id: string): Promise<User | null>;
  invite(input: InviteUserInput): Promise<User>;
  updateStatus(id: string, status: User['status']): Promise<User>;
}

// frontend/src/services/role-repository.ts
interface RoleRepository {
  list(): Promise<RoleListResult>;
  getById(id: string): Promise<Role | null>;
  create(input: CreateRoleInput): Promise<Role>;
  remove(id: string): Promise<void>;
}
```

`userService`/`roleService` wrap these with thin pass-throughs — no cross-domain resolution needed (see [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]] หัวข้อ 3), unlike `licenseService.allocateSeat` or `ticketService.createTicket`.

## Target Go endpoint mapping (ยังไม่ implement)

| Frontend call | Go endpoint | หมายเหตุ |
|---|---|---|
| `userService.listUsers({ search, status })` | `GET /api/v1/users?...` | ต้องมี `RequireRole('ADMIN')` ตาม AUTH-RBAC.md |
| `userService.getUser(id)` | `GET /api/v1/users/:id` | |
| `userService.inviteUser(input)` | `POST /api/v1/users/invite` | ส่งอีเมลเชิญจริง (ปัจจุบัน frontend แค่ set `lastActive: 'Just invited'` ไม่มี email delivery) |
| `userService.updateUserStatus(id, status)` | `PATCH /api/v1/users/:id/status` | |
| `roleService.listRoles()` | `GET /api/v1/roles` | |
| `roleService.getRole(id)` | `GET /api/v1/roles/:id` | |
| `roleService.createRole(input)` | `POST /api/v1/roles` | |
| `roleService.deleteRole(id)` | `DELETE /api/v1/roles/:id` | backend ต้อง reject system role เหมือน mock (`system: true`) และ reassign ผู้ใช้ที่ถือ role นี้ก่อนลบจริง (ปัจจุบัน mock ไม่จัดการ reassignment เพราะ `User.role` เป็น free-text ไม่ผูก `Role.id` — ดู deviation ข้อ 2) |

## Response/Request shape

```ts
interface User { id: string; name: string; email: string; role: string; department: string; status: 'Active' | 'Inactive' | 'Suspended'; lastActive: string; initials: string; avatarColor: string; }
interface Role { id: string; name: string; description: string; users: number; permissions: number; system: boolean; }
interface InviteUserInput { name: string; email: string; role: string; department: string; }
interface CreateRoleInput { name: string; description: string; }
```

## Deviation ที่ต้องบันทึกไว้

1. **Permission matrix (module × action grid) ไม่มี service operation รองรับเลย** — เหมือนกับ legacy ทุกประการ: `RoleManagementPage`'s "Save Changes" เป็น local UI state + toast เท่านั้น ไม่ persist จริง เพราะ fixture เดิมไม่มี field เก็บ per-module permission ต่อ role (มีแค่ `permissions: number` ที่เป็นตัวเลขสรุป) ต้องออกแบบ schema ใหม่ (`role_permissions` table: `role_id`, `module`, `action`) ก่อน backend จะ implement ได้จริง — ไม่ใช่ gap ที่ phase นี้สร้างขึ้น เป็น gap ที่มีอยู่แล้วตั้งแต่ legacy
2. **`User.role` เป็น free-text label ไม่ใช่ FK ไปยัง `Role.id`** — ตามที่มีอยู่ใน fixture เดิม ต้อง normalize เป็น `roleId` จริงตอน migrate ข้อมูลลง PostgreSQL (Phase 8) เพื่อให้ `roleService.deleteRole` สามารถ query/reassign user ที่ถือ role นั้นได้จริงก่อนลบ
3. **Departments/Locations/Master Data ไม่มี service ใดๆ** — ยังเป็นแค่ flat string array (`departments`/`locations` ใน fixture) ที่ domain อื่น (Employee) ใช้เป็น dropdown option เฉยๆ ไม่ใช่ entity ที่มี CRUD ของตัวเอง — ถ้าต้องการ CRUD จริง (เพิ่ม/ลบแผนก) ต้องเป็น phase ใหม่แยกต่างหาก ไม่ใช่ scope ของ Administration phase นี้

## สถานะการ implement จริง ณ ตอนนี้

- **Frontend**: implement ครบ 8 operation (4 User + 4 Role), ทดสอบผ่าน unit test (13 เคสรวม) + browser check จริง (invite/delete ทำงานถูกต้อง end-to-end ผ่าน UI จริง)
- **Backend (Go)**: ยังไม่ implement เลย — รอ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 8
