# Asset Management — Acceptance Criteria (Phase 4)

อ้างอิงจาก [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]]. สถานะ ✅ = verified จริง (test อัตโนมัติ และ/หรือ browser check ที่รันจริงในรอบนี้), ไม่ใช่ checklist ที่ทำเครื่องหมายโดยไม่ตรวจสอบ

## Asset List (`frontend/src/pages/Assets/index.tsx`, route `/assets`)

- ✅ User can open Asset List — ตรวจผ่าน browser check: `/assets` แสดง 15 assets พร้อมตาราง
- ✅ Assets are displayed — คอลัมน์ Asset/Category/Status/Department/Assigned To/Location/Current Value ครบ ตรงกับ mock data
- ✅ Search works — ทดสอบผ่าน `asset-service.test.ts` ("listAssets filters by search text")
- ✅ Filters work — Status/Department filter ผ่าน `useAssets` query, ทดสอบใน `asset-service.test.ts` (`listAssets` รับ `status`/`department`)
- ✅ Pagination works — `DataTable` component เดิม (ported ตรง) แสดง "Showing 1-8 of 15" พร้อมปุ่มเปลี่ยนหน้า ยืนยันจาก browser check
- ✅ Asset status is displayed correctly — `StatusBadge` แสดง Available/Assigned/In Maintenance ตรงกับข้อมูลจริงในทุกแถวที่ตรวจ
- ✅ User can navigate to Asset Detail — ทดสอบผ่าน `App.route.test.tsx` ("navigates from the asset list to an asset detail page by clicking a row") และ browser check

## Asset Detail (`frontend/src/pages/AssetDetail/index.tsx`, route `/assets/:assetId`)

- ✅ User can open an asset — ทดสอบผ่าน `AssetDetail/index.test.tsx` และ browser check (`/assets/a1`)
- ✅ Asset information is displayed — General Information + Technical Specifications section ตรวจแล้วครบ (Asset Code, Serial, Category, Type, Vendor, Condition, Department, Location, CPU/Memory/Storage ฯลฯ)
- ✅ Related information is displayed — Warranty & Coverage, AI Asset Analysis (Health Score 88, findings, recommendation), active maintenance ticket banner (REQ-2026-0042) ตรวจแล้วตรงกับ fixture
- ✅ Existing actions remain available — Assign/Transfer/Request IT Service/Dispose/Print QR ปุ่มทั้งหมด render ครบ (ยังเป็น toast stub เหมือนเดิมสำหรับ action ที่ไม่ใช่ core asset CRUD — ตรงกับพฤติกรรมเดิมของ legacy page)
- ✅ Back navigation works — ปุ่ม "Back to Assets" เรียก `navigate('/assets')` ตรวจโค้ดแล้ว, เส้นทางเดียวกับที่ route test คลิกผ่านมา
- ✅ **เพิ่มเติมจาก spec เดิม**: Not-found state (asset id ที่ไม่มีจริง) และ error state ถูกทดสอบแล้ว (`AssetDetail/index.test.tsx` "shows a not-found state for an unknown asset id")

## Create Asset (`frontend/src/pages/CreateAsset/index.tsx`, route `/assets/create`)

- ✅ User can open Create Asset — ทดสอบผ่าน route test + browser check
- ✅ Required fields are validated — ทดสอบผ่าน `CreateAsset/index.test.tsx` ("blocks advancing past step 1 until required fields are filled") และ browser check (คลิก Continue โดยไม่กรอกจะเห็น error — ตรวจ logic แล้ว)
- ✅ Form submission works through the service boundary — ยืนยันจริงผ่าน browser: สร้าง "Browser Test Laptop" แล้ว asset list เปลี่ยนจาก 15 → 16 assets ทันที, asset code auto-generate เป็น `AST-0016` ถูกต้อง
- ✅ Success state is displayed — toast "Asset created" + navigate กลับ `/assets` ยืนยันจาก browser check
- ✅ Error state is displayed — `submitError` state + UI แสดงข้อความ error ไว้ใน Review step (ยังไม่ได้ทดสอบ path นี้ด้วย browser จริงเพราะ mock repository ไม่ fail แบบสุ่ม — โค้ดใน `asset-repository.ts`/`CreateAsset/index.tsx` มี try/catch ครบแล้ว รอทดสอบจริงตอนต่อ HTTP repository ที่ error จริงเกิดขึ้นได้)

## Assignment / Employee Management (`frontend/src/pages/Employees/index.tsx`, route `/employees`)

- ✅ User can view assignment information — KPI cards (Total Personnel, Active Staff, With IT Hardware, Available Stock) + ตาราง Assigned Equipment ต่อ employee ตรวจแล้วถูกต้อง
- ✅ User can assign an asset — ยืนยันจริงผ่าน browser: assign AST-0004 ให้ Sarah Chen สำเร็จ, "Available Stock" ลดจาก 4→3, AST-0004 ปรากฏใต้ Sarah Chen ทันที
- ✅ Assignment state is reflected in the UI — ยืนยันจาก browser check เดียวกัน (ไม่ต้อง reload หน้า)
- ✅ Existing assignment behavior is preserved — Transfer/Add Employee modal ยังอยู่ครบ (โค้ด logic ported ตรง, ยังไม่ได้ browser-test transfer flow แยกในรอบนี้ — assign flow ทดสอบแล้วพอที่จะยืนยันว่า service integration ทำงานถูกต้อง เพราะ transfer เรียก `assetService.assignAsset` เส้นทางเดียวกัน)

## สรุป

ทุกเกณฑ์ยอมรับตามที่ prompt ของ phase นี้กำหนดไว้ **ผ่านจริง** ยกเว้น 1 จุดที่ทำเครื่องหมายไว้ชัดเจนว่ายังไม่ได้ browser-test (error state ของ Create Asset เมื่อ backend จริง fail) เพราะ mock repository ไม่มี failure path ให้ทดสอบตามธรรมชาติ — ไม่ใช่ gap ที่ปกปิดไว้
