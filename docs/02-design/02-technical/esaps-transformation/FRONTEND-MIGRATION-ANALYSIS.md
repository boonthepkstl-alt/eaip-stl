# Frontend Migration Analysis — RAISE

อ้างอิงจาก [[IMPLEMENTATION-READINESS-REVIEW|IMPLEMENTATION-READINESS-REVIEW.md]] และ [[ARCHITECTURE-COMPARISON|ARCHITECTURE-COMPARISON.md]] (ฉบับนี้เจาะเฉพาะ frontend ลงรายละเอียดถึง source code จริง ไม่ใช่แค่ README) เอกสารนี้เป็น Phase 3 ของ [[MIGRATION-PLAN|MIGRATION-PLAN.md]]

## 1. Company React Template — อ่านจาก source จริง (ไม่ใช่แค่ README)

### Project config
- `package.json`: `react-router-dom` **^7.10.1** ใน dependency จริง — **ไม่ตรงกับที่ README เขียนไว้ว่า "React Router 6"** (README ล้าสมัยกว่า dependency จริง) React 18.2, Zustand 4.4.7, Axios 1.6.2, Vite 5.0.8, TS 5.2.2, Tailwind 3.4.0, ESLint 8 + `@typescript-eslint` v6
- `tsconfig.json`: `strict: true`, `noUnusedLocals`/`noUnusedParameters: true` (เข้มกว่า ESAPS ปัจจุบันซึ่งไม่มี strict flags พวกนี้ระบุไว้), path alias `@/*` → `./src/*`
- `vite.config.ts`: proxy `/api` → `env.VITE_PROXY_TARGET` (default `http://localhost:8000`)
- `.eslintrc.cjs`: `eslint:recommended` + `@typescript-eslint/recommended` + `react-hooks/recommended`, `no-explicit-any: warn`, `max-warnings 0` ใน script `lint`
- `.prettierrc`: semi, single quote, printWidth 100
- ไม่มี test runner ผูกไว้ใน `package.json` (ยืนยันซ้ำ — ไม่มีมาตรฐาน test ให้อ้างอิงจาก template นี้)
- ไม่มี `.env`/`.env.example` จริงในโฟลเดอร์ (แค่ระบุใน README/SETUP.md ว่าต้องสร้างเอง)

### Architecture (อ่านจริงจาก `App.tsx`, `main.tsx`, `AuthContext.tsx`, `services/api.ts`)
- Entry: `main.tsx` → `ReactDOM.createRoot` + `React.StrictMode` (ไม่มี provider อื่นห่อเพิ่ม)
- Routing: `BrowserRouter` + `Routes`/`Route` จาก `react-router-dom`, `ProtectedRoute` เป็น component ที่ return `<Outlet/>` หรือ `<Navigate to="/login"/>` ตาม `isAuthenticated`
- Auth: `AuthContext` เก็บ `user`/`token` ใน `localStorage` (key `token`/`user`) ไม่ใช้ cookie, `login()`/`logout()` เรียก `authAPI` (axios) ตรงๆ ไม่มี Zustand เข้ามาเกี่ยวกับ auth เลย (Zustand เป็น dependency แต่ไม่พบการใช้งานจริงในไฟล์ที่ตรวจ — เหมือนกรณี Supabase ของ ESAPS)
- API client: axios instance เดียว (`services/api.ts`) พร้อม request interceptor (inject Bearer token จาก localStorage) และ response interceptor (401 → clear storage + hard redirect `/login`)
- Error handling: `ErrorBoundary` (class component) ห่อทั้ง `App` ที่ระดับบนสุด
- หน้าจอที่มีจริง: มีแค่ `Login`, `Dashboard` (+ `_components/DashboardHeader`, `DashboardStats`) — ไม่มีหน้าอื่น เป็น skeleton ตัวอย่างเท่านั้น

### Design system
- Tailwind 3.4 config: font `Prompt` (Google Font, โหลดผ่าน `index.html`), สี `primary` scale เดียว (`#E50141`, สีชมพู/แดง), ที่เหลือใช้ Tailwind `gray` default ตรงๆ ไม่มี custom semantic color (success/warning/error) และ**ไม่มี component ใดๆ นอกจาก `Navbar`/`Loading`/`ErrorBoundary`** — ไม่มี Button/Card/Modal/Table ให้เลย

## 2. Existing RAISE Frontend (ESAPS ที่ root) — อ่านจาก source จริง

### Project config
- `package.json` (root): React 19, Vite 6, TS 5.8, Tailwind **4.1** (ผ่าน `@tailwindcss/vite` plugin ไม่ใช่ `tailwind.config.js` แบบ v3), `lucide-react`, `motion` (framer-motion successor) — ไม่มี `react-router-dom`, ไม่มี `zustand`, ไม่มี `axios`
- `tsconfig.json` (root): ไม่มี `strict`/`noUnusedLocals`/`noUnusedParameters` ตั้งไว้เลย (ตรงข้ามกับ template ที่ตั้งเข้มทุกตัว) — เป็นช่องว่างด้าน type-safety ที่ต้องปิดเมื่อย้ายเข้า template
- `vite.config.ts` (root): ใช้ `@tailwindcss/vite` plugin (Tailwind v4 style, ไม่ใช้ PostCSS config แยกแบบ v3), มี comment เฉพาะของ Google AI Studio (`DISABLE_HMR`) ที่ไม่เกี่ยวกับ production
- ไม่มี ESLint config ที่ root เลย (`npm run lint` เดิมคือ `tsc --noEmit` เท่านั้น ไม่ใช่ ESLint จริง)

### Architecture (อ่านจริงจาก `App.tsx`, `routes/*`)
- Entry: `main.tsx` (ยังไม่ได้อ่านเนื้อหาเต็มในรอบนี้ แต่ import `App` เป็น root component เหมือน template)
- Routing: **ไม่มี router library** — `App.tsx` เก็บ `page: Page` (union type 30 ค่าใน `routes/types.ts`) ด้วย `useState`, ฟังก์ชัน `navigate(id, aid?)` เปลี่ยน state ตรงๆ, แยก `isStandalonePage()` สำหรับหน้า auth/error ที่ไม่ต้องมี `AppShell` ห่อ — เทียบเท่า "routing" ของ template แต่ implement เองทั้งหมดโดยไม่มี URL จริง (กด back/forward ของ browser หรือแชร์ URL ตรงไปหน้าใดหน้าหนึ่งไม่ได้เลยในปัจจุบัน — ข้อจำกัดสำคัญที่ template แก้ให้ฟรีด้วย `BrowserRouter`)
- Auth: ไม่มี `AuthContext` จริง — `isStandalonePage`/`STANDALONE_PAGES` ระบุ `login`/`forgot-password`/`register`/`404`/`403` เป็น constant แต่ไม่มี provider/token จัดการสถานะ login จริง (ตรงกับที่พบในรอบก่อนใน [[AUTH-RBAC|AUTH-RBAC.md]])
- API client: ไม่มี service layer รวม — เท่าที่ตรวจมี `fetch` ตรงไปยัง `/api/ai/*` เฉพาะจุดที่เรียก AI เท่านั้น หน้าจอ CRUD ทั้งหมดอ่านจาก `src/data/*.ts`
- Error handling: ไม่มี `ErrorBoundary` — มีแค่หน้า `404`/`403` เป็น UI (`ErrorPages.tsx`) ที่ navigate ไปเองเท่านั้น ไม่ใช่ React error boundary จริง

### Design system
- Tailwind v4 `@theme` ใน `src/index.css`: 5 scale เต็ม (`brand` น้ำเงิน `#3b82f6`, `accent` ม่วง `#6366f1`, `success`, `warning`, `error`) — **ครบกว่า template มาก** (template มีแค่ `primary` เดียว)
- Component: UI kit ครบ 19 component ใน `src/components/ui/` (`Button`, `Card`+`CardHeader`+`SectionCard`, `Badge`+`StatusBadge`, `Input`, `Select`, `Textarea`, `Checkbox`+`Checkbox2`, `Modal`+`ConfirmDialog`, `Drawer`, `Tabs`, `Avatar`, `Alert`, `Toast`+`ToastProvider`, `Dropdown`+`MenuButton`, `Breadcrumb`, `Pagination`, `Skeleton`, `EmptyState`, `Progress`) export รวมจาก `index.ts` เดียว — **ไม่มีสิ่งเทียบเท่านี้ใน template เลย**
- Utility: `lib/cn.ts` — className merge helper แบบง่าย (`filter(Boolean).join(' ')`) ไม่ใช้ `clsx`/`tailwind-merge` — ใช้งานได้แต่ไม่ merge conflicting Tailwind class (เช่น `p-2` ซ้อน `p-4`) เป็นข้อจำกัดเล็กที่ยอมรับได้ในขนาดปัจจุบัน

## 3. Design System — ข้อขัดแย้งที่ต้องตัดสินใจ (ไม่พบในรอบวิเคราะห์ก่อนหน้า)

`docs/02-design/DESIGN.md` (Design System ของ pipeline เอกสาร "tasks-mng") ถูกเขียนขึ้นโดยดึง token จาก **`template/react-template-main`** ตรงๆ (สี primary `#E50141`, font `Prompt`) ตามที่ระบุไว้ในเอกสารนั้นเอง แต่ ESAPS ที่ root ใช้ **Tailwind v4 @theme ของตัวเอง** (`brand` น้ำเงิน, `accent` ม่วง, ไม่มี `Prompt` font) ซึ่ง**ไม่ตรงกับ `DESIGN.md` เลย** — เป็นการค้นพบใหม่ของรอบนี้ ยังไม่มีที่ไหนพูดถึงมาก่อน

**คำแนะนำ**: ยึด **Tailwind v4 tokens ของ ESAPS เป็น design system จริงของ RAISE** ไม่ใช่ token pink ของ template หรือของ `DESIGN.md` เดิม เพราะ:
1. ตรงกับหลักการ "Preserve RAISE UI/UX" (Rule ของงานนี้) — UI ทั้ง 24 หน้าและ UI kit 19 component ถูกสร้างขึ้นบน token เหล่านี้อยู่แล้ว เปลี่ยนสีจะกระทบทุกหน้าจอ
2. `DESIGN.md` เดิมเขียนขึ้นสำหรับตัวอย่าง "tasks-mng" (โปรเจกต์ตัวอย่างของ starter-kit) ไม่ใช่ RAISE — ไม่มี dependency เชิงข้อกำหนดใดๆ ผูก RAISE ไว้กับ `DESIGN.md` ฉบับนั้น

**นี่คือ deviation จาก company template ที่ต้องบันทึกไว้อย่างชัดเจน** ตามกฎ "If a deviation is required, document it" — บันทึกใน [[FRONTEND-MIGRATION-BOUNDARY|FRONTEND-MIGRATION-BOUNDARY.md]] และควรแยกเขียน `docs/02-design/DESIGN.md` ฉบับใหม่สำหรับ RAISE โดยเฉพาะในงานถัดไป (ไม่ใช่ scope ของ Phase 3 นี้)

## 4. Architecture Comparison Matrix

| Area | react-template-main | Existing RAISE (ESAPS) | Decision |
|---|---|---|---|
| Entry Point | `main.tsx` → `createRoot` + `StrictMode`, ห่อด้วย `ErrorBoundary`→`BrowserRouter`→`AuthProvider` ใน `App.tsx` | `main.tsx` → `App` (ยังไม่มี provider ห่อ) | **MIGRATE** — ใช้โครง provider chain ของ template, ใส่ AppShell ของ ESAPS เป็น layout ภายใน route ที่ authenticated แล้ว |
| Routing | `react-router-dom` v7 (`BrowserRouter`/`Routes`/`Route`/`Outlet`), URL จริง, back/forward ใช้ได้ | `useState<Page>` ใน `App.tsx`, ไม่มี URL จริง, 30 page type ใน `routes/types.ts` | **REFACTOR** — ย้ายทุก page เข้า `react-router-dom`, แปลง `navigate(id, aid?)` เป็น `useNavigate()` + route param จริง (`/:id`) |
| Layout | `Navbar` แบบ static เดียว ไม่มี sidebar | `AppShell` (sidebar, responsive/mobile nav, search, AI Assistant, notification, profile, breadcrumb) | **KEEP** (ของ ESAPS) — `AppShell` สมบูรณ์กว่า `Navbar` ของ template มาก ไม่มีเหตุผลต้องแทนที่ |
| Components | มีแค่ 3 component ทั่วไป (`Navbar`, `Loading`, `ErrorBoundary`) ไม่มี UI kit | UI kit ครบ 19 component (`src/components/ui/`) | **KEEP** (ของ ESAPS) — ย้ายเข้า template ทั้งชุดตรงๆ |
| Design System | Tailwind 3.4, สี primary เดียว (`#E50141`), font `Prompt` | Tailwind 4 `@theme`, 5 semantic scale (brand/accent/success/warning/error) | **KEEP** (ของ ESAPS) + อัปเกรด Tailwind config เป็น v4 style ทั้ง project — ดูข้อ 3 ด้านบน |
| State | Zustand (dependency มีแต่ไม่ถูกใช้จริงในไฟล์ที่ตรวจ) | `useState` ระดับ `App.tsx` เท่านั้น | **NEW** — ยังไม่มีความจำเป็นต้องใช้ Zustand จนกว่าจะมี state ข้าม component ที่ซับซ้อนกว่านี้ (เช่น cart/filter ข้ามหน้า) เพิ่มเมื่อจำเป็นจริง ไม่ใส่ล่วงหน้า |
| API Client | axios instance เดียว + interceptor (auth inject, 401 redirect) ใน `services/api.ts` | ไม่มี service layer, `fetch` ตรงเฉพาะจุด (`/api/ai/*`), ที่เหลืออ่าน mock data | **MIGRATE** — ใช้ axios instance ของ template เป็นฐาน ขยายเป็น `services/{domain}.ts` ตาม [[API-SPECIFICATION|API-SPECIFICATION.md]] |
| Authentication | `AuthContext` (localStorage token) + `ProtectedRoute` | ไม่มีจริง — เป็น UI placeholder | **MIGRATE + REFACTOR ภายหลัง** — ใช้โครง `AuthContext`/`ProtectedRoute` ของ template ก่อนในรอบนี้ (localStorage token), จะสลับไปตาม [[AUTH-RBAC|AUTH-RBAC.md]] (cookie `stl_token`/RBAC เต็มรูปแบบ) ในรอบถัดไปเมื่อ backend Go พร้อม |
| Error Handling | `ErrorBoundary` (class component) ห่อทั้งแอป | ไม่มี React error boundary, มีแค่หน้า `404`/`403` เป็น UI | **MIGRATE** — เอา `ErrorBoundary` ของ template มาห่อ `App` ใหม่, คงหน้า `NotFound`/`AccessDenied` ของ ESAPS ไว้เป็น route `/404`/`/403` |
| Configuration | `.env`/`VITE_API_URL`/`VITE_PROXY_TARGET`, `src/config/constants.ts` (ROUTES, API_ENDPOINTS, STORAGE_KEYS) | `.env` มีแค่ `GEMINI_API_KEY` (คนละ concern — เป็นของ backend ไม่ใช่ frontend), `src/config/navigation.ts` (nav menu ไม่ใช่ route constant) | **NEW** — สร้าง `config/constants.ts` แบบ template แต่เพิ่ม `ROUTES` ให้ครบ 24 หน้าของ RAISE |
| Testing | ไม่มี test runner ใน template นี้เลย | ไม่มี test เลย | **NEW** — ต้องเลือก test runner เอง (ไม่มีมาตรฐานจาก template ให้ยึด) แนะนำ Vitest เพราะเป็นคู่ Vite โดยตรงและชุมชน React ใช้แพร่หลาย (ตัดสินใจนี้ไม่ขัดกับ template เพราะ template ไม่ได้กำหนดไว้เลย) |
| Build | `tsc && vite build`, `vite preview` | `vite build && esbuild server.ts ...` (รวม backend bundle เข้าไปด้วยเพราะเป็น full-stack prototype เดียว) | **MIGRATE** — แยก frontend build ออกจาก backend bundle ให้ตรงกับ template (`tsc && vite build` เท่านั้น ไม่ยุ่งกับ `server.ts`/`esbuild` อีกต่อไปในโครงใหม่) |
| Styling | Tailwind 3.4 + `postcss.config.js`/`autoprefixer` แยกไฟล์ | Tailwind 4 ผ่าน `@tailwindcss/vite` plugin (ไม่ต้องมี `postcss.config.js` แยก) | **KEEP** (ของ ESAPS) — Tailwind v4 เป็น major version ใหม่กว่า ตรงกับที่ CLAUDE.md อนุญาตให้ปรับ dependency version ใหม่กว่า template ได้ |

## 5. Technical debt ที่พบจริงใน ESAPS (เพิ่มเติมจากที่ระบุไว้ในรอบก่อน)

- **ไม่มี URL routing จริง** — เป็นข้อจำกัดที่สำคัญที่สุดที่ยังไม่ได้เน้นในรอบก่อน: ผู้ใช้แชร์ลิงก์ไปหน้า asset เฉพาะไม่ได้, browser back/forward ใช้ไม่ได้, ไม่มี deep-link สำหรับ notification/email ที่ควรพาไปหน้าที่เกี่ยวข้องตรง
- **tsconfig ไม่มี `strict` mode** — ต่างจาก template ที่ตั้ง `strict`/`noUnusedLocals`/`noUnusedParameters` ไว้ทั้งหมด เป็นความเสี่ยงเชิง type-safety ที่ต้องปิดตอน migrate (อาจเจอ type error ที่ซ่อนอยู่จำนวนหนึ่งตอนเปิด strict mode)
- **ไม่มี ESLint จริง** — `npm run lint` ปัจจุบันคือ `tsc --noEmit` เท่านั้น ไม่ตรวจ code style/hook rules เลย
- **`cn()` helper ไม่ merge Tailwind class ที่ขัดแย้งกัน** — ยอมรับได้ในขนาดปัจจุบัน แต่ควรพิจารณา `tailwind-merge` เมื่อ component ซับซ้อนขึ้น
