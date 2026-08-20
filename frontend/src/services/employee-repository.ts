import type { CreateEmployeeInput, Employee, EmployeeListQuery, EmployeeListResult, UpdateEmployeeInput } from '@/types/employee';

/**
 * Contract employeeService depends on. MockEmployeeRepository is the only implementation
 * in Phase 5A — swap it for an HttpEmployeeRepository backed by GET/POST /api/v1/employees
 * (see EMPLOYEE-MANAGEMENT-API-CONTRACT.md) once the Go backend lands, same pattern as
 * AssetRepository (Phase 4).
 */
export interface EmployeeRepository {
  list(query: EmployeeListQuery): Promise<EmployeeListResult>;
  getById(id: string): Promise<Employee | null>;
  create(input: CreateEmployeeInput): Promise<Employee>;
  update(id: string, input: UpdateEmployeeInput): Promise<Employee>;
}

function simulateNetwork<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

const AVATAR_COLORS = ['bg-brand-500', 'bg-accent-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-violet-500'];

/** Backed by the legacy ESAPS fixture data (data/fixtures/mockData.ts `employees` export). */
export class MockEmployeeRepository implements EmployeeRepository {
  private employees: Employee[];

  constructor(seed: Employee[]) {
    this.employees = [...seed];
  }

  async list(query: EmployeeListQuery): Promise<EmployeeListResult> {
    const search = (query.search ?? '').toLowerCase().trim();
    const filtered = this.employees.filter((e) => {
      const matchesSearch =
        !search ||
        e.name.toLowerCase().includes(search) ||
        e.jobTitle.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search) ||
        e.department.toLowerCase().includes(search) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(search));
      const matchesDept = !query.department || query.department === 'ALL' || e.department === query.department;
      const matchesLoc = !query.location || query.location === 'ALL' || e.location === query.location;
      const matchesStatus = !query.status || query.status === 'ALL' || e.status === query.status;
      return matchesSearch && matchesDept && matchesLoc && matchesStatus;
    });
    return simulateNetwork({ data: filtered, total: filtered.length });
  }

  async getById(id: string): Promise<Employee | null> {
    return simulateNetwork(this.employees.find((e) => e.id === id || e.employeeCode === id) ?? null);
  }

  async create(input: CreateEmployeeInput): Promise<Employee> {
    const seq = this.employees.length + 1;
    const initials = input.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'EM';
    const created: Employee = {
      id: `e${seq}`,
      employeeCode: `EMP-${seq.toString().padStart(4, '0')}`,
      name: input.name,
      email: input.email,
      phone: input.phone || '+1 (555) 000-0000',
      jobTitle: input.jobTitle || 'Staff Specialist',
      title: input.jobTitle || 'Staff Specialist',
      department: input.department,
      departmentId: `DEPT-${input.department.slice(0, 3).toUpperCase()}`,
      location: input.location,
      deskLocation: input.deskLocation || 'Open Desk',
      manager: input.manager || '',
      managerId: 'u1',
      status: input.status ?? 'Active',
      avatarColor: AVATAR_COLORS[this.employees.length % AVATAR_COLORS.length],
      initials,
      startDate: new Date().toISOString().split('T')[0],
      workstationType: 'Standard Corporate Workstation',
      primaryOs: 'macOS & Windows 11',
      assignedCount: 0,
    };
    this.employees = [created, ...this.employees];
    return simulateNetwork(created);
  }

  async update(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    const existing = this.employees.find((e) => e.id === id);
    if (!existing) {
      throw new Error(`Employee ${id} not found`);
    }
    const updated: Employee = {
      ...existing,
      jobTitle: input.jobTitle ?? existing.jobTitle,
      title: input.jobTitle ?? existing.title,
      department: input.department ?? existing.department,
      location: input.location ?? existing.location,
      deskLocation: input.deskLocation ?? existing.deskLocation,
      phone: input.phone ?? existing.phone,
      manager: input.manager ?? existing.manager,
      status: input.status ?? existing.status,
    };
    this.employees = this.employees.map((e) => (e.id === id ? updated : e));
    return simulateNetwork(updated);
  }
}
