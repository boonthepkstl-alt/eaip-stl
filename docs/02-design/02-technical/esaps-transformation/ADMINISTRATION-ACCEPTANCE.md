# Administration — Acceptance Criteria (Phase 6)

อ้างอิงจาก [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]]. ✅ = verified จริง (test อัตโนมัติ และ/หรือ browser check ที่รันจริงในรอบนี้), ⚠️ = documented gap ไม่ใช่ silent no-op

## Administration Landing (`frontend/src/pages/Administration/index.tsx`, route `/administration`)

- ✅ User can open the Administration desk — browser check: `/administration` แสดง 5 module card พร้อมสีไอคอนถูกต้อง
- ✅ Module cards show live counts (User: 8, Role: 6, Departments: 7, Locations: 9, Master Data: 24) — ตรวจแล้วตรงกับ fixture จริง
- ✅ Recent Users preview (top 5) — ตรวจแล้วถูกต้อง (Alex Morgan → David Kim)
- ✅ Roles & Permissions overview (all 6 roles with user/permission counts) — ตรวจแล้วถูกต้อง
- ✅ Navigate to User Management via card click — ทดสอบผ่าน `App.administration-route.test.tsx` + browser check
- ✅ Navigate to Role Management via card click — ทดสอบผ่าน `App.administration-route.test.tsx` + browser check
- ⚠️ Departments/Locations/Master Data cards show "Coming Soon" toast instead of navigating — documented deviation, not a redesign (legacy itself has no destination for these either, see [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]] หัวข้อ 6)
- ✅ Sidebar "Administration" navigates to the real Administration page, not a 404 — explicit regression test added per the established pattern (Phase 5A/5B/5C), matching the pattern that caught the Phase 5A routing bug

## User Management (`frontend/src/pages/UserManagement/index.tsx`, route `/administration/users`)

- ✅ User can open the User desk — `UserManagement/index.test.tsx` + browser check
- ✅ Search/filter by status — ทดสอบใน `user-service.test.ts`
- ✅ Invite User modal → `userService.inviteUser` — ยืนยันจริงผ่าน browser (Taylor Reed invited, list count 8→9, status "Active"/"Just invited")
- ✅ Suspend action → `userService.updateUserStatus` — ทดสอบใน `user-service.test.ts`
- ✅ Row actions (Edit Role/Reset Password) — preserved เป็น toast-only, ตรงกับ legacy ทุกประการ (ไม่ใช่ regression — legacy เองก็ไม่มี real mutation สำหรับสองปุ่มนี้)

## Role Management (`frontend/src/pages/RoleManagement/index.tsx`, route `/administration/roles`)

- ✅ User can open the Role desk — `RoleManagement/index.test.tsx` + browser check
- ✅ Role list with user/permission counts — ตรวจแล้วถูกต้องครบ 6 roles
- ✅ Permission matrix renders per selected role (15 module × 6 action) — ตรวจแล้วถูกต้อง, system role (System Administrator/Viewer) matrix ถูก disable ตรงกับ legacy
- ✅ Create Role modal → `roleService.createRole` — ทดสอบใน `role-service.test.ts`
- ✅ Delete Role action → `roleService.deleteRole` — ยืนยันจริงผ่าน browser (Asset Manager deleted, list count 6→5, selection falls back correctly)
- ✅ Delete blocked for system roles — ทดสอบใน `role-service.test.ts` (`deleteRole('r1')` throws) และ UI ซ่อนปุ่ม Delete ให้ system role ตรงกับ legacy
- ⚠️ "Save Changes" on the permission matrix is local-state + toast only — documented deviation, matching legacy exactly (fixture has no per-module permission field to persist, see [[ADMINISTRATION-API-CONTRACT|ADMINISTRATION-API-CONTRACT.md]] Deviation ข้อ 1)
- ✅ "Manage Users" button navigates to User Management — ทดสอบผ่าน `App.administration-route.test.tsx` + browser check

## Cross-Domain Regression

- ✅ No other domain references User/Role (grep-verified before writing this doc) — no coupling to close, unlike Phase 5C's Employee/Asset↔License tabs
- ✅ Regression: Employee list (`/employees`) still works after adding the new module — browser spot-check + full test suite (82/82)

## สรุป

ทุกเกณฑ์ยอมรับในสโคปของ Phase 6 (Administration) **ผ่านจริง** ยกเว้น 2 จุดที่ทำเครื่องหมายไว้ชัดเจนว่ายังไม่รองรับ (Departments/Locations/Master Data drill-down, permission matrix persistence) — ทั้งสองจุดสืบทอดมาจาก legacy เอง ไม่ใช่ gap ใหม่ ยืนยันด้วย 82 automated test (25 test file) และ browser check สดที่ทำ mutation จริง (invite user, delete role) แล้วตรวจผลลัพธ์กลับ
