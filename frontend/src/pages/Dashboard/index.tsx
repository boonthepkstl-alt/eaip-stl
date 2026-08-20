import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, EmptyState } from '@/components/ui';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell current="dashboard" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Dashboard' }]}>
      <Card className="p-0">
        <EmptyState
          icon={<LayoutDashboard className="h-6 w-6" />}
          title="Frontend foundation scaffold"
          description="Routing, AppShell, the design system, and the auth boundary are wired up. Real dashboard widgets (asset stats, AI decision summary, reconciliation status) migrate from the legacy ESAPS prototype in MIGRATION-PLAN.md Phase 6 onward."
        />
      </Card>
    </AppShell>
  );
};

export default Dashboard;
