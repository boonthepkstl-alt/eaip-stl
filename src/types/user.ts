// Wave 6 — Epic: User/Role/Permission + Baseline Administration (FR-08..FR-12).
// Named `ManagedUser` intentionally to avoid clashing with `types/auth.ts` User (the
// currently-logged-in session user shape).
export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string; // FR-10 single-select -> role.ts Role.id
  departmentId: string; // FR-12 single-select -> masterdata.ts Department.id
  employeeId?: string; // optional link -> organization.ts Employee.id
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
