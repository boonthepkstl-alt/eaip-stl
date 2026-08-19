import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Shield, Check, X, Lock } from 'lucide-react';
import { Card, CardHeader, Button, Badge, Input, Textarea, useToast, Modal, ConfirmDialog, Skeleton, EmptyState } from '@/components/ui';
import { roleAPI } from '@/services/role';
import { userAPI } from '@/services/user';
import { Role } from '@/types/role';
import { ManagedUser } from '@/types/user';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { PermissionKey } from '@/types/role';
import { roleSchema, type RoleFormValues } from '@/schemas/role.schema';
import { cn } from '@/lib/cn';

interface RoleManagementProps {
  onNavigate: (id: string) => void;
}

// FR-09, FR-11 (Epic: User/Role/Permission + Baseline Administration) — fixes baseline code
// review F-05/F-06. The matrix used to be a 15-module x 6-action grid invented locally in the
// page (Procurement/Analytics/Documents columns that don't exist in the real permission catalog,
// checkboxes that toggled nothing real) — it now renders `ALL_PERMISSIONS` (the single real
// catalog, grouped by its `category`) with checked state read from `Role.permissionKeys`, and
// "Save Changes" calls `roleAPI.update` for real (F-05). Switching `selectedRole` used to leave
// stale checkbox state from the previous role because it was seeded once in a lazy useState
// initializer — a `useEffect` keyed on `selectedRoleId` now resyncs `pendingKeys` every time the
// selection changes (F-06).
export function RoleManagement({ onNavigate }: RoleManagementProps) {
  const { push } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [roleList, userList] = await Promise.all([roleAPI.list(), userAPI.list()]);
      setRoles(roleList);
      setUsers(userList);
    } catch (err) {
      push({ variant: 'error', title: 'Could not load roles', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select a role once the list loads, or after the selected one is deleted.
  useEffect(() => {
    if (roles.length === 0) return;
    if (!roles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  // F-06 fix: resync the working copy every time the selection actually changes, instead of
  // seeding it once from whichever role happened to be selected at mount.
  useEffect(() => {
    setPendingKeys(new Set(selectedRole?.permissionKeys ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole?.id]);

  const dirty = selectedRole
    ? pendingKeys.size !== selectedRole.permissionKeys.length || selectedRole.permissionKeys.some((k) => !pendingKeys.has(k))
    : false;

  const togglePermission = (key: string) => {
    setPendingKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const userCountFor = (roleId: string) => users.filter((u) => u.roleId === roleId).length;

  const saveChanges = async () => {
    if (!selectedRole) return;
    try {
      await roleAPI.update(selectedRole.id, { permissionKeys: Array.from(pendingKeys) as PermissionKey[] });
      push({ variant: 'success', title: 'Permissions saved', message: selectedRole.name });
      fetchAll();
    } catch (err) {
      push({ variant: 'error', title: 'Could not save permissions', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema), defaultValues: { permissionKeys: [] } });

  const onCreate = async (values: RoleFormValues) => {
    try {
      const created = await roleAPI.create({ ...values, permissionKeys: values.permissionKeys as PermissionKey[] });
      push({ variant: 'success', title: 'Role created', message: created.name });
      setCreateOpen(false);
      reset();
      setSelectedRoleId(created.id);
      fetchAll();
    } catch (err) {
      push({ variant: 'error', title: 'Could not create role', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const deleteRole = async () => {
    if (!deleteTarget) return;
    try {
      await roleAPI.deactivate(deleteTarget.id);
      push({ variant: 'warning', title: 'Role deleted', message: deleteTarget.name });
      setDeleteTarget(null);
      setSelectedRoleId(null);
      fetchAll();
    } catch (err) {
      push({ variant: 'error', title: 'Could not delete role', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const categories = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.category)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Role list */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-body text-surface-500">{roles.length} roles</p>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>New Role</Button>
        </div>
        <div className="flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
          ) : roles.length === 0 ? (
            <Card>
              <EmptyState icon={<Shield className="h-6 w-6" />} title="No roles found" description="No roles have been configured yet." />
            </Card>
          ) : (
            roles.map((role) => (
              <Card key={role.id} className={cn('p-0 transition-all', selectedRoleId === role.id ? 'border-brand-300 ring-1 ring-brand-200' : 'hover:shadow-sm')}>
                <button type="button" className="w-full p-4 text-left" onClick={() => setSelectedRoleId(role.id)}>
                  <div className="flex items-start gap-3">
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', role.isSystemRole ? 'bg-surface-100 text-surface-500' : 'bg-accent-50 text-accent-600')}>
                      {role.isSystemRole ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-surface-900 truncate">{role.name}</p>
                      <p className="text-caption text-surface-500">{userCountFor(role.id)} users · {role.permissionKeys.length} permissions</p>
                    </div>
                  </div>
                </button>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Permission matrix */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card>
          <CardHeader
            title={selectedRole?.name ?? ''}
            description={selectedRole?.description}
            action={
              <div className="flex items-center gap-2">
                {selectedRole?.isSystemRole && <Badge variant="neutral">System Role</Badge>}
                <Button variant="outline" size="sm" disabled={!dirty} onClick={saveChanges}>Save Changes</Button>
                {selectedRole && !selectedRole.isSystemRole && (
                  <Button variant="ghost" size="sm" className="text-error-600" onClick={() => setDeleteTarget(selectedRole)}>Delete</Button>
                )}
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-surface-100">
                {categories.map((category) => (
                  <Fragment key={category}>
                    <tr className="bg-surface-50">
                      <td colSpan={2} className="px-4 py-2 text-caption font-semibold text-surface-600 uppercase">{category}</td>
                    </tr>
                    {ALL_PERMISSIONS.filter((p) => p.category === category).map((perm) => {
                      const checked = pendingKeys.has(perm.key);
                      return (
                        <tr key={perm.key} className="hover:bg-surface-50">
                          <td className="px-4 py-2.5 text-body text-surface-700">{perm.label}</td>
                          <td className="px-3 py-2.5 text-right w-16">
                            <button
                              onClick={() => togglePermission(perm.key)}
                              aria-label={`${perm.label}: ${checked ? 'enabled' : 'disabled'}`}
                              aria-pressed={checked}
                              className={cn(
                                'h-6 w-6 rounded-md inline-flex items-center justify-center transition-colors',
                                checked ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-300 hover:bg-surface-200',
                              )}
                            >
                              {checked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedRole && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Shield className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="text-body font-medium text-surface-900">{userCountFor(selectedRole.id)} users assigned</p>
                <p className="text-caption text-surface-500">Changes apply immediately to all assigned users</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('user-management')}>Manage Users</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Create role modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); reset(); }}
        title="Create Role"
        description="Define a new role — permissions can be set afterwards in the matrix"
        footer={
          <>
            <Button variant="outline" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onCreate)}>Create Role</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Role Name" placeholder="e.g. Asset Auditor" error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" placeholder="Describe what this role can do..." {...register('description')} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteRole}
        title="Delete this role?"
        message={`${deleteTarget?.name} will be removed. Users with this role will need to be reassigned.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
