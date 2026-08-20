# API Spec (Operation Contract — Logical)

เอกสารนี้อธิบายสัญญาการทำงาน (operation contract) ระดับ logical ครอบคลุมฟีเจอร์ทั้งหมดใน
[[feature-list]] และ [[user-journey]] สอดคล้องกับ [[architecture]] (Backend Service —
Controller/Service/Repository layer) อ้างอิง entity/attribute จาก [[db-spec]] และความต้องการ
ต้นทางจาก [[backlog]] และเอกสาร spec: [[20260815-01-task-creation-assignment]] (สร้างงาน/
มอบหมายงาน) และ [[20260815-02-supervisor-task-approval]] (อนุมัติ/ปฏิเสธงานโดย Supervisor)

**หมายเหตุเรื่อง tech stack:** เอกสารนี้ระบุเฉพาะชื่อ operation, บทบาทผู้เรียก, input/output,
กฎทางธุรกิจ และกรณี error เท่านั้น **ห้ามตีความว่ามี HTTP method/path, REST/GraphQL/gRPC หรือ
protocol ใดๆ ผูกอยู่** แม้ [[technology-stack]] จะตัดสินใจแล้วว่า Backend ใช้ Go/Fiber ก็ตาม
เพราะเอกสารนั้นเองระบุว่าการ map operation เข้ากับ route/endpoint จริงเป็นงานของ detailed design
(ดูหัวข้อ "ประเด็นรอตัดสินใจ" ท้ายเอกสาร) รูปแบบผลลัพธ์ error ที่อ้างอิงในเอกสารนี้ ("สำเร็จ/ผิดพลาด
+ ข้อความ") จึงเขียนเป็นแนวคิดเชิง logical เท่านั้น ไม่ใช่ JSON schema ของ [[technology-stack]]
โดยตรง

## บทบาทผู้ใช้ (Role) ที่เกี่ยวข้อง

- **Staff** — สร้างงาน, มอบหมายงาน (ให้ผู้อื่นในทีม/โครงการเดียวกัน หรือให้ตนเอง), แก้ไขงานที่ถูก
  ปฏิเสธและส่งขออนุมัติใหม่ (บทบาทนี้กำหนดจาก TeamProjectMembership.บทบาทระดับ_Project_level
  = Staff ใน [[db-spec]])
- **Supervisor** — ตรวจสอบ อนุมัติ หรือปฏิเสธงานที่อยู่ในสถานะ "รออนุมัติ" เฉพาะในทีม/โครงการที่
  ตนมีบทบาท Supervisor (TeamProjectMembership.บทบาทระดับ_Project_level = Supervisor)

ทุก operation ในเอกสารนี้ต้องผ่านการตรวจสอบตัวตนผู้ใช้ (authentication) ที่ Controller layer ก่อน
เสมอ ([[architecture]]) ส่วนการตรวจสอบสิทธิ์เชิง business rule (scope ทีม/โครงการ, บทบาท) เป็น
หน้าที่ของ Service layer ตาม NFR-01/NFR-02

## รายการ Operation

### 1. สร้างงานใหม่และมอบหมายงาน

- **ผู้เรียกได้ (Role):** Staff
- **อ้างอิง FR/NFR:** [[20260815-01-task-creation-assignment#Functional Requirements (FR)|FR-01]],
  [[20260815-01-task-creation-assignment#Functional Requirements (FR)|FR-02]],
  [[20260815-01-task-creation-assignment#Functional Requirements (FR)|FR-03]],
  [[20260815-01-task-creation-assignment#Non-Functional Requirements (NFR)|NFR-01]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-04]]
- **Input:**
  - ชื่องาน (จำเป็น) — mapping: `Task.ชื่องาน`
  - รายละเอียด (Rich Text, จำเป็น) — mapping: `Task.รายละเอียด`
  - ผู้รับมอบหมาย (อ้างอิงถึง User, จำเป็น) — mapping: `Task.ผู้รับมอบหมาย(user_id)` — อาจเป็น
    ผู้ใช้ที่เรียก operation นี้เอง (self-assign, FR-03)
  - กำหนดส่ง (วันที่-เวลา, จำเป็น) — mapping: `Task.กำหนดส่ง`
  - ระดับความสำคัญ (จำเป็น) — mapping: `Task.ระดับความสำคัญ`
  - ทีม/โครงการที่งานนี้สังกัด **ไม่รับจาก input ของผู้เรียกโดยตรง** — Service layer กำหนดจาก
    ทีม/โครงการที่ผู้เรียก (ผู้สร้างงาน) สังกัดอยู่ผ่าน `TeamProjectMembership` เพื่อป้องกันการปลอม
    ค่าจาก Client (สอดคล้องกับหลักการ NFR-01 ที่ระบุว่า "ไม่เชื่อค่าที่ Client ส่งมาโดยตรง")
- **Output:**
  - Task ที่สร้างสำเร็จ พร้อม `สถานะ` = "รออนุมัติ" (ตั้งค่าอัตโนมัติทันทีตาม FR-04 หลังมอบหมายสำเร็จ)
  - รายการ Notification ที่ถูกสร้างสำหรับ Supervisor ของทีม/โครงการนั้น (ผูกกับ Task นี้)
- **กฎทางธุรกิจ / Validation:**
  1. ทุกฟิลด์ที่จำเป็นต้องมีค่าตามที่ระบุใน `Task` entity ต้องถูกกรอกครบก่อนบันทึก (FR-01)
  2. ถ้าผู้รับมอบหมาย = ผู้เรียกเอง → อนุญาตเสมอ ไม่ต้องตรวจสอบ scope เพิ่มเติม (FR-03)
  3. ถ้าผู้รับมอบหมาย ≠ ผู้เรียก → ต้องตรวจสอบว่าผู้รับมอบหมายมี `TeamProjectMembership` ในทีม/
     โครงการเดียวกับผู้เรียก (ผู้สร้างงาน) ก่อนบันทึกทุกครั้ง (FR-02, NFR-01) การตรวจสอบนี้เกิดที่
     Service layer เสมอ ไม่ว่าจะเรียกผ่านช่องทางใด (NFR-01)
  4. เมื่อสร้าง+มอบหมายสำเร็จ ต้องตั้ง `สถานะ` เป็น "รออนุมัติ" และสร้าง Notification ให้ผู้ใช้ทุก
     คนที่มี `TeamProjectMembership.บทบาทระดับ_Project_level` = Supervisor ในทีม/โครงการเดียวกัน
     ทันที (FR-04) พร้อมบันทึก `TaskStatusHistory` (สถานะก่อนหน้า = ไม่มี/สร้างใหม่ → รออนุมัติ)
- **กรณี Error หลัก:**
  - ผู้รับมอบหมายไม่ได้อยู่ในทีม/โครงการเดียวกับผู้เรียก → ปฏิเสธคำขอทั้งหมด ไม่บันทึกงาน (NFR-01)
  - ฟิลด์ที่จำเป็นขาดหายหรือรูปแบบไม่ถูกต้อง (เช่น กำหนดส่งไม่ใช่วันที่ที่ถูกต้อง) → ปฏิเสธคำขอ
    (FR-01)

### 2. ดึงรายละเอียดงาน

- **ผู้เรียกได้ (Role):** Staff (ผู้สร้างงานหรือผู้ถูกมอบหมายของ Task นั้น), Supervisor (ที่มี
  `TeamProjectMembership` บทบาท Supervisor ในทีม/โครงการเดียวกับ Task นั้น)
- **อ้างอิง FR/NFR:** สนับสนุน
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-05]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-06]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-07]],
  [[20260815-02-supervisor-task-approval#Non-Functional Requirements (NFR)|NFR-02]]
  (ตาม [[user-journey#Journey: Supervisor ตรวจสอบและอนุมัติ/ปฏิเสธงาน]] ขั้นตอน "Supervisor
  เปิดดูรายละเอียดงานที่รออนุมัติ" ก่อนตัดสินใจอนุมัติ/ปฏิเสธ)
- **Input:** รหัสงาน (Task id, จำเป็น)
- **Output:** รายละเอียด Task ทั้งหมด (ชื่องาน, รายละเอียด, ผู้สร้างงาน, ผู้รับมอบหมาย, กำหนดส่ง,
  ระดับความสำคัญ, สถานะ), ประวัติ `TaskComment` ที่ผูกกับงานนี้ (ถ้ามี เช่น เหตุผลการปฏิเสธรอบก่อน)
- **กฎทางธุรกิจ / Validation:**
  1. ผู้เรียกต้องเป็นผู้สร้างงาน, ผู้ถูกมอบหมาย หรือ Supervisor ที่มีสิทธิ์ระดับ Project-level ใน
     ทีม/โครงการเดียวกับงานนั้นเท่านั้น จึงจะเห็นรายละเอียดงานได้ (NFR-02 ใช้ scope เดียวกับการ
     ตรวจสอบสิทธิ์อนุมัติ/ปฏิเสธ)
- **กรณี Error หลัก:**
  - ไม่พบ Task ตาม id ที่ระบุ → แจ้งไม่พบข้อมูล
  - ผู้เรียกไม่มีสิทธิ์เข้าถึงงานนี้ (ไม่ใช่ผู้สร้าง/ผู้ถูกมอบหมาย/Supervisor ในทีม/โครงการเดียวกัน)
    → ปฏิเสธคำขอ (NFR-02)

### 3. ดึงรายการงานที่รออนุมัติสำหรับ Supervisor

- **ผู้เรียกได้ (Role):** Supervisor
- **อ้างอิง FR/NFR:** สนับสนุน
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-04]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-05]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-06]],
  [[20260815-02-supervisor-task-approval#Non-Functional Requirements (NFR)|NFR-02]]
  (จำเป็นเพื่อให้ Supervisor เห็นภาพรวมงานที่รออนุมัติหลังได้รับ Notification ตาม FR-04 ก่อนเปิด
  ดูรายละเอียดทีละงานด้วย operation ที่ 2)
- **Input:** (ไม่มี field บังคับ นอกจากตัวตนผู้เรียกที่ได้จาก authentication)
- **Output:** รายการ Task ที่ `สถานะ` = "รออนุมัติ" และ `Task.ทีม/โครงการ` ตรงกับทีม/โครงการที่
  ผู้เรียกมีบทบาท Supervisor อยู่เท่านั้น
- **กฎทางธุรกิจ / Validation:**
  1. กรองเฉพาะงานในทีม/โครงการที่ผู้เรียกมี `TeamProjectMembership` บทบาท Supervisor (NFR-02) —
     ไม่แสดงงานของทีม/โครงการอื่น
- **กรณี Error หลัก:**
  - ผู้เรียกไม่มีบทบาท Supervisor ในทีม/โครงการใดเลย → คืนรายการว่าง (ไม่ถือเป็นข้อผิดพลาด)

### 4. อนุมัติงาน

- **ผู้เรียกได้ (Role):** Supervisor
- **อ้างอิง FR/NFR:**
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-05]],
  [[20260815-02-supervisor-task-approval#Non-Functional Requirements (NFR)|NFR-02]]
- **Input:** รหัสงาน (Task id, จำเป็น)
- **Output:** Task ที่มี `สถานะ` เปลี่ยนเป็นสถานะเริ่มดำเนินการ (เช่น "รอดำเนินการ") พร้อม
  `TaskStatusHistory` รายการใหม่ (สถานะก่อนหน้า = "รออนุมัติ" → สถานะใหม่ = "รอดำเนินการ") และ
  Notification ที่สร้างให้ผู้ถูกมอบหมายของงานนั้น
- **กฎทางธุรกิจ / Validation:**
  1. Task ที่จะอนุมัติต้องมี `สถานะ` ปัจจุบัน = "รออนุมัติ" เท่านั้น (FR-05)
  2. ผู้เรียกต้องมี `TeamProjectMembership.บทบาทระดับ_Project_level` = Supervisor ในทีม/โครงการ
     เดียวกับ `Task.ทีม/โครงการ` (NFR-02) ตรวจสอบทุกครั้งไม่ว่าจะเรียกผ่านช่องทางใด
  3. เมื่ออนุมัติสำเร็จ ต้องบันทึก `TaskStatusHistory` และสร้าง Notification ให้ผู้ถูกมอบหมายทันที
     (FR-05)
- **กรณี Error หลัก:**
  - ผู้เรียกไม่มีสิทธิ์ Supervisor ในทีม/โครงการเดียวกับงาน → ปฏิเสธคำขอ (NFR-02)
  - Task ไม่ได้อยู่ในสถานะ "รออนุมัติ" (เช่น อนุมัติซ้ำ หรืองานถูกปฏิเสธไปแล้ว) → ปฏิเสธคำขอ พร้อม
    แจ้งสถานะปัจจุบัน (FR-05)
  - ไม่พบ Task ตาม id ที่ระบุ → แจ้งไม่พบข้อมูล

### 5. ปฏิเสธงานพร้อมเหตุผล

- **ผู้เรียกได้ (Role):** Supervisor
- **อ้างอิง FR/NFR:**
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-06]],
  [[20260815-02-supervisor-task-approval#Non-Functional Requirements (NFR)|NFR-02]]
- **Input:**
  - รหัสงาน (Task id, จำเป็น)
  - เหตุผลการปฏิเสธ (Rich Text, จำเป็น) — mapping: `TaskComment.เนื้อหา` (ประเภท = "เหตุผลการปฏิเสธ")
- **Output:** Task ที่มี `สถานะ` เปลี่ยนเป็น "ถูกปฏิเสธ" พร้อม `TaskComment` ใหม่ที่บันทึกเหตุผล,
  `TaskStatusHistory` รายการใหม่ (อ้างอิงถึง TaskComment นั้น), และ Notification ที่สร้างให้ทั้ง
  Staff ผู้สร้างงานและผู้ถูกมอบหมาย
- **กฎทางธุรกิจ / Validation:**
  1. Task ที่จะปฏิเสธต้องมี `สถานะ` ปัจจุบัน = "รออนุมัติ" เท่านั้น (FR-06)
  2. ต้องระบุเหตุผลการปฏิเสธเสมอ ห้ามปฏิเสธโดยไม่ระบุเหตุผล (FR-06)
  3. ผู้เรียกต้องมี `TeamProjectMembership.บทบาทระดับ_Project_level` = Supervisor ในทีม/โครงการ
     เดียวกับ `Task.ทีม/โครงการ` (NFR-02)
  4. เมื่อปฏิเสธสำเร็จ ต้องบันทึก `TaskComment`, `TaskStatusHistory` (ผูกกับ comment นั้น) และสร้าง
     Notification ให้ Staff ผู้สร้างงานและผู้ถูกมอบหมายทันที (FR-06)
- **กรณี Error หลัก:**
  - ไม่ได้ระบุเหตุผลการปฏิเสธ → ปฏิเสธคำขอ (FR-06)
  - ผู้เรียกไม่มีสิทธิ์ Supervisor ในทีม/โครงการเดียวกับงาน → ปฏิเสธคำขอ (NFR-02)
  - Task ไม่ได้อยู่ในสถานะ "รออนุมัติ" → ปฏิเสธคำขอ พร้อมแจ้งสถานะปัจจุบัน (FR-06)
  - ไม่พบ Task ตาม id ที่ระบุ → แจ้งไม่พบข้อมูล

### 6. แก้ไขงานที่ถูกปฏิเสธและขออนุมัติใหม่

- **ผู้เรียกได้ (Role):** Staff (เฉพาะผู้สร้างงานเดิม)
- **อ้างอิง FR/NFR:**
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-07]]
- **Input:**
  - รหัสงาน (Task id, จำเป็น)
  - ฟิลด์ที่แก้ไขได้ (อย่างน้อยหนึ่งฟิลด์): ชื่องาน, รายละเอียด, ผู้รับมอบหมาย, กำหนดส่ง, ระดับความ
    สำคัญ — mapping ตรงกับ attribute เดียวกับ operation ที่ 1 (`Task.ชื่องาน`,
    `Task.รายละเอียด`, `Task.ผู้รับมอบหมาย`, `Task.กำหนดส่ง`, `Task.ระดับความสำคัญ`)
- **Output:** Task ที่มี `สถานะ` เปลี่ยนกลับเป็น "รออนุมัติ" พร้อม `TaskStatusHistory` รายการใหม่
  (สถานะก่อนหน้า = "ถูกปฏิเสธ" → สถานะใหม่ = "รออนุมัติ") และ Notification ที่สร้างให้ Supervisor
  ของทีม/โครงการนั้นอีกครั้ง
- **กฎทางธุรกิจ / Validation:**
  1. Task ที่จะแก้ไข/ส่งขออนุมัติใหม่ ต้องมี `สถานะ` ปัจจุบัน = "ถูกปฏิเสธ" เท่านั้น (FR-07)
  2. ผู้เรียกต้องเป็นผู้สร้างงานเดิมของ Task นั้น (`Task.ผู้สร้างงาน` ตรงกับผู้เรียก)
  3. ถ้ามีการเปลี่ยนผู้รับมอบหมายระหว่างแก้ไข ต้องตรวจสอบ scope ทีม/โครงการเดียวกันซ้ำอีกครั้ง
     ตามกฎเดียวกับ operation ที่ 1 ข้อ 2–3 (FR-02, NFR-01) เนื่องจากเป็นการมอบหมายงานอีกครั้ง
  4. เมื่อบันทึกสำเร็จ ต้องตั้ง `สถานะ` กลับเป็น "รออนุมัติ" และสร้าง Notification ให้ Supervisor
     ของทีม/โครงการนั้นอีกครั้งทันที (FR-07)
- **กรณี Error หลัก:**
  - ผู้เรียกไม่ใช่ผู้สร้างงานเดิม → ปฏิเสธคำขอ
  - Task ไม่ได้อยู่ในสถานะ "ถูกปฏิเสธ" (เช่น ยังรออนุมัติอยู่ หรืออนุมัติไปแล้ว) → ปฏิเสธคำขอ พร้อม
    แจ้งสถานะปัจจุบัน (FR-07)
  - เปลี่ยนผู้รับมอบหมายเป็นผู้ที่ไม่ได้อยู่ในทีม/โครงการเดียวกัน → ปฏิเสธคำขอ (NFR-01)
  - ไม่พบ Task ตาม id ที่ระบุ → แจ้งไม่พบข้อมูล

### 7. ดึงรายการแจ้งเตือนของผู้ใช้ที่ล็อกอินอยู่

- **ผู้เรียกได้ (Role):** Staff, Supervisor (ผู้ใช้ที่ล็อกอินอยู่ ดึงเฉพาะ Notification ของตนเอง)
- **อ้างอิง FR/NFR:** สนับสนุน
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-04]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-05]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-06]],
  [[20260815-02-supervisor-task-approval#Functional Requirements (FR)|FR-07]]
  (ทุก FR ข้างต้นระบุว่าระบบต้อง "แจ้งเตือน" ผู้ใช้ที่เกี่ยวข้อง — operation นี้จำเป็นเพื่อให้ผู้ใช้
  เข้าถึงข้อมูลแจ้งเตือนที่ระบบสร้างไว้ ไม่ใช่ requirement ใหม่ที่แยกออกจาก FR เหล่านี้)
- **Input:** (ไม่มี field บังคับ นอกจากตัวตนผู้เรียก)
- **Output:** รายการ `Notification` ที่ `ผู้รับ` = ผู้เรียก เรียงตามเวลาสร้างล่าสุดก่อน
- **กฎทางธุรกิจ / Validation:**
  1. ผู้เรียกเห็นได้เฉพาะ Notification ของตนเองเท่านั้น
- **กรณี Error หลัก:** (ไม่มีกรณี error เฉพาะนอกจากการยืนยันตัวตนที่ Controller layer)

## ประเด็นรอตัดสินใจ

รายละเอียดต่อไปนี้ยังไม่ควรถูกกำหนดในเอกสารระดับ operation contract นี้ ให้ดูการตัดสินใจจริงตอน
detailed design โดยอ้างอิง [[technology-stack]]:

- **การ map operation → HTTP method/path (หรือ protocol อื่น) จริง:** แม้ [[technology-stack]]
  จะระบุ Go/Fiber เป็นมาตรฐานบังคับแล้ว แต่การกำหนด route/endpoint จริงของแต่ละ operation ข้างต้น
  เป็นงานของ detailed design ต่อฟีเจอร์ ไม่ใช่ของเอกสารนี้
- **รูปแบบ error response จริง:** [[technology-stack]] ระบุรูปแบบมาตรฐานของ `go-template-main`
  (`{ "status": "ERROR", "message": "..." }`) ไว้แล้วสำหรับใช้อ้างอิงตอน implementation — เอกสาร
  นี้อธิบายเฉพาะ "กรณี error หลัก" เชิงความหมาย (semantic) ไม่ผูกกับ schema ของ response จริง
- **ช่องทางนำส่งการแจ้งเตือนจริง (Notification delivery):** ดูหัวข้อ "ประเด็นรอตัดสินใจ" ใน
  [[architecture]] และ [[db-spec]] — operation ที่ 7 ในเอกสารนี้ระบุเฉพาะการดึงข้อมูลที่ถูกบันทึก
  ไว้แล้ว ไม่ผูกกับกลไก push/email/อื่นๆ

## เอกสารที่เกี่ยวข้อง

- [[architecture]]
- [[db-spec]]
- [[feature-list]]
- [[user-journey]]
- [[backlog]]
- [[technology-stack]]
- [[20260815-01-task-creation-assignment]]
- [[20260815-02-supervisor-task-approval]]
