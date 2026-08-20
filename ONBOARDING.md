# ONBOARDING — starter-kit-v1

**starter-kit-v1 เป็น template สำหรับจัดเตรียมโครงสร้างพื้นฐานของโปรเจกต์ใหม่** ไม่ใช่ตัวโปรเจกต์
จริง เนื้อหาใน `docs/` ที่มีอยู่ตอนนี้ (ระบบจัดการงาน "tasks-mng") เป็น**ตัวอย่างที่ใช้พิสูจน์ว่า
pipeline ทั้งสายทำงานถูกต้องจริง** ตั้งแต่ requirement ยัน prototype ไม่ใช่เนื้อหาที่ต้องเก็บไว้ถ้า
คุณจะเริ่มโปรเจกต์ใหม่จาก kit นี้

เอกสารนี้อธิบายว่า kit นี้มีอะไรให้บ้าง และต้องทำอะไรบ้างเพื่อเริ่มโปรเจกต์ใหม่จริงจาก kit นี้

## สิ่งที่ kit นี้เตรียมไว้ให้

| ส่วนประกอบ | ตำแหน่ง | หน้าที่ |
|---|---|---|
| กติกาการทำงาน | `CLAUDE.md` | บอก Claude Code ว่าโปรเจกต์นี้มีโครงสร้างเอกสารแบบไหน กติกาไหนที่ต้องยึด |
| Custom agents | `.claude/agents/` (15 ตัว) | ผู้เชี่ยวชาญเฉพาะด้านต่อขั้นตอน SDLC ตั้งแต่ requirement ถึง dev/test จริง |
| Custom skills | `.claude/skills/` (14 ตัว) | คำสั่งลัด (`/capture-requirement`, `/sync-*`, `/audit-*` ฯลฯ) ที่ห่อ agent ไว้ให้เรียกใช้ปลอดภัยและสม่ำเสมอ |
| Reference code templates | `react-template-main/`, `go-template-main/` | มาตรฐานเทคโนโลยีบังคับจาก CIO — โครงสร้างโค้ดจริงให้ scaffold โปรเจกต์ใหม่จากตรงนี้ |
| Design system เริ่มต้น | `docs/02-design/DESIGN.md` | สี/ฟอนต์/component ดึงมาจาก token จริงใน `react-template-main` |
| ตัวอย่างเนื้อหาที่ใช้ทดสอบ pipeline | `docs/` ทั้งหมด (ยกเว้น `DESIGN.md`) | เนื้อหาตัวอย่าง (tasks-mng) — **ลบ/แทนที่ได้เมื่อเริ่มโปรเจกต์จริง** |

## แนวคิดของ pipeline (SDLC)

```
Requirement & Plan → Analysis & Design → Development → Testing → Deployment
```

แต่ละขั้นมี skill/agent รองรับ เรียงตามลำดับที่ควรใช้:

1. `/capture-requirement` — แปลง requirement ดิบเป็นเอกสาร spec + อัปเดต backlog
2. `/audit-backlog` — ตรวจสอบว่า backlog ตรงกับ spec ทุกฉบับ
3. `/sync-feature-journey` — backlog → feature-list.md (MoSCoW) + user-journey.md
4. แตกแขนงขนานกัน 3 สาย จาก feature-list/user-journey:
   - `/sync-technical-spec` (หรือแยกเป็น `/sync-architecture` → `/sync-api-db` → `/sync-detailed-design` → nfr-review)
   - `/sync-test-plan` — acceptance-criteria + test-plan + test-cases
   - `/build-prototype` — Clickable HTML prototype (**ต้องมี `DESIGN.md` ก่อนเสมอ**)
5. `/sync-phase-plan` — backlog/feature-list → release-plan.md + task breakdown ต่อ phase
6. `/run-requirements-phase`, `/run-technical-phase`, `/run-prototype-phase` — รวมหลายขั้นตอนไว้ในคำสั่งเดียว
7. `/audit-pipeline` — ตรวจสอบความสอดคล้องทั้งสายในคำสั่งเดียว

จากนั้นเมื่อเริ่มพัฒนาจริง (Development + Testing):

8. `dev-analyst` → `dev-designer` → `dev-coder` → `test-runner` (เรียกผ่าน Agent tool โดยตรง
   ยังไม่มี slash command ห่อไว้) — ดูรายละเอียดในหัวข้อ "เริ่มพัฒนาจริง" ด้านล่าง

## วิธีเริ่มโปรเจกต์ใหม่จาก kit นี้

1. **ตัดสินใจก่อนว่าจะเก็บตัวอย่าง tasks-mng ไว้ดูเป็น reference หรือลบทิ้ง** — ถ้าต้องการเริ่มสะอาด
   ให้ลบเนื้อหาใน `docs/01-requirements/`, `docs/02-design/` (ยกเว้น `DESIGN.md` ถ้าจะใช้สี/ฟอนต์
   เดิมต่อ), `docs/03-testing/`, `docs/05-log/` ทิ้ง แต่**เก็บโครงสร้างโฟลเดอร์ไว้ตามเดิม**
   (`CLAUDE.md` อ้างอิงโครงสร้างนี้ตรงๆ)
2. **ตรวจสอบว่า `docs/02-design/DESIGN.md` มีเนื้อหาที่ต้องการ** — ถ้าจะใช้สี/ฟอนต์ตาม
   `react-template-main` ต่อ ก็เก็บของเดิมไว้ได้เลย ถ้าต้องการเปลี่ยน Design System ให้แก้ไฟล์นี้
   ก่อนเรียก `/build-prototype`
3. **เริ่มด้วย `/capture-requirement`** ป้อน requirement ดิบของโปรเจกต์ใหม่ทีละเรื่อง แล้วให้
   pipeline พาไปทีละขั้นตามลำดับด้านบน
4. **เมื่อ design พร้อมและจะเริ่มเขียนโค้ดจริง** — copy โครงสร้างจาก `react-template-main/` และ
   `go-template-main/` ไปเริ่มโปรเจกต์จริง (ดู `SETUP.md`/`README.md` ของแต่ละ template สำหรับ
   ขั้นตอน bootstrap เช่น `go mod edit -module`, เปลี่ยนชื่อใน `package.json`) **ห้ามแก้ไขไฟล์ใน
   สองโฟลเดอร์นี้โดยตรง** เพราะเป็นต้นแบบอ้างอิงที่ agent อื่นจะกลับมาเทียบรูปแบบเสมอ

## เริ่มพัฒนาจริง (Development phase)

ต้องมีโปรเจกต์จริงที่ scaffold จาก template แล้ว (ข้อ 4 ด้านบน) ก่อนจึงจะเริ่มได้:

1. `dev-analyst` — วิเคราะห์ฟีเจอร์จาก detailed-design/api-spec/db-spec/technology-stack เป็น
   task พัฒนาที่จับต้องได้ (เสนอสร้าง Issue ใน GitHub/JIRA ผ่าน MCP ถ้าต้องการ)
2. `dev-designer` — แปลง db-spec เชิง logical เป็น schema จริงตาม database engine ที่เลือก +
   map operation เข้ากับไฟล์จริงของ template
3. `dev-coder` — เขียนโค้ดจริงตาม pattern ของ template เป๊ะๆ พร้อม test
4. `test-runner` — รัน test จริง เทียบผลกับ acceptance-criteria/test-cases บันทึกผลลง
   `docs/03-testing/02-test-result/`

**สิ่งที่ยังไม่ผ่านการทดสอบจริงใน kit นี้:** 4 agent ข้างต้นถูกออกแบบไว้แล้วแต่ยังไม่เคยถูกเรียกใช้
จริงกับโปรเจกต์ที่ scaffold จริง (เพราะตัวอย่าง tasks-mng ยังไม่ได้ scaffold โปรเจกต์จริง) ควร
ทดลองกับฟีเจอร์เล็กๆ ก่อนเพื่อยืนยันว่า pipeline ส่วนนี้ทำงานถูกต้องเช่นกัน

## กติกาที่ต้องรู้ก่อนเริ่ม

- ทุกไฟล์ Markdown ใน `docs/` เป็น Obsidian vault ใช้ `[[wikilink]]` เชื่อมโยงข้ามเอกสารเสมอ
- ทุก FR/NFR ต้องมีรหัสกำกับ (`FR-xx`/`NFR-xx`) และระดับความสำคัญ (สูง/กลาง/ต่ำ) — "สูง" = ต้องมีใน
  MVP ดูสรุปที่ `docs/01-requirements/backlog.md`
- **Tech stack ตัดสินใจแล้วเป็นมาตรฐานบังคับจาก CIO**: React (`react-template-main`) + Go/Fiber
  Clean Architecture (`go-template-main`) — อนุญาตอัปเกรด version ได้ แต่ห้ามเปลี่ยน framework
  โดยไม่ได้รับอนุมัติจาก CIO (ดูรายละเอียดที่ `docs/02-design/02-technical/technology-stack.md`)
- เมื่อผู้ใช้ขอทำงานที่ตรงกับหน้าที่ของ skill ใดอยู่แล้ว **ให้เรียก skill/agent นั้นเสมอ อย่าแก้ไฟล์
  เอกสารตรงๆ เอง** เพื่อให้การตรวจสอบ cross-file consistency และการบันทึก log เป็นไปตามรูปแบบเดิม
- ดูรายละเอียดกติกาทั้งหมดที่ `CLAUDE.md`

## จุดที่ยังไม่พร้อม (ต้องทำก่อนถือว่า kit นี้สมบูรณ์)

- [ ] ยังไม่เคยทดสอบ `dev-analyst`/`dev-designer`/`dev-coder`/`test-runner` กับโปรเจกต์จริง
- [ ] ยังไม่มี slash command ห่อ Development phase (ต้องเรียกผ่าน Agent tool ตรงๆ)
