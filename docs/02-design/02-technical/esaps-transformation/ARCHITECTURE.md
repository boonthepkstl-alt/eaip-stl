# Target Architecture — RAISE

อ้างอิงจาก [[INDEX|INDEX.md]] และ [[ARCHITECTURE-COMPARISON|ARCHITECTURE-COMPARISON.md]]

## ภาพรวม

```text
                          RAISE Platform
                                |
                +---------------+---------------+
                |                               |
        React Frontend                    AI Assistant (widget)
     (react-template-main baseline          (เรียกผ่าน REST เดียวกับ
      + UI kit จาก ESAPS)                     ส่วนอื่นของแอป ไม่ใช่ direct
                |                              call ไป Gemini)
                +---------------+---------------+
                                |
                             REST API
                                |
                        Go Backend (Fiber)
                     (go-template-main baseline)
                                |
        +----------------------+----------------------+
        |                      |                       |
   Domain Modules         Workflow Module           AI Service
  (asset/employee/         (approval/request)      (5 engine — ดู
   license/maintenance/                             AI-ARCHITECTURE.md)
   procurement/audit/                                    |
   reconciliation/                                  Gemini API +
   inventory/document/                               Fallback Engine
   notification/report)
        |                      |                       |
        +----------------------+----------------------+
                                |
                          PostgreSQL
                                |
        +-----------------------+-----------------------+
        |                       |                        |
      Redis               Object Storage           External APIs
   (session/cache)      (document/attachment)             |
                                                +----------+----------+
                                                |          |          |
                                            Oracle FA   Entra ID     M365
                                          (reconcile)  (auth/SSO)  (notify)
```

## หลักการออกแบบ

1. **Modular monolith ก่อน ไม่ใช่ microservices** — `go-template-main` ไม่ได้กำหนดมาตรฐาน microservices ไว้ และ scope ของ RAISE (asset/employee/license/maintenance/procurement/audit/reconciliation) ยังจัดการได้ในโครง `internal/{module}/` เดียวได้สบาย แยกเป็น service จริงเมื่อมีเหตุผลด้าน scale/team boundary ชัดเจนเท่านั้น (ดู Rule 7 ใน [[DEVELOPMENT-GUIDE|DEVELOPMENT-GUIDE.md]])
2. **UI เดิมเป็น baseline** — ไม่ rewrite `src/components/ui/*`, `AppShell`, หรือหน้าจอที่มีอยู่แล้ว ย้ายเข้า `react-template-main` แล้วต่อ API client ใหม่เข้าไปแทนที่การอ่าน mock data
3. **Backend ย้ายจาก Express → Go/Fiber ทั้งหมด** ตามมาตรฐาน CIO ที่ตัดสินใจแล้วใน `docs/02-design/02-technical/technology-stack.md` — ไม่มีข้อยกเว้นสำหรับ AI endpoint เดิม ต้อง migrate ไปด้วย
4. **AI เป็น advisory layer เสมอสำหรับ action ที่มีผลกระทบสูง** (เช่น replace/retire asset, ปิด reconciliation discrepancy) — AI ให้ recommendation, มนุษย์ approve, backend ทำ business transaction จริง (ดู [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]] หัวข้อ Human-in-the-loop)
5. **Data grounding ก่อน AI reasoning** — ทุก AI call ต้องผ่านการ query ข้อมูลจริงจากฐานข้อมูลก่อนส่งเข้า prompt ไม่ใช่รับ JSON จาก frontend ตรงๆแบบปัจจุบัน

## Component Mapping (ESAPS ปัจจุบัน → RAISE เป้าหมาย)

| ESAPS ปัจจุบัน | RAISE เป้าหมาย |
|---|---|
| `src/App.tsx` (state-based nav) | React Router routes ตาม convention ของ `react-template-main` (`src/pages/{Feature}/index.tsx`) |
| `src/data/*.ts` (mock) | `src/services/{domain}.ts` เรียก REST API จริง + ย้าย mock เดิมไปเป็น `tests/fixtures/` |
| `src/components/ui/*`, `AppShell` | คงไว้เหมือนเดิม ย้ายเข้า `src/components/` ของโปรเจกต์ใหม่ |
| `server.ts` (Express, ไฟล์เดียว) | `internal/ai/` (Go) — controller/service/repository แยกตาม `go-template-main` |
| ไม่มี DB | PostgreSQL ตาม [[DATABASE-DESIGN|DATABASE-DESIGN.md]] |
| ไม่มี auth จริง | JWT + RBAC ตาม [[AUTH-RBAC|AUTH-RBAC.md]] |

## NFR mapping (ตัวอย่างเบื้องต้น — ต้องเทียบกับ backlog จริงถ้ามีการทำ requirement phase ของ RAISE ในอนาคต)

- **ความพร้อมใช้งาน**: PostgreSQL read-replica (go-template รองรับอยู่แล้วผ่าน `DBManager`), health endpoint (`/api/health` มีอยู่แล้วทั้งสองฝั่ง)
- **การตรวจสอบย้อนกลับ (Audit)**: ทุก AI recommendation และทุก approval step ต้องมี audit log ตาม [[SECURITY|SECURITY.md]]
- **ความปลอดภัย**: RBAC บังคับทั้ง frontend และ backend/DB layer ไม่ใช่ frontend-only เหมือนตอนนี้
