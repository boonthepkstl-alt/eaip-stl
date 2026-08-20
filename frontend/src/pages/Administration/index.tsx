import { useNavigate } from 'react-router-dom';
import { Users, Shield, Building2, MapPin, Database, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, CardHeader, Button, Badge, StatusBadge, Avatar, useToast } from '@/components/ui';
import { departments, locations } from '@/data/fixtures/mockData';
import { useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { cn } from '@/lib/cn';

// Tailwind's build-time JIT scanner needs complete literal class strings — `bg-${color}-50`
// (the legacy Administration.tsx's original approach) never gets picked up, so cards would
// render without their icon background/color. A static map keeps the same 5 colors but in a
// form the scanner can see.
const CARD_COLOR_CLASSES: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-error-50 text-error-600',
};

// Ported from src/pages/Administration.tsx (the "Administration" landing page, nav id
// `administration`, route `/administration`). Drill-down cards for Departments/Locations/Master
// Data have no destination page in the legacy app either — clicking them there silently falls
// through to Dashboard (no case in src/routes/pageRoutes.tsx). Rather than reproduce that as a
// real 404 under router-based navigation, they show an honest "coming soon" toast instead — a
// documented deviation, not new scope, same pattern as Ticket's Edit modal in Phase 5B.
export function AdministrationPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { users, loading: usersLoading } = useUsers({});
  const { roles, loading: rolesLoading } = useRoles();

  const cards = [
    { id: 'user-management', title: 'User Management', description: 'Manage user accounts and access', icon: Users, count: users.length, color: 'brand', route: '/administration/users' },
    { id: 'role-management', title: 'Role Management', description: 'Configure roles and permissions', icon: Shield, count: roles.length, color: 'accent', route: '/administration/roles' },
    { id: 'departments', title: 'Departments', description: 'Organizational departments', icon: Building2, count: departments.length, color: 'success', route: null },
    { id: 'locations', title: 'Locations', description: 'Physical locations and sites', icon: MapPin, count: locations.length, color: 'warning', route: null },
    { id: 'master-data', title: 'Master Data', description: 'Categories, vendors, and types', icon: Database, count: 24, color: 'error', route: null },
  ] as const;

  const handleCardClick = (card: (typeof cards)[number]) => {
    if (card.route) navigate(card.route);
    else push({ variant: 'info', title: 'Coming Soon', message: `${card.title} management isn't available yet.` });
  };

  return (
    <AppShell current="administration" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Administration' }]}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card key={c.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
              <div onClick={() => handleCardClick(c)}>
                <div className="flex items-start justify-between">
                  <div className={cn('h-11 w-11 rounded-lg flex items-center justify-center', CARD_COLOR_CLASSES[c.color])}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-surface-300 group-hover:text-surface-500 transition-colors" />
                </div>
                <p className="text-title font-semibold text-surface-900 mt-4">{c.title}</p>
                <p className="text-body text-surface-500 mt-1">{c.description}</p>
                <Badge variant="neutral" className="mt-3">{c.count} items</Badge>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader title="Recent Users" description="Latest user accounts" action={<Button variant="ghost" size="sm" onClick={() => navigate('/administration/users')}>View all</Button>} />
          <div className="p-3">
            {usersLoading ? (
              <p className="px-2 py-4 text-body text-surface-400">Loading users...</p>
            ) : (
              users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-surface-50 transition-colors">
                  <Avatar initials={u.initials} color={u.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-surface-900 truncate">{u.name}</p>
                    <p className="text-caption text-surface-500">{u.email}</p>
                  </div>
                  <Badge variant="neutral">{u.role}</Badge>
                  <StatusBadge status={u.status} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Roles & Permissions" description="Access control configuration" action={<Button variant="ghost" size="sm" onClick={() => navigate('/administration/roles')}>Manage roles</Button>} />
          <div className="p-3">
            {rolesLoading ? (
              <p className="px-2 py-4 text-body text-surface-400">Loading roles...</p>
            ) : (
              roles.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-surface-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center"><Shield className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-surface-900">{r.name}{r.system && <Badge variant="neutral" className="ml-2">System</Badge>}</p>
                    <p className="text-caption text-surface-500 truncate">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-caption text-surface-500">
                    <span>{r.users} users</span>
                    <span>{r.permissions} permissions</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
