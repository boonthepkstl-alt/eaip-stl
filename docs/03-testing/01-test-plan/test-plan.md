# Test Plan

เอกสารสรุปกลยุทธ์การทดสอบภาพรวมของโปรเจกต์ (tasks-mng) 1 ไฟล์ต่อโปรเจกต์ ครอบคลุมทุกฟีเจอร์ใน
[[feature-list]] และทุก journey ใน [[user-journey]] อ้างอิงเกณฑ์ยอมรับละเอียดที่
[[acceptance-criteria]] และ test case แบบ step-by-step ที่ `test-cases/{feature-slug}.md`

## Scope

ฟีเจอร์ทั้งหมดที่ต้องทดสอบ (อ้างอิง [[feature-list]] ปัจจุบัน — 3 ฟีเจอร์):

| # | ฟีเจอร์ | รหัส FR/NFR | MoSCoW | บทบาทผู้ใช้ |
|---|---------|--------------|--------|--------------|
| 1 | สร้างงานใหม่และมอบหมายงานให้ทีม | FR-01, FR-02, FR-03, NFR-01 | Must have | Staff |
| 2 | อนุมัติ/ปฏิเสธงานโดย Supervisor | FR-04, FR-05, FR-06, NFR-02 | Must have | Staff และ Supervisor |
| 3 | แก้ไขงานที่ถูกปฏิเสธและขออนุมัติใหม่ | FR-07 | Should have | Staff |

**นอกขอบเขต (out of scope)** ตามที่ spec ต้นทางระบุไว้ชัดเจน — ไม่ต้องออกแบบ test case รองรับใน
รอบนี้:
- การมอบหมายงานข้ามทีม/โครงการแบบมีสิทธิ์พิเศษ ([[20260815-01-task-creation-assignment]])
- การแก้ไข/ลบงาน (นอกเหนือจากกรณีแก้ไขงานที่ถูกปฏิเสธตาม FR-07), Sub Task, workflow เปลี่ยนสถานะ
  งานอื่นๆ หลังการสร้าง ([[20260815-01-task-creation-assignment]])
- การอนุมัติหลายลำดับชั้น (multi-level approval), การมอบอำนาจอนุมัติ (delegate), การอนุมัติ Sub
  Task แยกจาก Parent Task, การอนุมัติการเปลี่ยนสถานะอื่นๆ ภายหลังเริ่มงาน เช่น อนุมัติปิดงาน/
  เสร็จสิ้นงาน ([[20260815-02-supervisor-task-approval]])
- กลไกนำส่งการแจ้งเตือนจริง (in-app/อีเมล/push) — ยังเป็น "ประเด็นรอตัดสินใจ" ใน [[architecture]]/
  [[db-spec]]/[[api-spec]] เอกสารทดสอบชุดนี้ทดสอบเฉพาะว่าระบบ "สร้าง/บันทึก" Notification ที่ถูกต้อง
  ไว้หรือไม่ ไม่ทดสอบช่องทางนำส่งจริง จนกว่าจะมีการตัดสินใจเพิ่มเติม

## ประเภทการทดสอบ

### Functional Testing (ต่อกลุ่ม FR)

| กลุ่ม FR | ประเภทการทดสอบ | หมายเหตุ |
|----------|------------------|----------|
| FR-01, FR-02, FR-03 | Functional Testing — การสร้างงานและมอบหมายงาน (happy path + validation) | ดู [[acceptance-criteria#1. สร้างงานใหม่และมอบหมายงานให้ทีม]] |
| FR-04, FR-05, FR-06 | Functional Testing — workflow อนุมัติ/ปฏิเสธงาน (state transition testing) | ต้องทดสอบทุก state transition ที่ระบุใน [[db-spec#4. Task (งาน)]]: รออนุมัติ → รอดำเนินการ / รออนุมัติ → ถูกปฏิเสธ |
| FR-07 | Functional Testing — วงจรแก้ไข/ขออนุมัติใหม่ (regression ต่อ FR-02 เพราะมีการตรวจสอบ scope ซ้ำ) | ต้องทดสอบว่าวนกลับไปยัง workflow ของฟีเจอร์ที่ 2 ได้ถูกต้อง |

### Non-Functional Testing (ต่อ NFR แต่ละตัว)

| รหัส NFR | ด้าน | ประเภทการทดสอบ |
|----------|------|------------------|
| NFR-01 | Authorization ในการมอบหมายงาน | Security Testing (Authorization/Access Control) — ทดสอบว่าระบบปฏิเสธการมอบหมายงานข้ามทีม/โครงการทุกช่องทางที่เรียกใช้งาน ไม่ใช่แค่ระดับ UI |
| NFR-02 | Authorization ในการอนุมัติ/ปฏิเสธงาน | Security Testing (Authorization/Access Control) — ทดสอบว่าระบบปฏิเสธคำขออนุมัติ/ปฏิเสธจากผู้ใช้ที่ไม่มีสิทธิ์ Supervisor ในทีม/โครงการเดียวกันทุกช่องทาง |

หมายเหตุ: ปัจจุบัน [[backlog]] ยังไม่มี NFR ด้าน Performance/Reliability/Usability อื่นใดนอกจาก
NFR-01/NFR-02 (ทั้งคู่เป็นด้าน Authorization) จึงยังไม่มีประเภท Performance Testing/Load Testing
ในขอบเขตของ test plan ฉบับนี้ — หากมี NFR ใหม่เพิ่มเข้ามาในอนาคต ให้ปรับตารางนี้ตาม

## Environment

รอกำหนดรายละเอียด environment การทดสอบจริง (เช่น URL, ข้อมูลทดสอบเริ่มต้น, วิธี seed
TeamProject/TeamProjectMembership สำหรับ setup precondition) เนื่องจากยังไม่มี
`docs/02-design/02-technical/detailed-design/` (รายละเอียดระดับ implementation ต่อฟีเจอร์)
แม้ [[technology-stack]] จะตัดสินใจแล้ว (Frontend: React/TypeScript/Vite ตาม `react-template-main`,
Backend: Go/Fiber ตาม `go-template-main`, Clean Architecture Controller → Service → Repository →
Database) แต่ยังไม่มีการเลือก database engine จริงจาก 4 ตัวเลือก (PostgreSQL/MSSQL/Oracle/
Tarantool ดู [[db-spec#ประเด็นรอตัดสินใจ]]) และยังไม่มีรายละเอียด detailed design ต่อฟีเจอร์ —
แนะนำให้รัน `sync-detailed-design` ก่อนเริ่มเขียน test data/environment setup ที่ผูกกับ
ระบบจริง (เช่น test database, mock service)

สิ่งที่ทราบแล้วและใช้อ้างอิงได้ในระหว่างนี้:
- Backend: Go + Fiber (Clean Architecture — Controller/Service/Repository layer)
- Frontend: React + TypeScript + Vite
- Authentication: JWT (Bearer token + HttpOnly cookie ที่ฝั่ง backend, Context API ที่ฝั่ง frontend)

## Entry Criteria

- [[feature-list]], [[user-journey]], [[acceptance-criteria]] ของฟีเจอร์ที่จะทดสอบ ต้องเป็นฉบับ
  ล่าสุดและไม่มีรหัส FR/NFR ตกหล่น
- มีข้อมูลทดสอบเริ่มต้นอย่างน้อย: ผู้ใช้ที่มีบทบาท Staff และ Supervisor ในทีม/โครงการเดียวกันอย่าง
  น้อย 1 ทีม, ผู้ใช้อีกอย่างน้อย 1 คนที่อยู่คนละทีม/โครงการ (สำหรับทดสอบ NFR-01/NFR-02)
- Environment ทดสอบพร้อมใช้งาน (รอ [[technology-stack]]/detailed design ตัดสินใจรายละเอียดที่เหลือ
  ตามหัวข้อ Environment ด้านบน)

## Exit Criteria

- Test case ทุกรายการใน `test-cases/{feature-slug}.md` ถูก execute แล้วอย่างน้อย 1 รอบ
- Test case ที่ผูกกับ FR/NFR ระดับ "สูง" (Must have) ทั้งหมดต้องผ่าน (Pass) ก่อนจึงจะถือว่าฟีเจอร์
  นั้นพร้อมปล่อย (release-ready)
- Test case ที่ผูกกับ FR ระดับ "กลาง" (Should have เช่น FR-07) ควรผ่านทั้งหมด แต่หากพบ defect ที่ไม่
  ใช่ blocker สามารถพิจารณาเลื่อนแก้ไขในรอบถัดไปได้ตามดุลยพินิจของทีม
- ไม่มี defect ระดับ Critical/Blocker ค้างอยู่ในฟีเจอร์ที่เป็น Must have

## บทบาทผู้ทดสอบ

- **Staff** — ทดสอบ flow การสร้างงาน, มอบหมายงาน (รวม self-assign), แก้ไขงานที่ถูกปฏิเสธ
- **Supervisor (Project-level)** — ทดสอบ flow การอนุมัติ/ปฏิเสธงาน และการตรวจสอบสิทธิ์
- ผู้ทดสอบต้องเตรียมบัญชีทดสอบอย่างน้อย 2 บทบาทข้างต้น พร้อมกรณีข้ามทีม/โครงการ (ไม่มีสิทธิ์) เพื่อ
  ทดสอบ NFR-01/NFR-02 ให้ครบ

## ตารางสรุปฟีเจอร์ ↔ ไฟล์ Test Case ↔ จำนวน AC ที่ครอบคลุม

| # | ฟีเจอร์ | ไฟล์ test case | รหัส FR/NFR | จำนวน AC ที่ครอบคลุม (จาก [[acceptance-criteria]]) |
|---|---------|-----------------|--------------|-------------------------------------------------------|
| 1 | สร้างงานใหม่และมอบหมายงานให้ทีม | [[test-cases/create-assign-task|create-assign-task.md]] | FR-01, FR-02, FR-03, NFR-01 | 7 (FR-01: 3, FR-02: 2, FR-03: 1, NFR-01: 1 — รวมกรณี happy/negative) |
| 2 | อนุมัติ/ปฏิเสธงานโดย Supervisor | [[test-cases/supervisor-task-approval|supervisor-task-approval.md]] | FR-04, FR-05, FR-06, NFR-02 | 8 (FR-04: 1, FR-05: 3, FR-06: 3, NFR-02: 1) |
| 3 | แก้ไขงานที่ถูกปฏิเสธและขออนุมัติใหม่ | [[test-cases/resubmit-rejected-task|resubmit-rejected-task.md]] | FR-07 | 4 |

## เอกสารที่เกี่ยวข้อง

- [[feature-list]]
- [[user-journey]]
- [[acceptance-criteria]]
- [[backlog]]
- [[architecture]]
- [[api-spec]]
- [[db-spec]]
- [[technology-stack]]
