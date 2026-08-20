# Prototype v1 — Task Management (20260815-01-v1)

เวอร์ชันแรกของ Clickable HTML Prototype ในโปรเจกต์นี้ (ไม่มีเวอร์ชันก่อนหน้าให้ reuse) แปลงจาก
[[feature-list]] + [[user-journey]] โดยยึด [[DESIGN.md|DESIGN]] เป็น single source of truth ของ
ภาพทั้งหมด อ้างอิงรายละเอียด field/validation/สิทธิ์จาก spec ต้นทาง
[[20260815-01-task-creation-assignment]] และ [[20260815-02-supervisor-task-approval]]

## ขอบเขต

ครอบคลุมทั้ง 2 journey ใน [[user-journey]] ครบทุกรหัส FR-01–FR-07, NFR-01–NFR-02 ตามที่ยืนยันแผน
กับผู้ใช้แล้ว ไม่มีการตัดลด scope

## ตาราง Journey/ฟีเจอร์ ↔ ไฟล์ ↔ รหัส FR/NFR

| ไฟล์ | Journey/ฟีเจอร์ | รหัส FR/NFR | บทบาท |
|------|------------------|--------------|--------|
| `index.html` | หน้ารวมลิงก์ทุกหน้าจอ จัดกลุ่มตาม journey | — | ทั้งหมด |
| `login.html` | จุดเริ่มต้นเข้าสู่ระบบ (demo เลือกบทบาท) | จุดเริ่ม journey — ไม่มีรหัสเจาะจง | Staff, Supervisor |
| `staff-task-list.html` | Journey 1: Staff — Dashboard งานของฉัน | FR-01 (จุดเริ่ม), แสดงผล FR-04/FR-05/FR-06 | Staff |
| `task-create.html` | Journey 1: Staff — สร้างงานใหม่ + มอบหมายงาน | FR-01, FR-02, FR-03, NFR-01 | Staff |
| `task-detail-staff.html` | Journey 2: Staff — ดูผลการอนุมัติ/ปฏิเสธ | FR-04 (แสดงผล), FR-05/FR-06 (แสดงผล), จุดเข้า FR-07 | Staff |
| `task-edit-resubmit.html` | Journey 2: Staff — แก้ไขงานที่ถูกปฏิเสธและส่งขออนุมัติใหม่ | FR-07 | Staff |
| `supervisor-task-list.html` | Journey 2: Supervisor — รายการงานรออนุมัติ | FR-04 (จุดรับแจ้งเตือน), NFR-02 (ขอบเขตทีม/โครงการ) | Supervisor |
| `task-detail-supervisor.html` | Journey 2: Supervisor — อนุมัติ/ปฏิเสธงาน | FR-05, FR-06, NFR-02 | Supervisor |
| `task-detail-supervisor-denied.html` | Journey 2: Supervisor — ตัวอย่างถูกปฏิเสธสิทธิ์นอกทีม/โครงการ | NFR-02 | Supervisor |

## หมายเหตุจุดที่เน้นตาม NFR/หลักการออกแบบ

- **NFR-01 (Authorization การมอบหมายงาน):** `task-create.html` แสดงตัวอย่าง alert แบบ danger
  สาธิตกรณีระบบปฏิเสธคำขอมอบหมายงานให้ผู้ใช้นอกทีม/โครงการ ควบคู่กับ dropdown ผู้รับมอบหมายที่ถูก
  จำกัดเฉพาะสมาชิกในทีมเดียวกันในสถานะปกติของฟอร์ม
- **NFR-02 (Authorization การอนุมัติ/ปฏิเสธงาน):** แยกเป็นหน้าจอเฉพาะ
  `task-detail-supervisor-denied.html` เพื่อสาธิตว่าระบบต้องปฏิเสธคำขอทุกช่องทางที่เรียกใช้งาน
  ไม่ใช่แค่ซ่อนปุ่มในหน้าจอปกติ
- **1 primary action ต่อหน้าจอ:** ทุกฟอร์ม/หน้าจอมีปุ่ม `.btn-primary` เพียงปุ่มเดียวเป็น action หลัก
  (เช่น "สร้างงานและมอบหมาย", "ส่งขออนุมัติใหม่") ปุ่มรองใช้ `.btn-secondary`/`.btn-danger` ตาม
  ความหมายที่ DESIGN.md กำหนด (danger เฉพาะ action ทำลาย/ปฏิเสธ)
- **สื่อความหมายสถานะด้วยข้อความ+สีเสมอ:** badge สถานะ (รออนุมัติ/รอดำเนินการ/ถูกปฏิเสธ/เสร็จสิ้น)
  ทุกจุดมีทั้ง label ข้อความและสี ไม่ใช้สีเพียงอย่างเดียว ตาม accessibility ใน DESIGN.md
- **Stat tile บน dashboard ทั้งสองบทบาท:** ใช้เฉพาะสีสถานะ (success/warning/danger/info) ที่มีอยู่แล้ว
  ใน DESIGN.md เป็น border-left accent เท่านั้น ไม่มีการสร้างจานสี categorical ใหม่ (ตรวจสอบตาม
  แนวทาง dataviz skill แล้วก่อนออกแบบ)
- **Notification:** ออกแบบเป็น bell icon + dropdown แบบ static ฝังในทุกหน้าหลัง login (ไม่แยกเป็น
  หน้าจอต่างหาก เพราะ user-journey ไม่ได้ระบุหน้าจอ notification history แยก เป็นเพียงพฤติกรรม
  "แจ้งเตือน" ที่ผูกกับ FR-04/05/06/07)
- **Modal อนุมัติ/ปฏิเสธ:** ใช้ CSS-only `:target` (ไม่มี JS ภายนอก/framework) เพื่อคง constraint
  self-contained static HTML
- Touch target ปุ่ม/interactive element ทั้งหมด (`.btn`, `.notif-bell`, `.filter-chip`, `.modal-close`)
  กำหนด min-height/min-width อย่างน้อย 44px ตาม accessibility guideline ใน DESIGN.md

## ข้อจำกัด/สิ่งที่ยังไม่ทำในรอบนี้

- ยังไม่ได้เปิดตรวจสอบด้วยเบราว์เซอร์จริง (agent นี้ไม่มีเครื่องมือเปิดเบราว์เซอร์) ตรวจสอบได้เพียง
  การอ่านไฟล์กลับเพื่อเช็คโครงสร้าง/ลิงก์/การอ้างอิง `style.css` เท่านั้น — แนะนำให้ตรวจสอบด้วย
  เบราว์เซอร์จริงในเทรดหลักก่อนใช้เป็นฐานพัฒนา
- ไม่มีหน้าจอ notification history แยกต่างหาก (ตามเหตุผลด้านบน) หากต้องการในอนาคตควรพิจารณาว่าเป็น
  requirement ใหม่ (แนะนำ `/capture-requirement`) ก่อนเพิ่มหน้าจอ
- Prototype นี้เป็น static mockup ไม่มี logic จริง (ปุ่ม submit/ลิงก์นำไปหน้าอื่นตามสถานการณ์ demo
  ที่กำหนดไว้ล่วงหน้าเท่านั้น)

## เอกสารที่เกี่ยวข้อง

- [[feature-list]]
- [[user-journey]]
- [[DESIGN.md|DESIGN]]
- [[backlog]]
- [[20260815-01-task-creation-assignment]]
- [[20260815-02-supervisor-task-approval]]
