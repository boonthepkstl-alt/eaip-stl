import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshLicenseService() {
  vi.resetModules();
  const mod = await import('@/services/license-service');
  return mod.licenseService;
}

describe('licenseService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('listLicenses returns the seeded fixture licenses', async () => {
    const licenseService = await freshLicenseService();
    const result = await licenseService.listLicenses({});
    expect(result.total).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.total);
  });

  it('listLicenses filters by search text', async () => {
    const licenseService = await freshLicenseService();
    const result = await licenseService.listLicenses({ search: 'Microsoft 365' });
    expect(result.data.every((l) => l.product.toLowerCase().includes('microsoft 365'))).toBe(true);
  });

  it('getLicense returns null for an unknown id', async () => {
    const licenseService = await freshLicenseService();
    const result = await licenseService.getLicense('does-not-exist');
    expect(result).toBeNull();
  });

  it('createLicense adds a new license that listLicenses then returns', async () => {
    const licenseService = await freshLicenseService();
    const before = await licenseService.listLicenses({});
    const created = await licenseService.createLicense({
      product: 'Test Product',
      vendor: 'Test Vendor',
      category: 'Developer Tools & IDE',
      type: 'Subscription (Named User)',
      seatsPurchased: 20,
      annualCost: 6000,
      expiryDate: '2027-01-01',
    });
    const after = await licenseService.listLicenses({});
    expect(after.total).toBe(before.total + 1);
    expect(created.licenseCode).toMatch(/^LIC-TEST/);
    expect(created.status).toBe('Active');
    expect(created.costPerSeat).toBe(300);
  });

  it('allocateSeat resolves employeeId/assetId into a real seat snapshot (one-way Employee/Asset dependency)', async () => {
    const licenseService = await freshLicenseService();
    const before = await licenseService.getLicense('l1');
    expect(before).not.toBeNull();

    const updated = await licenseService.allocateSeat('l1', { employeeId: 'e1', allocationRole: 'Standard User' });
    expect(updated.seatsUsed).toBe((before?.seatsUsed ?? 0) + 1);
    expect(updated.allocatedSeats[0].employeeName).toBe('Sarah Chen'); // e1 in the fixture
  });

  it('allocateSeat rejects an unknown employee id', async () => {
    const licenseService = await freshLicenseService();
    await expect(licenseService.allocateSeat('l1', { employeeId: 'nope', allocationRole: 'Standard User' })).rejects.toThrow();
  });

  it('releaseSeat removes an allocated seat and decrements seatsUsed', async () => {
    const licenseService = await freshLicenseService();
    const allocated = await licenseService.allocateSeat('l1', { employeeId: 'e2', allocationRole: 'Standard User' });
    const seatId = allocated.allocatedSeats[0].id;

    const released = await licenseService.releaseSeat('l1', seatId);
    expect(released.allocatedSeats.some((s) => s.id === seatId)).toBe(false);
    expect(released.seatsUsed).toBe(allocated.seatsUsed - 1);
  });

  it('renewLicense extends the expiry date and updates cost/seats', async () => {
    const licenseService = await freshLicenseService();
    const before = await licenseService.getLicense('l1');
    const updated = await licenseService.renewLicense('l1', { addedYears: 1, seatsPurchased: 600, annualCost: 120000 });

    expect(updated.seatsPurchased).toBe(600);
    expect(updated.annualCost).toBe(120000);
    expect(updated.status).toBe('Active');
    expect(new Date(updated.expiryDate).getFullYear()).toBe(new Date(before!.expiryDate).getFullYear() + 1);
  });
});
