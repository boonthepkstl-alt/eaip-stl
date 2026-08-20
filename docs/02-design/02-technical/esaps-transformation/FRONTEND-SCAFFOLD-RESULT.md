# Frontend Scaffold Result — RAISE

อ้างอิงจาก [[FRONTEND-MIGRATION-BOUNDARY|FRONTEND-MIGRATION-BOUNDARY.md]]. บันทึกผลจริงของการ scaffold `frontend/` (คำสั่งที่รันจริงและผลลัพธ์จริง ไม่ใช่การอ้างว่าสำเร็จโดยไม่ตรวจสอบ)

## ตำแหน่ง scaffold

`frontend/` ที่ root ของ repo (แยกจาก `src/`/`server.ts` เดิมของ ESAPS ที่ยังคงอยู่ครบ ไม่ถูกแก้ไข) — เพิ่ม config `raise-frontend` ใน `.claude/launch.json` (port 5173, `npm --prefix frontend run dev`) เพื่อเปิด preview ได้โดยไม่ชนกับ `prototype-static-server` เดิม (port 4173)

## โครงสร้างที่ scaffold จริง

```text
frontend/
├── index.html, package.json, tsconfig.json, tsconfig.node.json
├── vite.config.ts, vitest.config.ts, .eslintrc.cjs, .prettierrc, .env.example, .gitignore
├── public/vite.svg
└── src/
    ├── main.tsx, App.tsx, index.css, vite-env.d.ts
    ├── components/
    │   ├── ErrorBoundary.tsx        (FOUNDATION — จาก template)
    │   ├── AppShell.tsx             (SHARED — ported จาก ESAPS, ตัด mock-data/AIAssistantDrawer coupling)
    │   └── ui/ (19 component + index.ts)  (SHARED — copy ตรงจาก ESAPS)
    ├── config/constants.ts (FOUNDATION), navigation.ts (SHARED, copy ตรง)
    ├── contexts/AuthContext.tsx (FOUNDATION, ปรับ storage key + role type)
    ├── lib/cn.ts (SHARED, copy ตรง)
    ├── services/api-client.ts, auth-service.ts (FOUNDATION, ต่อ go-template contract)
    ├── types/api.ts (copy ตรงจาก template), auth.ts (ปรับ role ตาม AUTH-RBAC.md)
    ├── pages/Login, Dashboard, NotFound, modules.tsx (6 placeholder), _shared/ModulePage.tsx
    └── test/setup.ts, components/ui/Button.test.tsx (smoke test)
```

## คำสั่งที่รันจริงและผลลัพธ์จริง

| ขั้นตอน | คำสั่ง | ผลลัพธ์ |
|---|---|---|
| Install | `npm install` (ใน `frontend/`) | สำเร็จ — 339 packages, มี deprecation warning จาก ESLint 8/`@humanwhocodes/*` (dependency ของ template เดิม ไม่ใช่สิ่งที่เพิ่มใหม่) และ 5 vulnerability (3 moderate/1 high/1 critical) จาก `npm audit` — **ยังไม่ได้รัน `npm audit fix` ในรอบนี้** ต้องตรวจสอบก่อนขึ้น production จริง |
| Type check | `npx tsc --noEmit` | **รอบแรกพบ error จริง 3 จุด** จากการเปิด `strict`/`noUnusedLocals` ตามมาตรฐาน template (ตรงกับที่คาดการณ์ไว้ใน FRONTEND-MIGRATION-ANALYSIS.md ว่า ESAPS เดิมไม่ได้ตั้ง flag เหล่านี้): `ErrorBoundary.tsx`/`Modal.tsx` import `React` โดยไม่ใช้ (ไม่จำเป็นกับ JSX transform ปัจจุบัน), `navigation.ts` import `UserCheck` icon ที่ไม่ได้ใช้ — **แก้แล้วทั้ง 3 จุด**, รันซ้ำผ่านสะอาด (exit 0, ไม่มี output) |
| Build | `npm run build` (`tsc && vite build`) | สำเร็จ — `dist/index.html` 0.53 kB, `dist/assets/*.css` 29.31 kB (gzip 6.39 kB), `dist/assets/*.js` 324.55 kB (gzip 104.09 kB), build ใน 9.09s |
| Lint | `npm run lint` (`--max-warnings 0` ตาม template) | **รอบแรกพบ warning จริง 3 จุด** (`react-refresh/only-export-components`) ใน `Alert.tsx`, `Toast.tsx` (มาจาก UI kit ของ ESAPS ที่ colocate helper/hook กับ component), `AuthContext.tsx` (มาจาก pattern เดียวกับ `AuthContext.tsx` ของ **template เอง** — พิสูจน์ว่า template's own reference code ก็ไม่ผ่าน `--max-warnings 0` ของตัวเองถ้าเอาไปรันตรงๆ) — **แก้ด้วย `eslint-disable-next-line` ที่มี comment อธิบายเหตุผลไว้ทั้ง 3 จุด** (ไม่ได้ปิด rule ทั้งโปรเจกต์) รันซ้ำผ่านสะอาด |
| Test | `npm run test` (`vitest run`) | สำเร็จ — 1 test file, 2 test ผ่านทั้งหมด (สร้าง smoke test ใหม่สำหรับ `Button` component เพราะไม่มี test เดิมให้รันในทั้งสองแหล่งต้นทาง) |
| Dev server + browser check | `npm --prefix frontend run dev` ผ่าน `preview_start`, ตรวจด้วย `get_page_text`/`read_console_messages`/`read_network_requests` | `/` (ไม่ login) → redirect ไป `/login` ถูกต้อง, แสดงฟอร์ม RAISE เรียบร้อย ไม่มี console error; ตั้ง `localStorage` token/user จำลอง (ไม่แตะ backend จริง) แล้วเข้า `/dashboard` และ `/assets` → AppShell + placeholder page render ถูกต้อง ไม่มี console error, ไม่มี network request ล้มเหลว |

## ปัญหาที่พบจริงระหว่าง scaffold (ไม่ใช่ assumption)

1. **`react-router-dom` เวอร์ชันจริงใน template คือ v7** ไม่ใช่ v6 ตามที่ README ของ template เขียนไว้ — ใช้ v7 ตรงตาม `package.json` จริงของ template (ข้อมูลนี้บันทึกไว้แล้วใน [[FRONTEND-MIGRATION-ANALYSIS|FRONTEND-MIGRATION-ANALYSIS.md]])
2. **`tsconfig` ของ template (`strict`/`noUnusedLocals`/`noUnusedParameters`) จับ error จริงที่ซ่อนอยู่ในโค้ดที่ port มาจากทั้ง ESAPS และ template เอง** — ยืนยันว่าการเปิด strict mode มีประโยชน์จริง ไม่ใช่แค่ทฤษฎี
3. **`--max-warnings 0` ของ template เข้มกว่าที่ reference code ของ template เองผ่านได้** (กรณี `AuthContext.tsx`) — เป็นข้อสังเกตที่ควรแจ้ง reviewer ของ template เผื่อทีมอื่นเจอปัญหาเดียวกัน แต่ไม่ใช่สิ่งที่ต้องแก้ใน `template/react-template-main/` เอง (ห้ามแก้ไฟล์ template ตรงๆ)
4. **`npm audit` รายงาน 5 vulnerabilities รวม 1 critical** — เป็น dependency ของ ESLint 8 toolchain ที่ template เลือกใช้ ยังไม่ได้แก้ในรอบนี้ (scope ของ phase นี้คือพิสูจน์ architecture ไม่ใช่ security hardening) แต่ต้องกลับมาตรวจก่อน production ตาม [[SECURITY|SECURITY.md]]

## Definition of Done — ตรวจสอบจริง

```text
[x] react-template-main ถูกวิเคราะห์จาก source จริง
[x] ESAPS frontend ถูกวิเคราะห์จาก source จริง
[x] Architecture comparison มีเอกสาร (FRONTEND-MIGRATION-ANALYSIS.md)
[x] Migration boundary มีเอกสาร (FRONTEND-MIGRATION-BOUNDARY.md)
[x] KEEP/MIGRATE/REFACTOR/REPLACE/REMOVE/NEW ระบุครบในตาราง comparison
[x] Target frontend structure ถูกกำหนด (FOUNDATION/BUSINESS/SHARED/LEGACY)
[x] Scaffold ใหม่มีอยู่จริงที่ frontend/
[x] Company template convention ถูกรักษาไว้ (tsconfig strict, eslint/prettier config, script names, path alias @/)
[x] src/ เดิมยังอยู่ครบ ไม่ถูกแก้ไข
[x] server.ts ยังอยู่ครบ ไม่ถูกแก้ไข
[x] Mock data (src/data/*.ts) ยังอยู่ครบเป็น reference — ไม่ถูกย้าย/ลบ ไม่ถูกดึงเข้า frontend/ ใหม่
[x] API boundary มีอยู่ (services/api-client.ts, auth-service.ts — ไม่เรียก Gemini/DB ตรง)
[x] Routing ทำงานจริง (ตรวจใน browser แล้ว)
[x] App shell ทำงานจริง (ตรวจใน browser แล้ว)
[x] Environment configuration มีอยู่ (.env.example: VITE_API_BASE_URL, VITE_APP_ENV)
[x] TypeScript ผ่าน (แก้ 3 error แล้วผ่านสะอาด)
[x] Build ผ่าน
[x] Lint ผ่าน (แก้ 3 warning แล้วผ่านสะอาด ด้วย --max-warnings 0)
[x] Test ผ่าน (เพิ่ม Vitest ใหม่ + smoke test 2 เคส)
[x] เอกสารอัปเดตครบ (ดูหัวข้อถัดไป)
```

## Deviation ที่ยังเปิดอยู่ (ไม่ได้ตัดสินใจแทนในเอกสารนี้)

- Google Font `Prompt` ของ template ยังไม่ถูกนำเข้ามาใน `frontend/index.html` — รอ design review ตาม [[FRONTEND-MIGRATION-BOUNDARY|FRONTEND-MIGRATION-BOUNDARY.md]]
- `npm audit` vulnerabilities ของ ESLint 8 toolchain — ยังไม่แก้ ต้องกลับมาพิจารณาก่อน production
- Zustand ถูกตัดออกจาก `package.json` ของ scaffold นี้ (ไม่ใช่ dependency ที่จำเป็นตอนนี้) — เพิ่มกลับเมื่อมี state ข้าม component ที่ซับซ้อนจริง ตามที่ระบุไว้ใน [[FRONTEND-MIGRATION-ANALYSIS|FRONTEND-MIGRATION-ANALYSIS.md]]

## ขั้นต่อไป

Scaffold นี้เป็น **foundation ที่พร้อมสำหรับ Phase 6 เป็นต้นไปของ [[MIGRATION-PLAN|MIGRATION-PLAN.md]]** (ย้าย business module ทีละตัวจาก `src/pages/*.tsx` เดิมเข้า `frontend/src/pages/`) — **ยังไม่ควร migrate หน้าธุรกิจจริงต่อในรอบนี้** ตามข้อกำหนดของ phase นี้ ("Do not proceed to full business-module migration until the scaffold passes the Definition of Done") ซึ่งผ่านครบแล้วตามตารางด้านบน
