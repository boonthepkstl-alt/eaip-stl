# Database Design — RAISE

อ้างอิงจาก [[DOMAIN-MODEL|DOMAIN-MODEL.md]] และ pattern จริงใน `template/go-template-main/repository/dbManager.go`

## เครื่องยนต์ฐานข้อมูล

`go-template-main` เตรียม `DBManager` ให้รองรับ **PostgreSQL, Oracle, MSSQL, Tarantool พร้อมกัน** โดย PostgreSQL และ Tarantool มี dual-pool (write ไป master, read กระจายไป replica แบบ round-robin พร้อม health-check ต่อรอบ) แต่สำหรับ RAISE:

- **ใช้ PostgreSQL เป็นฐานข้อมูลหลัก** (ตามคำแนะนำในเอกสารวิเคราะห์ต้นฉบับ — เหมาะกับ domain model เชิง relational ของ asset/employee/license/workflow)
- **Oracle** ใช้เฉพาะการเชื่อมต่อ **Oracle Fixed Assets (Oracle FA)** สำหรับ reconciliation เท่านั้น (อ่านข้อมูลจากระบบภายนอก ไม่ใช่ระบบเก็บข้อมูลหลักของ RAISE) — ใช้ `repository/sampleOracleRepository.go` เป็นแนวทาง
- **MSSQL/Tarantool**: ไม่มีความจำเป็นสำหรับ RAISE ในขณะนี้ ปล่อยเป็น "not configured" ได้ (`DBManager.Health()` รองรับสถานะนี้อยู่แล้ว)

Config ใช้ env key ตามที่ `dbManager.go` กำหนดไว้แล้ว (`DB_PG_SERVER`, `DB_PG_PORT`, `DB_PG_USER`, `DB_PG_PASS`, `DB_PG_INST`, `DB_PG_SCHEMA`, `DB_PG_SSLMODE`, `DB_PG_REPLICAS` ฯลฯ) — ไม่ต้องคิด schema config ใหม่

## Supabase dependency ที่มีอยู่แล้ว — ตัดสินใจแล้ว (ไม่ใช่ assumption)

`@supabase/supabase-js` อยู่ใน `package.json` ปัจจุบันแต่ไม่พบการเรียกใช้จริงในโค้ดที่ตรวจ มีสองแนวทางที่พิจารณา:

1. **DBManager ของ go-template-main ตรงๆ** (สอดคล้องมาตรฐาน CIO เต็มรูปแบบ) — ต้องดูแล PostgreSQL instance เอง
2. **Supabase (PostgreSQL + Auth + Storage)** — ได้ Auth/Storage มาพร้อมกัน แต่ Supabase Auth จะไปแทนที่ auth service ของ go-template ซึ่งขัดกับมาตรฐาน CIO

**ตัดสินใจ: เลือกแนวทางที่ 1** หลังจากตรวจ implementation จริงของ `dbManager.go`/`samplePGRepository.go`/`sampleRepository.go` แล้วพบว่ามี dual-pool write/read พร้อม failover, hot-reload config, และ facade pattern ที่สะอาด — เพียงพอที่จะพึ่งพาได้โดยไม่ต้องเพิ่ม platform ใหม่ (รายละเอียดหลักฐานดู [[IMPLEMENTATION-READINESS-REVIEW|IMPLEMENTATION-READINESS-REVIEW.md]] และ [[ADR-003-database|DECISIONS/ADR-003-database.md]]) ต้นทุนที่ต้องรับคือไม่มี ORM — ทุก entity ต้องเขียน raw SQL เอง `@supabase/supabase-js` ที่เหลือใน `package.json` ถือเป็น dependency ที่ไม่ได้ใช้แล้ว ให้เอาออกเมื่อ scaffold โปรเจกต์จริง (ไม่ต้องรีบลบจาก ESAPS เดิมตอนนี้ตามกฎ "ห้ามแก้ source จริงจนกว่าจะได้รับอนุญาต")

## Schema ระดับตาราง (ร่างเริ่มต้น — ต้อง refine ด้วย `db-spec.md` convention ของโปรเจกต์ก่อนใช้จริง)

ตามรายการเอนทิตีใน [[DOMAIN-MODEL|DOMAIN-MODEL.md]] แต่ละตารางควรมีคอลัมน์มาตรฐานร่วมตาม pattern ของ `model/sampleModel.go` (`ID` แบบ UUID, `PaginationQuery`/`PaginatedResponse` สำหรับ list endpoint) บวก:

```sql
-- ตัวอย่างตารางหลัก (ยึด field จาก DOMAIN-MODEL.md ที่ยืนยันจาก mock data จริง)
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES asset_categories(id),
  location_id UUID REFERENCES asset_locations(id),
  status_id UUID REFERENCES asset_statuses(id),
  purchase_cost NUMERIC(14,2),
  current_value NUMERIC(14,2),
  age_years NUMERIC(5,2),
  expected_lifespan_years NUMERIC(5,2),
  condition VARCHAR(50),
  cumulative_repair_cost NUMERIC(14,2),
  estimated_next_repair_cost NUMERIC(14,2),
  annual_maintenance_cost NUMERIC(14,2),
  downtime_hours NUMERIC(8,2),
  new_model_replacement_cost NUMERIC(14,2),
  estimated_salvage_value NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_decision_runs (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES assets(id),
  recommendation VARCHAR(20) NOT NULL, -- REPAIR|REPLACE|REASSIGN|RETIRE|MAINTAIN
  confidence NUMERIC(5,2),
  health_score NUMERIC(5,2),
  risk_score NUMERIC(5,2),
  payback_period_months NUMERIC(6,2),
  tco_3year_repair NUMERIC(14,2),
  tco_3year_replace NUMERIC(14,2),
  cost_savings_3year NUMERIC(14,2),
  ai_rationale TEXT,
  risk_factors JSONB,
  action_items JSONB,
  source VARCHAR(20) NOT NULL, -- 'gemini' | 'fallback'
  requested_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

ตารางที่เหลือ (`employees`, `licenses`, `maintenance_requests`, `reconciliation_runs`, `approval_requests` ฯลฯ) ให้แตกรายละเอียดด้วย agent `api-db-writer` เมื่อเริ่มทำ `db-spec.md` จริงของ RAISE (ดู [[DEVELOPMENT-GUIDE|DEVELOPMENT-GUIDE.md]] สำหรับลำดับการเรียกใช้ pipeline)

## Migration convention

ตาม `go-template-main/sql/pg/V0__Initial_Table.sql` ใช้ naming แบบ Flyway-style (`V{n}__{description}.sql`) วางไว้ที่ `sql/pg/` ของโปรเจกต์จริงที่ scaffold ออกมา — ห้าม apply migration ลง database จริงโดยไม่ขออนุญาตผู้ใช้ก่อนเสมอ (ตามกฎ session และตามที่ CLAUDE.md ระบุไว้สำหรับ `dev-designer`)
