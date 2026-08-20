# Software License Management — Frontend Service Contract & Target API (Phase 5C)

อ้างอิงจาก [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]], [[MAINTENANCE-API-CONTRACT|MAINTENANCE-API-CONTRACT.md]] (รูปแบบเดียวกัน), [[API-SPECIFICATION|API-SPECIFICATION.md]]

## Frontend contract ที่มีอยู่แล้ว (`frontend/src/services/license-repository.ts`)

```ts
interface SoftwareLicenseRepository {
  list(query: LicenseListQuery): Promise<{ data: SoftwareLicense[]; total: number }>;
  getById(id: string): Promise<SoftwareLicense | null>;
  create(license: SoftwareLicense): Promise<SoftwareLicense>;
  update(id: string, patch: Partial<SoftwareLicense>): Promise<SoftwareLicense>;
  renew(id: string, input: RenewLicenseInput): Promise<SoftwareLicense>;
  allocateSeat(id: string, seat: AllocatedSeat): Promise<SoftwareLicense>;
  releaseSeat(id: string, seatId: string): Promise<SoftwareLicense>;
}
```

`licenseService` wraps this with `createLicense` (auto-generates `licenseCode`/`costPerSeat`), `allocateSeat` (resolves `employeeId`/`assetId` via `employeeService`/`assetService` before calling `repository.allocateSeat`), plus thin pass-throughs for the rest.

## Target Go endpoint mapping (ยังไม่ implement)

| Frontend call | Go endpoint | หมายเหตุ |
|---|---|---|
| `licenseService.listLicenses({ search, category, status, vendor })` | `GET /api/v1/licenses?...` | |
| `licenseService.getLicense(id)` | `GET /api/v1/licenses/:id` | |
| `licenseService.createLicense(input)` | `POST /api/v1/licenses` | backend generate `licenseCode`/`costPerSeat` แทน frontend (ปัจจุบัน frontend คำนวณเองเพราะยังไม่มี backend) |
| `licenseService.updateLicense(id, patch)` | `PATCH /api/v1/licenses/:id` | |
| `licenseService.renewLicense(id, input)` | `POST /api/v1/licenses/:id/renew` | รับ `addedYears`/`seatsPurchased`/`annualCost` |
| `licenseService.allocateSeat(id, input)` | `POST /api/v1/licenses/:id/seats` | รับ `employeeId`/`assetId`(optional)/`allocationRole` เท่านั้น (ไม่ใช่ embedded object) — backend join เอง แล้วเก็บ snapshot ที่ resolve แล้วลง DB (audit-trail-safe เหมือน Ticket) |
| `licenseService.releaseSeat(id, seatId)` | `DELETE /api/v1/licenses/:id/seats/:seatId` | |

## Response/Request shape

License shape ตรงกับ `SoftwareLicenseDetail` ใน fixture เดิมทุกประการ (ดู [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]]) — ไม่ทำซ้ำในเอกสารนี้เพราะยาวเกิน 100 บรรทัด อ้างอิง `frontend/src/data/fixtures/licenseData.ts` เป็น source of truth ของ shape จนกว่าจะมีการปรับ

```ts
interface CreateLicenseInput {
  product: string; vendor: string; category: LicenseCategory; type: LicenseType;
  seatsPurchased: number; annualCost: number; expiryDate: string;
}
interface RenewLicenseInput { addedYears: number; seatsPurchased: number; annualCost: number; }
interface AllocateSeatInput { employeeId: string; assetId?: string; allocationRole: string; }
```

## Deviation ที่ต้องบันทึกไว้

1. **`licenseCode`/`costPerSeat` คำนวณฝั่ง frontend ตอน `createLicense`** — ชั่วคราวเพราะยังไม่มี Go backend ที่ generate ให้ ต้องย้าย logic นี้ไป backend ตอน implement `POST /api/v1/licenses` จริง (ป้องกัน client กำหนด code ซ้ำกันเองได้)
2. **`AllocatedSeat`/`InstalledAssetBinding` เป็น embedded snapshot ไม่ใช่ join แบบ live** — ตั้งใจ (audit-trail integrity) เหมือน `Ticket.requester`/`Ticket.asset` ดู [[SOFTWARE-LICENSE-MIGRATION|SOFTWARE-LICENSE-MIGRATION.md]] หัวข้อ 2

## สถานะการ implement จริง ณ ตอนนี้

- **Frontend**: implement ครบ 7 operation, ทดสอบผ่าน unit test (8 เคส) + browser check จริง (allocate/release/renew ทำงานถูกต้อง end-to-end ผ่าน UI จริง)
- **Backend (Go)**: ยังไม่ implement เลย — รอ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 8
