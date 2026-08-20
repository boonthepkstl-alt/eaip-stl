# Administration Vertical Slice — Migration Record (Phase 6)

อ้างอิงจาก [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]] (สถาปัตยกรรมต้นแบบ) และ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] บันทึกนี้คือผลจริงของการ migrate โมดูล "Administration" (nav id `administration`) ที่ยังไม่เคยถูกทำใน Phase ก่อนหน้า — ผู้ใช้ระบุตรงๆ ว่า "Administration ยังไม่ได้ปรับปรุง" หลังจาก Phase 5C (Software License) เสร็จ ไม่ใช่ phase ที่ระบุไว้ล่วงหน้าใน MIGRATION-PLAN.md (ซึ่งมี Phase 6 เป็น Audit/Reconciliation) — เอกสารนี้ขยาย MIGRATION-PLAN.md เพื่อบันทึกงานนี้ในลำดับที่ทำจริง

## 1. Source files inspected ก่อนเขียนโค้ดใดๆ

| ไฟล์ | บทบาทจริง | โดเมน | การตัดสินใจ |
|---|---|---|---|
| `src/pages/Administration.tsx` (84 บรรทัด) | หน้า landing: module card 5 ใบ (User Management, Role Management, Departments, Locations, Master Data) + Recent Users preview + Roles overview list | **Administration (landing)** | **MIGRATE** |
| `src/pages/UserManagement.tsx` (106 บรรทัด) | List page ของ platform login account: search/filter, Invite modal, Suspend confirm, row actions (Edit Role/Reset Password/Suspend) | **User** | **MIGRATE** |
| `src/pages/RoleManagement.tsx` (166 บรรทัด) | Role list + permission matrix (15 module × 6 action) ต่อ role, Create/Delete role | **Role** | **MIGRATE** |
| `src/data/mockData.ts` (`users`, `roles` exports) | ข้อมูล User/Role ทั้งหมด (คัดลอกเป็น fixture ตั้งแต่ Phase 3 แล้ว) | **User/Role** | **MIGRATE** (ใช้ fixture เดิม) |

**ยืนยันจากการอ่าน `src/routes/pageRoutes.tsx` จริง**: legacy app มี case จริงแค่ 4 อัน — `administration`, `user-management`, `role-management`, `settings` การ์ด "Departments"/"Locations"/"Master Data" บน Administration.tsx เรียก `onNavigate('departments')`/`'locations'`/`'master-data')` แต่**ไม่มี case ใดรองรับเลยสักตัว** — legacy `switch` ตกไปที่ `default: <Dashboard>` เงียบๆ นี่คือลิงก์ที่ตายอยู่แล้วในระบบเดิม ไม่ใช่ฟีเจอร์จริงที่ต้อง migrate (ดูหัวข้อ 5)

## 2. Domain boundary — User vs. Employee (ยืนยันซ้ำจาก Phase 5A)

อ่าน fixture จริงแล้วยืนยัน: `User` (`src/data/mockData.ts`) กับ `Employee` (`src/data/mockData.ts` เช่นกัน แต่คนละ export) เป็น **entity คนละตัว ไม่มี field เชื่อมกันเลย** — `User.id` เป็น `u1..u8`, `Employee.id` เป็น `e1..e10` (คนละ namespace) `User` คือบัญชีเข้าระบบ RAISE (email/role label/status), `Employee` คือประวัติพนักงานที่มี hardware assignment ตรงกับสิ่งที่บันทึกไว้แล้วใน [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]] ("DEFER User/Role Management อย่างมีเหตุผล — คนละโดเมน: User/Identity และ RBAC ไม่ใช่ Employee") — Phase 6 นี้คือการปิด defer นั้น

## 3. Cross-domain relationships — ไม่มีเลยในรอบนี้ (ต่างจาก Ticket/License)

อ่าน fixture แล้วพบว่า `User.role` เป็น **free-text label** (`'System Administrator'`, `'Asset Manager'`, ...) ไม่ใช่ foreign key ไปยัง `Role.id` และ `Role.users`/`Role.permissions` เป็น**ตัวเลขสรุปที่เก็บไว้ตรงๆ ใน fixture** ไม่ใช่ live count ที่คำนวณจาก User list จริง (ตรวจแล้วว่า `Role.users` ไม่ตรงกับจำนวน User ที่มี `role` label เดียวกันเป๊ะเสมอไปในข้อมูลตัวอย่าง — เป็นพฤติกรรมเดิมของ legacy ไม่ใช่บั๊กใหม่) ผลคือ:

- `userService` และ `roleService` **ไม่ import กันเองเลยทั้งสองทิศทาง** — เป็นครั้งแรกในโปรเจกต์นี้ที่ domain คู่หนึ่งไม่มี cross-domain dependency ใดๆ (ต่างจาก Employee→Asset, Ticket→Employee+Asset, License→Employee+Asset)
- `pages/RoleManagement`'s "Manage Users" button และ `pages/Administration`'s "View all"/"Manage roles" buttons เป็นแค่ `navigate()` เปล่าๆ ไม่มีการอ่านข้อมูลข้ามโดเมน

## 4. Domain Types

- `types/user.ts` — `User` (ตรงกับ fixture ทุกประการ), `InviteUserInput`, `UserListQuery`, `UserListResult`
- `types/role.ts` — `Role` (ตรงกับ fixture ทุกประการ), `CreateRoleInput`, `RoleListResult`

## 5. Service Boundary

`services/user-repository.ts` (`UserRepository` + `MockUserRepository`) + `services/user-service.ts` (`listUsers`, `getUser`, `inviteUser`, `updateUserStatus`) และ `services/role-repository.ts` (`RoleRepository` + `MockRoleRepository`) + `services/role-service.ts` (`listRoles`, `getRole`, `createRole`, `deleteRole`) — pattern เดียวกับ `assetService`/`employeeService`/`ticketService`/`licenseService` ทุกจุด `pages/Administration`, `pages/UserManagement`, `pages/RoleManagement` เรียกผ่านนี้เท่านั้น ไม่ import fixture ตรง

`MockRoleRepository.remove()` ปฏิเสธการลบ system role (`role.system === true`, เช่น "System Administrator"/"Viewer") ด้วย `throw` — ตรงกับ UI เดิมที่ซ่อนปุ่ม Delete ให้ system role อยู่แล้ว (RoleManagement.tsx: `{selectedRole.system ? <Badge>System Role</Badge> : <>...Delete button...</>}`) เพิ่ม guard ที่ระดับ service ด้วยเพื่อไม่ให้พึ่งพา UI ฝั่งเดียวเป็นด่านป้องกันเดียว

## 6. UI decision ที่บันทึกไว้ (ไม่ใช่การตัดทิ้งเงียบๆ)

Legacy `Administration.tsx`'s 3 การ์ด "Departments"/"Locations"/"Master Data" คลิกแล้วไม่มีปลายทางจริงอยู่แล้ว (ดูหัวข้อ 1 — `onNavigate()` ไปยัง id ที่ไม่มี case ใน `pageRoutes.tsx`, ตกไปที่ Dashboard เงียบๆ) ระบบใหม่ใช้ router จริง ถ้าปล่อยให้คลิกแล้ว `navigate('/departments')` จะกลายเป็นหน้า 404 จริง (ต่างจาก legacy ที่ fallback ไป Dashboard) — เพื่อไม่ให้เกิด regression แบบ 404 ใหม่ที่ไม่มีอยู่ในระบบเดิม จึงให้ 3 การ์ดนี้แสดง toast "Coming Soon" แทนการ navigate เมื่อคลิก (`AdministrationPage.handleCardClick`) เป็นทางเลือกที่ถูกต้องกว่า legacy (ไม่ทำให้ user สับสนว่าทำไมกดแล้วไปหน้า Dashboard) และบันทึกไว้ชัดเจนว่าเป็น scope ที่ยังไม่ implement จริง ไม่ใช่การขยาย scope ใหม่

Card icon background color: legacy ใช้ template string `bg-${color}-50`/`text-${color}-600` ซึ่ง Tailwind v4 build-time JIT scanner (ต่างจาก legacy ที่รันผ่าน CDN runtime scan) **ไม่สามารถ detect ได้** — เปลี่ยนเป็น static `Record<string, string>` map (`CARD_COLOR_CLASSES`) แทน คงสี 5 สีเดิมทุกประการ (brand/accent/success→emerald/warning→amber/error) เพียงเปลี่ยนวิธีเขียนให้ scanner เห็น — ยืนยันด้วย browser screenshot ว่าสีขึ้นถูกต้องครบทุกใบ (ดูหัวข้อ 9)

## 7. Test Results (รันจริงแล้ว)

```text
TypeScript : ผ่าน (0 error)
Build      : ผ่าน (bundle-size advisory เท่านั้น)
Lint       : ผ่าน (--max-warnings 0)
Test       : 82/82 ผ่าน (25 test file)
  - user-service.test.ts (7 เคส รวม invite/suspend และ unknown-id rejection)
  - role-service.test.ts (6 เคส รวม create/delete และ system-role/unknown-id rejection)
  - pages/Administration/index.test.tsx, pages/UserManagement/index.test.tsx, pages/RoleManagement/index.test.tsx (component tests)
  - App.navigation.test.tsx ขยายเพิ่ม: คลิก sidebar "Administration" จริง ยืนยันไม่ 404 + static audit assertion
  - App.administration-route.test.tsx (ใหม่): Administration→User Management, Administration→Role Management, Role Management→User Management (ผ่านปุ่ม "Manage Users") ทั้ง 3 เส้นทาง
  - ของเดิมจาก Phase 3/4/5A/5B/5C ทั้งหมดยังผ่าน (ไม่มี regression)
```

## 8. Cross-domain regression note

ต่างจาก Phase ก่อนหน้าที่ต้องปิด known coupling ข้าม domain (เช่น AssetDetail/EmployeeDetail's License tab ใน Phase 5C) — **ไม่มี domain อื่นใดอ้างอิง User/Role มาก่อน** (ตรวจด้วย grep `from '@/services/user-service'`/`from '@/services/role-service'` ทั่วโปรเจกต์ก่อนเขียนเอกสารนี้ พบว่ามีแค่ pages ของ Administration เองที่ import) จึงไม่มี regression risk ต่อโมดูลอื่นจาก phase นี้

## 9. Browser Verification Results

- ✅ Administration landing (`/administration`): 5 module card พร้อมสีไอคอนถูกต้องครบ (ยืนยันด้วย screenshot หลังแก้ dynamic-class bug), Recent Users (Alex Morgan ... David Kim), Roles overview (6 roles)
- ✅ User Management (`/administration/users`): 8 users จริงจาก fixture, คอลัมน์ครบ (User/Role/Department/Status/Last Active)
- ✅ Invite User: กรอกฟอร์มจริง ("Taylor Reed") → กด Send Invitation → รายการอัปเดตทันทีเป็น 9 users, สถานะ "Active"/"Just invited" ถูกต้อง
- ✅ Role Management (`/administration/roles`): 6 roles จริง, breadcrumb "RAISE / Administration / Role Management" ถูกต้อง
- ✅ เลือก role "Asset Manager" → permission matrix โหลดถูกต้อง (15 module × 6 action), ปุ่ม Save Changes/Delete ปรากฏ (non-system role)
- ✅ Delete Role: กด Delete → ConfirmDialog → ยืนยัน → รายการอัปเดตทันทีเหลือ 5 roles, "Asset Manager" หายไปจริง, selection fallback ไป role แรกที่เหลือถูกต้อง
- ✅ Regression: `/employees` ยังทำงานถูกต้องหลังเพิ่มโมดูลใหม่
- ✅ ไม่มี console error จากโค้ดแอปพลิเคชันตลอดการทดสอบ (มีแค่ WebSocket HMR error ของ dev server เอง)

`src/`/`server.ts` ยืนยันแล้วว่าไม่ถูกแก้ไข (mtime ยังเป็น 2026-08-16 22:14)
