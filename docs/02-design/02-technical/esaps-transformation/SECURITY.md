# Security Requirements — RAISE

อ้างอิงจาก [[AUTH-RBAC|AUTH-RBAC.md]], [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]]

## ช่องว่างที่ตรวจพบจริงในโค้ดปัจจุบัน

- ไม่มี authentication/authorization จริงเลย (ดู [[AUTH-RBAC|AUTH-RBAC.md]]) — ทุกหน้าจอเข้าถึงได้โดยไม่ต้อง login
- `server.ts` ไม่มี rate limiting บน endpoint `/api/ai/*` — เสี่ยง cost ของ Gemini API บวมถ้ามีการเรียกถี่/เรียกจากภายนอกที่ไม่ได้ตั้งใจ
- `.env.example` มีแค่ `GEMINI_API_KEY` — ยังไม่มี secret แยกสำหรับ DB/JWT signing key/Oracle FA credential เพราะยังไม่มีของจริงให้ตั้งค่า

## ข้อกำหนดที่ต้องปิดก่อนขึ้น production

1. **Authentication/RBAC จริง** ทั้ง frontend/backend (รายละเอียดใน [[AUTH-RBAC|AUTH-RBAC.md]]) — แทนที่ demo auth ของ `go-template-main` ด้วย repository-backed user lookup ตามที่ README ของ template เตือนไว้
2. **Input validation** ทุก endpoint ที่รับข้อมูลจาก client (`BodyParser`/`QueryParser` ต้องตรวจ field required/type ก่อนเข้าสู่ service layer)
3. **Secret management** — ห้าม commit `GEMINI_API_KEY`/DB credential ลง repo (ตรวจสอบ `.gitignore` ครอบคลุม `.env`/`.env.local` แล้วในทั้ง ESAPS root และ react-template) พิจารณาใช้ `util/infisicalUtils.go` ของ go-template สำหรับ secret ระดับ production
4. **CORS policy ที่รัดกุม** — `go-template-main` เตือนไว้ตรงๆ ว่าห้ามใช้ `CORS_ALLOW_ORIGINS=*` เมื่อ frontend ส่ง credential (cookie `stl_token`)
5. **Rate limiting** บน `/api/v1/ai/*` เพื่อคุม cost + ป้องกัน abuse
6. **Audit log** ทุก mutation สำคัญ (asset status change, approval decision, reconciliation correction) ลง `audit_logs` — แยกจาก log ของ AI (`ai_decision_runs`)
7. **AI-specific**: ห้าม log credential/token ที่หลุดเข้ามาใน prompt/response โดยไม่ตั้งใจ, ห้าม AI เขียนข้อมูลสำคัญเองโดยไม่ผ่าน human approval (ดู [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]])
8. **File upload validation** เมื่อ Document Management (`DocumentsPlaceholder` ปัจจุบัน) กลายเป็นฟีเจอร์จริง — ตรวจ type/size/malware scan ก่อนเก็บลง object storage
9. **Error sanitization** — ปัจจุบัน `server.ts` คืน `err.Error()` ตรงๆในหลาย endpoint (เช่น `catch` block ของ AI endpoint) ต้องตรวจว่าไม่หลุด stack trace/internal detail ไปยัง client ใน production

## สิ่งที่ทำถูกต้องอยู่แล้ว (เก็บไว้)

- `GEMINI_API_KEY` ไม่เคยถูกส่งไปยัง frontend — เรียก Gemini จาก `server.ts` (backend) เท่านั้น ต้องคงหลักการนี้ไว้เมื่อย้ายไป Go
