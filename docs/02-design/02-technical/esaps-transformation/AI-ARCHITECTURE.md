# AI Architecture — RAISE

อ้างอิงจาก [[ARCHITECTURE|ARCHITECTURE.md]]. **หมายเหตุสำคัญ:** starter-kit ของโปรเจกต์นี้ (`.claude/agents/dev-*`) เป็น agent สำหรับเขียนเอกสาร/orchestrate การพัฒนา ไม่ใช่มาตรฐาน AI runtime ของแอปจริง ดังนั้นเอกสารนี้ออกแบบใหม่โดยอิงจาก pattern ที่ดีอยู่แล้วใน `server.ts` ปัจจุบัน ไม่ใช่การ migrate ตามมาตรฐานที่มีอยู่แล้ว

## สิ่งที่มีอยู่แล้วและควรเก็บไว้ (จาก `server.ts` จริง)

- **Model**: `gemini-2.5-flash` ผ่าน `@google/genai` (`GoogleGenAI`) — เรียกจาก backend เท่านั้น ไม่เคยเปิดเผย `GEMINI_API_KEY` ให้ frontend เห็น (ถูกต้องแล้ว ต้องคงหลักการนี้ไว้)
- **Timeout wrapper**: `withTimeout(promise, 6000)` — ป้องกัน request ค้าง
- **Fallback engine เชิงตัวเลข**: `generateFallbackDecision()` คำนวณจาก `repairRatio`, `lifecycleProgress` แล้วสรุป `REPAIR`/`REPLACE` พร้อม confidence/TCO/risk — ใช้เมื่อไม่มี API key หรือเรียก Gemini ไม่สำเร็จ มี fallback เทียบเท่าสำหรับ audit/summary/chat ด้วย
- แนวคิดนี้ตรงกับหลัก **graceful degradation** ที่ต้องการอยู่แล้ว — งานที่ต้องทำคือย้ายเข้า service layer ที่มีโครงสร้างชัดเจนขึ้น ไม่ใช่ออกแบบใหม่ทั้งหมด

## สิ่งที่ต้องเพิ่ม

1. **แยก AI ออกจาก HTTP handler** — ปัจจุบัน Gemini client init, prompt, fallback, และ Express route อยู่ไฟล์เดียวกันหมด (`server.ts`) ย้ายเข้า `internal/ai/` (Go) แยก concern: `client.go` (model abstraction), `prompt/` (versioned prompt templates), `engine/` (decision/audit/summary/chat), `fallback/` (เก็บ logic ปัจจุบันไว้เกือบทั้งหมด)
2. **Data grounding** — ปัจจุบัน frontend ส่ง asset JSON ตรงไปยัง Gemini ผ่าน backend (`Frontend → Asset JSON → Gemini prompt`) เป้าหมายคือให้ backend query ข้อมูลจริงจาก DB ก่อนประกอบ prompt เสมอ:
   ```text
   Request (asset_id) → Permission Check → DB Query (asset + repair history +
   maintenance cost + warranty) → Business Rules → AI Reasoning → Response + Sources
   ```
3. **AI observability**: บันทึกทุกครั้งที่เรียก AI ลงตาราง `ai_decision_runs`/`ai_recommendations` (ดู [[DATABASE-DESIGN|DATABASE-DESIGN.md]]) พร้อม `model`, `prompt_version`, `latency_ms`, `token_usage`, `source` (`gemini`|`fallback`), `confidence`
4. **Human-in-the-loop สำหรับ action ที่มีผลกระทบสูง** — AI ต้องไม่แก้ record สำคัญเอง (เช่น เปลี่ยนสถานะ asset เป็น RETIRE จริง, ปิด reconciliation discrepancy):
   ```text
   AI Recommendation → Human Review → Approval → Business Transaction
   ```

## 5 AI Engine เป้าหมาย (map จาก endpoint ที่มีอยู่แล้ว)

| Engine | Endpoint ปัจจุบัน | ขยายเพิ่ม |
|---|---|---|
| 1. Asset Decision Engine | `POST /api/ai/decision-matrix` (มีอยู่แล้ว พร้อม fallback) | เพิ่ม `REASSIGN` ให้เป็น recommendation ที่เป็นไปได้จริง (ปัจจุบัน fallback รองรับแค่ REPAIR/REPLACE) |
| 2. Audit Intelligence | `POST /api/ai/reconcile-audit` (มีอยู่แล้ว) | ต่อกับ `oracle_fa_records`/`reconciliation_items` จริงแทนข้อมูลจำลอง |
| 3. Predictive Maintenance | ยังไม่มี endpoint | ใหม่ทั้งหมด — ต้องมี `maintenance_history` จริงก่อนจึงมีข้อมูลให้ทำนาย |
| 4. Cost Optimization | บางส่วนซ้อนอยู่ใน `executive-summary` | แยกเป็น engine เฉพาะเมื่อมี license/inventory data จริง |
| 5. Executive Copilot | `POST /api/ai/chat` (มีอยู่แล้วแบบ direct-to-Gemini) | ต้องเปลี่ยนเป็น retrieval-then-reason (ห้ามตอบจาก mock data hardcode ต่อไป) |

## Safety controls

- AI ต้อง**ไม่**เรียก write operation ต่อ Oracle FA หรือ post accounting transaction เอง — คืนแค่ recommendation
- Log ต้องไม่บันทึกข้อมูลอ่อนไหว (credential, token) แม้จะอยู่ใน prompt/response
- Rate limit ระดับ user สำหรับ `/api/v1/ai/*` เพื่อคุม cost ของ Gemini API (ยังไม่มีการจำกัดใน `server.ts` ปัจจุบัน)

รายละเอียด security เพิ่มเติมดู [[SECURITY|SECURITY.md]], รายละเอียด test สำหรับ AI ดู [[TEST-STRATEGY|TEST-STRATEGY.md]]
