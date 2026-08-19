// Wave 6 — Epic: User/Role/Permission + Baseline Administration (FR-09, FR-11).
export type PermissionKey =
  | 'user:manage'
  | 'role:manage'
  | 'org:manage'
  | 'masterdata:manage'
  | 'admin:access'
  | 'asset:read'
  | 'asset:create'
  | 'asset:update'
  | 'assignment:read'
  | 'assignment:checkinout'
  | 'approval:action'
  | 'workflow:configure'
  | 'itrequest:read'
  | 'itrequest:create'
  | 'itrequest:assign'
  | 'report:read';

export interface Permission {
  key: PermissionKey;
  label: string;
  category: 'Administration' | 'Asset' | 'Assignment/Approval' | 'IT Request' | 'Reporting';
}

export interface Role {
  id: string; // uses the same value as auth.ts UserRole, e.g. 'administrator'
  name: string;
  description?: string;
  permissionKeys: PermissionKey[];
  isSystemRole: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
