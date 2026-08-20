import { employees as employeeFixtures } from '@/data/fixtures/mockData';
import { assetService } from '@/services/asset-service';
import { MockEmployeeRepository, type EmployeeRepository } from '@/services/employee-repository';
import type { CreateEmployeeInput, Employee, EmployeeListQuery, EmployeeListResult, EmployeeSummary, UpdateEmployeeInput } from '@/types/employee';
import type { Asset } from '@/types/asset';

const repository: EmployeeRepository = new MockEmployeeRepository(employeeFixtures);

/**
 * The stable frontend contract for Employee Management pages (pages/Employees,
 * pages/EmployeeDetail). Employee is its own domain — this file has no dependency on
 * assetRepository/assetService for its own CRUD, and assetService never imports anything
 * from here (one-way: Employee → Asset, never the reverse — see
 * EMPLOYEE-MANAGEMENT-MIGRATION.md "Asset ↔ Employee relationship").
 */
export const employeeService = {
  listEmployees: (query: EmployeeListQuery = {}): Promise<EmployeeListResult> => repository.list(query),
  getEmployee: (id: string): Promise<Employee | null> => repository.getById(id),
  createEmployee: (input: CreateEmployeeInput): Promise<Employee> => repository.create(input),
  updateEmployee: (id: string, input: UpdateEmployeeInput): Promise<Employee> => repository.update(id, input),

  /**
   * The one explicit, documented cross-domain read: an employee's assigned assets live in the
   * Asset domain (Asset.assignedEmployeeId), so this asks assetService for the full asset list
   * and filters here rather than duplicating a second copy of asset data inside the Employee
   * repository. Returns full `Asset` records (not the narrower `EmployeeAssignment` wire type)
   * because the Assigned Assets table needs the whole row — see types/employee.ts.
   */
  getEmployeeAssignments: async (employeeId: string, employeeName: string): Promise<Asset[]> => {
    const { data } = await assetService.listAssets({});
    return data.filter((a) => a.assignedEmployeeId === employeeId || (a.assignedTo && a.assignedTo.toLowerCase() === employeeName.toLowerCase()));
  },

  getEmployeeSummary: async (employeeId: string, employeeName: string): Promise<EmployeeSummary> => {
    const assignments = await employeeService.getEmployeeAssignments(employeeId, employeeName);
    return {
      assignedAssetCount: assignments.length,
      totalAssetValue: assignments.reduce((sum, a) => sum + (a.currentValue || 0), 0),
      openTicketCount: 0, // Maintenance domain — formalized when Maintenance gets its own service
    };
  },
};
