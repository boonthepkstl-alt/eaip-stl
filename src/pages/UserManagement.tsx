import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { Button, Badge, Avatar, Select, Input, useToast, ConfirmDialog, Modal } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { userAPI } from '@/services/user';
import { roleAPI } from '@/services/role';
import { masterdataAPI } from '@/services/masterdata';
import { ManagedUser } from '@/types/user';
import { Role } from '@/types/role';
import { Department } from '@/types/masterdata';
import { createUserSchema, type CreateUserFormValues } from '@/schemas/user.schema';
import { formatDateTime } from '@/utils/format';

interface UserManagementProps {
  onNavigate: (id: string) => void;
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

// FR-08, FR-10, FR-12 (Epic: User/Role/Permission + Baseline Administration) — real data via
// userAPI/roleAPI/masterdataAPI (services already ported; only this page was still on Bolt's
// @/data/mockData). Bolt's "Import"/"Edit Role"/"Reset Password" row actions had no backing
// service and only fired a fake toast — dropped entirely rather than keeping a non-functional
// button. ManagedUser has no "Suspended" status, only `isActive` — Suspend/Reactivate below maps
// to that boolean via userAPI.update, there is no delete endpoint (ข้อจำกัดของ userAPI).
export function UserManagement({ onNavigate }: UserManagementProps) {
  void onNavigate;
  const { push } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<ManagedUser | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [userList, roleList, departmentList] = await Promise.all([
        userAPI.list(),
        roleAPI.list(),
        masterdataAPI.listDepartments(),
      ]);
      setUsers(userList);
      setRoles(roleList);
      setDepartments(departmentList);
    } catch (err) {
      push({ variant: 'error', title: 'Could not load users', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? roleId;
  const departmentName = (departmentId: string) => departments.find((d) => d.id === departmentId)?.name ?? departmentId;

  const filtered = users.filter((u) => {
    const term = search.trim().toLowerCase();
    const matchSearch = !term || u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive);
    return matchSearch && matchStatus;
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({ resolver: zodResolver(createUserSchema) });

  const onInvite = async (values: CreateUserFormValues) => {
    try {
      await userAPI.create({ ...values, isActive: true });
      push({ variant: 'success', title: 'Invitation sent', message: `${values.fullName} (${values.email})` });
      setInviteOpen(false);
      reset();
      fetchAll();
    } catch (err) {
      push({ variant: 'error', title: 'Could not invite user', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const toggleActive = async (target: ManagedUser) => {
    try {
      await userAPI.update(target.id, { ...target, isActive: !target.isActive });
      push({
        variant: target.isActive ? 'warning' : 'success',
        title: target.isActive ? 'User suspended' : 'User reactivated',
        message: target.fullName,
      });
      setSuspendTarget(null);
      fetchAll();
    } catch (err) {
      push({ variant: 'error', title: 'Could not update user', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const columns: Column<ManagedUser>[] = [
    {
      key: 'fullName', header: 'User', sortable: true, sortValue: (r) => r.fullName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(r.fullName)} size="sm" />
          <div><p className="font-medium text-surface-900">{r.fullName}</p><p className="text-caption text-surface-500">{r.email}</p></div>
        </div>
      ),
    },
    { key: 'roleId', header: 'Role', sortable: true, sortValue: (r) => roleName(r.roleId), render: (r) => <Badge variant="brand">{roleName(r.roleId)}</Badge> },
    { key: 'departmentId', header: 'Department', sortable: true, sortValue: (r) => departmentName(r.departmentId), render: (r) => <span className="text-surface-600">{departmentName(r.departmentId)}</span> },
    { key: 'isActive', header: 'Status', sortable: true, sortValue: (r) => (r.isActive ? 1 : 0), render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Suspended'}</Badge> },
    { key: 'updatedAt', header: 'Last Updated', sortable: true, sortValue: (r) => r.updatedAt, render: (r) => <span className="text-surface-500">{formatDateTime(r.updatedAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="brand">{filtered.length} users</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>Invite User</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name or email..."
        toolbar={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Suspended' },
          ]} />
        }
        rowActions={(row) => [
          row.isActive
            ? { label: 'Suspend', danger: true, onClick: () => setSuspendTarget(row) }
            : { label: 'Reactivate', onClick: () => toggleActive(row) },
        ]}
      />

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); reset(); }}
        title="Invite User"
        description="Create a new user account in RAISE"
        footer={
          <>
            <Button variant="outline" onClick={() => { setInviteOpen(false); reset(); }}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onInvite)}>Send Invitation</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Full Name" placeholder="e.g. Jordan Smith" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Username" placeholder="e.g. jordan.s" error={errors.username?.message} {...register('username')} />
          <Input label="Email Address" type="email" placeholder="jordan.s@singerthai.co.th" error={errors.email?.message} {...register('email')} />
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select
                label="Role"
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.roleId?.message}
                options={[{ value: '', label: 'Select a role...' }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
              />
            )}
          />
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select
                label="Department"
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.departmentId?.message}
                options={[{ value: '', label: 'Select a department...' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
              />
            )}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={() => suspendTarget && toggleActive(suspendTarget)}
        title="Suspend this user?"
        message={`${suspendTarget?.fullName} will lose access immediately. They can be reactivated at any time.`}
        confirmLabel="Suspend"
        variant="danger"
      />
    </div>
  );
}
