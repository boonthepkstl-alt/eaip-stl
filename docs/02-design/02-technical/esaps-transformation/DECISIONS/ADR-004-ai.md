# ADR-004 — Keep Fallback-Engine Pattern, Add Data Grounding and Human-in-the-Loop

## สถานะ
Proposed

## บริบท

`server.ts` ปัจจุบันเรียก Gemini (`gemini-2.5-flash`) ตรงจาก backend พร้อม fallback เชิงตัวเลขที่ออกแบบมาดี (`generateFallbackDecision` และเทียบเท่าสำหรับ audit/summary/chat) แต่ยังส่ง JSON ที่ frontend ประกอบเองเข้า prompt ตรงๆ ไม่มี data grounding, ไม่มี AI observability, ไม่มี human approval สำหรับ action ที่มีผลกระทบสูง starter-kit ของโปรเจกต์นี้ (`.claude/agents`) ไม่มีมาตรฐาน AI runtime ให้ยึด (เป็น agent สำหรับเขียนเอกสาร)

## การตัดสินใจ

1. **เก็บแนวคิด fallback engine ไว้** — เป็นจุดแข็งที่หายากใน prototype ทั่วไป, port จาก TypeScript ไป Go แทนการออกแบบใหม่
2. **เพิ่ม data grounding**: backend query DB จริงก่อนประกอบ prompt เสมอ ไม่รับ asset JSON จาก frontend ตรงๆ อีกต่อไป
3. **เพิ่ม human-in-the-loop** สำหรับ action ที่มีผลกระทบสูง — AI คืนแค่ recommendation, มนุษย์ approve ก่อนเกิด business transaction จริง
4. **เพิ่ม AI observability**: log ทุก AI call ลง `ai_decision_runs` (model, prompt_version, latency, token usage, source: gemini|fallback)

## ผลที่ตามมา

- AI reasoning จะช้าลงเล็กน้อย (ต้อง query DB ก่อนเรียก Gemini) แต่ผลลัพธ์น่าเชื่อถือขึ้นมากเพราะ grounded กับข้อมูลจริง
- ต้องออกแบบ prompt versioning ใหม่ทั้งหมด (ปัจจุบันไม่มี versioning เลย)
- Executive Copilot (`/api/ai/chat`) ต้องเปลี่ยนจาก direct-to-Gemini เป็น retrieval-then-reason — เปลี่ยนแปลงมากที่สุดในกลุ่ม AI engine ทั้ง 5 ตัว

## Alternative ที่พิจารณาแล้วไม่เลือก

ใช้ starter-kit agent (`dev-analyst` ฯลฯ) เป็นฐานของ AI runtime architecture — ปฏิเสธเพราะ agent เหล่านี้ออกแบบมาสำหรับ orchestrate การเขียนเอกสาร/โค้ดโดย Claude Code ไม่ใช่สถาปัตยกรรม AI ที่ทำงานภายในตัวแอป RAISE เอง คนละ concern กัน
