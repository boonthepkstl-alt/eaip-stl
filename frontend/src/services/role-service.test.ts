import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshRoleService() {
  vi.resetModules();
  const mod = await import('@/services/role-service');
  return mod.roleService;
}

describe('roleService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('listRoles returns the seeded fixture roles', async () => {
    const roleService = await freshRoleService();
    const result = await roleService.listRoles();
    expect(result.total).toBeGreaterThan(0);
    expect(result.data.some((r) => r.name === 'System Administrator')).toBe(true);
  });

  it('getRole returns null for an unknown id', async () => {
    const roleService = await freshRoleService();
    const result = await roleService.getRole('does-not-exist');
    expect(result).toBeNull();
  });

  it('createRole adds a new non-system role that listRoles then returns', async () => {
    const roleService = await freshRoleService();
    const before = await roleService.listRoles();
    const created = await roleService.createRole({ name: 'Asset Auditor', description: 'Read-only audit access' });
    const after = await roleService.listRoles();
    expect(after.total).toBe(before.total + 1);
    expect(created.system).toBe(false);
  });

  it('deleteRole removes a non-system role', async () => {
    const roleService = await freshRoleService();
    const before = await roleService.listRoles();
    await roleService.deleteRole('r2'); // Asset Manager, non-system
    const after = await roleService.listRoles();
    expect(after.total).toBe(before.total - 1);
    expect(after.data.some((r) => r.id === 'r2')).toBe(false);
  });

  it('deleteRole rejects a system role', async () => {
    const roleService = await freshRoleService();
    await expect(roleService.deleteRole('r1')).rejects.toThrow(); // System Administrator, system: true
  });

  it('deleteRole rejects an unknown role id', async () => {
    const roleService = await freshRoleService();
    await expect(roleService.deleteRole('does-not-exist')).rejects.toThrow();
  });
});
