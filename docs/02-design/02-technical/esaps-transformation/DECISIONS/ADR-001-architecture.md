# ADR-001 — Modular Monolith, Keep Existing UI as Baseline

## สถานะ
Proposed (ยังไม่ได้ยืนยันจากผู้มีอำนาจตัดสินใจ — ดู [[MIGRATION-PLAN|../MIGRATION-PLAN.md]] Phase 2)

## บริบท

ESAPS ที่ root ของ repo นี้เป็น frontend prototype ที่สมบูรณ์มาก (UI kit ครบ, 24 หน้าจอ, AppShell) หุ้ม backend Express ไฟล์เดียว ไม่มี database/auth จริง มาตรฐาน CIO บังคับให้ใช้ `template/react-template-main`/`template/go-template-main` เป็นฐาน (ดู `CLAUDE.md` และ `docs/02-design/02-technical/technology-stack.md`)

## การตัดสินใจ

1. **ใช้ UI ปัจจุบันของ ESAPS เป็น baseline** ไม่ rewrite ใหม่ — ย้ายเข้า `react-template-main` scaffold
2. **ใช้ modular monolith** สำหรับ backend Go แทน microservices — scope ปัจจุบัน (asset/employee/license/maintenance/procurement/audit/reconciliation) จัดการได้ในโครงเดียว
3. **Backend ย้ายจาก Express → Go/Fiber ทั้งหมด** ไม่มีข้อยกเว้นสำหรับ AI endpoint เดิม

## ผลที่ตามมา

- ต้องแปลง state-based routing (`App.tsx`) เป็น React Router — งานที่มีความเสี่ยง regression ปานกลาง เพราะกระทบทุกหน้าจอ
- ทีมต้องเรียนรู้ Go/Fiber ถ้ายังไม่คุ้นเคย (backend เดิมเป็น TypeScript/Express)
- ได้ประโยชน์จาก DBManager multi-engine, OpenTelemetry tracing, JWT+RBAC middleware ที่ template เตรียมไว้แล้วโดยไม่ต้องสร้างเอง

ดู [[ADR-002-backend|ADR-002-backend.md]] สำหรับรายละเอียด backend, [[ADR-003-database|ADR-003-database.md]] สำหรับ database
