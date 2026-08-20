# Asset Management — Frontend Service Contract & Target API (Phase 4)

อ้างอิงจาก [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]] และ [[API-SPECIFICATION|API-SPECIFICATION.md]]. เอกสารนี้บันทึกสัญญาจริงที่ `frontend/src/services/asset-service.ts` implement ไว้แล้ว (มี `MockAssetRepository` เป็น implementation เดียวในตอนนี้) และ endpoint ฝั่ง Go backend ที่ยังไม่มีอยู่จริงซึ่งต้อง implement ให้ตรงสัญญานี้ในอนาคต — ไม่มีการเขียนโค้ด Go จริงใน phase นี้

## Frontend contract ที่มีอยู่แล้ว (`frontend/src/services/asset-repository.ts`)

```ts
interface AssetRepository {
  list(query: AssetListQuery): Promise<AssetListResult>;
  getById(id: string): Promise<Asset | null>;
  create(input: CreateAssetInput): Promise<Asset>;
  assign(input: AssignAssetInput): Promise<Asset>;
}
```

`assetService` (`frontend/src/services/asset-service.ts`) exposes `listAssets`, `getAsset`, `createAsset`, `assignAsset` — ทุกหน้าใน `pages/Assets`, `pages/AssetDetail`, `pages/CreateAsset`, `pages/Employees` เรียกผ่านนี้เท่านั้น

## Target Go endpoint mapping (ยังไม่ implement — เอกสารไว้ก่อนตาม API-SPECIFICATION.md)

| Frontend call | Go endpoint | หมายเหตุ |
|---|---|---|
| `assetService.listAssets({ search, status, department, page, limit })` | `GET /api/v1/assets?search=&status=&department=&page=&limit=` | ตรงกับ pattern `model.PaginationQuery`/`PaginatedResponse` ของ `go-template-main` |
| `assetService.getAsset(id)` | `GET /api/v1/assets/:id` | คืน 404 เมื่อไม่พบ — frontend แปลงเป็น `notFound: true` ผ่าน `useAsset` แล้ว (ดู hook จริง) |
| `assetService.createAsset(input)` | `POST /api/v1/assets` | ต้องมี `RequireRole('IT_STAFF', 'IT_MANAGER', 'ADMIN')` ตาม AUTH-RBAC.md |
| `assetService.assignAsset({ assetId, employeeId, employeeName, notes })` | `POST /api/v1/assets/:id/assign` | **field `employeeName` ในสัญญาปัจจุบันเป็น workaround ฝั่ง frontend** เพราะยังไม่มี Employee service — backend จริงควร lookup employee name จาก `employeeId` เอง ไม่รับชื่อจาก client (ป้องกัน client ส่งชื่อเพี้ยน) ดูหัวข้อ Deviation ด้านล่าง |

## Response/Request shape

```ts
// GET /api/v1/assets → AssetListResult
interface AssetListResult { data: Asset[]; total: number }

interface Asset {
  id: string; code: string; name: string; category: string; type: string;
  status: 'Available' | 'Assigned' | 'In Maintenance' | 'Retired';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  location: string; department: string;
  assignedTo: string | null; assignedEmployeeId?: string | null; assignedDate?: string;
  purchaseDate: string; purchaseCost: number; currentValue: number;
  warrantyExpiry: string; vendor: string; serialNumber: string;
  specs: { label: string; value: string }[];
}

// POST /api/v1/assets ← CreateAssetInput
interface CreateAssetInput {
  name: string; code?: string; category: string; type: string; serialNumber: string;
  vendor?: string; purchaseCost: number; purchaseDate: string; warrantyExpiry?: string;
  department: string; location: string; condition: Asset['condition']; description?: string;
}

// POST /api/v1/assets/:id/assign ← AssignAssetInput
interface AssignAssetInput { assetId: string; employeeId: string; employeeName: string; notes?: string }
```

`icon: LucideIcon` **ไม่อยู่ใน field ใดเลย** — เป็นผลจากการ REFACTOR ใน Phase 4 (ดู [[ASSET-MANAGEMENT-MIGRATION|ASSET-MANAGEMENT-MIGRATION.md]]) ฝั่ง frontend resolve icon จาก `type` ผ่าน `data/asset-icons.ts` เอง Go backend ไม่ต้องรู้จัก concept นี้เลย

## Deviation จาก API-SPECIFICATION.md เดิมที่ต้องบันทึกไว้

`API-SPECIFICATION.md` (เขียนไว้ตั้งแต่รอบวิเคราะห์ก่อน Phase 4) ระบุ `POST /api/v1/assets/:id/assign` ไว้แล้วแต่ไม่ได้ระบุ request body ชัดเจน — Phase 4 นี้เติมรายละเอียดจริง (`{ employeeId, employeeName, notes }`) จากการต้อง implement mock repository จริง **field `employeeName` เป็นสัญญาณว่า asset service ไม่ควรเป็นเจ้าของข้อมูล employee** เมื่อ backend จริง implement ควรเปลี่ยนเป็นรับแค่ `employeeId` แล้ว join กับ employee table เอง — ต้องปรับ [[API-SPECIFICATION|API-SPECIFICATION.md]] ให้ตรงเมื่อ Employee service (Phase 5) formalize เสร็จ

## สถานะการ implement จริง ณ ตอนนี้

- **Frontend**: implement ครบ, ทดสอบผ่านทั้ง unit test (`asset-service.test.ts`, 6 เคส) และ browser check จริง (list/detail/create/assign ทำงานถูกต้อง)
- **Backend (Go)**: **ยังไม่ implement เลย** — เป็นสัญญาที่ backend phase ([[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 4 เดิม/ย้ายไปหลัง Phase 4 นี้ตามลำดับใหม่ที่ผู้ใช้เสนอ) ต้อง implement ให้ตรงตามนี้ก่อนสลับ `MockAssetRepository` → `HttpAssetRepository`
