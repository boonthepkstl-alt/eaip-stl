# System Settings — Acceptance Criteria (Phase 7)

อ้างอิงจาก [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]]. ✅ = verified จริง (test อัตโนมัติ และ/หรือ browser check ที่รันจริงในรอบนี้), ⚠️ = documented gap ไม่ใช่ silent no-op

## System Settings (`frontend/src/pages/Settings/index.tsx`, route `/settings`)

- ✅ User can open the Settings desk — browser check: `/settings` แสดง 6 side-tab section
- ✅ General section (Organization Name, Support Email, Timezone, Date Format, Currency, Language) — ค่าเริ่มต้นตรงกับ legacy defaultValue ทุกฟิลด์
- ✅ Notifications section (5 toggle) — ทดสอบผ่าน `Settings/index.test.tsx` + `settings-service.test.ts` (nested merge)
- ✅ Security section (Session Timeout, Password Policy, Two-Factor, Max Login Attempts, IP Whitelist) — ทดสอบผ่าน `settings-service.test.ts`
- ✅ Appearance section (Theme picker, Primary Color swatches) — ตรวจแล้วถูกต้อง, ทั้งสองยังเป็น state ที่บันทึกได้แต่ไม่เปลี่ยน UI จริง ตรงกับ legacy ทุกประการ (ดู [[SYSTEM-SETTINGS-API-CONTRACT|SYSTEM-SETTINGS-API-CONTRACT.md]] Deviation ข้อ 2)
- ✅ Email section (SMTP Server/Port/Username/Encryption/From Email) — ตรวจแล้วถูกต้อง
- ⚠️ Email section's Password field — ไม่มีค่าเริ่มต้น ไม่ persist เข้า service (ตรงกับ legacy ทุกประการ, ดู [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]] หัวข้อ 4)
- ✅ Data & Backup section (Automatic Backups toggle, Data Retention days, Export Schedule toggle) — ตรวจแล้วถูกต้อง
- ✅ **Save Changes actually persists** — ยืนยันจริงผ่าน browser (แก้ Organization Name → "Acme Corp" → Save → toast ปรากฏ → ค่ายังอยู่) และ unit test (`pages/Settings/index.test.tsx`'s "saving a change persists it" ตรวจ `settingsService.getSettings()` หลัง save ตรงกับที่กรอกไว้) — เป็นการยกระดับจาก legacy ที่ Save เดิมแค่ยิง toast โดยไม่ persist อะไรจริงเลย (ดู [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]] หัวข้อ 1-2)
- ✅ Reset button — คืนค่า draft กลับไปเป็นค่าที่ persist ไว้ล่าสุด (ไม่ใช่ hard-coded default) ตรงกับความคาดหวังของ UI ปุ่ม "Reset" ที่ควรยกเลิกการแก้ไขที่ยังไม่บันทึก
- ✅ Sidebar "System Settings" navigates to the real Settings page, not a 404 — explicit regression test added per the established pattern (Phase 5A onward)

## Cross-Domain Regression

- ✅ No other domain references `settingsService` (grep-verified before writing this doc) — no coupling to close
- ✅ Regression: Administration landing (`/administration`) still works after adding the new module — browser spot-check + full test suite (90/90)

## สรุป

ทุกเกณฑ์ยอมรับในสโคปของ Phase 7 (System Settings) **ผ่านจริง** ยกเว้น 1 จุดที่ทำเครื่องหมายไว้ชัดเจนว่ายังไม่รองรับ (SMTP password field) ซึ่งสืบทอดมาจาก legacy เอง ไม่ใช่ gap ใหม่ ยืนยันด้วย 90 automated test (27 test file) และ browser check สดที่ทำ mutation จริง (save Organization Name) แล้วตรวจผลลัพธ์กลับ
