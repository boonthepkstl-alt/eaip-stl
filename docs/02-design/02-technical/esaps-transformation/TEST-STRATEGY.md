# Test Strategy — RAISE

อ้างอิงจาก [[SECURITY|SECURITY.md]], [[AI-ARCHITECTURE|AI-ARCHITECTURE.md]]

## สถานะปัจจุบัน

`package.json` ที่ root (ESAPS) มีแค่ `npm run lint` (`tsc --noEmit`) — **ไม่มี test runner ผูกไว้เลย** ไม่มี unit test/integration test ทั้งฝั่ง frontend และ backend ปัจจุบัน `template/go-template-main` มีตัวอย่าง `controller/sampleController_test.go` และคำสั่ง `go test -v -coverprofile=coverage.out ./...` ให้ใช้เป็นต้นแบบ

## Frontend

- **Unit test**: component ที่ไม่มี dependency ภายนอก (เช่น `src/components/ui/*` ทั้งหมด) — เหมาะเป็นชุดแรกเพราะ pure และ reuse สูง
- **Integration test**: หน้าจอที่ผูกกับ service layer ใหม่ (เช่น `AssetList` เรียก `services/assets.ts`) — mock API response
- **E2E**: เส้นทางสำคัญเท่านั้น (login → ดู asset → ยื่นคำขอ maintenance → approve) ไม่ต้องครอบทุกหน้า placeholder

## Backend (Go)

- **Unit test**: ต่อ service layer (mock repository) ตาม `sampleController_test.go` เป็นต้นแบบ
- **Repository test**: รันกับ PostgreSQL testcontainer หรือ schema แยกสำหรับทดสอบ ไม่ใช่ production DB
- **API test**: ยิง endpoint จริงผ่าน Fiber test app เทียบ response shape ตาม [[API-SPECIFICATION|API-SPECIFICATION.md]]

## AI

AI test **ต้องไม่พึ่ง live Gemini response เพียงอย่างเดียว** เพราะ non-deterministic และมี cost:

- ใช้ fixture คงที่ (asset ตัวอย่างที่ผลลัพธ์คาดเดาได้) ทดสอบ `generateFallbackDecision()` ปัจจุบันตรงๆ — logic นี้เป็น deterministic อยู่แล้ว ทดสอบได้ทันทีโดยไม่ต้องรอ migration ไป Go
- Evaluation case ที่ต้องมี: repair vs replace, มี discrepancy ใน reconciliation, executive question ที่ต้อง query ข้อมูลจริง, request ที่ไม่มีสิทธิ์ (ต้องถูก reject ก่อนถึง AI เลย), ข้อมูลไม่พอสำหรับตัดสินใจ (ต้องบอกตรงๆ ไม่ capture มั่ว)
- Mock การเรียก Gemini ในชั้น unit/integration test — เก็บ live-call smoke test แยกไว้เป็น manual/scheduled เท่านั้น เพราะมี cost ต่อครั้ง

## ลำดับความสำคัญ (ตาม MIGRATION-PLAN)

ยังไม่ต้องเขียน test ให้ครบทุกฟีเจอร์ในรอบแรก — เริ่มจาก unit test ของ fallback engine (มีอยู่แล้ว, deterministic, cost ต่ำสุดในการเริ่ม) → API test ของ CRUD หลัก (asset/employee/maintenance) → ค่อยขยายไป AI evaluation set เมื่อ data grounding พร้อมแล้ว
