// Employee domain types (Phase 5A). Shape matches the legacy Employee interface in
// src/data/mockData.ts as-is (same reasoning as Asset in Phase 4 — do not recreate UI, so
// the wire shape stays close to what the ported pages already expect).

export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive';

// Free-text in the legacy mock data — kept as a plain string alias until a real
// `departments` table exists (see DATABASE-DESIGN.md).
export type Department = string;

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  title: string;
  department: Department;
  departmentId: string;
  location: string;
  deskLocation: string;
  manager: string;
  managerId: string;
  status: EmployeeStatus;
  avatarColor: string;
  initials: string;
  startDate: string;
  workstationType: string;
  primaryOs: string;
  assignedCount: number;
}

// Computed, not stored — see employeeService.getEmployeeSummary.
export interface EmployeeSummary {
  assignedAssetCount: number;
  totalAssetValue: number;
  openTicketCount: number;
}

// Target wire shape for GET /api/v1/employees/:id/assignments (see
// EMPLOYEE-MANAGEMENT-API-CONTRACT.md). The Phase 5A mock implementation returns full `Asset`
// records instead (the UI needs the whole asset row to render its table) — this narrower type
// documents what the real endpoint should return once Asset/Employee are separate backend
// services and a full Asset join isn't free.
export interface EmployeeAssignment {
  employeeId: string;
  assetId: string;
  assignedAt: string;
  status: 'active' | 'returned';
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  jobTitle?: string;
  phone?: string;
  department: string;
  location: string;
  deskLocation?: string;
  manager?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeInput {
  jobTitle?: string;
  department?: string;
  location?: string;
  deskLocation?: string;
  phone?: string;
  manager?: string;
  status?: EmployeeStatus;
}

export interface EmployeeListQuery {
  search?: string;
  department?: string | 'ALL';
  location?: string | 'ALL';
  status?: EmployeeStatus | 'ALL';
}

export interface EmployeeListResult {
  data: Employee[];
  total: number;
}
