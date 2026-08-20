import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshEmployeeService() {
  vi.resetModules();
  const mod = await import('@/services/employee-service');
  return mod.employeeService;
}

describe('employeeService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('listEmployees returns the seeded fixture employees', async () => {
    const employeeService = await freshEmployeeService();
    const result = await employeeService.listEmployees({});
    expect(result.total).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.total);
  });

  it('listEmployees filters by search text', async () => {
    const employeeService = await freshEmployeeService();
    const all = await employeeService.listEmployees({});
    const target = all.data[0];
    const result = await employeeService.listEmployees({ search: target.name });
    expect(result.data.some((e) => e.id === target.id)).toBe(true);
  });

  it('getEmployee returns null for an unknown id', async () => {
    const employeeService = await freshEmployeeService();
    const result = await employeeService.getEmployee('does-not-exist');
    expect(result).toBeNull();
  });

  it('createEmployee adds a new employee that listEmployees then returns', async () => {
    const employeeService = await freshEmployeeService();
    const before = await employeeService.listEmployees({});
    const created = await employeeService.createEmployee({
      name: 'Test Person',
      email: 'test.person@example.com',
      department: 'Engineering',
      location: 'HQ - Floor 4',
    });
    const after = await employeeService.listEmployees({});
    expect(after.total).toBe(before.total + 1);
    expect(created.employeeCode).toMatch(/^EMP-/);
    expect(created.status).toBe('Active');
  });

  it('updateEmployee changes the stored employee record', async () => {
    const employeeService = await freshEmployeeService();
    const existing = (await employeeService.listEmployees({})).data[0];
    const updated = await employeeService.updateEmployee(existing.id, { jobTitle: 'Updated Title' });
    expect(updated.jobTitle).toBe('Updated Title');

    const refetched = await employeeService.getEmployee(existing.id);
    expect(refetched?.jobTitle).toBe('Updated Title');
  });

  it('updateEmployee rejects an unknown employee id', async () => {
    const employeeService = await freshEmployeeService();
    await expect(employeeService.updateEmployee('nope', { jobTitle: 'X' })).rejects.toThrow();
  });

  it('getEmployeeAssignments is a one-way read against assetService (Employee -> Asset, never the reverse)', async () => {
    const employeeService = await freshEmployeeService();
    const employees = (await employeeService.listEmployees({})).data;
    const withAssets = employees.find((e) => e.assignedCount > 0) ?? employees[0];

    const assignments = await employeeService.getEmployeeAssignments(withAssets.id, withAssets.name);
    expect(Array.isArray(assignments)).toBe(true);
    for (const asset of assignments) {
      expect(asset.assignedEmployeeId === withAssets.id || asset.assignedTo?.toLowerCase() === withAssets.name.toLowerCase()).toBe(true);
    }
  });
});
