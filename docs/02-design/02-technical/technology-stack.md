# Technology Stack

## สถานะ

**ตัดสินใจแล้ว** — กำหนดโดย CIO เป็นมาตรฐานบังคับ (mandatory standard) สำหรับการพัฒนาระบบทุกระบบในองค์กร ไม่ใช่การตัดสินใจเฉพาะโปรเจกต์ tasks-mng นี้เพียงระบบเดียว

ที่มา: template อ้างอิงต้นทางวางไว้ที่ root ของ repository นี้ (`/react-template-main/`, `/go-template-main/`) เพื่อใช้เป็นจุดอ้างอิงระหว่างช่วง design/implementation

## กติกาการใช้ template อ้างอิง

- ทุกระบบต้องพัฒนาโดยอ้างอิงโครงสร้าง/แนวปฏิบัติจาก **`react-template-main`** (Frontend) และ **`go-template-main`** (Backend) เป็นหลักเสมอ ห้ามเลือก framework/library อื่นทดแทนโดยไม่ได้รับอนุมัติจาก CIO
- อนุญาตให้ **ปรับ version ของ dependency ให้ใหม่กว่า** เวอร์ชันที่ระบุใน template ต้นทางได้ (เช่น อัปเกรด React/Go/library เป็น minor/major version ใหม่กว่าที่ pin ไว้) แต่ต้องคงหมวดหมู่เทคโนโลยีเดิม (เช่น ยังคงเป็น React + Fiber ไม่เปลี่ยนไปใช้ framework อื่น) และตรวจสอบว่าไม่กระทบ pattern เชิงสถาปัตยกรรมที่ template วางไว้ (Clean Architecture layering, service layer pattern ฯลฯ)
- เมื่อเริ่มพัฒนาโปรเจกต์จริง ให้ copy โครงสร้างจาก template แล้วปรับ module name/project name ตามที่ระบุใน README ของแต่ละ template (`go mod edit -module`, เปลี่ยนชื่อใน `package.json`) ไม่ใช่เขียนโครงสร้างใหม่ตั้งแต่ต้น

## Frontend — อ้างอิงจาก `react-template-main`

| หมวด | เทคโนโลยี | เวอร์ชันใน template ต้นทาง (ปรับใหม่กว่านี้ได้) |
|------|-----------|--------------------------------------------------|
| Core UI Library | React | ^18.2.0 |
| ภาษา | TypeScript | ^5.2.2 |
| Build Tool | Vite | ^5.0.8 |
| CSS Framework | Tailwind CSS | ^3.4.0 |
| Routing | React Router DOM | ^7.10.1 |
| State Management | Zustand | ^4.4.7 |
| HTTP Client | Axios | ^1.6.2 |
| Lint/Format | ESLint + Prettier + TypeScript ESLint | ^8.55.0 / ^3.1.1 / ^6.14.0 |
| Container | Docker | ตาม `Dockerfile` ใน template |

**สถาปัตยกรรมเชิง logical (คงรูปแบบนี้ไว้เสมอ ไม่ว่าจะอัปเกรด version ใด):**
- View Layer (`src/pages`, `src/components`) → Service Layer (`src/services`) → Configuration Layer (`src/config`) → Type Layer (`src/types`)
- Path alias `@/` แทน relative import
- แยก Global component (`src/components/`) กับ Local component เฉพาะหน้า (`src/pages/[Feature]/_components/`)
- Authentication: JWT ผ่าน Context API (`src/contexts`) + Axios interceptor แนบ token อัตโนมัติ + auto-redirect เมื่อ 401

## Backend — อ้างอิงจาก `go-template-main`

| หมวด | เทคโนโลยี | เวอร์ชันใน template ต้นทาง (ปรับใหม่กว่านี้ได้) |
|------|-----------|--------------------------------------------------|
| ภาษา | Go | 1.23.0 |
| Web Framework | Fiber | v2.51.0 |
| Authentication | golang-jwt/jwt | v5.2.1 (Bearer token + HttpOnly cookie) |
| Logging | Logrus + nested-logrus-formatter | v1.9.3 |
| Config | Viper | v1.17.0 |
| Secrets Management | Infisical SDK | v0.4.4 |
| Tracing | OpenTelemetry (OTLP → Jaeger) | v1.24.0 |
| Test Assertion | Testify | v1.9.0 |
| Database Driver (เลือกตามที่ระบบต้องใช้จริง) | PostgreSQL (`lib/pq`), MS SQL (`go-mssqldb`), Oracle (`go-ora`), Tarantool (`go-tarantool`) | v1.10.9 / v0.12.3 / v2.9.0 / v2.4.1 |

**สถาปัตยกรรมเชิง logical (Clean Architecture — คงรูปแบบนี้ไว้เสมอ):**
```
Controller (HTTP parsing/response, ไม่มี business logic)
    → Service (business logic, orchestration, ไม่รู้จัก HTTP)
        → Repository (data access, interface ต่อ database — รองรับหลาย database engine ผ่าน facade + strategy pattern)
            → Database
```
- Handler layer แยกต่างหากสำหรับเรียก external HTTP API (ไม่ปนกับ service layer)
- Dependency Injection แบบ manual constructor injection (ไม่ใช้ DI framework)
- Middleware: JWT auth, panic recovery, tracing, CORS
- Error handling: repository คืน `(result, error)` → service wrap ด้วย `fmt.Errorf` → controller map เป็น HTTP status + JSON `{ "status": "ERROR", "message": "..." }`

โปรเจกต์จริงไม่จำเป็นต้องใช้ทั้ง 4 database engine ที่ template รองรับ — เลือกเฉพาะ engine ที่ตรงกับที่ตัดสินใจในระบบจริง แต่ต้องคงรูปแบบ repository interface ตาม facade pattern เดิม

## ผลกระทบต่อเอกสารเชิงเทคนิคอื่น

เอกสารต่อไปนี้เคยตั้งใจเขียนแบบ stack-agnostic เพราะรอการตัดสินใจนี้ — เมื่อ technology-stack.md ถูกกำหนดแล้ว ให้พิจารณาปรับเอกสารต่อไปนี้ให้ผูกกับ stack จริงเมื่อเข้าสู่ช่วง implementation:
- [[architecture.md]] —ยัง logical/conceptual ได้ต่อไป แต่ mapping component → Fiber service / React module ควรระบุเมื่อเข้าสู่ detailed design
- [[api-spec.md]] — ยังไม่ต้องผูก REST path จริงจนกว่าจะเริ่ม implement แต่ควรอ้างอิงรูปแบบ error response ของ go-template-main (`{ "status": "ERROR", "message": "..." }`) เป็นมาตรฐาน
- [[db-spec.md]] — ต้องเลือก database engine จริงจาก 4 ตัวที่ template รองรับ (PostgreSQL/MSSQL/Oracle/Tarantool) เมื่อทีมตัดสินใจ

## เอกสารที่เกี่ยวข้อง

- [[architecture.md]]
- [[api-spec.md]]
- [[db-spec.md]]
