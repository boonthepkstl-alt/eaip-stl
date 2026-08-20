import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, UserPlus, Upload } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge, Button, StatusBadge, Avatar, Select, Input, useToast, ConfirmDialog, Modal } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { departments } from '@/data/fixtures/mockData';
import { useUsers } from '@/hooks/useUsers';
import { userService } from '@/services/user-service';
import type { User } from '@/types/user';

// Ported from src/pages/UserManagement.tsx. User is a platform login/identity account, its own
// domain distinct from Employee — see types/user.ts and ADMINISTRATION-MIGRATION.md.
export function UserManagementPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [inviteDept, setInviteDept] = useState(departments[0] || 'Engineering');

  const { users: filtered, loading, error, refetch } = useUsers({ search, status: statusFilter as User['status'] | 'all' });

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      push({ variant: 'warning', title: 'Required Fields', message: 'Full Name and Email are required.' });
      return;
    }
    const created = await userService.inviteUser({ name: inviteName, email: inviteEmail, role: inviteRole, department: inviteDept });
    refetch();
    setInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
    push({ variant: 'success', title: 'Invitation sent', message: `${created.name} will receive an email invitation.` });
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    await userService.updateUserStatus(suspendTarget.id, 'Suspended');
    refetch();
    push({ variant: 'warning', title: 'User suspended', message: suspendTarget.name });
    setSuspendTarget(null);
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'User', sortable: true, sortValue: (r) => r.name, render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar initials={r.initials} color={r.avatarColor} size="sm" />
        <div><p className="font-medium text-surface-900">{r.name}</p><p className="text-caption text-surface-500">{r.email}</p></div>
      </div>
    ) },
    { key: 'role', header: 'Role', sortable: true, sortValue: (r) => r.role, render: (r) => <Badge variant="brand">{r.role}</Badge> },
    { key: 'department', header: 'Department', sortable: true, sortValue: (r) => r.department, render: (r) => <span className="text-surface-600">{r.department}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'lastActive', header: 'Last Active', sortable: true, sortValue: (r) => r.lastActive, render: (r) => <span className="text-surface-500">{r.lastActive}</span> },
  ];

  return (
    <AppShell current="administration" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Administration', href: '/administration' }, { label: 'User Management' }]}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="brand">{filtered.length} users</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />}>Import</Button>
            <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>Invite User</Button>
          </div>
        </div>

        {error ? (
          <p className="text-body text-error-600">{error} <button onClick={refetch} className="underline font-medium">Retry</button></p>
        ) : (
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
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Suspended', label: 'Suspended' },
              ]} />
            }
            rowActions={(row) => [
              { label: 'Edit Role', onClick: () => push({ variant: 'info', title: 'Edit role', message: row.name }) },
              { label: 'Reset Password', onClick: () => push({ variant: 'success', title: 'Password reset sent', message: row.email }) },
              { divider: true, label: '' },
              { label: 'Suspend', danger: true, onClick: () => setSuspendTarget(row) },
            ]}
          />
        )}

        <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite User" description="Send an invitation to join RAISE" footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite}>Send Invitation</Button>
          </>
        }>
          <div className="flex flex-col gap-4">
            <Input label="Full Name" placeholder="e.g. Jordan Smith" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            <Input label="Email Address" type="email" placeholder="jordan@raise.co" leftIcon={<Mail className="h-4 w-4" />} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Select label="Role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} options={[
              { value: 'Viewer', label: 'Viewer' },
              { value: 'Editor', label: 'Editor' },
              { value: 'Asset Manager', label: 'Asset Manager' },
              { value: 'Administrator', label: 'Administrator' },
            ]} />
            <Select label="Department" value={inviteDept} onChange={(e) => setInviteDept(e.target.value)} options={departments.map((d) => ({ value: d, label: d }))} />
          </div>
        </Modal>

        <ConfirmDialog
          open={!!suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={handleConfirmSuspend}
          title="Suspend this user?"
          message={`${suspendTarget?.name} will lose access immediately. They can be reactivated at any time.`}
          confirmLabel="Suspend"
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
