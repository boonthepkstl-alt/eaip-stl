import type { PlatformSettings, UpdateSettingsInput } from '@/types/settings';

/**
 * Contract settingsService depends on. MockSettingsRepository is the only implementation in
 * Phase 7 — swap it for an HttpSettingsRepository backed by GET/PATCH /api/v1/settings (see
 * SYSTEM-SETTINGS-API-CONTRACT.md) once the Go backend lands, same pattern as AssetRepository.
 */
export interface SettingsRepository {
  get(): Promise<PlatformSettings>;
  update(patch: UpdateSettingsInput): Promise<PlatformSettings>;
}

function simulateNetwork<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

/**
 * Backed by the legacy ESAPS defaultValue-only fixture literals in src/pages/Settings.tsx — this
 * is a single record (no collection), so the seed lives here rather than in data/fixtures.
 */
export class MockSettingsRepository implements SettingsRepository {
  private settings: PlatformSettings;

  constructor(seed: PlatformSettings) {
    this.settings = { ...seed };
  }

  async get(): Promise<PlatformSettings> {
    return simulateNetwork({ ...this.settings });
  }

  async update(patch: UpdateSettingsInput): Promise<PlatformSettings> {
    this.settings = {
      ...this.settings,
      ...patch,
      notifications: { ...this.settings.notifications, ...patch.notifications },
      security: { ...this.settings.security, ...patch.security },
      appearance: { ...this.settings.appearance, ...patch.appearance },
      email: { ...this.settings.email, ...patch.email },
      data: { ...this.settings.data, ...patch.data },
    };
    return simulateNetwork({ ...this.settings });
  }
}
