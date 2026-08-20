// User domain types (Phase 6 — Administration). This is the platform login/identity account
// (email, system role label, account status) — a distinct domain from Employee (company
// personnel record with hardware assignments, see types/employee.ts). Confirmed by reading the
// legacy fixture: User and Employee are two unrelated arrays in mockData.ts with no shared id
// space, matching the DEFER decision already recorded in EMPLOYEE-MANAGEMENT-MIGRATION.md.

export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: UserStatus;
  lastActive: string;
  initials: string;
  avatarColor: string;
}

export interface InviteUserInput {
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface UserListQuery {
  search?: string;
  status?: UserStatus | 'all';
}

export interface UserListResult {
  data: User[];
  total: number;
}
