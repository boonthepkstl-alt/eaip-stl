import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshUserService() {
  vi.resetModules();
  const mod = await import('@/services/user-service');
  return mod.userService;
}

describe('userService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('listUsers returns the seeded fixture users', async () => {
    const userService = await freshUserService();
    const result = await userService.listUsers({});
    expect(result.total).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.total);
  });

  it('listUsers filters by search text', async () => {
    const userService = await freshUserService();
    const result = await userService.listUsers({ search: 'Sarah Chen' });
    expect(result.data.every((u) => u.name.toLowerCase().includes('sarah chen'))).toBe(true);
  });

  it('listUsers filters by status', async () => {
    const userService = await freshUserService();
    const result = await userService.listUsers({ status: 'Suspended' });
    expect(result.data.every((u) => u.status === 'Suspended')).toBe(true);
    expect(result.data.some((u) => u.name === 'Olivia Brown')).toBe(true);
  });

  it('getUser returns null for an unknown id', async () => {
    const userService = await freshUserService();
    const result = await userService.getUser('does-not-exist');
    expect(result).toBeNull();
  });

  it('inviteUser adds a new active user that listUsers then returns', async () => {
    const userService = await freshUserService();
    const before = await userService.listUsers({});
    const created = await userService.inviteUser({ name: 'Jordan Smith', email: 'jordan@raise.co', role: 'Viewer', department: 'Engineering' });
    const after = await userService.listUsers({});
    expect(after.total).toBe(before.total + 1);
    expect(created.status).toBe('Active');
  });

  it('updateUserStatus suspends a user', async () => {
    const userService = await freshUserService();
    const updated = await userService.updateUserStatus('u2', 'Suspended');
    expect(updated.status).toBe('Suspended');
    expect(updated.name).toBe('Sarah Chen');
  });

  it('updateUserStatus rejects an unknown user id', async () => {
    const userService = await freshUserService();
    await expect(userService.updateUserStatus('does-not-exist', 'Suspended')).rejects.toThrow();
  });
});
