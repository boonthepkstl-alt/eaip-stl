import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { Employee } from '@/types/organization';
import { mockEmployees } from '@/mocks/organization.mock';

export type CreateEmployeePayload = Omit<Employee, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;
export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

// Organization API — MINIMAL SEED for Wave 4 (see src/types/organization.ts). Wave 6 (Epic:
// User/Role/Permission + Baseline Administration) extends this with full Employee CRUD, same
// USE_MOCK switch pattern as src/services/asset.ts/dashboard.ts. listEmployees/getEmployee/
// getDirectManager signatures are kept unchanged — workflow.ts/CheckInCheckOut/
// AssignTransferDrawer depend on them.
export const organizationAPI = {
  listEmployees: async (): Promise<Employee[]> => {
    if (USE_MOCK) {
      return mockEmployees;
    }
    const response = await api.get<Employee[]>(API_ENDPOINTS.ORGANIZATION.EMPLOYEES);
    return response.data;
  },

  getEmployee: async (id: string): Promise<Employee | undefined> => {
    if (USE_MOCK) {
      return mockEmployees.find((employee) => employee.id === id);
    }
    const response = await api.get<Employee>(API_ENDPOINTS.ORGANIZATION.EMPLOYEE_DETAIL(id));
    return response.data;
  },

  getDirectManager: async (employeeId: string): Promise<Employee | undefined> => {
    const employee = await organizationAPI.getEmployee(employeeId);
    if (!employee?.directManagerId) {
      return undefined;
    }
    return organizationAPI.getEmployee(employee.directManagerId);
  },

  getEmployeesByDepartment: async (departmentId: string): Promise<Employee[]> => {
    const employees = await organizationAPI.listEmployees();
    return employees.filter((employee) => employee.departmentId === departmentId);
  },

  create: async (payload: CreateEmployeePayload): Promise<Employee> => {
    if (USE_MOCK) {
      const timestamp = new Date().toISOString();
      const created: Employee = {
        ...payload,
        id: `EMP-${String(mockEmployees.length + 1).padStart(3, '0')}`,
        createdAt: timestamp,
        createdBy: 'current.user',
        updatedAt: timestamp,
        updatedBy: 'current.user',
      };
      mockEmployees.push(created);
      return created;
    }
    const response = await api.post<Employee>(API_ENDPOINTS.ORGANIZATION.EMPLOYEES, payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateEmployeePayload): Promise<Employee> => {
    if (USE_MOCK) {
      const index = mockEmployees.findIndex((employee) => employee.id === id);
      if (index === -1) {
        throw new Error(`Employee ${id} not found`);
      }
      const updated: Employee = {
        ...mockEmployees[index],
        ...payload,
        id: mockEmployees[index].id,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current.user',
      };
      mockEmployees[index] = updated;
      return updated;
    }
    const response = await api.put<Employee>(API_ENDPOINTS.ORGANIZATION.EMPLOYEE_DETAIL(id), payload);
    return response.data;
  },

  deactivate: async (id: string): Promise<Employee> => organizationAPI.update(id, { isActive: false }),
};
