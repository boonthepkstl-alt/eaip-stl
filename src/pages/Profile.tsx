import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Building2, Calendar, Shield, Settings, Edit, Check, UserCircle } from 'lucide-react';
import { Card, Button, Badge, Input, SectionCard, useToast, Skeleton, EmptyState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/services/user';
import { roleAPI } from '@/services/role';
import { organizationAPI } from '@/services/organization';
import { masterdataAPI } from '@/services/masterdata';
import { authAPI } from '@/services/auth';
import { ManagedUser } from '@/types/user';
import { Employee } from '@/types/organization';
import { formatDate } from '@/utils/format';

interface ProfileProps {
  onNavigate: (id: string) => void;
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

interface PersonalInfoFormValues {
  fullName: string;
  email: string;
  username: string;
}

// FR-08 (Epic: User/Role/Permission + Baseline Administration) — real identity via
// useAuth().user (session) + userAPI/roleAPI/organizationAPI/masterdataAPI, replacing Bolt's
// hardcoded "Alex Morgan" fixture. Fields with no real source (phone, bio, office floor,
// activity-summary counters) are dropped rather than fabricated. Change Password is wired to
// the real authAPI.changePassword — that service intentionally has no USE_MOCK branch (see
// services/auth.ts), so in this mock-only environment it will surface a real network error
// instead of a fake "saved" toast; that is accurate behavior, not a bug, until a backend exists.
// Two-Factor Authentication has no enroll/disable UI here (that is a separate, larger feature)
// — only the real current status is shown.
export function Profile({ onNavigate }: ProfileProps) {
  const { user } = useAuth();
  const { push } = useToast();
  const [managedUser, setManagedUser] = useState<ManagedUser | null>(null);
  const [roleName, setRoleName] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<PersonalInfoFormValues>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
  } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  const fetchProfile = () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      userAPI.getById(user.id),
      roleAPI.getById(user.role),
      user.employeeId ? organizationAPI.getEmployee(user.employeeId) : Promise.resolve(undefined),
      masterdataAPI.listDepartments(),
    ])
      .then(([foundUser, role, emp, departments]) => {
        if (foundUser) {
          setManagedUser(foundUser);
          reset({ fullName: foundUser.fullName, email: foundUser.email, username: foundUser.username });
          setDepartmentName(departments.find((d) => d.id === foundUser.departmentId)?.name ?? '');
        }
        setRoleName(role?.name ?? user.role);
        setEmployee(emp ?? null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSavePersonalInfo = async (values: PersonalInfoFormValues) => {
    if (!managedUser) return;
    try {
      const updated = await userAPI.update(managedUser.id, values);
      setManagedUser(updated);
      reset(values);
      push({ variant: 'success', title: 'Profile updated', message: 'Your changes have been saved' });
    } catch (err) {
      push({ variant: 'error', title: 'Could not update profile', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const onChangePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      push({ variant: 'error', title: 'Passwords do not match' });
      return;
    }
    setPasswordSubmitting(true);
    try {
      await authAPI.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      push({ variant: 'success', title: 'Password changed' });
      resetPassword();
    } catch (err) {
      push({ variant: 'error', title: 'Could not change password', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (loadError || !managedUser) {
    return (
      <EmptyState
        icon={<UserCircle className="h-6 w-6" />}
        title="เกิดข้อผิดพลาด"
        description={loadError ?? 'ไม่พบข้อมูลผู้ใช้'}
        action={<Button size="sm" onClick={fetchProfile}>ลองใหม่</Button>}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      {/* Profile header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-600 to-accent-600" />
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10">
            <div className="h-20 w-20 rounded-full bg-brand-500 flex items-center justify-center text-white text-heading font-bold border-4 border-white shadow-md">
              {initialsOf(managedUser.fullName)}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-heading font-bold text-surface-900">{managedUser.fullName}</h1>
              <p className="text-body text-surface-500">{roleName}{employee?.positionTitle ? ` · ${employee.positionTitle}` : ''}</p>
            </div>
            <div className="flex gap-2 pb-2">
              <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />} onClick={() => onNavigate('settings')}>Settings</Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 flex-wrap text-caption text-surface-500">
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{managedUser.email}</span>
            {departmentName && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{departmentName}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {formatDate(managedUser.createdAt)}</span>
            <Badge variant={managedUser.isActive ? 'success' : 'neutral'} dot>{managedUser.isActive ? 'Active' : 'Suspended'}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Personal info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="Personal Information" description="Update your account details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" {...register('fullName')} />
              <Input label="Username" {...register('username')} />
              <Input label="Email" type="email" {...register('email')} />
              <Input label="Department" value={departmentName} disabled />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => reset()} disabled={!isDirty}>Cancel</Button>
              <Button leftIcon={<Check className="h-4 w-4" />} loading={isSubmitting} disabled={!isDirty} onClick={handleSubmit(onSavePersonalInfo)}>Save Changes</Button>
            </div>
          </SectionCard>

          <SectionCard title="Security" description="Password and authentication">
            <div className="flex flex-col gap-4">
              <Input label="Current Password" type="password" placeholder="••••••••" {...registerPassword('currentPassword')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="New Password" type="password" placeholder="••••••••" {...registerPassword('newPassword')} />
                <Input label="Confirm Password" type="password" placeholder="••••••••" {...registerPassword('confirmPassword')} />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" loading={passwordSubmitting} onClick={handlePasswordSubmit(onChangePassword)}>Change Password</Button>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-surface-100">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-surface-400" />
                  <div><p className="text-body font-medium text-surface-900">Two-Factor Authentication</p><p className="text-caption text-surface-500">Add an extra layer of security</p></div>
                </div>
                <Badge variant={user?.mfaEnabled ? 'success' : 'neutral'}>{user?.mfaEnabled ? 'Enabled' : 'Disabled'}</Badge>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Quick Actions">
            <div className="flex flex-col gap-1">
              {[
                { label: 'Notification Preferences', icon: Edit, onClick: () => onNavigate('notifications') },
                { label: 'Security Settings', icon: Shield, onClick: () => onNavigate('settings') },
                { label: 'System Settings', icon: Settings, onClick: () => onNavigate('settings') },
              ].map((a) => (
                <button key={a.label} onClick={a.onClick} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-surface-50 transition-colors text-left">
                  <a.icon className="h-4 w-4 text-surface-400" />
                  <span className="text-body text-surface-700">{a.label}</span>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
