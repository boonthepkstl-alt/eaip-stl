import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Globe, Shield, Palette, Mail, Database, Save } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button, Input, Select, Textarea, Checkbox, useToast, SectionCard } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';
import type { PlatformSettings } from '@/types/settings';
import { cn } from '@/lib/cn';

const sections = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'data', label: 'Data & Backup', icon: Database },
];

const notificationLabels: Record<keyof PlatformSettings['notifications'], string> = {
  assignment: 'Assignment updates',
  maintenance: 'Maintenance alerts',
  license: 'License expiration warnings',
  approval: 'Approval requests',
  system: 'System announcements',
};

// Ported from src/pages/Settings.tsx. Unlike every domain migrated so far, legacy Settings has
// no backing fixture — every field was local component state with a hardcoded defaultValue, and
// "Save Changes" only showed a toast without persisting anything. Now goes through
// settingsService/useSettings (a single platform-wide record, not a collection — see
// types/settings.ts) so Save actually persists across the session, an improvement over legacy's
// toast-only behavior rather than a redesign of the UI itself. See SYSTEM-SETTINGS-MIGRATION.md.
export function SettingsPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { settings, loading, saving, save } = useSettings();
  const [section, setSection] = useState('general');
  const [draft, setDraft] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  const handleSave = async () => {
    if (!draft) return;
    await save(draft);
    push({ variant: 'success', title: 'Settings saved', message: 'Your changes have been applied' });
  };

  const handleReset = () => {
    if (settings) setDraft(settings);
  };

  if (loading || !draft) {
    return (
      <AppShell current="settings" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'System Settings' }]}>
        <div className="flex items-center justify-center py-24 text-body text-surface-400">Loading settings...</div>
      </AppShell>
    );
  }

  return (
    <AppShell current="settings" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'System Settings' }]}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  'inline-flex items-center gap-2.5 px-3 py-2 rounded-md text-body font-medium transition-colors whitespace-nowrap w-full text-left',
                  section === s.id ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-100',
                )}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          {section === 'general' && (
            <SectionCard title="General Settings" description="Platform-wide configuration">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Organization Name" value={draft.organizationName} onChange={(e) => setDraft({ ...draft, organizationName: e.target.value })} />
                <Input label="Support Email" type="email" value={draft.supportEmail} onChange={(e) => setDraft({ ...draft, supportEmail: e.target.value })} />
                <Select label="Timezone" value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })} options={[
                  { value: 'utc', label: 'UTC' },
                  { value: 'est', label: 'America/New York (EST)' },
                  { value: 'pst', label: 'America/Los Angeles (PST)' },
                  { value: 'gmt', label: 'Europe/London (GMT)' },
                ]} />
                <Select label="Date Format" value={draft.dateFormat} onChange={(e) => setDraft({ ...draft, dateFormat: e.target.value })} options={[
                  { value: 'iso', label: 'YYYY-MM-DD' },
                  { value: 'us', label: 'MM/DD/YYYY' },
                  { value: 'eu', label: 'DD/MM/YYYY' },
                ]} />
                <Select label="Currency" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} options={[
                  { value: 'usd', label: 'USD ($)' },
                  { value: 'eur', label: 'EUR (€)' },
                  { value: 'gbp', label: 'GBP (£)' },
                ]} />
                <Select label="Language" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                ]} />
              </div>
            </SectionCard>
          )}

          {section === 'notifications' && (
            <SectionCard title="Notification Preferences" description="Choose what alerts you receive">
              <div className="flex flex-col gap-4">
                {(Object.keys(notificationLabels) as (keyof PlatformSettings['notifications'])[]).map((key) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                    <div>
                      <p className="text-body font-medium text-surface-900">{notificationLabels[key]}</p>
                      <p className="text-caption text-surface-500">Receive notifications for {notificationLabels[key].toLowerCase()}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={draft.notifications[key]}
                        onChange={(e) => setDraft({ ...draft, notifications: { ...draft.notifications, [key]: e.target.checked } })}
                      />
                      <div className="w-10 h-6 bg-surface-200 peer-focus:ring-2 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                    </label>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {section === 'security' && (
            <>
              <SectionCard title="Authentication" description="Password and access policies">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Session Timeout (minutes)" type="number" value={draft.security.sessionTimeoutMinutes} onChange={(e) => setDraft({ ...draft, security: { ...draft.security, sessionTimeoutMinutes: Number(e.target.value) || 0 } })} />
                  <Select label="Password Policy" value={draft.security.passwordPolicy} onChange={(e) => setDraft({ ...draft, security: { ...draft.security, passwordPolicy: e.target.value as PlatformSettings['security']['passwordPolicy'] } })} options={[
                    { value: 'basic', label: 'Basic (8+ chars)' },
                    { value: 'standard', label: 'Standard (12+ chars, mixed)' },
                    { value: 'strict', label: 'Strict (16+ chars, symbols)' },
                  ]} />
                  <Select label="Two-Factor Authentication" value={draft.security.twoFactor} onChange={(e) => setDraft({ ...draft, security: { ...draft.security, twoFactor: e.target.value as PlatformSettings['security']['twoFactor'] } })} options={[
                    { value: 'off', label: 'Disabled' },
                    { value: 'optional', label: 'Optional' },
                    { value: 'required', label: 'Required for all users' },
                  ]} />
                  <Input label="Max Login Attempts" type="number" value={draft.security.maxLoginAttempts} onChange={(e) => setDraft({ ...draft, security: { ...draft.security, maxLoginAttempts: Number(e.target.value) || 0 } })} />
                </div>
              </SectionCard>
              <SectionCard title="IP Whitelist" description="Restrict access by IP address">
                <Textarea placeholder="Enter one IP per line, e.g. 192.168.1.0/24" value={draft.security.ipWhitelist} onChange={(e) => setDraft({ ...draft, security: { ...draft.security, ipWhitelist: e.target.value } })} />
              </SectionCard>
            </>
          )}

          {section === 'appearance' && (
            <SectionCard title="Appearance" description="Customize the look and feel">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-body font-medium text-surface-900 mb-2">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', bg: 'bg-white border-surface-300' },
                      { id: 'dark', label: 'Dark', bg: 'bg-surface-900 border-surface-700' },
                      { id: 'system', label: 'System', bg: 'bg-gradient-to-br from-white to-surface-900 border-surface-300' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setDraft({ ...draft, appearance: { ...draft.appearance, theme: t.id as PlatformSettings['appearance']['theme'] } })}
                        className={cn('rounded-lg border-2 p-4 text-center transition-all hover:shadow-sm', t.bg, draft.appearance.theme === t.id && 'ring-2 ring-brand-500')}
                      >
                        <span className={cn('text-body font-medium', t.id === 'dark' ? 'text-white' : 'text-surface-900')}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-body font-medium text-surface-900 mb-2">Primary Color</p>
                  <div className="flex gap-2">
                    {['bg-brand-600', 'bg-accent-600', 'bg-success-600', 'bg-warning-600', 'bg-error-600'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDraft({ ...draft, appearance: { ...draft.appearance, primaryColor: c } })}
                        className={cn('h-9 w-9 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110', c, draft.appearance.primaryColor === c ? 'ring-surface-400' : 'ring-transparent')}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {section === 'email' && (
            <SectionCard title="Email Configuration" description="SMTP settings for system emails">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="SMTP Server" value={draft.email.smtpServer} onChange={(e) => setDraft({ ...draft, email: { ...draft.email, smtpServer: e.target.value } })} />
                <Input label="SMTP Port" type="number" value={draft.email.smtpPort} onChange={(e) => setDraft({ ...draft, email: { ...draft.email, smtpPort: Number(e.target.value) || 0 } })} />
                <Input label="Username" value={draft.email.smtpUsername} onChange={(e) => setDraft({ ...draft, email: { ...draft.email, smtpUsername: e.target.value } })} />
                <Input label="Password" type="password" placeholder="••••••••" />
                <Select label="Encryption" value={draft.email.encryption} onChange={(e) => setDraft({ ...draft, email: { ...draft.email, encryption: e.target.value as PlatformSettings['email']['encryption'] } })} options={[
                  { value: 'tls', label: 'TLS' },
                  { value: 'ssl', label: 'SSL' },
                  { value: 'none', label: 'None' },
                ]} />
                <Input label="From Email" type="email" value={draft.email.fromEmail} onChange={(e) => setDraft({ ...draft, email: { ...draft.email, fromEmail: e.target.value } })} />
              </div>
            </SectionCard>
          )}

          {section === 'data' && (
            <SectionCard title="Data & Backup" description="Backup and data retention policies">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between py-2 border-b border-surface-100">
                  <div><p className="text-body font-medium text-surface-900">Automatic Backups</p><p className="text-caption text-surface-500">Daily backup at 2:00 AM UTC</p></div>
                  <Checkbox checked={draft.data.autoBackupEnabled} onChange={(e) => setDraft({ ...draft, data: { ...draft.data, autoBackupEnabled: e.target.checked } })} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-100">
                  <div><p className="text-body font-medium text-surface-900">Data Retention (days)</p><p className="text-caption text-surface-500">How long to keep historical records</p></div>
                  <Input type="number" className="w-24" value={draft.data.dataRetentionDays} onChange={(e) => setDraft({ ...draft, data: { ...draft.data, dataRetentionDays: Number(e.target.value) || 0 } })} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-body font-medium text-surface-900">Export Schedule</p><p className="text-caption text-surface-500">Weekly export to cloud storage</p></div>
                  <Checkbox checked={draft.data.exportScheduleEnabled} onChange={(e) => setDraft({ ...draft, data: { ...draft.data, exportScheduleEnabled: e.target.checked } })} />
                </div>
              </div>
            </SectionCard>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <Button leftIcon={<Save className="h-4 w-4" />} disabled={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
