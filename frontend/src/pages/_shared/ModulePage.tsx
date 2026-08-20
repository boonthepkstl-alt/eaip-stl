import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/ui';

interface ModulePageProps {
  /** Matches a navGroups item id in config/navigation.ts, used for active-state highlighting and the page title lookup. */
  pageId: string;
  breadcrumbLabel: string;
  icon: ReactNode;
  description: string;
}

/**
 * Placeholder for a RAISE business module that has not been migrated from the legacy
 * ESAPS pages yet (see FRONTEND-MIGRATION-BOUNDARY.md — BUSINESS modules are intentionally
 * out of scope for the Phase 3 foundation scaffold). Proves that routing + AppShell + the
 * design system compose correctly for every module without porting real business logic yet.
 */
export function ModulePage({ pageId, breadcrumbLabel, icon, description }: ModulePageProps) {
  const navigate = useNavigate();

  return (
    <AppShell current={pageId} onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: breadcrumbLabel }]}>
      <EmptyState icon={icon} title={`${breadcrumbLabel} — foundation placeholder`} description={description} />
    </AppShell>
  );
}
