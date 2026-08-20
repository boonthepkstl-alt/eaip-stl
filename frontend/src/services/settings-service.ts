import { MockSettingsRepository, type SettingsRepository } from '@/services/settings-repository';
import type { PlatformSettings, UpdateSettingsInput } from '@/types/settings';

// Seed values match the legacy defaultValue literals in src/pages/Settings.tsx exactly — see
// SYSTEM-SETTINGS-MIGRATION.md for the field-by-field trace back to the original page.
const SEED: PlatformSettings = {
  organizationName: 'RAISE Corporation',
  supportEmail: 'support@raise.co',
  timezone: 'utc',
  dateFormat: 'iso',
  currency: 'usd',
  language: 'en',
  notifications: { assignment: true, maintenance: true, license: true, approval: true, system: false },
  security: { sessionTimeoutMinutes: 30, passwordPolicy: 'basic', twoFactor: 'off', maxLoginAttempts: 5, ipWhitelist: '' },
  appearance: { theme: 'light', primaryColor: 'bg-brand-600' },
  email: { smtpServer: 'smtp.raise.co', smtpPort: 587, smtpUsername: 'noreply@raise.co', encryption: 'tls', fromEmail: 'noreply@raise.co' },
  data: { autoBackupEnabled: true, dataRetentionDays: 365, exportScheduleEnabled: false },
};

const repository: SettingsRepository = new MockSettingsRepository(SEED);

/**
 * The stable frontend contract for the System Settings page (pages/Settings). Settings is its
 * own domain — a single platform-wide record, not a collection — with no dependency on any
 * other service and nothing else importing from it.
 */
export const settingsService = {
  getSettings: (): Promise<PlatformSettings> => repository.get(),
  updateSettings: (patch: UpdateSettingsInput): Promise<PlatformSettings> => repository.update(patch),
};
