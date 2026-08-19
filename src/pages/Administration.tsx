import { useEffect, useState } from 'react';
import { Users, Shield, Building2, MapPin, Database, ChevronRight } from 'lucide-react';
import { Card, CardHeader, Button, Badge, Avatar, Skeleton, EmptyState, useToast } from '@/components/ui';
import { userAPI } from '@/services/user';
import { roleAPI } from '@/services/role';
import { masterdataAPI } from '@/services/masterdata';
import { ManagedUser } from '@/types/user';
import { Role } from '@/types/role';
import { Department, AssetLocation } from '@/types/masterdata';
import { cn } from '@/lib/cn';

interface AdministrationProps {
  onNavigate: (id: string) => void;
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

// FR-08..FR-12 (Epic: User/Role/Permission + Baseline Administration) — fixes baseline code
// review F-02 (see App.tsx: 'departments'/'locations'/'master-data' used to have no PATH_BY_ID
// entry, so clicking those cards silently fell back to Dashboard via the `?? ROUTES.DASHBOARD`
// fallback — now routed to a real Placeholder page instead). Also replaces every count/preview
// row (`data/mockData`'s `users`/`roles`/`departments`/`locations`) with real service data.
export function Administration({ onNavigate }: AdministrationProps) {
  const { push } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [masterDataCount, setMasterDataCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userAPI.list(),
      roleAPI.list(),
      masterdataAPI.listDepartments(),
      masterdataAPI.listLocations(),
      masterdataAPI.listVendors(),
      masterdataAPI.list('category'),
      masterdataAPI.list('company'),
      masterdataAPI.list('branch'),
    ])
      .then(([userList, roleList, departmentList, locationList, vendors, categories, companies, branches]) => {
        if (cancelled) return;
        setUsers(userList);
        setRoles(roleList);
        setDepartments(departmentList);
        setLocations(locationList);
        setMasterDataCount(vendors.length + categories.length + companies.length + branches.length);
      })
      .catch((err) => {
        if (cancelled) return;
        push({ variant: 'error', title: 'Could not load administration data', message: err instanceof Error ? err.message : String(err) });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? roleId;
  const userCountFor = (roleId: string) => users.filter((u) => u.roleId === roleId).length;
  const recentUsers = [...users].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  const cards = [
    { id: 'user-management', title: 'User Management', description: 'Manage user accounts and access', icon: Users, count: users.length, color: 'brand' },
    { id: 'role-management', title: 'Role Management', description: 'Configure roles and permissions', icon: Shield, count: roles.length, color: 'accent' },
    { id: 'departments', title: 'Departments', description: 'Organizational departments', icon: Building2, count: departments.length, color: 'success' },
    { id: 'locations', title: 'Locations', description: 'Physical locations and sites', icon: MapPin, count: locations.length, color: 'warning' },
    { id: 'master-data', title: 'Master Data', description: 'Categories, vendors, and types', icon: Database, count: masterDataCount, color: 'error' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.id} className="p-0 hover:shadow-md transition-shadow group">
            <button type="button" className="w-full p-5 text-left" onClick={() => onNavigate(c.id)}>
              <div className="flex items-start justify-between">
                <div className={cn('h-11 w-11 rounded-lg flex items-center justify-center', `bg-${c.color}-50`, `text-${c.color}-600`)}>
                  <c.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-surface-300 group-hover:text-surface-500 transition-colors" />
              </div>
              <p className="text-title font-semibold text-surface-900 mt-4">{c.title}</p>
              <p className="text-body text-surface-500 mt-1">{c.description}</p>
              <Badge variant="neutral" className="mt-3">{loading ? '…' : c.count} items</Badge>
            </button>
          </Card>
        ))}
      </div>

      {/* Recent users preview */}
      <Card>
        <CardHeader title="Recent Users" description="Latest user accounts" action={<Button variant="ghost" size="sm" onClick={() => onNavigate('user-management')}>View all</Button>} />
        <div className="p-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full my-1" />)
          ) : recentUsers.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="No users yet" description="Invite a user from User Management to see them here." />
          ) : (
            recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-surface-50 transition-colors">
                <Avatar initials={initialsOf(u.fullName)} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-surface-900 truncate">{u.fullName}</p>
                  <p className="text-caption text-surface-500">{u.email}</p>
                </div>
                <Badge variant="neutral">{roleName(u.roleId)}</Badge>
                <Badge variant={u.isActive ? 'success' : 'neutral'} dot>{u.isActive ? 'Active' : 'Suspended'}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Roles overview */}
      <Card>
        <CardHeader title="Roles & Permissions" description="Access control configuration" action={<Button variant="ghost" size="sm" onClick={() => onNavigate('role-management')}>Manage roles</Button>} />
        <div className="p-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full my-1" />)
          ) : roles.length === 0 ? (
            <EmptyState icon={<Shield className="h-6 w-6" />} title="No roles yet" description="No roles have been configured yet." />
          ) : (
            roles.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-surface-50 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center"><Shield className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-surface-900">{r.name}{r.isSystemRole && <Badge variant="neutral" className="ml-2">System</Badge>}</p>
                  <p className="text-caption text-surface-500 truncate">{r.description}</p>
                </div>
                <div className="flex items-center gap-4 text-caption text-surface-500">
                  <span>{userCountFor(r.id)} users</span>
                  <span>{r.permissionKeys.length} permissions</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
