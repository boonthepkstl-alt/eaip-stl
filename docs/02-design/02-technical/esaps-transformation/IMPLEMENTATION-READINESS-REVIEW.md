# Implementation Readiness Review — RAISE

อ้างอิงจาก [[INDEX|INDEX.md]]. เอกสารนี้ตรวจสอบความพร้อมของ 4 แหล่งอ้างอิงก่อนเริ่ม migrate code จริง (ตามที่ผู้ใช้ขอ — "อย่าเพิ่งเริ่ม migrate code ทันที ให้ทำ Implementation Readiness Review ก่อน") **ยังไม่มีการแก้ไข source code ใดๆ ในเอกสารนี้**

```text
1. template/react-template-main   → Frontend migration boundary
2. template/go-template-main      → Backend + DB + API foundation
3. .claude/agents                 → Development workflow / AI-assisted engineering
4. esaps (root)                   → Business modules + existing UI + AI capability
```

## 1. `template/react-template-main` — Frontend migration boundary

**พร้อมแค่ไหน:** โครง layer ชัดเจน (pages/services/contexts/types/config) แต่เป็น **skeleton เปล่า** — ไม่มี UI component สำเร็จรูป ไม่มีหน้าจอธุรกิจจริง

**Migration boundary ที่ชัดเจน:**
- **รับจาก ESAPS ทั้งชุด**: `src/components/ui/*` (Alert, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Drawer, Dropdown, EmptyState, Input, Modal, Pagination, Progress, Select, Skeleton, Tabs, Textarea, Toast), `AppShell`, `AIAssistantDrawer`, `Charts`, `DataTable` — ไม่มีสิ่งเหล่านี้ใน template เลย จึงไม่มี conflict ต้อง merge
- **รับจาก template**: `AuthContext`, `ProtectedRoute` pattern, Axios interceptor + service layer convention (`src/services/{domain}.ts`), path alias `@/`
- **ต้องแปลงเอง**: routing — ESAPS ใช้ `useState<Page>` ใน `App.tsx` ล้วนๆ, template ใช้ React Router 6 เต็มรูปแบบ นี่คือจุดที่มี **ความเสี่ยง regression สูงสุด** ของ frontend migration เพราะกระทบทุกหน้าจอ (24 หน้า) พร้อมกัน — ควรทำเป็น branch แยกและทดสอบ navigation ทุกเส้นทางก่อน merge ไม่ใช่ค่อยๆแปลงทีละหน้า (เพราะ `App.tsx` ปัจจุบันควบคุม page state จากจุดเดียว เปลี่ยนครึ่งเดียวจะพังทั้งระบบ)
- version gap: template ใช้ React 18/Router 6/Zustand, ESAPS ใช้ React 19 ไม่มี router — CLAUDE.md อนุญาตให้ปรับ version ใหม่กว่าได้ ดังนั้นคง React 19 ไว้ได้ แค่เพิ่ม React Router 6 เข้าไป

**Readiness: กลาง** — ทิศทางชัดแล้ว แต่ยังไม่มีใครลองแปลงหน้าจอจริงแม้แต่ 1 หน้าเพื่อพิสูจน์ pattern

## 2. `template/go-template-main` — Backend + DB + API foundation

**พร้อมแค่ไหน:** นี่คือส่วนที่ตรวจสอบละเอียดที่สุดในรอบนี้ เพื่อตอบคำถามเรื่อง database decision โดยไม่ assume

### คุณภาพของ DB abstraction (`repository/dbManager.go`, `samplePGRepository.go`, `sampleRepository.go`)

- **Dual-pool ที่ทำงานจริง**: write ไป master (`GetPGWriteDb`), read กระจายไป replica แบบ round-robin พร้อม health-check ต่อรอบ (`pickLivePGRead`) และ fallback ไป master อัตโนมัติเมื่อ replica ทุกตัว unhealthy — ไม่ใช่แค่ config เปล่าๆ มี logic จัดการ failure จริง
- **Hot-reload config**: เปลี่ยน replica list ใน config file แล้ว pool reconnect เองโดยไม่ต้อง restart service (`reloadConfigIfChanged`) — ตรวจสอบแล้วว่า implement ครบทั้ง cache invalidation ตาม mtime และการ apply เฉพาะ key ที่อนุญาต (`hotConfigKeys`)
- **Facade pattern สะอาด**: `SampleRepository` (facade) ห่อ `SamplePGRepository`/`TTRepository`/`OracleRepository`/`MSSQLRepository` แยกกัน — primary CRUD เดินผ่าน PostgreSQL เท่านั้น ส่วนอื่นเป็น per-DB access เสริม ไม่ปนกัน
- **Read/write separation ระดับ repository**: `GetSomePGData`/`ListSomePGData` ใช้ read pool, `AddSomePGData`/`UpdateSomePGData`/`DeleteSomePGData` ใช้ write pool อย่างสม่ำเสมอ ไม่มีจุดที่ปนกันแบบผิดพลาด
- **Transaction wrapper** (`WithTransaction`) มี panic-safe rollback (recover แล้ว rollback แล้ว re-panic) — ไม่ silent-swallow panic
- **ข้อจำกัดที่ต้องรับรู้ก่อนตัดสินใจ**: ไม่มี ORM/query builder — ใช้ raw SQL string constant (`model.SQL_simple_pg_*`) + `Prepare`/`PrepareContext` + library `github.com/blockloop/scan` สำหรับ map row → struct เท่านั้น หมายความว่า **ทุก column ใหม่ต้องเขียน SQL string และปรับ struct tag เอง** ไม่มี auto-migration/code-gen ให้ — เหมาะกับทีมที่คุ้นเคย raw SQL อยู่แล้ว แต่เพิ่ม boilerplate เมื่อ domain entity มีจำนวนมาก (RAISE มีมากกว่า 20 entity ตาม [[DOMAIN-MODEL|DOMAIN-MODEL.md]])

### คุณภาพของ Auth (`service/authService.go`, `middleware/jwtAuth.go`)

- JWT middleware (`JWTAuth`, `RequireRole`) implement ครบ (Bearer/cookie, blacklist, role check) — **พร้อมใช้จริงในระดับ middleware**
- `authService.Login()` ปัจจุบันเป็น **hardcoded single-user demo เท่านั้น** (เทียบ username/password กับค่าใน env ตรงๆ ไม่มีการ query DB เลย) — ตรงกับที่ README เตือนไว้ ("Replace the demo auth service with a repository-backed user lookup") ต้องเขียน `UserRepository` ใหม่เองทั้งหมด ไม่มีตัวอย่างให้ในไฟล์ auth ปัจจุบัน (มีแต่ตัวอย่าง CRUD ของ `sample*`ที่ใช้เป็นแนวทางได้)

**สรุป DB abstraction**: **มีคุณภาพดีในระดับ connection/pooling/failover** (สมกับที่จะพึ่งพาได้) แต่ **ไม่มี ORM ช่วยลด boilerplate** — ต้องรับต้นทุนนี้ไว้ล่วงหน้า

**Readiness: ดี** สำหรับ connection layer, **ปานกลาง** สำหรับ auth (ต้องสร้าง user repository เองทั้งหมด), **ต่ำ** สำหรับ business domain (ยังไม่มี repository ของ asset/employee/ฯลฯ เลย เป็นแค่ sample เทมเพลตให้เลียนแบบ)

## 3. `.claude/agents` — Development workflow / AI-assisted engineering

**พร้อมแค่ไหน:** พร้อมสมบูรณ์สำหรับ**เอกสาร** (requirement→backlog→feature-list→technical spec→test plan→prototype) แต่สาย `dev-analyst`→`dev-designer`→`dev-coder`→`test-runner` **ยังไม่เคยถูกทดสอบกับโปรเจกต์ scaffold จริงเลยแม้แต่ครั้งเดียว** (ยืนยันจาก `ONBOARDING.md`: "4 agent ข้างต้นถูกออกแบบไว้แล้วแต่ยังไม่เคยถูกเรียกใช้จริงกับโปรเจกต์ที่ scaffold จริง")

**นัยสำคัญสำหรับ migration ของ RAISE**: ถ้าจะใช้ 4 agent นี้ orchestrate การเขียนโค้ดจริงของ RAISE ควร **ทดลองกับ scope เล็กที่สุดก่อน** (เช่น 1 entity อย่าง `assets` แบบ CRUD ล้วนๆ ไม่รวม AI) เพื่อพิสูจน์ pipeline ก่อนใช้กับทั้งระบบ — ตรงกับคำแนะนำเดิมใน ONBOARDING.md อยู่แล้ว ไม่ใช่ความเสี่ยงใหม่ที่เพิ่งพบ

**ไม่มีมาตรฐาน AI runtime** (ยืนยันซ้ำจากรอบก่อน) — ส่วนนี้ยังต้องออกแบบเองตาม [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]]

**Readiness: ดีสำหรับเอกสาร, ยังไม่ยืนยัน (unproven) สำหรับ dev/test agent กับโค้ดจริง**

## 4. `esaps` (root) — Business modules + existing UI + AI capability

ตามที่วิเคราะห์ไว้แล้วใน [[ARCHITECTURE-COMPARISON|ARCHITECTURE-COMPARISON.md]] — UI/component พร้อมมาก, AI fallback-engine ออกแบบดี, แต่ไม่มี DB/auth จริง ข้อมูลเป็น mock ทั้งหมด **ไม่มีอะไรใหม่เพิ่มจากรอบตรวจนี้** ยกเว้นย้ำชัดว่า **ห้ามลบ `server.ts`/mock data/component เดิมตอนนี้** เพราะยังเป็นแหล่งอ้างอิง business behavior เดียวที่มีอยู่ (asset decision logic ทั้งหมดอยู่ใน `generateFallbackDecision()` ไม่มีเอกสาร business rule แยกที่อื่น) — ถ้าลบก่อนมี test/acceptance criteria รองรับ จะไม่มีทางพิสูจน์ได้ว่า backend ใหม่ให้ผลลัพธ์ตรงกับของเดิมหรือไม่

**Readiness: พร้อมเป็น reference ทันที, ยังไม่พร้อมเป็น production code**

## Database decision — สรุปจากหลักฐานจริง (ไม่ใช่ assumption)

ตามที่ตรวจ `dbManager.go`/`samplePGRepository.go`/`sampleRepository.go` จริงแล้ว: **abstraction ของ `go-template-main` มีคุณภาพเพียงพอที่จะพึ่งพาได้** (dual-pool, failover, hot-reload, facade pattern สะอาด) จุดเดียวที่เป็นต้นทุนจริงคือ **ไม่มี ORM** ต้องเขียน raw SQL ทุก entity เอง

**คำแนะนำ**: เลือก **PostgreSQL ผ่าน `DBManager` ของ go-template-main** ตามที่ผู้ใช้เอนเอียงไว้แล้ว — เหตุผล:
1. Connection/failover layer พิสูจน์แล้วว่ามีคุณภาพจริง ไม่ใช่ของเปล่า
2. สอดคล้อง company backend standard เต็มรูปแบบ ไม่เพิ่ม platform ใหม่ (Supabase) ที่ยังไม่มีการใช้งานจริงในโค้ดปัจจุบันแม้จะมี dependency อยู่
3. ต้นทุนที่เพิ่มขึ้น (เขียน raw SQL เอง, ไม่มี ORM) เป็นต้นทุนที่ **ทุกทีมที่ใช้ go-template-main ต้องรับอยู่แล้วเป็นมาตรฐาน** ไม่ใช่ต้นทุนเฉพาะของ RAISE

อัปเดต [[ADR-003-database|DECISIONS/ADR-003-database.md]] เป็น **Accepted** ตามหลักฐานนี้แล้ว — ยังต้องรอการอนุมัติจริงจากผู้มีอำนาจ (business owner/CIO) ก่อนสร้าง PostgreSQL instance หรือ apply migration จริงตามกฎ session (การเปลี่ยน infra จริงต้องขออนุญาตเสมอ)

## จุดที่ยังไม่ควรทำตอนนี้ (ย้ำจากคำแนะนำของผู้ใช้)

- **ห้ามลบ** `server.ts`, mock data (`src/data/*.ts`), หรือ component เดิมของ ESAPS จนกว่าจะมี migration boundary ที่ชัดเจน + test/acceptance criteria รองรับ (ดู [[TEST-STRATEGY|TEST-STRATEGY.md]])
- **ห้ามเริ่ม migrate code จริง** จนกว่า Phase 0 (ด้านล่าง) จะได้รับการยืนยันจากผู้ใช้

## Phase 0: Foundation Migration (เป้าหมายถัดไปหลัง readiness review นี้ผ่าน)

```text
template/react-template-main + existing RAISE UI → Production Frontend
template/go-template-main + RAISE domain          → Production Backend
starter-kit                                        → Development Workflow
PostgreSQL (ผ่าน DBManager)                        → Real Data Layer
Gemini (คง fallback-engine pattern ไว้)            → AI Service Layer
```

รายละเอียดขั้นตอนเต็มอยู่ใน [[MIGRATION-PLAN|MIGRATION-PLAN.md]] (Phase 3 เป็นต้นไปในเอกสารนั้น) — Phase 0 ในที่นี้คือการยืนยัน readiness ก่อนเข้า Phase 3 จริง ไม่ใช่ phase ใหม่ที่แยกจาก migration plan เดิม
