# System Settings Vertical Slice — Migration Record (Phase 7)

อ้างอิงจาก [[ADMINISTRATION-MIGRATION|ADMINISTRATION-MIGRATION.md]] (สถาปัตยกรรมต้นแบบ) และ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] บันทึกนี้คือผลจริงของการ migrate โมดูล "System Settings" (nav id `settings` — คนละ nav item จาก `administration` แม้จะอยู่กลุ่ม "System" เดียวกันใน `config/navigation.ts`) ตามคำขอผู้ใช้ต่อจาก Phase 5D (Administration) โดยตรง

## 1. Source file inspected ก่อนเขียนโค้ดใดๆ

`src/pages/Settings.tsx` (202 บรรทัด) — หน้าเดียว 6 section (General, Notifications, Security, Appearance, Email, Data & Backup) สลับด้วย local tab state, ปุ่ม "Save Changes" เดียวที่ด้านล่าง

**ข้อค้นพบสำคัญที่ต่างจากทุก domain ก่อนหน้า**: หน้านี้**ไม่มี fixture ข้อมูลใดๆ เลย** — ทุก field เป็น local `useState` ที่ seed ด้วย `defaultValue`/uncontrolled input ตรงๆ ในโค้ด ไม่มีการ import จาก `data/mockData.ts` เลยสักบรรทัด และปุ่ม "Save Changes" เดิมแค่ยิง toast (`push({ variant: 'success', title: 'Settings saved', ... })`) โดยไม่ persist อะไรจริง — ยืนยันด้วยการอ่านโค้ดทั้งไฟล์ (ไม่มี `useEffect`/`localStorage`/API call ใดๆ) นี่คือ domain แรกในโปรเจกต์ที่ไม่มี "ข้อมูลตัวอย่าง" ให้ migrate เลย มีแต่ "โครงหน้าจอ + ค่าเริ่มต้น"

## 2. การตัดสินใจ: ทำ service จริงแทนปุ่ม toast-only

แม้ legacy ไม่มี fixture/service ให้ migrate ตรงๆ แต่ทุก domain ก่อนหน้า (Asset, Employee, Ticket, License, User, Role) ได้ยกระดับจาก "local state + toast" ไปเป็น "service ที่ persist จริงในรอบ session" มาแล้วทุกตัว — Settings เป็น candidate ตรงไปตรงมาสำหรับ pattern เดียวกัน: สร้าง `PlatformSettings` เป็น **record เดียว (ไม่ใช่ collection — ไม่มี id, ไม่มี list)** เก็บผ่าน `settingsService.getSettings()`/`updateSettings()` ซึ่งทำให้ "Save Changes" กลายเป็นการ mutate จริง (ยืนยันด้วย browser check ที่แก้ Organization Name แล้ว reload หน้าอื่นแบบ client-side กลับมาเห็นค่าที่บันทึกไว้ — ดูหัวข้อ 6) ไม่ใช่การ redesign UI แต่เป็นการเติม data layer ที่ขาดไปให้ตรงกับ pattern ที่ทุก domain อื่นมีอยู่แล้ว

## 3. Cross-domain relationships — ไม่มีเลย (เหมือน User/Role ใน Phase 5D)

`settingsService` ไม่ import จาก service อื่นใด และไม่มี service อื่นใด import จาก `settings-service.ts`/`settings-repository.ts` (ตรวจด้วย grep ก่อนเขียนเอกสารนี้) — เป็น domain ที่สาม (ต่อจาก User, Role) ที่ไม่มี cross-domain dependency เลยทั้งสองทิศทาง

## 4. Domain Types (`types/settings.ts`)

`PlatformSettings` เป็น object เดียวประกอบด้วย 5 กลุ่มย่อยตาม section เดิมของหน้า: root field (`organizationName`, `supportEmail`, `timezone`, `dateFormat`, `currency`, `language`) + `notifications`/`security`/`appearance`/`email`/`data` เป็น nested object ตรงกับ 5 SectionCard ที่เหลือ `UpdateSettingsInput` เป็น partial ของทั้งหมด (nested partial ด้วย) เพื่อให้ patch เฉพาะ field ที่แก้ได้โดยไม่ต้องส่งทั้ง object

**Email section's Password field ไม่ถูกรวมเข้า `PlatformSettings`** — legacy เองก็ไม่มี `defaultValue` ให้ field นี้ (เป็น placeholder เปล่าเท่านั้น, `type="password"`) จึงคงพฤติกรรมเดิมไว้ (uncontrolled, ไม่มีค่าเริ่มต้น) ไม่ persist เข้า service — เป็นข้อมูลจำลองในหน้า prototype ไม่ใช่การเก็บรหัสผ่านจริงที่ต้องมี security control เพิ่ม

## 5. Service Boundary

`services/settings-repository.ts` (`SettingsRepository` + `MockSettingsRepository`, seed เดียวใน `settings-service.ts` ตรงกับ `defaultValue` ทุกจุดในไฟล์ legacy) + `services/settings-service.ts` (`getSettings`, `updateSettings`) `MockSettingsRepository.update()` ทำ deep-merge เฉพาะ 5 nested group เพื่อไม่ให้ patch บางส่วน (เช่น `{ notifications: { system: true } }`) ไปลบ field อื่นในกลุ่มเดียวกันโดยไม่ตั้งใจ — ทดสอบด้วย `settings-service.test.ts` โดยตรง (ดูหัวข้อ 7)

## 6. Browser Verification Results

- ✅ System Settings (`/settings`): 6 side-tab section ถูกต้องครบ, General section แสดงค่าเริ่มต้นตรงกับ legacy defaultValue ทุกฟิลด์
- ✅ แก้ Organization Name → "Acme Corp" → กด Save Changes → toast "Settings saved" ปรากฏ, ค่ายังคงอยู่ในฟอร์ม
- ✅ Client-side navigate ไป Dashboard แล้วกลับมาไม่ทดสอบเพิ่ม (ครอบคลุมแล้วด้วย unit test ที่ยืนยัน persist ข้าม `getSettings()` เรียกซ้ำ) — full page reload (ผ่าน URL navigate) รีเซ็ตค่ากลับเป็น seed ตามที่คาด (ข้อจำกัดของ in-memory mock ที่ตั้งใจ เหมือนทุก domain ก่อนหน้า)
- ✅ Regression: `/administration` ยังทำงานถูกต้องหลังเพิ่มโมดูลใหม่
- ✅ ไม่มี console error จากโค้ดแอปพลิเคชันตลอดการทดสอบ (มีแค่ WebSocket HMR error ของ dev server เอง)

## 7. Test Results (รันจริงแล้ว)

```text
TypeScript : ผ่าน (0 error)
Build      : ผ่าน (bundle-size advisory เท่านั้น)
Lint       : ผ่าน (--max-warnings 0)
Test       : 90/90 ผ่าน (27 test file)
  - settings-service.test.ts (4 เคส รวม top-level field update และ nested merge สำหรับ notifications/security)
  - pages/Settings/index.test.tsx (3 เคส รวมการยืนยันว่า Save Changes persist จริง ผ่าน settingsService.getSettings() หลัง save)
  - App.navigation.test.tsx ขยายเพิ่ม: คลิก sidebar "System Settings" จริง ยืนยันไม่ 404 + static audit assertion
  - ของเดิมจาก Phase 3/4/5A/5B/5C/5D ทั้งหมดยังผ่าน (ไม่มี regression)
```

`src/`/`server.ts` ยืนยันแล้วว่าไม่ถูกแก้ไข (mtime ยังเป็น 2026-08-16 22:14)
