import { useEffect, useState } from 'react';
import { Boxes, CheckCircle2, Wrench } from 'lucide-react';
import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DonutChart, ProgressBarChart } from '@/components/Charts';
import { dashboardAPI } from '@/services/dashboard';
import { DashboardSummary } from '@/types/dashboard';
import { cn } from '@/lib/cn';

interface DashboardProps {
  onNavigate: (id: string) => void;
}

// FR-53..FR-56 (Reduced Dashboard): Total/Active/Idle asset counts, Asset by Category,
// Asset by Location, Asset by Department (via Active Assignment only). Out-of-scope for
// this Epic: Software License, Maintenance Calendar, Financial (Depreciation/Cost),
// Recent Activities, Pending Approvals, Asset Lifecycle trend — see
// docs/01-requirements/01-spec/20260815-09-reduced-dashboard.md
const COLOR_CYCLE = ['bg-brand-500', 'bg-accent-500', 'bg-success-500', 'bg-warning-500', 'bg-error-500', 'bg-surface-500'];

const kpiMeta = [
  { key: 'totalAssets' as const, label: 'Total Assets', icon: Boxes, color: 'brand' },
  { key: 'activeAssets' as const, label: 'Active', icon: CheckCircle2, color: 'success' },
  { key: 'idleAssets' as const, label: 'Idle', icon: Wrench, color: 'warning' },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-600' },
  success: { bg: 'bg-success-50', text: 'text-success-600' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600' },
};

// onNavigate is accepted for signature parity with other pages (see App.tsx wiring) but is
// unused here — Reduced Dashboard (FR-53..FR-56) has no drill-down navigation in this Epic.
export function Dashboard(_props: DashboardProps) {
  void _props;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Fetch-once on mount (no polling/real-time channel) — NEEDS_DECISION #2 on the exact
    // real-time mechanism is not resolved yet; see 20260815-09-reduced-dashboard.md FR-53.
    dashboardAPI.getSummary().then((data) => {
      if (!cancelled) {
        setSummary(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiMeta.map((kpi) => (
            <Card key={kpi.key} className="p-5">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-8 w-24 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader title="กำลังโหลด..." />
              <div className="p-5">
                <Skeleton className="h-40 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Grid — FR-53: Total / Active / Idle Asset Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiMeta.map((kpi) => {
          const c = colorMap[kpi.color];
          const Icon = kpi.icon;
          return (
            <Card key={kpi.key} className="p-5 hover:shadow-md transition-shadow">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', c.bg)}>
                <Icon className={cn('h-5 w-5', c.text)} />
              </div>
              <p className="text-display font-bold text-surface-900 mt-4">{summary[kpi.key]}</p>
              <p className="text-body font-medium text-surface-700 mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts row — FR-54, FR-55, FR-56 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Asset by Category" description="Distribution by asset category" />
          <div className="p-5">
            <DonutChart
              data={summary.byCategory.map((g, i) => ({ label: g.label, value: g.count, color: COLOR_CYCLE[i % COLOR_CYCLE.length] }))}
              centerValue={String(summary.totalAssets)}
              centerLabel="Total"
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Asset by Location" description="Distribution by asset location" />
          <div className="p-5">
            <ProgressBarChart
              data={summary.byLocation.map((g, i) => ({
                label: g.label,
                value: g.count,
                max: summary.totalAssets,
                color: COLOR_CYCLE[i % COLOR_CYCLE.length],
              }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Asset by Department" description="เฉพาะ Asset ที่มี Active Assignment เท่านั้น" />
          <div className="p-5">
            <ProgressBarChart
              data={summary.byDepartment.map((g, i) => ({
                label: g.label,
                value: g.count,
                max: summary.totalAssets,
                color: COLOR_CYCLE[i % COLOR_CYCLE.length],
              }))}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
