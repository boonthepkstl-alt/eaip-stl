# CLAUDE.md

ไฟล์นี้ให้คำแนะนำแก่ Claude Code (claude.ai/code) เมื่อทำงานกับโค้ดในโปรเจกต์นี้

## สถานะของโปรเจกต์

โปรเจกต์นี้เป็น **starter-kit เอกสาร** (`starter-kit-v1` — ดู [ONBOARDING.md](ONBOARDING.md)) ที่ใช้พิสูจน์ว่า pipeline เอกสารทั้งสาย (requirement → design → test plan → prototype) ทำงานถูกต้อง เนื้อหาตัวอย่างในโฟลเดอร์ `docs/` (ระบบจัดการงาน "tasks-mng") **ยังไม่ได้ scaffold เป็นโปรเจกต์ซอร์สโค้ดจริงตาม pipeline นี้** — ยังไม่มี dev-coder/test-runner รันกับ tasks-mng จริง งานส่วนใหญ่ที่มีอยู่ตอนนี้อยู่ภายใต้โฟลเดอร์ `docs/` ความคืบหน้าของแต่ละขั้นตอน (requirements/design/testing) ไม่เท่ากัน — บางไฟล์มีเนื้อหาแล้ว บางไฟล์/โฟลเดอร์ยังว่างรอเนื้อหาอยู่ ให้ตรวจสถานะจริงของแต่ละไฟล์ก่อนอ้างอิงหรือแก้ไข อย่าเชื่อคำอธิบายสถานะที่เขียนไว้ในเอกสารฉบับเก่า

**หมายเหตุ:** ที่ root ของ repo มีแอป React+Express จริงอีกชุดหนึ่ง (`src/`, `server.ts`, `package.json` ชื่อ `react-example`, `metadata.json` ระบุชื่อ "ESAPS — Enterprise Smart Asset & Procurement System") ซึ่ง**ไม่เกี่ยวข้องกับ pipeline เอกสารข้างต้นและไม่ได้ scaffold จาก `react-template-main`/`go-template-main`** — ดูรายละเอียดที่หัวข้อ "แอป ESAPS ที่ root (แยกจาก starter-kit pipeline)" ด้านล่าง ตรวจสอบกับผู้ใช้ก่อนเสมอว่าจะให้ปฏิบัติกับแอปนี้อย่างไร (ทดลอง/ของจริง/จะย้าย) ก่อนแก้ไขไฟล์ในนั้น

**Tech stack ตัดสินใจแล้ว** (มาตรฐานบังคับจาก CIO — ดู `docs/02-design/02-technical/technology-stack.md`): ทุกระบบต้องพัฒนาโดยอ้างอิง 2 template ที่วางไว้ในโฟลเดอร์ `template/` ของ repo นี้ — `template/react-template-main/` (Frontend) และ `template/go-template-main/` (Backend) — เป็นหลักเสมอ อนุญาตให้ปรับ version ของ dependency ให้ใหม่กว่าที่ template ระบุได้ แต่ห้ามเปลี่ยนหมวดหมู่เทคโนโลยี (framework) โดยไม่ได้รับอนุมัติจาก CIO **template ทั้งสองนี้เป็นโค้ดอ้างอิง ไม่ใช่ซอร์สโค้ดของระบบจริง** ห้ามแก้ไขไฟล์ในสองโฟลเดอร์นี้โดยตรง — เมื่อเริ่มพัฒนาจริง ให้ copy โครงสร้างไปเริ่มโปรเจกต์ใหม่ตามที่ README ของแต่ละ template ระบุ (**หมายเหตุตำแหน่งไฟล์**: เดิม template ทั้งสองอยู่ที่ root ตรงๆ แต่ ณ 2026-08-19 ถูกย้ายเข้าไปอยู่ใต้ `template/` แล้ว — ตรวจสอบตำแหน่งจริงก่อนอ้างอิงเสมอถ้าพบว่าไม่ตรงกับที่นี่อีก)

## ภาพรวมระบบที่กำลังวางแผน

เอกสารข้อกำหนด (ไฟล์ Markdown ใน `docs/01-requirements/01-spec/` — อาจมีมากกว่า 1 ไฟล์ตามความต้องการที่ทยอยเพิ่มเข้ามา ให้ดูรายการไฟล์จริงในโฟลเดอร์นี้แทนการอ้างชื่อไฟล์เจาะจง) คือแหล่งอ้างอิงเดียวที่บอกว่าระบบที่กำลังวางแผนคือระบบอะไร มีขอบเขตแค่ไหน และมีบทบาทผู้ใช้แบบใด **ห้ามสมมติโดเมนหรือฟีเจอร์ของระบบจากความจำหรือจากตัวอย่างโปรเจกต์อื่น** ให้เปิดอ่านไฟล์ spec จริงก่อนตอบคำถามเกี่ยวกับภาพรวมระบบเสมอ (โดเมนของระบบกำหนดโดยผู้ใช้และเปลี่ยนได้ในแต่ละช่วงของโปรเจกต์ ส่วนนี้ของ CLAUDE.md จึงตั้งใจไม่ระบุเจาะจงไว้ เพื่อไม่ให้ล้าสมัยเมื่อโดเมนเปลี่ยน)

กติกาที่คงที่ไม่ว่าโดเมนของระบบจะเป็นอะไร (มาจากรูปแบบของเอกสารทั้งวอลต์ ไม่ใช่จากตัวระบบที่วางแผนอยู่):
- ทุกความต้องการเชิงฟังก์ชัน/ไม่ใช่เชิงฟังก์ชันมีรหัสกำกับ (`FR-xx` / `NFR-xx`) และระดับความสำคัญ (สูง/กลาง/ต่ำ โดย "สูง" คือสิ่งที่ต้องมีใน MVP) — ดูสรุปล่าสุดที่ `docs/01-requirements/backlog.md`
- เอกสารทุกชั้นอ้างอิงกันด้วย `[[wikilink]]` แบบ Obsidian และควรอ้างอิงกลับไปยัง spec ต้นทางเสมอ
- ให้ตรวจสถานะจริงของ spec ก่อนอ้างอิงหรือแก้ไข อย่าเชื่อคำอธิบายภาพรวมระบบที่เคยเขียนไว้ในเอกสารฉบับเก่า (รวมถึงหัวข้อนี้เอง หากมีใครเติมรายละเอียดเจาะจงไว้ในอนาคตแล้วโดเมนถูกเปลี่ยนภายหลัง)

## โครงสร้างพื้นที่เอกสาร (`docs/`)

โปรเจกต์นี้ใช้รูปแบบโฟลเดอร์แบ่งตามขั้นตอน SDLC โดยมีลำดับเลขนำหน้า เมื่อสร้างเอกสารใหม่ ให้ใส่ในโฟลเดอร์ขั้นตอนที่ตรงกัน อย่าสร้างตำแหน่งใหม่เอง:

```
docs/
  00-archived/                    เอกสารที่เลิกใช้/ถูกแทนที่แล้ว
  01-requirements/
    01-spec/                      เอกสารความต้องการทุกฉบับ (1 ไฟล์ต่อ 1 requirement/หัวข้อ ตั้งชื่อแบบ `YYYYMMDD-NN-<slug>.md`) — ดูรายการไฟล์จริงในโฟลเดอร์นี้เสมอ อาจมีมากกว่า 1 ไฟล์
    02-plan/
      release-plan.md              แผนแบ่ง phase/release ก่อนเริ่ม dev จริง (จัดกลุ่ม FR/NFR ตามลำดับที่ควรทำก่อน-หลัง พร้อมเหตุผล)
    03-task/
      {phase-slug}-tasks.md         การแตกงานย่อยระดับ implementation ต่อ phase (อ้างอิง release-plan.md) เขียนแบบไม่ผูก tech stack จนกว่าจะมีการตัดสินใจจริง
    backlog.md                    Backlog รวม FR/NFR ทั้งหมดจากทุกไฟล์ใน 01-spec/ (ตรวจสถานะ/เนื้อหาจริงในไฟล์ก่อนอ้างอิง)
  02-design/
    01-prototypes/<date>-<n>-<version>/   โฟลเดอร์ Prototype แบบมีวันที่และเวอร์ชัน (HTML mockup, prototype.md)
    02-technical/
      architecture.md              สถาปัตยกรรมระดับ logical/conceptual (component, data flow) — ไม่ผูก tech stack จนกว่า technology-stack.md จะถูกตัดสินใจ
      api-spec.md                  สัญญา API เชิง logical (resource/operation/request-response) ไม่ผูก framework
      db-spec.md                   โมเดลข้อมูลเชิง logical (entity/attribute/ความสัมพันธ์) ไม่ผูก database engine
      detailed-design/{feature-slug}.md   การออกแบบระดับ component ต่อฟีเจอร์ อ้างอิง api-spec.md/db-spec.md
      nfr-review.md                ตรวจสอบว่าการออกแบบ (architecture/api-spec/db-spec/detailed-design) รองรับทุก NFR ใน backlog หรือไม่
      technology-stack.md          ตัดสินใจแล้ว — React (`react-template-main`) + Go/Fiber Clean Architecture (`go-template-main`) มาตรฐานบังคับจาก CIO
    feature-list.md
    user-journey.md
    DESIGN.md                     Design System หลัก (สี, ตัวอักษร, ระยะห่าง, องค์ประกอบ UI) — อ้างอิงก่อนทำ Prototype ใน 01-prototypes/
  03-testing/
    01-test-plan/
      acceptance-criteria.md      เกณฑ์ยอมรับ (Given-When-Then) ต่อ FR/NFR จัดกลุ่มตาม feature-list
      test-plan.md                 ภาพรวมกลยุทธ์ทดสอบ 1 ไฟล์ต่อโปรเจกต์ (scope, ประเภทการทดสอบ, environment, entry/exit criteria)
      test-cases/{feature-slug}.md Test case แบบ step-by-step ต่อฟีเจอร์ อ้างอิง acceptance-criteria.md
    02-test-result/                ผลการรันทดสอบจริง (`{YYYYMMDD}-{feature-slug}.md`) — ดูแลโดย agent `test-runner` (ต้องมีโปรเจกต์ซอร์สโค้ดจริงจาก `dev-coder` ก่อนจึงจะมีเนื้อหา)
  04-retrospectives/
  05-log/
  .obsidian/                      Vault นี้เปิด/แก้ไขด้วย Obsidian — Markdown + wikilink คือรูปแบบหลักของพื้นที่นี้เช่นกัน
```

ไฟล์ในโฟลเดอร์ที่มีวันที่ (เช่น prototypes) ใช้รูปแบบชื่อ `YYYYMMDD-NN-<slug>` ให้คงรูปแบบนี้ต่อไปเมื่อสร้างไฟล์ใหม่ที่มีวันที่กำกับ เพื่อให้เรียงตามลำดับเวลาได้ถูกต้อง

เนื่องจาก `docs/` เป็น Obsidian vault เมื่อเพิ่มเนื้อหาใหม่ ควรใช้การอ้างอิงข้ามเอกสารแบบ `[[wikilink]]` สอดคล้องกับวิธีที่โมดูลเอกสารโครงการ (FR-48–FR-58) ถูกออกแบบไว้ในตัวระบบจริง

## เครื่องมืออัตโนมัติดูแลความสอดคล้องของเอกสาร (agents & skills)

โปรเจกต์นี้มี custom agents ใน `.claude/agents/` และ skills ใน `.claude/skills/` สำหรับสร้าง/ตรวจสอบความสอดคล้องของเอกสารแต่ละชั้นให้ตรงกับชั้นก่อนหน้าเสมอ ตามลำดับ: spec → `backlog.md` → `feature-list.md`/`user-journey.md` → แตกแขนงขนานกัน 3 สาย (technical spec ใน `02-technical/`, test plan ใน `03-testing/`, prototype ใน `01-prototypes/`) → phase plan ใน `01-requirements/02-plan/`+`03-task/` เมื่อผู้ใช้ขอให้ทำงานที่ตรงกับหน้าที่ของ skill ใดอยู่แล้ว **ให้เรียกใช้ skill/agent นั้นแทนการแก้ไฟล์เอกสารตรงๆ เอง** เพื่อให้การตรวจสอบ cross-file consistency และการบันทึกสรุปงานลง `docs/05-log/{YYYYMMDD}-log.md` เป็นไปตามรูปแบบเดิมของโปรเจกต์

จุดเริ่มต้นที่ใช้บ่อย:
- `/capture-requirement` — แปลง requirement ดิบจากผู้ใช้เป็นเอกสาร spec ใหม่/แก้ไขของเดิม พร้อมอัปเดต backlog
- `/audit-backlog`, `/sync-feature-journey`, `/sync-technical-spec` (รวม architecture → api-spec/db-spec → detailed-design → nfr-review), `/sync-test-plan`, `/sync-phase-plan`, `/build-prototype` — ตรวจสอบและ sync เอกสารแต่ละชั้นให้ตรงกับชั้นก่อนหน้า
- `/run-requirements-phase`, `/run-technical-phase`, `/run-prototype-phase` — รวมหลายขั้นตอนที่เกี่ยวข้องกันไว้ในคำสั่งเดียว
- `/audit-pipeline` — ตรวจสอบความสอดคล้องทั้งสายงานตั้งแต่ spec ถึงปลายทางในคำสั่งเดียว

## เครื่องมืออัตโนมัติสำหรับ Development phase (เมื่อเริ่มพัฒนาจริง)

นอกจาก agent/skill ที่ดูแลความสอดคล้องของเอกสารข้างต้น โปรเจกต์นี้ยังมี agent อีกชุดหนึ่งใน
`.claude/agents/` สำหรับช่วง **Development + Testing phase จริง** (ทำงานกับโค้ด/ระบบจริง ไม่ใช่
แค่เอกสาร) แบ่งเป็น 4 sub agent ที่ทำงานต่อกันเป็นสาย ตามบทบาท: `dev-analyst` (วิเคราะห์งานพัฒนา
ก่อนเริ่มเขียนโค้ด จาก detailed-design/api-spec/db-spec/technology-stack และเสนอสร้าง Issue ใน
GitHub/JIRA ผ่าน MCP) → `dev-designer` (แปลง db-spec เชิง logical เป็น schema จริงตาม database
engine ที่เลือก และ map operation เข้ากับโครงสร้างไฟล์จริงของ template) → `dev-coder` (เขียน
โค้ดจริงตาม pattern ของ `react-template-main`/`go-template-main` เป๊ะๆ พร้อม test) → `test-runner`
(รัน test จริงกับโค้ดจริง เทียบผลกับ `acceptance-criteria.md`/`test-cases/` ที่ `test-writer`
เขียนไว้ บันทึกผลจริงลง `03-testing/02-test-result/` พร้อมเสนอสร้าง Bug ticket เมื่อพบ test ไม่ผ่าน)

หมายเหตุ: **ช่วง Requirement & Plan และ Analysis & Design ไม่ต้องการ agent เพิ่มเติม** เพราะ
`requirement-writer`/`backlog-auditor`/`phase-planner` (Requirement & Plan) และ
`feature-journey-writer`/`architecture-writer`/`api-db-writer`/`detailed-design-writer`/
`nfr-reviewer`/`prototype-writer`/`prototype-auditor`/`test-writer` (Analysis & Design) ครอบคลุม
งานเชิงเอกสารของสองช่วงนี้ครบแล้วตาม diagram 2 — งานของสองช่วงนี้เป็นเอกสารล้วน ไม่ต้อง
โต้ตอบกับระบบภายนอก (โค้ดจริง/MCP) เหมือน Development/Testing จึงไม่มีช่องว่างแบบเดียวกับที่
`dev-*`/`test-runner` มาเติมให้ Development phase

Claude Code ในเซสชันหลัก (ผู้รับคำสั่งจากผู้ใช้และวางแผนงาน) ทำหน้าที่เป็น **Main Agent/
orchestrator** เอง — เรียก 4 sub agent นี้ต่อกันผ่าน Agent tool ตามลำดับข้างต้น ไม่ต้องมี agent
แยกต่างหากสำหรับบทบาทนี้ Context ที่ทุก agent (ทั้งสายเอกสารและสาย development/testing) ควรอ่าน
ก่อนเริ่มงานเสมอคือ `CLAUDE.md`, spec ที่เกี่ยวข้องใน `01-spec/`, `backlog.md`, `feature-list.md`,
`user-journey.md`, และ log ล่าสุดใน `05-log/`

ข้อควรระวังสำคัญของสาย development/testing นี้:
- `dev-coder`/`test-runner` ต้องตรวจสอบก่อนเสมอว่ามีโปรเจกต์ซอร์สโค้ดจริง (scaffold จาก template
  แล้ว) อยู่หรือไม่ ก่อนเขียนโค้ด/รัน test — ห้ามแก้ไขไฟล์ใน `template/go-template-main/`/
  `template/react-template-main/` เองเด็ดขาด เพราะเป็นโค้ดอ้างอิงเท่านั้น
- MCP tools ที่ระบุไว้ในบทบาทของแต่ละ agent (GitHub, JIRA, DB) อาจยังไม่ได้เชื่อมต่อ/ยืนยันตัวตน
  ในบางเซสชัน — agent ต้องใช้ `ToolSearch` ตรวจสอบก่อนใช้งานจริงเสมอ ห้ามแกล้งทำเป็นดำเนินการ
  สำเร็จถ้าเครื่องมือยังไม่พร้อม
- การสร้าง Issue/Ticket/Bug จริง, การ apply schema/migration ลงฐานข้อมูลจริง, และการ commit/push/
  สร้าง Pull Request ล้วนต้องขออนุญาตผู้ใช้ก่อนเสมอ (ตามกฎความปลอดภัยระดับ session)

## แอป ESAPS ที่ root (แยกจาก starter-kit pipeline)

นอกจากพื้นที่เอกสารใน `docs/` แล้ว ที่ root ของ repo ยังมีแอป React + Express ที่รันได้จริง (ดูเหมือนสร้างจาก Google AI Studio — มี `metadata.json` ระบุ `majorCapabilities: MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`) **นี่ไม่ใช่ผลลัพธ์ของ dev-coder และไม่ได้ scaffold จาก `react-template-main`/`go-template-main`** จึงไม่ตรงตามมาตรฐาน tech stack ที่ CIO กำหนดไว้ใน `docs/02-design/02-technical/technology-stack.md` — ให้ถือเป็นพื้นที่แยกต่างหาก ไม่ผสมกับงานเอกสารของ pipeline หลัก

โครงสร้างคร่าวๆ:
- `server.ts` — Express server ห่อ Vite dev middleware (dev) และเรียก Gemini API ผ่าน `@google/genai` (`GEMINI_API_KEY` จาก `.env`, ดู `.env.example`) มี fallback logic เชิงตัวเลข (เช่น `generateFallbackDecision`) ใช้เมื่อไม่มี API key หรือเรียก AI ไม่สำเร็จ
- `src/App.tsx` + `src/routes/` — routing แบบ state-based ในตัว (ไม่ใช้ react-router) จัดการหน้าปัจจุบันด้วย `useState<Page>` และฟังก์ชัน `navigate`
- `src/pages/` — หน้าจอของระบบจัดการสินทรัพย์/ครุภัณฑ์ (Dashboard, AssetList/Detail, Maintenance, SoftwareLicense, AIDecisionCenter, Reconciliation, UserManagement ฯลฯ) บางหน้ายังเป็น placeholder (Procurement, Audit, Documents, Approvals, Analytics)
- `src/data/` — mock data ที่หน้าจอต่างๆ ใช้แสดงผล (ยังไม่ต่อ backend/database จริง)

คำสั่งที่ใช้กับแอปนี้ (รันจาก root ของ repo ไม่ใช่จากใน `react-template-main/`):
```bash
npm install        # ติดตั้ง dependency ครั้งแรก
npm run dev         # tsx server.ts — dev server (Vite + Express + Gemini proxy)
npm run build       # vite build + bundle server.ts เป็น dist/server.cjs
npm run start        # รันเวอร์ชัน build แล้ว (dist/server.cjs)
npm run lint         # tsc --noEmit (type-check เท่านั้น ไม่มี ESLint config ที่ root)
```
ยังไม่มี test runner ผูกไว้ใน `package.json` ของแอปนี้

**เอกสารวิเคราะห์และแผนยกระดับแอปนี้ไปสู่ production (RAISE):** ดูชุดเอกสารที่ `docs/02-design/02-technical/esaps-transformation/` (เริ่มจาก `INDEX.md`) — เทียบสถาปัตยกรรม ESAPS ปัจจุบันกับ `template/react-template-main`/`template/go-template-main` ทีละด้าน พร้อม target architecture, domain model, API spec, AI architecture, auth/RBAC, security, test strategy, migration plan แบบ 12 phase, และ ADR 4 ฉบับ **เอกสารชุดนี้เป็นแผนสำหรับอ้างอิงเท่านั้น ยังไม่มีการแก้ไข source code จริง** — ตรวจสอบเอกสารนี้ก่อนเสมอเมื่อผู้ใช้ขอให้ทำงานต่อยอดแอป ESAPS เพื่อไม่ให้แผนที่มีอยู่แล้วขัดแย้งกับงานใหม่

## แนวทางการทำงานในโปรเจกต์นี้ตอนนี้

- ให้ยึดเอกสารทั้งหมดใน `docs/01-requirements/01-spec/` (ไม่ใช่ไฟล์ใดไฟล์หนึ่งโดยเฉพาะ) เป็นแหล่งอ้างอิงหลักของความต้องการเชิงฟังก์ชัน/ไม่ใช่เชิงฟังก์ชัน (รหัส FR-xx / NFR-xx) — ใช้รหัสเหล่านี้อ้างอิงเมื่อพูดคุยหรือวางแผนฟีเจอร์ และให้ตรวจ `docs/01-requirements/backlog.md` เพื่อดูสรุป FR/NFR ล่าสุดทั้งหมดก่อนเสมอ
- เอกสารออกแบบเชิงเทคนิคใน `docs/02-design/02-technical/` (`architecture.md`, `api-spec.md`, `db-spec.md`, `technology-stack.md` และไฟล์ใน `detailed-design/`) หากยังไม่มีไฟล์หรือยังว่างเปล่า หากถูกขอให้ช่วยออกแบบระบบ ให้สร้าง/เติมเนื้อหาลงในไฟล์เหล่านี้ตามตำแหน่งที่ระบุไว้ในโครงสร้างด้านบน ไม่ควรสร้างเอกสารคู่ขนานแยกที่อื่น
- `docs/02-design/DESIGN.md` คือแหล่งอ้างอิงหลัก (single source of truth) ของ Design System เชิงภาพ (สี, ตัวอักษร, ระยะห่าง, องค์ประกอบ UI, accessibility) — เมื่อสร้างหรือแก้ไข Prototype ใดๆ ใน `01-prototypes/` ให้ยึด token และกติกาใน `DESIGN.md` เสมอ ห้ามกำหนดสี/สไตล์ใหม่นอกเอกสารนี้โดยไม่จำเป็น หากพบว่า Design System ต้องเปลี่ยน ให้แก้ที่ `DESIGN.md` ก่อน แล้วค่อยสะท้อนไปยัง Prototype
- ฝั่ง pipeline เอกสาร (`docs/`) ยังไม่มี package manifest/CI config ของตัวเอง เพราะยังไม่ได้ scaffold โปรเจกต์จริงตาม `react-template-main`/`go-template-main` — เมื่อ `dev-coder` เริ่ม scaffold โปรเจกต์จริงจาก template แล้ว ควรกลับมาอัปเดตไฟล์นี้ให้มีคำสั่ง build/lint/test และสถาปัตยกรรมโค้ดจริงของโปรเจกต์นั้น (แยกจากคำสั่งของแอป ESAPS ที่ root ซึ่งเป็นคนละพื้นที่กัน)
