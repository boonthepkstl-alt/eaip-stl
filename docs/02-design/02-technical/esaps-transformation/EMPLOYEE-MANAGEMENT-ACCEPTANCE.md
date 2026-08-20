# Employee Management — Acceptance Criteria (Phase 5A)

อ้างอิงจาก [[EMPLOYEE-MANAGEMENT-MIGRATION|EMPLOYEE-MANAGEMENT-MIGRATION.md]]. ✅ = verified จริง (test อัตโนมัติ และ/หรือ browser check ที่รันจริงในรอบนี้)

## Employee List (`frontend/src/pages/Employees/index.tsx`, route `/employees`)

- ✅ User can open Employee Management — browser check: `/employees` แสดง 7 employees พร้อม KPI
- ✅ Employees are displayed — ตาราง Employee/Designation/Location/Assigned Equipment/Status/Actions ครบ
- ✅ Search works — `employeeService.listEmployees({search})` ทดสอบใน `employee-service.test.ts`
- ✅ Filters work — Department/Location/Status filter ผ่าน `useEmployees` query
- ✅ Employee status is displayed — `StatusBadge` แสดง Active ทุกแถวที่ตรวจ ตรงกับ fixture
- ✅ Department information is displayed — คอลัมน์ "Designation & Department" ตรวจแล้วถูกต้อง
- ✅ Assigned asset information is displayed where supported — คอลัมน์ "Assigned Equipment" แสดง AST-code ที่คลิกได้ ตรงกับ `assetService` จริง (ไม่ใช่ copy เดี่ยว)
- ✅ User can navigate to Employee Detail — ทดสอบผ่าน `pages/Employees/index.test.tsx` + browser check

## Employee Detail (`frontend/src/pages/EmployeeDetail/index.tsx`, route `/employees/:employeeId`)

- ✅ User can open an employee — `EmployeeDetail/index.test.tsx` + browser check (`/employees/e1`)
- ✅ Employee information is displayed — Identity sidebar (code, status, designation, phone, start date) ตรวจแล้วครบ
- ✅ Department/position information is displayed — "Organization & Hierarchy" section ตรวจแล้วถูกต้อง (Engineering, DEPT-ENG, David Kim, Desk E-412)
- ✅ Assigned assets are displayed where supported — "Current Assigned Hardware" + tab "Assigned Assets" แสดง asset จริง 2 ชิ้นตรงกับ fixture, มูลค่ารวม $3,520 ถูกต้อง
- ✅ Navigation works — ปุ่ม "Back to Employee Management" กลับ `/employees` ได้; asset card นำทางไป `/assets/:id` จริง (ยืนยันแล้ว)
- ✅ Existing actions are preserved — Edit Identity/Assign Asset/New IT Ticket ปุ่มครบ, Edit Identity ยืนยันแล้วว่า save ผ่าน `employeeService.updateEmployee` จริง (Job Title เปลี่ยนสำเร็จ)
- ✅ **เพิ่มเติมจาก spec เดิม**: Not-found state (employee id ที่ไม่มีจริง) ทดสอบแล้ว

## Assignment (Asset ↔ Employee relationship ตาม section 15/23 ของ Phase 5A)

- ✅ User can view assigned assets — ยืนยันแล้วทั้งใน `pages/Employees` (คอลัมน์) และ `pages/EmployeeDetail` (tab + overview card)
- ✅ User can assign an asset — ยืนยันจริงผ่าน browser: assign "MacBook Air M2" ให้ Sarah Chen จากหน้า Employee Detail สำเร็จ
- ✅ Assignment state updates — Assigned Assets 2→3, Total Value $3,520→$4,620, History count 6→7 อัปเดตแบบ real-time
- ✅ Available asset count updates if supported — ยืนยันแล้วใน Phase 4's `pages/Employees` (Available Stock ลดลงตอน assign) ยังทำงานถูกต้องหลัง refactor รอบนี้
- ✅ Asset ↔ Employee relationship remains consistent — `App.cross-domain.test.tsx` ยืนยันทั้งสองทิศทาง (Asset→Employee, Employee→Asset) นำทางถูกต้องไปยัง entity เดียวกัน ไม่มีข้อมูลไม่ตรงกัน

## Deferred (ตามที่ prompt กำหนดไว้ชัดเจนว่าไม่ให้ migrate ในรอบนี้)

- User Management (`src/pages/UserManagement.tsx`) — โดเมน User/Application Identity ไม่ใช่ Employee
- Role Management (`src/pages/RoleManagement.tsx`) — โดเมน RBAC/Authorization ไม่ใช่ Employee
- License tab, IT Tickets tab ใน Employee Detail — โดเมน License/Maintenance ตามลำดับ (จะทำใน Phase 5B/5C)

## สรุป

ทุกเกณฑ์ยอมรับที่อยู่ในสโคปของ Phase 5A (Employee domain core + Asset↔Employee relationship) **ผ่านจริงทั้งหมด** ยืนยันด้วย 29 automated test (10 test file) และ browser check สดที่ทำ mutation จริง (assign asset, edit profile) แล้วตรวจผลลัพธ์กลับ ไม่มี checklist ที่ทำเครื่องหมายโดยไม่ตรวจสอบ
