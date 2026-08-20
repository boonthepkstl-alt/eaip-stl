# Frontend Migration Boundary — RAISE

อ้างอิงจาก [[FRONTEND-MIGRATION-ANALYSIS|FRONTEND-MIGRATION-ANALYSIS.md]]

## Concept

```text
react-template-main
        │
        ▼
Frontend Foundation (scaffolded ที่ frontend/ — ดู FRONTEND-SCAFFOLD-RESULT.md)
        │
        ├── App Bootstrap    (main.tsx, App.tsx, ErrorBoundary)
        ├── Router           (react-router-dom v7, ProtectedRoute)
        ├── Layout           (AppShell — ย้ายจาก ESAPS ไม่ใช่ Navbar ของ template)
        ├── Design System    (UI kit 19 component จาก ESAPS + Tailwind v4 tokens ของ ESAPS)
        ├── API Client       (axios instance ของ template ขยายเป็น services/{domain}.ts)
        ├── Auth Boundary    (AuthContext ของ template ชั่วคราว → เปลี่ยนตาม AUTH-RBAC.md ทีหลัง)
        ├── Error Handling   (ErrorBoundary ของ template + NotFound/AccessDenied ของ ESAPS)
        ├── Configuration    (config/constants.ts แบบ template)
        └── Testing          (Vitest — เพิ่มใหม่ ไม่มีในทั้งสองแหล่ง)
                │
                ▼
        RAISE Business Modules (ยังไม่ migrate ใน phase นี้ — เป็น placeholder เท่านั้น)
                │
                ├── Dashboard, Assets, Employees, Maintenance, Licenses,
                │   Inventory, Audit, Reconciliation, Procurement, Workflow,
                │   Reports, AI
```

## Classification: FOUNDATION / BUSINESS / SHARED / LEGACY

### FOUNDATION (มาจาก `template/react-template-main`, ใช้ตรงๆหรือปรับเล็กน้อย)
| ไฟล์ต้นทาง (template) | บทบาทใน scaffold ใหม่ |
|---|---|
| `src/App.tsx` (provider chain: ErrorBoundary→BrowserRouter→AuthProvider) | โครง `App.tsx` ของ `frontend/` |
| `src/contexts/AuthContext.tsx` | ใช้ตรงๆในรอบนี้ (localStorage token) — จะแทนที่ด้วย cookie-based ตาม AUTH-RBAC.md ในรอบหลัง |
| `src/services/api.ts` (axios + interceptor) | ฐานของ `frontend/src/services/api-client.ts` |
| `src/components/ErrorBoundary.tsx` | ใช้ตรงๆ |
| `src/types/api.ts`, `types/auth.ts` | ฐานของ `frontend/src/types/` (ขยาย field ตาม go-template auth model จริงทีหลัง) |
| `src/config/constants.ts` (ROUTES/API_ENDPOINTS/STORAGE_KEYS pattern) | ฐานของ `frontend/src/config/constants.ts` — ขยาย ROUTES ให้ครบ 24 หน้า |
| `tsconfig.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`, path alias `@/*`) | ใช้ตรงๆ — ปิดช่องว่าง type-safety ที่ ESAPS เดิมไม่มี |
| `.eslintrc.cjs`, `.prettierrc` | ใช้ตรงๆ |
| `vite.config.ts` (proxy `/api`, alias `@/`) | ใช้เป็นฐาน ปรับ plugin เป็น `@tailwindcss/vite` (Tailwind v4) แทน PostCSS v3 |

### BUSINESS (มาจาก ESAPS — เนื้อหาธุรกิจของ RAISE)
ทุกไฟล์ใน `src/pages/*.tsx` (24 หน้า), `src/data/*.ts` (mock ที่จะถูกแทนด้วย service call ทีละหน้าใน phase ถัดไป), `src/config/navigation.ts` — **ยังไม่ย้ายใน phase นี้** ตาม Definition of Done ("Do not migrate every RAISE page yet") จะย้ายทีละโมดูลตาม [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 6 เป็นต้นไป

### SHARED (มาจาก ESAPS — ใช้ร่วมกันทุกหน้า ย้ายเข้า foundation ทันทีในรอบนี้เพราะไม่มีสิ่งเทียบเท่าใน template)
- `src/components/ui/*` (19 component) — ย้ายเข้า `frontend/src/components/ui/` ทั้งชุด
- `src/components/AppShell.tsx` — ย้ายเข้า `frontend/src/components/AppShell.tsx` เป็น layout หลักแทน `Navbar` ของ template
- `src/lib/cn.ts` — ย้ายเข้า `frontend/src/lib/cn.ts` ตรงๆ
- `src/index.css` (Tailwind v4 `@theme` tokens) — ย้ายเข้า `frontend/src/index.css` ตรงๆ (เป็น design system จริงของ RAISE ตามข้อสรุปใน FRONTEND-MIGRATION-ANALYSIS.md ข้อ 3)

**หมายเหตุ**: `AIAssistantDrawer`, `Charts`, `DataTable` เป็น SHARED เช่นกันแต่ยังไม่ย้ายในรอบนี้เพราะ scaffold ของ phase นี้ยังไม่มีหน้าที่ใช้งานจริง (จะย้ายพร้อมหน้าที่ใช้งานจริงใน phase ถัดไป)

### LEGACY (คงไว้ที่เดิม ไม่แตะต้อง จนกว่าจะมี test/acceptance criteria รองรับการ migrate)
- `src/` (root เดิมทั้งหมด) และ `server.ts` — **ยังคงอยู่ครบ ไม่ลบ ไม่ย้าย ไม่แก้ไข** ในระหว่าง phase นี้ ใช้เป็น reference ของ business behavior (ตาม constraint ของงานนี้ข้อ 6)
- `package.json`/`vite.config.ts`/`tsconfig.json` ที่ root เดิม — ยังทำงานได้ตามปกติแยกจาก `frontend/` ที่สร้างใหม่ ไม่ชนกัน

## Route Mapping

| Existing Route/Page (ESAPS `Page` type) | New Route (`frontend/`, React Router) | Status |
|---|---|---|
| `dashboard` | `/dashboard` | Scaffolded (placeholder ที่ใช้ AppShell จริง, เนื้อหายังไม่ migrate) |
| `login` | `/login` | Scaffolded (ใช้ฟอร์มของ template ปรับสไตล์เป็น ESAPS tokens) |
| `assets` | `/assets` | Placeholder เท่านั้น |
| `asset-detail` | `/assets/:assetId` | ยังไม่ scaffold (mapping ไว้เป็นเอกสาร รอ Phase 6) |
| `create-asset` | `/assets/new` | ยังไม่ scaffold |
| `assignment` | `/assignments` | ยังไม่ scaffold |
| `employee-detail` | `/employees/:employeeId` | Placeholder route `/employees` เท่านั้นใน phase นี้ |
| `maintenance` | `/maintenance` | Placeholder เท่านั้น |
| `ticket-detail` | `/maintenance/:ticketId` | ยังไม่ scaffold |
| `licenses` | `/licenses` | Placeholder เท่านั้น |
| `license-detail` | `/licenses/:licenseId` | ยังไม่ scaffold |
| `inventory` | `/inventory` | ยังไม่ scaffold (ไม่อยู่ใน minimum list ของ scaffold นี้) |
| `procurement` | `/procurement` | ยังไม่ scaffold |
| `audit` | `/audit` | ยังไม่ scaffold |
| `documents` | `/documents` | ยังไม่ scaffold |
| `approvals` | `/approvals` | ยังไม่ scaffold |
| `reports` | `/reports` | ยังไม่ scaffold |
| `analytics` | `/analytics` | ยังไม่ scaffold |
| `notifications` | `/notifications` | ยังไม่ scaffold |
| `administration` | `/administration` | ยังไม่ scaffold |
| `user-management` | `/administration/users` | ยังไม่ scaffold |
| `role-management` | `/administration/roles` | ยังไม่ scaffold |
| `settings` | `/settings` | ยังไม่ scaffold |
| `profile` | `/profile` | ยังไม่ scaffold |
| `ai-decision` | `/ai` | Placeholder เท่านั้น (ตาม minimum scaffold list) |
| `forgot-password` | `/forgot-password` | ยังไม่ scaffold |
| `register` | `/register` | ยังไม่ scaffold |
| `404` | `*` (catch-all) | Scaffolded |
| `403` | `/403` | ยังไม่ scaffold (ไม่อยู่ใน minimum list) |

Path parameter ใช้ URL segment จริง (`:assetId` เป็นต้น) แทนที่การส่ง `aid` ผ่าน `navigate(id, aid)` ของเดิม — ทำให้ deep-link/share URL ใช้ได้จริงเป็นครั้งแรก (แก้ technical debt ที่ระบุไว้ใน FRONTEND-MIGRATION-ANALYSIS.md ข้อ 5)

## Deviation จาก company template ที่บันทึกไว้ (ตามกฎ "document it")

1. **Design system**: ใช้ Tailwind v4 tokens ของ ESAPS (`brand`/`accent`/`success`/`warning`/`error`) แทนสี `primary` (`#E50141`) ของ template — เหตุผลและรายละเอียดอยู่ใน [[FRONTEND-MIGRATION-ANALYSIS|FRONTEND-MIGRATION-ANALYSIS.md]] ข้อ 3
2. **Layout**: ใช้ `AppShell` ของ ESAPS แทน `Navbar` ของ template — เหตุผล: `AppShell` สมบูรณ์กว่ามาก (sidebar, responsive, AI assistant, notification) ไม่มีเหตุผลด้านวิศวกรรมที่จะถอยไปใช้ของที่ด้อยกว่า
3. **Test runner**: เพิ่ม Vitest ที่ไม่มีอยู่ในทั้งสองแหล่งต้นทาง — เหตุผล: ต้องมี test runner บ้าง ("Definition of Done" ข้อ "Tests pass if configured") และ Vitest คือคู่ Vite โดยตรง ไม่ขัดกับ convention ใดของ template เพราะ template ไม่ได้กำหนดไว้เลย
4. **Font**: ยังไม่ย้าย Google Font `Prompt` ของ template เข้ามาใน phase นี้ (ESAPS เดิมใช้ font ระบบของ Tailwind default) — ทิ้งไว้เป็น open question สำหรับ business owner/design review ในรอบถัดไป ไม่ตัดสินใจแทนในเอกสารนี้
