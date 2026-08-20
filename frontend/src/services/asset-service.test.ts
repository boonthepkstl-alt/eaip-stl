import { beforeEach, describe, expect, it, vi } from 'vitest';

// Reset module state between tests since asset-service.ts wires a module-level singleton
// MockAssetRepository seeded once at import time.
async function freshAssetService() {
  vi.resetModules();
  const mod = await import('@/services/asset-service');
  return mod.assetService;
}

describe('assetService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('listAssets returns the seeded fixture assets', async () => {
    const assetService = await freshAssetService();
    const result = await assetService.listAssets({});
    expect(result.total).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.total);
  });

  it('listAssets filters by search text', async () => {
    const assetService = await freshAssetService();
    const all = await assetService.listAssets({});
    const target = all.data[0];
    const result = await assetService.listAssets({ search: target.code });
    expect(result.data.every((a) => a.code === target.code)).toBe(true);
  });

  it('getAsset returns null for an unknown id', async () => {
    const assetService = await freshAssetService();
    const result = await assetService.getAsset('does-not-exist');
    expect(result).toBeNull();
  });

  it('createAsset adds a new asset that listAssets then returns', async () => {
    const assetService = await freshAssetService();
    const before = await assetService.listAssets({});
    const created = await assetService.createAsset({
      name: 'Test Laptop',
      category: 'IT Hardware',
      type: 'Laptop',
      serialNumber: 'TEST-0001',
      purchaseCost: 1000,
      purchaseDate: '2026-01-01',
      department: 'Engineering',
      location: 'HQ - Floor 4',
      condition: 'Excellent',
    });
    const after = await assetService.listAssets({});
    expect(after.total).toBe(before.total + 1);
    expect(created.status).toBe('Available');
    expect(created.code).toMatch(/^AST-/);
  });

  it('assignAsset marks the asset as Assigned to the given employee', async () => {
    const assetService = await freshAssetService();
    const available = (await assetService.listAssets({ status: 'Available' })).data[0];
    expect(available).toBeDefined();

    const updated = await assetService.assignAsset({ assetId: available.id, employeeId: 'e99', employeeName: 'Test Employee' });
    expect(updated.status).toBe('Assigned');
    expect(updated.assignedTo).toBe('Test Employee');
    expect(updated.assignedEmployeeId).toBe('e99');
  });

  it('assignAsset rejects an unknown asset id', async () => {
    const assetService = await freshAssetService();
    await expect(assetService.assignAsset({ assetId: 'nope', employeeId: 'e1', employeeName: 'X' })).rejects.toThrow();
  });
});
