# System Settings — Frontend Service Contract & Target API (Phase 7)

อ้างอิงจาก [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]], [[ADMINISTRATION-API-CONTRACT|ADMINISTRATION-API-CONTRACT.md]] (รูปแบบเดียวกัน), [[API-SPECIFICATION|API-SPECIFICATION.md]]

## Frontend contract ที่มีอยู่แล้ว (`frontend/src/services/settings-repository.ts`)

```ts
interface SettingsRepository {
  get(): Promise<PlatformSettings>;
  update(patch: UpdateSettingsInput): Promise<PlatformSettings>;
}
```

`settingsService` wraps this with thin pass-throughs (`getSettings`, `updateSettings`) — no cross-domain resolution, same as `userService`/`roleService` in Phase 5D.

## Target Go endpoint mapping (ยังไม่ implement)

| Frontend call | Go endpoint | หมายเหตุ |
|---|---|---|
| `settingsService.getSettings()` | `GET /api/v1/settings` | Single-record resource — ไม่มี `:id` เพราะเป็น platform-wide config เดียว ต้องมี `RequireRole('ADMIN')` ตาม AUTH-RBAC.md |
| `settingsService.updateSettings(patch)` | `PATCH /api/v1/settings` | Partial update — backend ควร deep-merge nested group (`notifications`/`security`/`appearance`/`email`/`data`) เหมือน `MockSettingsRepository.update()` ไม่ใช่ replace ทั้ง object |

## Response/Request shape

```ts
interface PlatformSettings {
  organizationName: string; supportEmail: string; timezone: string; dateFormat: string; currency: string; language: string;
  notifications: { assignment: boolean; maintenance: boolean; license: boolean; approval: boolean; system: boolean };
  security: { sessionTimeoutMinutes: number; passwordPolicy: 'basic' | 'standard' | 'strict'; twoFactor: 'off' | 'optional' | 'required'; maxLoginAttempts: number; ipWhitelist: string };
  appearance: { theme: 'light' | 'dark' | 'system'; primaryColor: string };
  email: { smtpServer: string; smtpPort: number; smtpUsername: string; encryption: 'tls' | 'ssl' | 'none'; fromEmail: string };
  data: { autoBackupEnabled: boolean; dataRetentionDays: number; exportScheduleEnabled: boolean };
}
```

## Deviation ที่ต้องบันทึกไว้

1. **Email SMTP password ไม่มี field ใน `PlatformSettings` เลย** — legacy UI มีแค่ placeholder input ไม่มี default/state จริง ตาม [[SYSTEM-SETTINGS-MIGRATION|SYSTEM-SETTINGS-MIGRATION.md]] หัวข้อ 4 เมื่อ backend implement จริง ต้องเพิ่ม secret-handling ที่เหมาะสม (เช่น เก็บผ่าน secrets manager ไม่ใช่ plaintext ในตาราง settings) — ไม่ควร derive จาก mock repository ปัจจุบันตรงๆ
2. **Appearance's theme/primaryColor เป็นแค่ state ที่บันทึกได้ ไม่ได้เปลี่ยน UI จริงตาม theme ที่เลือก** — ตรงกับ legacy ทุกประการ (ปุ่มเลือก theme ใน `Settings.tsx` ไม่มี logic เปลี่ยน CSS จริงเลย เป็นแค่ UI ตัวอย่าง) ถ้าต้องการ dark mode จริงต้องเป็นงานแยกที่ผูกกับ design system tokens ทั้งระบบ

## สถานะการ implement จริง ณ ตอนนี้

- **Frontend**: implement ครบ 2 operation (single-record get/update), ทดสอบผ่าน unit test (4 เคส) + browser check จริง (แก้ Organization Name แล้ว persist จริงในรอบ session)
- **Backend (Go)**: ยังไม่ implement เลย — รอ [[MIGRATION-PLAN|MIGRATION-PLAN.md]] Phase 8
