# ADR-002 — Replace Express Backend with go-template-main

## สถานะ
Proposed

## บริบท

`server.ts` ปัจจุบันรวม Express routing, Vite dev middleware, Gemini client init, fallback logic เชิงธุรกิจ และ business logic ไว้ในไฟล์เดียว (391 บรรทัด) ไม่มีการแบ่ง layer ไม่มี test มาตรฐาน CIO กำหนด Go/Fiber (`go-template-main`) เป็น backend บังคับ

## การตัดสินใจ

ย้าย backend ทั้งหมดไปเป็น Go/Fiber ตามโครง `controller → service → repository → model` ของ `template/go-template-main` รวม 4 AI endpoint ที่มีอยู่แล้ว (`/api/ai/decision-matrix`, `/api/ai/reconcile-audit`, `/api/ai/executive-summary`, `/api/ai/chat`) — ย้าย implementation ไป Go แต่คง path/contract เดิมไว้เพื่อลด breaking change ฝั่ง frontend ในช่วง transition

## ผลที่ตามมา

- ต้องเขียน Go client สำหรับเรียก Gemini API ใหม่ (ปัจจุบันมีแค่ TypeScript SDK `@google/genai`) — ตรวจสอบว่า Google มี Go SDK ที่เทียบเท่า หรือต้องเรียกผ่าน REST ตรงจาก Go
- ได้ JWT auth, RBAC middleware, OpenTelemetry tracing, multi-DB support ที่ Express เดิมไม่มีให้ทันที
- Fallback engine เชิงตัวเลข (`generateFallbackDecision`) ต้อง port จาก TypeScript เป็น Go — logic ตรงไปตรงมา (คำนวณเลข) ความเสี่ยงต่ำ

## Alternative ที่พิจารณาแล้วไม่เลือก

คง Express ไว้เป็น "AI microservice" แยกจาก Go backend หลัก — ปฏิเสธเพราะขัดกับมาตรฐาน CIO ที่ต้องการ backend เดียวตาม `go-template-main` และเพิ่มความซับซ้อนของการดูแล 2 runtime โดยไม่มีเหตุผลด้าน scale ที่ชัดเจนรองรับ
