# Authentication & RBAC — RAISE

อ้างอิงจาก [[ARCHITECTURE-COMPARISON|ARCHITECTURE-COMPARISON.md]]

## สถานะปัจจุบัน (ต้องแทนที่ทั้งหมด)

- `src/pages/Auth.tsx` มี `Login`, `ForgotPassword`, `Register` เป็น **UI เท่านั้น** ไม่ได้เรียก backend จริง
- `AppShell` แสดง profile "Alex Morgan / Administrator" hardcode, sign-out คือ `navigate('login')` เฉยๆ ไม่มีการล้าง token/session จริง (เพราะไม่มี token อยู่แล้ว)
- ไม่มี route guard ฝั่ง frontend และไม่มี middleware ตรวจสิทธิ์ฝั่ง backend เลย (เพราะยังไม่มี backend endpoint สำหรับ business data)

## เป้าหมาย — ใช้ pattern ของ template ทั้งสองฝั่งตรงๆ

### Backend (`go-template-main`)
- `middleware/jwtAuth.go`: `JWTAuth()` รองรับทั้ง `Authorization: Bearer <token>` และ cookie `stl_token` — ตรวจ token ผ่าน `util.ValidateToken`, เช็ค revoke ผ่าน `util.IsTokenBlacklisted` (สำหรับ logout)
- `RequireRole(roles...)` — role `admin` ผ่านเสมอ, role อื่นต้องอยู่ใน allowlist ของแต่ละ route
- **ข้อควรระวัง**: `authService.go` ของ template ใช้ demo credential จาก env (`AUTH_DEMO_USERNAME`/`PASSWORD`/`ROLE`) — README ของ template เตือนไว้ตรงๆว่า "Replace the demo auth service with a repository-backed user lookup when starting a real project" **ต้องทำสิ่งนี้ก่อนขึ้น production เสมอ** ห้ามปล่อย demo auth ไว้
- รองรับ `BYPASS_JWT` สำหรับ local dev เท่านั้น — ต้องปิด/ไม่ตั้งค่านี้ใน production environment

### Frontend (`react-template-main`)
- `contexts/AuthContext.tsx` + `ProtectedRoute` — ครอบทุก route ที่ต้อง login ตาม pattern ที่ระบุใน README (`<Route element={<ProtectedRoute />}>...`)
- Axios interceptor inject token อัตโนมัติ + auto-redirect ไป `/login` เมื่อโดน 401

### Role ที่เสนอ (จาก analysis เดิม ต้องยืนยันกับ business owner)
```text
EMPLOYEE   — ขอ/ติดตามงาน asset ของตัวเอง
IT_STAFF   — จัดการ asset/maintenance ที่ได้รับมอบหมาย
IT_MANAGER — approve คำขอ, ดู reconciliation/report
ADMIN      — จัดการ user/role, เข้าถึงทุกโมดูล
```

## RBAC ต้องบังคับ 2 ชั้นเสมอ

```text
Frontend   — ซ่อน/แสดง UI ตาม role (UX เท่านั้น ไม่ใช่ security boundary)
Backend    — RequireRole() ต่อ route (security boundary จริง)
```

ห้ามพึ่ง frontend-only authorization แม้แต่กรณีเดียว — endpoint ที่แก้ไขข้อมูล (`POST`/`PUT`/`DELETE`) ทุกตัวใน [[API-SPECIFICATION|API-SPECIFICATION.md]] ต้องมี `RequireRole(...)` กำกับ

## Enterprise SSO (เป้าหมายระยะถัดไป)

```text
Microsoft Entra ID / Azure AD
        │
        ▼
   OIDC / OAuth2
        │
        ▼
      Backend
        │
        ▼
       RBAC
```

เป็น phase ถัดไปหลังจาก JWT auth พื้นฐานของ go-template ทำงานได้แล้ว — ไม่ต้องทำพร้อมกันในรอบแรก (ดู [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 11)
