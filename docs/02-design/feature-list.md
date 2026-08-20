# รายการฟีเจอร์ (Feature List)

เอกสารนี้จัดกลุ่มรายการ Functional/Non-Functional Requirements จาก [[backlog]] ให้เป็น
"ฟีเจอร์" ที่มีความหมายต่อผู้ใช้งานจริง สำหรับทีมออกแบบ/พัฒนาใช้อ้างอิง อ้างอิงรายละเอียดเต็มของ
แต่ละรหัสได้จากเอกสาร spec ต้นทาง: [[20260815-01-task-creation-assignment]] (สร้างงาน/
มอบหมายงาน) และ [[20260815-02-supervisor-task-approval]] (การอนุมัติงานจาก Supervisor)

ระดับความสำคัญแบบ MoSCoW ของแต่ละฟีเจอร์ map มาจากระดับความสำคัญ (สูง/กลาง/ต่ำ) ที่กำหนดไว้ใน
[[backlog]] ตามกฎ: สูง → Must have, กลาง → Should have, ต่ำ → Could have โดยฟีเจอร์ที่ครอบคลุม
รหัสมากกว่า 1 ระดับ จะถือระดับสูงสุดในบรรดารหัสที่ครอบคลุมเป็นระดับของทั้งฟีเจอร์

## สรุปฟีเจอร์ทั้งหมด

| # | ฟีเจอร์ | คำอธิบายสั้น (1 บรรทัด) | MoSCoW | รหัส FR/NFR | บทบาทผู้ใช้ |
|---|---------|--------------------------|--------|--------------|--------------|
| 1 | สร้างงานใหม่และมอบหมายงานให้ทีม | Staff สร้างงานใหม่พร้อมรายละเอียดครบชุด และมอบหมายให้สมาชิกในทีม/โครงการเดียวกันหรือให้ตนเองได้ | Must have | [[20260815-01-task-creation-assignment#Functional Requirements (FR)\|FR-01]], [[20260815-01-task-creation-assignment#Functional Requirements (FR)\|FR-02]], [[20260815-01-task-creation-assignment#Functional Requirements (FR)\|FR-03]], [[20260815-01-task-creation-assignment#Non-Functional Requirements (NFR)\|NFR-01]] | Staff |
| 2 | อนุมัติ/ปฏิเสธงานโดย Supervisor | Supervisor ระดับ Project-level ตรวจสอบงานที่รออนุมัติ แล้วอนุมัติหรือปฏิเสธพร้อมเหตุผล | Must have | [[20260815-02-supervisor-task-approval#Functional Requirements (FR)\|FR-04]], [[20260815-02-supervisor-task-approval#Functional Requirements (FR)\|FR-05]], [[20260815-02-supervisor-task-approval#Functional Requirements (FR)\|FR-06]], [[20260815-02-supervisor-task-approval#Non-Functional Requirements (NFR)\|NFR-02]] | Staff และ Supervisor |
| 3 | แก้ไขงานที่ถูกปฏิเสธและขออนุมัติใหม่ | Staff แก้ไขรายละเอียดงานที่ถูกปฏิเสธแล้วส่งกลับเข้าสถานะรออนุมัติอีกครั้ง | Should have | [[20260815-02-supervisor-task-approval#Functional Requirements (FR)\|FR-07]] | Staff |

## 1. สร้างงานใหม่และมอบหมายงานให้ทีม

Staff สามารถสร้างงาน (Task) ใหม่โดยระบุชื่องาน รายละเอียด (Rich Text) ผู้รับมอบหมาย กำหนดส่ง
และระดับความสำคัญ ระบบตั้งสถานะเริ่มต้นให้อัตโนมัติ จากนั้นมอบหมายงานให้สมาชิกคนอื่นในทีม/โครงการ
เดียวกัน หรือมอบหมายให้ตนเองก็ได้ (self-assign) ระบบต้องตรวจสอบสิทธิ์การมอบหมายทุกครั้งเพื่อป้องกัน
การมอบหมายข้ามทีม/โครงการ

- รหัส FR/NFR: [[20260815-01-task-creation-assignment#Functional Requirements (FR)|FR-01]]
  (สร้างงานใหม่), [[20260815-01-task-creation-assignment#Functional Requirements (FR)|FR-02]]
  (มอบหมายงานภายในทีม/โครงการเดียวกัน),
  [[20260815-01-task-creation-assignment#Functional Requirements (FR)|FR-03]]
  (มอบหมายงานให้ตนเอง),
  [[20260815-01-task-creation-assignment#Non-Functional Requirements (NFR)|NFR-01]]
  (Authorization ในการมอบหมายงาน)
- บทบาทผู้ใช้: Staff
- ระดับความสำคัญ (MoSCoW): Must have

## 2. อนุมัติ/ปฏิเสธงานโดย Supervisor

เมื่อ Staff มอบหมายงานสำเร็จ ระบบเปลี่ยนสถานะงานเป็น "รออนุมัติ" และแจ้งเตือน Supervisor ของทีม/
โครงการนั้นทันที Supervisor ที่มีสิทธิ์ระดับ Project-level ในทีม/โครงการเดียวกับงานเท่านั้นที่มีสิทธิ์
อนุมัติหรือปฏิเสธงานนั้น เมื่ออนุมัติ ระบบเปลี่ยนสถานะงานเป็นสถานะเริ่มดำเนินการและแจ้งเตือนผู้ถูก
มอบหมาย เมื่อปฏิเสธ ต้องระบุเหตุผลประกอบ (บันทึกเป็น Rich Text/comment ผูกกับ Task) ระบบเปลี่ยน
สถานะเป็น "ถูกปฏิเสธ" และแจ้งเตือน Staff ผู้สร้างงานและผู้ถูกมอบหมาย

- รหัส FR/NFR: [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-04]]
  (ตั้งสถานะ "รออนุมัติ" หลังมอบหมายงาน),
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-05]]
  (Supervisor อนุมัติงาน),
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-06]]
  (Supervisor ปฏิเสธงานพร้อมเหตุผล),
  [[20260815-02-supervisor-task-approval#Non-Functional Requirements (NFR)|NFR-02]]
  (Authorization ในการอนุมัติ/ปฏิเสธงาน)
- บทบาทผู้ใช้: Staff (ผู้สร้าง/ผู้ถูกมอบหมาย รับผลการอนุมัติ) และ Supervisor (ผู้อนุมัติ/ปฏิเสธ)
- ระดับความสำคัญ (MoSCoW): Must have

## 3. แก้ไขงานที่ถูกปฏิเสธและขออนุมัติใหม่

Staff ผู้สร้างงานสามารถแก้ไขรายละเอียดงานที่ถูก Supervisor ปฏิเสธ แล้วส่งขออนุมัติใหม่ได้ ระบบ
เปลี่ยนสถานะงานกลับเป็น "รออนุมัติ" อีกครั้งเมื่อส่งใหม่ และแจ้งเตือน Supervisor อีกครั้ง เป็นวงจร
ต่อเนื่องจากฟีเจอร์ที่ 2 จนกว่างานจะได้รับการอนุมัติ

- รหัส FR/NFR: [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-07]]
  (แก้ไขและขออนุมัติใหม่หลังถูกปฏิเสธ)
- บทบาทผู้ใช้: Staff
- ระดับความสำคัญ (MoSCoW): Should have
