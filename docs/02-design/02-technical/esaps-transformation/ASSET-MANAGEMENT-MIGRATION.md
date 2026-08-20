# Asset Management Vertical Slice — Migration Record (Phase 4)

อ้างอิงจาก [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 6 (renumbered into this Phase 4 per user request — ดู [[INDEX|INDEX.md]]) และ [[FRONTEND-MIGRATION-BOUNDARY|FRONTEND-MIGRATION-BOUNDARY.md]]. บันทึกนี้คือผลจริงของการ migrate — ทุกคำสั่ง verification ถูกรันจริงแล้ว ไม่ใช่การอ้างว่าเสร็จโดยไม่ตรวจสอบ

## Scope ที่ migrate จริงในรอบนี้

| หน้า/ไฟล์เดิม | ปลายทางใหม่ | Route |
|---|---|---|
| `src/pages/AssetList.tsx` | `frontend/src/pages/Assets/index.tsx` | `/assets` |
| `src/pages/AssetDetail.tsx` | `frontend/src/pages/AssetDetail/index.tsx` | `/assets/:assetId` |
| `src/pages/CreateAsset.tsx` | `frontend/src/pages/CreateAsset/index.tsx` | `/assets/create` |
| `src/pages/Assignment.tsx` | `frontend/src/pages/Employees/index.tsx` | `/employees` |
| `src/components/DataTable.tsx` | `frontend/src/components/DataTable.tsx` | (shared component) |
| `src/data/mockData.ts` (ทั้งไฟล์) | `frontend/src/data/fixtures/mockData.ts` | (fixture, ไม่ import ตรงจากหน้าธุรกิจอีกต่อไป — ดูหัวข้อ Service Boundary) |
| `src/data/aiData.ts`, `src/data/requisitionData.ts` (ทั้งไฟล์) | `frontend/src/data/fixtures/{aiData,requisitionData}.ts` | (fixture — ยังใช้ตรงใน AssetDetail's License/Maintenance/AI tab เพราะเป็นโดเมนอื่น ดูหัวข้อ Known Cross-Domain Coupling) |

`src/`, `server.ts` ที่ root **ไม่ถูกแก้ไขเลย** ตลอด phase นี้ (ตรวจแล้วด้วย `ls -la` เทียบ mtime — ยังเป็น 2026-08-16 เหมือนก่อนเริ่ม)

**หมายเหตุเรื่อง route ของ `Assignment.tsx`**: prompt ต้นฉบับของ phase นี้เสนอ route `/assets/:id/assignment` แต่จากการอ่านโค้ดจริงแล้ว `Assignment.tsx` คือหน้า **"Employee Management" แบบ standalone เต็มหน้า** (มี KPI, ตาราง employee ทั้งบริษัท, modal add/assign/transfer) ไม่ใช่ sub-form ผูกกับ asset หนึ่งตัว — ตรงกับ `id: 'assignment'` ใน `config/navigation.ts` ที่ map ไปเมนู "Employee Management" อยู่แล้ว จึง migrate ไปเป็น route แยก `/employees` ตามที่ [[FRONTEND-MIGRATION-BOUNDARY|FRONTEND-MIGRATION-BOUNDARY.md]] (Phase 3) กำหนดไว้แล้ว ไม่ใช่ nested route — เป็นการยึด "existing implementation is the business behavior reference" ตามกฎของ phase นี้เอง

## Component Classification (KEEP / MIGRATE / REFACTOR / REPLACE / REMOVE / NEW)

| Component/ไฟล์ | Classification | เหตุผล |
|---|---|---|
| `components/ui/*` (19 component, จาก Phase 3) | **KEEP** | ใช้ตรงๆไม่ต้องแก้ — พิสูจน์แล้วว่า pattern เดิมรองรับหน้าธุรกิจจริงได้โดยไม่ต้องเปลี่ยน |
| `components/DataTable.tsx` | **MIGRATE** | ย้ายเข้า `frontend/` ตรงๆ ไม่มี business logic ผูกอยู่ ใช้ได้กับทุก entity ที่มี `id: string` |
| `AppShell.tsx` (จาก Phase 3) | **REFACTOR (bug fix)** | พบบั๊กจริงระหว่าง route test: ปุ่ม "New Asset" ในแถบบนของ AppShell เดิม navigate ไปหน้า `assets` เฉยๆ (เขียนผิดตอน Phase 3) แก้เป็น `assets/create` แล้ว — ดูหัวข้อ Bugs Found |
| `Asset` domain type | **REFACTOR** | ตัด `icon: LucideIcon` ออกจาก type (presentation concern) ย้ายไป `data/asset-icons.ts` ที่เหลือคงโครงเดิมไว้ (ดู [[ASSET-MANAGEMENT-API-CONTRACT|ASSET-MANAGEMENT-API-CONTRACT.md]]) |
| `src/data/mockData.ts` → asset-related exports | **MIGRATE + wrap ด้วย service boundary** | ย้ายไฟล์ทั้งไฟล์เข้า fixtures ตรงๆ (ตามกฎ "reuse existing mock data, don't create a second dataset") แต่หน้าธุรกิจไม่ import ตรงจาก fixture อีกต่อไป — เรียกผ่าน `assetService` เท่านั้น |
| Employee domain (`departments`, `locations`, `employees`) | **KEEP AS-IS (deferred)** | ยังไม่มี `EmployeeService` ในรอบนี้ (Phase 5 ตาม MIGRATION-PLAN.md) — `pages/Employees` อ่าน employee list เป็น local state ที่ seed จาก fixture ตรงๆ ยังไม่ผ่าน service layer |
| `src/pages/AssetDetail.tsx`'s License/Maintenance/AI tabs (`softwareLicenses`, `requisitionData`, `getAssetHealth`) | **KEEP AS-IS (deferred)** | ข้อมูลเหล่านี้เป็นของโดเมน License/Maintenance/AI ไม่ใช่ Asset — ดึง `assetService` มาครอบตอนนี้จะ misattribute ownership ผิดโดเมน คงอ่านจาก fixture ตรงในหน้านี้ไปก่อน จนกว่าจะมี service ของแต่ละโดเมนใน Phase 5/7 |
| `AIAssistantDrawer.tsx`, `Charts.tsx` | **NOT MIGRATED** | ไม่ได้ใช้งานในหน้า Asset Management เลย (Phase 3 ตัดออกจาก AppShell ไปแล้วด้วยเหตุผลเดียวกัน — coupling กับ mock data) ยังไม่ต้อง migrate จนกว่าจะมีหน้าที่ใช้จริง |
| ชื่อ package `react-example` ที่ root เดิม | **REMOVE (ในอนาคต ไม่ใช่รอบนี้)** | ยังไม่แก้ ตามกฎ "ห้ามแก้ legacy source" — บันทึกไว้เป็น backlog สำหรับตอนที่ประกาศ deprecate `src/` เดิมอย่างเป็นทางการ |

## Business Component Boundary ที่ใช้จริง

Prompt ต้นฉบับเสนอ `features/assets/{components,hooks,services,types}` แต่ **`template/react-template-main` ไม่ได้กำหนด convention แบบ `features/` ไว้เลย** (ยืนยันจาก README จริงที่อ่านใน Phase 3 — ใช้ `pages/{Feature}/index.tsx + _components/`, `services/{domain}.ts`, `types/{domain}.ts` แยกกันในระดับ `src/` ตรงๆ) ตามกฎ "the company template's actual structure takes precedence" จึงใช้โครงจริงนี้แทน:

```text
frontend/src/
├── pages/Assets/index.tsx           # /assets
├── pages/AssetDetail/index.tsx      # /assets/:assetId
├── pages/CreateAsset/index.tsx      # /assets/create
├── pages/Employees/index.tsx        # /employees
├── components/DataTable.tsx         # generic — ไม่ใช่ asset-specific
├── data/asset-icons.ts              # presentation-only icon resolver
├── data/fixtures/{mockData,aiData,requisitionData}.ts
├── hooks/{useAssets,useAsset}.ts
├── services/{asset-repository,asset-service}.ts
└── types/{asset,employee}.ts
```

## Bugs Found During Migration (ยืนยันด้วย test จริง ไม่ใช่ code review เฉยๆ)

1. **AppShell "New Asset" quick action นำทางผิด** — เขียนไว้ใน Phase 3 ว่า `onClick={() => onNavigate('assets')}` (ไปหน้า assets list เฉยๆ ไม่มี action) ที่ถูกต้องคือ `onNavigate('assets/create')` พบจาก test `App.route.test.tsx` ที่ล้มเหลวตอนคลิกปุ่มแล้วไม่เห็นฟอร์ม "Basic Information" — แก้แล้ว, test ผ่านหลังแก้

## Known Cross-Domain Coupling (tech debt ที่ตั้งใจทิ้งไว้ พร้อมแผนปิดในอนาคต)

- `pages/AssetDetail/index.tsx` อ่าน `softwareLicenses` (License), `requisitionData`/`getAssetHealth` (Maintenance/AI) ตรงจาก fixture — ต้อง refactor เป็น `licenseService`/`maintenanceService`/AI grounding เมื่อถึง Phase 5 (License/Maintenance) และ Phase 7 (AI) ตาม [[MIGRATION-PLAN|MIGRATION-PLAN.md]]
- `pages/Employees/index.tsx` จัดการ employee list เป็น local state ล้วนๆ ไม่มี `EmployeeService` — จะ formalize พร้อม Phase 5
- Ticket detail drawer เดิมใน `AssetDetail.tsx` (4-stage governance timeline แบบเต็ม) ถูกย่อเหลือแค่สรุปสั้นในเวอร์ชัน migrate เพราะรายละเอียดเต็มเป็นของ Maintenance module — จะย้าย full drawer ไปที่ `pages/Maintenance` ตอน Phase 5

## Regression Comparison — Legacy vs. Migrated

ตรวจด้วยการรันจริงใน browser preview (`frontend`, `npm run dev`) เทียบกับโค้ด/พฤติกรรมของ `src/pages/*.tsx` เดิม:

| Behavior | Legacy (`src/`) | Migrated (`frontend/`) | ผลต่าง |
|---|---|---|---|
| Asset list, search, filter, pagination | ทำงานจาก mock array ตรง | ทำงานผ่าน `assetService.listAssets()` (Mock repository) | เหมือนกันทุกอย่างสำหรับผู้ใช้ ต่างกันแค่ชั้น implementation |
| Asset detail: header/specs/warranty/AI health/active ticket banner | อ่าน mock ตรง | อ่านผ่าน `useAsset()` (asset core) + fixture ตรง (license/maintenance/AI tab) | เหมือนกัน — ยืนยันแล้วด้วย browser check จริง (ดูค่า Health Score 88, AST-0001 ฯลฯ ตรงกับ mock เดิมทุกตัว) |
| Create Asset 4-step wizard | จบด้วย toast เท่านั้น ไม่มี "การสร้างจริง" | จบด้วย `assetService.createAsset()` จริง — asset ใหม่ปรากฏในรายการทันที (ยืนยันแล้ว: 15→16 assets) | **ดีขึ้น** — พฤติกรรมสมจริงกว่าเดิม ไม่ใช่ regression |
| Assign/Transfer asset ใน Employee Management | mutate local state เฉพาะหน้านั้น | `assetService.assignAsset()` เขียนเข้า repository ตัวเดียวกันที่ AssetList/AssetDetail อ่านอยู่ — ยืนยันแล้ว: assign แล้ว "Available Stock" ลดลงจริง, asset ปรากฏใต้ employee ทันที | **ดีขึ้น** — แก้ปัญหาเดิมที่ Assignment.tsx มี asset list สำเนาแยกจาก AssetList.tsx ไม่ sync กัน |
| URL/deep-link | ไม่มี — เปลี่ยนหน้าด้วย state เท่านั้น | มี URL จริงทุกหน้า, back/forward ใช้ได้ | **ดีขึ้น** — เจตนา ตามที่ระบุใน FRONTEND-MIGRATION-ANALYSIS.md |

ไม่พบ regression ที่ไม่ตั้งใจจากการตรวจนี้
