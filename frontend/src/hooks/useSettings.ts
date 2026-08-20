import { useEffect, useState, useCallback } from 'react';
import { settingsService } from '@/services/settings-service';
import type { PlatformSettings, UpdateSettingsInput } from '@/types/settings';

interface UseSettingsResult {
  settings: PlatformSettings | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  save: (patch: UpdateSettingsInput) => Promise<PlatformSettings>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .getSettings()
      .then((result) => {
        if (!cancelled) setSettings(result);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load settings. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (patch: UpdateSettingsInput) => {
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings(patch);
      setSettings(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, error, saving, save };
}
