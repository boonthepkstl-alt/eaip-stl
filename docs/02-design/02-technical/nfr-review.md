# NFR Review

เอกสารนี้ตรวจสอบว่า NFR ทุกตัวใน [[backlog]] มีการออกแบบมารองรับจริงหรือไม่ในเอกสารเชิงเทคนิค
([[architecture]], [[api-spec]], [[db-spec]], และไฟล์ใน `detailed-design/`) **เอกสารนี้เป็นผลการ
ตรวจสอบเท่านั้น ไม่ใช่เอกสารออกแบบ** — หากพบช่องว่าง ให้ไปแก้ที่เอกสารต้นทางที่เกี่ยวข้องผ่าน
skill ที่แนะนำ ไม่แก้ไขในเอกสารนี้

อัปเดตล่าสุด: 2026-08-15 (ตรวจสอบครั้งที่ 1 หลัง `detailed-design/` ถูกสร้างครบ 3 ไฟล์)

## ตารางสรุป

| รหัส NFR | คำอธิบายสั้น | สถานะ | เอกสาร/ส่วนที่พบ | สิ่งที่ยังขาด | แนะนำให้รันอะไรต่อ |
|----------|--------------|--------|-------------------|----------------|----------------------|
| NFR-01 | ความปลอดภัย/สิทธิ์การใช้งาน (Authorization) ในการมอบหมายงาน: อนุญาตเฉพาะสมาชิกในทีม/โครงการเดียวกัน หรือ self-assign | รองรับแล้ว (Addressed) | [[architecture#NFR Mapping]] (map ไว้ที่ Service layer พร้อมแนวทาง "ไม่เชื่อค่าที่ Client ส่งมาโดยตรง"); [[api-spec#1. สร้างงานใหม่และมอบหมายงาน]] (กฎ Validation ข้อ 2–3 + กรณี error); [[api-spec#6. แก้ไขงานที่ถูกปฏิเสธและขออนุมัติใหม่]] (ตรวจ scope ซ้ำเมื่อเปลี่ยนผู้รับมอบหมาย); [[db-spec#3. TeamProjectMembership (การสังกัดทีม/โครงการ + บทบาทระดับ Project-level)]] และ business rule ใต้ entity `Task`; [[create-assign-task]] (sequence diagram แตก branch self-assign/scope check + edge case table 5 รายการ รวมกรณีปลอมค่าทีม/โครงการจาก Client); [[resubmit-rejected-task]] (edge case ตรวจ scope ซ้ำตอนเปลี่ยนผู้รับมอบหมาย, TC-03-04) | — ไม่พบช่องว่าง | — |
| NFR-02 | ความปลอดภัย/สิทธิ์การใช้งาน (Authorization) ในการอนุมัติ/ปฏิเสธงาน: อนุญาตเฉพาะ Supervisor ระดับ Project-level ในทีม/โครงการเดียวกับงานนั้น | รองรับแล้ว (Addressed) | [[architecture#NFR Mapping]] (map ไว้ที่ Service layer); [[api-spec#2. ดึงรายละเอียดงาน]], [[api-spec#3. ดึงรายการงานที่รออนุมัติสำหรับ Supervisor]], [[api-spec#4. อนุมัติงาน]], [[api-spec#5. ปฏิเสธงานพร้อมเหตุผล]] (กฎ Validation + กรณี error ระบุ scope check ทุก operation); [[db-spec#3. TeamProjectMembership (การสังกัดทีม/โครงการ + บทบาทระดับ Project-level)]] และ business rule ใต้ entity `Task`; [[supervisor-task-approval]] (sequence diagram ตรวจสิทธิ์ก่อนแสดงรายละเอียดและก่อนอนุมัติ/ปฏิเสธซ้ำทุกครั้ง + edge case table 6 รายการ รวมกรณี Supervisor ข้ามทีม/โครงการและผู้เรียกไม่มีสิทธิ์เข้าถึงรายละเอียด) | — ไม่พบช่องว่าง | — |

## รายละเอียดการตรวจสอบ

### NFR-01

- **architecture.md**: ระบุ component รับผิดชอบชัดเจน (Service layer) พร้อมแนวทางเชิงหลักการที่
  ตรงเจตนาของ NFR ("ทุกคำขอมอบหมายงานต้องตรวจสอบว่าผู้รับมอบหมายสังกัดทีม/โครงการเดียวกับผู้สร้างงาน
  ก่อนบันทึกเสมอ ไม่เชื่อค่าที่ Client ส่งมาโดยตรง")
- **api-spec.md**: operation "สร้างงานใหม่และมอบหมายงาน" และ "แก้ไขงานที่ถูกปฏิเสธและขออนุมัติใหม่"
  ทั้งคู่ระบุกฎ validation และกรณี error ที่ครอบคลุม NFR-01 ตรงไปตรงมา รวมถึงระบุว่าทีม/โครงการของ
  Task "ไม่รับจาก input ของผู้เรียกโดยตรง" ซึ่งตรงกับหลักการ anti-tampering ของ NFR นี้
- **db-spec.md**: entity `TeamProjectMembership` ออกแบบมาเพื่อรองรับการตรวจสอบ scope นี้โดยเฉพาะ
  (ระบุไว้ในหมายเหตุ attribute ตรงๆ ว่า "ใช้ตรวจสอบ NFR-01")
- **detailed-design**: `create-assign-task.md` มี edge case ครบทั้ง "มอบหมายข้ามทีม/โครงการ" และ
  "ผู้ใช้พยายามส่งค่าทีม/โครงการมาเองจาก Client" พร้อมอ้างอิง test case; `resubmit-rejected-task.md`
  ครอบคลุมกรณีเปลี่ยนผู้รับมอบหมายระหว่างแก้ไขงานที่ถูกปฏิเสธด้วยกฎเดียวกัน
- **สรุป**: ครบทุกชั้นเอกสาร ไม่มีช่องว่าง

### NFR-02

- **architecture.md**: ระบุ component รับผิดชอบชัดเจน (Service layer) พร้อมแนวทางเชิงหลักการ
  ("ตรวจสอบ role (Supervisor) และ scope (ทีม/โครงการเดียวกับงาน) ก่อนอนุญาตให้เปลี่ยนสถานะงานทุกครั้ง")
- **api-spec.md**: ครอบคลุมทั้ง 4 operation ที่เกี่ยวข้อง (ดึงรายละเอียดงาน, ดึงรายการงานที่รออนุมัติ,
  อนุมัติงาน, ปฏิเสธงานพร้อมเหตุผล) แต่ละ operation ระบุกฎ scope check และกรณี error แยกไว้ชัดเจน
- **db-spec.md**: ใช้ entity `TeamProjectMembership` เดียวกันกับ NFR-01 ระบุไว้ตรงๆ ว่า "ใช้
  ตรวจสอบ ... NFR-02 (สิทธิ์ระดับ Supervisor)"
- **detailed-design**: `supervisor-task-approval.md` มี sequence diagram ที่ตรวจสอบสิทธิ์ทั้งตอน
  ดึงรายละเอียดงานและตอนอนุมัติ/ปฏิเสธ (ตรวจซ้ำทุกครั้งไม่พึ่งการตรวจครั้งแรก) พร้อม edge case
  ครบ 6 รายการ รวมกรณี Supervisor ข้ามทีม/โครงการและผู้เรียกไม่มีสิทธิ์เข้าถึงรายละเอียดงานเลย
- **สรุป**: ครบทุกชั้นเอกสาร ไม่มีช่องว่าง

## สรุปผล

- จำนวน NFR ทั้งหมดที่ตรวจสอบ: 2 (NFR-01, NFR-02)
- รองรับแล้ว (Addressed): 2
- รองรับบางส่วน (Partial): 0
- ยังไม่รองรับ (Missing): 0
- ไม่มี NFR ใดที่ต้องแนะนำให้รัน `sync-architecture`, `sync-api-db`, หรือ `sync-detailed-design`
  เพิ่มเติมในรอบนี้

## เอกสารที่เกี่ยวข้อง

- [[backlog]]
- [[architecture]]
- [[api-spec]]
- [[db-spec]]
- [[create-assign-task]]
- [[supervisor-task-approval]]
- [[resubmit-rejected-task]]
