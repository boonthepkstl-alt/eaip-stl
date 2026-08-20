# ADR-003 — PostgreSQL via go-template DBManager, Oracle for FA Reconciliation Only

## สถานะ
**Accepted** — ยืนยันจากการตรวจ implementation จริงของ `dbManager.go`/`samplePGRepository.go`/`sampleRepository.go` (ดู [[IMPLEMENTATION-READINESS-REVIEW|../IMPLEMENTATION-READINESS-REVIEW.md]]) ไม่ใช่จาก assumption เหมือนรอบก่อน — ยังต้องรอการอนุมัติจริงจาก business owner/CIO ก่อนสร้าง PostgreSQL instance หรือ apply migration จริงตามกฎ session

## บริบท

ESAPS ปัจจุบันไม่มี database เลย — ทุกอย่างเป็น mock data ใน `src/data/*.ts` มี `@supabase/supabase-js` เป็น dependency แต่ไม่พบการใช้งานจริง `template/go-template-main` เตรียม `DBManager` รองรับ PostgreSQL (master + read-replica), Oracle, MSSQL, Tarantool พร้อมกัน

## การตัดสินใจ

1. ใช้ **PostgreSQL เป็นฐานข้อมูลหลัก** ของ RAISE ผ่าน `DBManager` ของ go-template ตรงๆ (ไม่ใช้ Supabase) เพื่อให้สอดคล้องมาตรฐาน CIO เต็มรูปแบบ — ยืนยันได้จากการตรวจ implementation จริงแล้วว่า `DBManager` มี dual-pool write/read พร้อม failover, hot-reload config, และ facade pattern (`SampleRepository`) ที่สะอาด **ไม่ใช่ของเปล่าที่มีแต่ config** จึงเพียงพอที่จะพึ่งพาได้โดยไม่ต้องพึ่ง Supabase
2. ใช้ **Oracle เฉพาะสำหรับเชื่อมต่อ Oracle Fixed Assets** ในการทำ reconciliation เท่านั้น ไม่ใช่ระบบเก็บข้อมูลหลัก
3. **ไม่ใช้ MSSQL/Tarantool** ในเบื้องต้น — ปล่อยเป็น "not configured" ตาม `DBManager.Health()`
4. **รับทราบต้นทุนที่มาคู่กับการเลือกนี้**: `go-template-main` ไม่มี ORM/query builder — repository layer ใช้ raw SQL string constant + `github.com/blockloop/scan` สำหรับ map row→struct ทุก entity ใหม่ (มีมากกว่า 20 ตัวตาม [[DOMAIN-MODEL|../DOMAIN-MODEL.md]]) ต้องเขียน SQL เองทั้งหมด ไม่มี auto-migration/code-gen ช่วย — ยอมรับต้นทุนนี้เพื่อความสอดคล้องกับมาตรฐาน CIO

## ผลที่ตามมา

- ต้องตั้ง PostgreSQL instance เอง (ไม่ได้ managed service สำเร็จรูปแบบ Supabase) — เพิ่มงาน DevOps
- ได้ read-replica + hot-reload config โดยไม่ต้องเขียนเพิ่มเอง (มีอยู่แล้วใน `dbManager.go`)
- Schema ต้องออกแบบใหม่ทั้งหมด (ไม่มี schema เดิมให้ migrate จาก mock data) — ดู [[DOMAIN-MODEL|../DOMAIN-MODEL.md]]

## จะต้อง revisit ADR นี้ถ้า

ผู้ใช้ยืนยันว่าต้องการใช้ Supabase จริง (เพราะมี dependency เตรียมไว้แล้วใน `package.json`) — ต้องเขียน ADR ใหม่เปรียบเทียบ Supabase Auth vs. JWT ของ go-template ว่าจะเลือกใช้ตัวไหนเป็น auth backbone แทน

## หลักฐานที่ใช้ตัดสินใจ (ตรวจแล้ว ไม่ใช่ assumption)

- `repository/dbManager.go`: dual-pool PG (master write + round-robin read-replica พร้อม per-replica health check), hot-reload config ตาม mtime ของไฟล์ config, graceful transaction wrapper (`WithTransaction`) ที่ panic-safe
- `repository/samplePGRepository.go`: read ผ่าน `GetPGReadDB()`, write ผ่าน `GetPGWriteDb()` แยกกันชัดเจนทุก method, ใช้ prepared statement + `blockloop/scan` สำหรับ row mapping
- `repository/sampleRepository.go`: facade ที่ประกาศ primary CRUD ผ่าน PostgreSQL ชัดเจน ส่วน per-DB (`TTAdd`, `OracleGet` ฯลฯ) เป็น method เสริมแยกออกไป ไม่ปนกับ primary path
- `service/authService.go`: ยืนยันว่าเป็น **hardcoded demo เท่านั้น** ไม่มี repository-backed lookup — ต้องสร้าง `UserRepository` เองทั้งหมดในระหว่าง migration (ดู [[AUTH-RBAC|../AUTH-RBAC.md]])
