import type { AllocatedSeat, LicenseListQuery, RenewLicenseInput, SoftwareLicense, UpdateLicenseInput } from '@/types/license';

/**
 * Contract licenseService depends on. MockSoftwareLicenseRepository is the only
 * implementation in Phase 5C — swap it for an HttpSoftwareLicenseRepository backed by
 * GET/POST /api/v1/licenses (see SOFTWARE-LICENSE-API-CONTRACT.md) once the Go backend lands,
 * same pattern as AssetRepository/EmployeeRepository/TicketRepository.
 */
export interface SoftwareLicenseRepository {
  list(query: LicenseListQuery): Promise<{ data: SoftwareLicense[]; total: number }>;
  getById(idOrCode: string): Promise<SoftwareLicense | null>;
  create(license: SoftwareLicense): Promise<SoftwareLicense>;
  update(id: string, input: UpdateLicenseInput): Promise<SoftwareLicense>;
  renew(id: string, input: RenewLicenseInput): Promise<SoftwareLicense>;
  allocateSeat(id: string, seat: AllocatedSeat): Promise<SoftwareLicense>;
  releaseSeat(id: string, seatId: string): Promise<SoftwareLicense>;
}

function simulateNetwork<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

/** Backed by the legacy ESAPS fixture data (data/fixtures/licenseData.ts). */
export class MockSoftwareLicenseRepository implements SoftwareLicenseRepository {
  private licenses: SoftwareLicense[];

  constructor(seed: SoftwareLicense[]) {
    this.licenses = [...seed];
  }

  async list(query: LicenseListQuery): Promise<{ data: SoftwareLicense[]; total: number }> {
    const search = (query.search ?? '').toLowerCase().trim();
    const filtered = this.licenses.filter((l) => {
      if (query.category && query.category !== 'all' && l.category !== query.category) return false;
      if (query.status && query.status !== 'all' && l.status !== query.status) return false;
      if (query.vendor && query.vendor !== 'all' && l.vendor !== query.vendor) return false;
      if (search) {
        const matches =
          l.product.toLowerCase().includes(search) ||
          l.vendor.toLowerCase().includes(search) ||
          l.licenseCode.toLowerCase().includes(search) ||
          l.category.toLowerCase().includes(search) ||
          l.licenseKey.toLowerCase().includes(search);
        if (!matches) return false;
      }
      return true;
    });
    return simulateNetwork({ data: filtered, total: filtered.length });
  }

  async getById(idOrCode: string): Promise<SoftwareLicense | null> {
    return simulateNetwork(this.licenses.find((l) => l.id === idOrCode || l.licenseCode === idOrCode) ?? null);
  }

  async create(license: SoftwareLicense): Promise<SoftwareLicense> {
    this.licenses = [license, ...this.licenses];
    return simulateNetwork(license);
  }

  private mutate(id: string, updater: (l: SoftwareLicense) => SoftwareLicense): SoftwareLicense {
    const existing = this.licenses.find((l) => l.id === id);
    if (!existing) throw new Error(`License ${id} not found`);
    const updated = updater(existing);
    this.licenses = this.licenses.map((l) => (l.id === id ? updated : l));
    return updated;
  }

  async update(id: string, input: UpdateLicenseInput): Promise<SoftwareLicense> {
    return simulateNetwork(
      this.mutate(id, (l) => ({
        ...l,
        product: input.product ?? l.product,
        edition: input.edition ?? l.edition,
        vendor: input.vendor ?? l.vendor,
        annualCost: input.annualCost ?? l.annualCost,
        costPerSeat: input.annualCost ? Math.round(input.annualCost / l.seatsPurchased) : l.costPerSeat,
        licenseKey: input.licenseKey ?? l.licenseKey,
        autoRenew: input.autoRenew ?? l.autoRenew,
      }))
    );
  }

  async renew(id: string, input: RenewLicenseInput): Promise<SoftwareLicense> {
    return simulateNetwork(
      this.mutate(id, (l) => {
        const currentExpiry = new Date(l.expiryDate);
        currentExpiry.setFullYear(currentExpiry.getFullYear() + input.addedYears);
        const newExpiryStr = currentExpiry.toISOString().split('T')[0];
        return {
          ...l,
          expiryDate: newExpiryStr,
          seatsPurchased: input.seatsPurchased,
          annualCost: input.annualCost,
          costPerSeat: Math.round(input.annualCost / input.seatsPurchased),
          status: 'Active',
          history: [
            {
              id: `lh-${Date.now()}`,
              licenseId: l.id,
              date: new Date().toISOString().split('T')[0],
              type: 'Contract Renewal',
              title: `${input.addedYears}-Year Subscription Renewed`,
              description: `Renewed through ${newExpiryStr}. Capacity: ${input.seatsPurchased} seats, Cost: $${input.annualCost.toLocaleString()}.`,
              actor: 'Current Admin',
              badge: 'Renewed',
            },
            ...l.history,
          ],
        };
      })
    );
  }

  async allocateSeat(id: string, seat: AllocatedSeat): Promise<SoftwareLicense> {
    return simulateNetwork(
      this.mutate(id, (l) => ({
        ...l,
        seatsUsed: l.seatsUsed + 1,
        allocatedSeats: [seat, ...l.allocatedSeats],
        history: [
          {
            id: `lh-${Date.now()}`,
            licenseId: l.id,
            date: new Date().toISOString().split('T')[0],
            type: 'Seat Allocation',
            title: `Seat Allocated to ${seat.employeeName}`,
            description: `Assigned seat for ${l.product} to ${seat.employeeName} (${seat.employeeCode}).`,
            actor: 'Current Admin',
            badge: 'Seat +1',
          },
          ...l.history,
        ],
      }))
    );
  }

  async releaseSeat(id: string, seatId: string): Promise<SoftwareLicense> {
    return simulateNetwork(
      this.mutate(id, (l) => {
        const seat = l.allocatedSeats.find((s) => s.id === seatId);
        return {
          ...l,
          seatsUsed: Math.max(0, l.seatsUsed - 1),
          allocatedSeats: l.allocatedSeats.filter((s) => s.id !== seatId),
          history: seat
            ? [
                {
                  id: `lh-${Date.now()}`,
                  licenseId: l.id,
                  date: new Date().toISOString().split('T')[0],
                  type: 'Seat Revocation',
                  title: `Seat Revoked from ${seat.employeeName}`,
                  description: `Released seat for ${l.product} previously held by ${seat.employeeName}.`,
                  actor: 'Current Admin',
                  badge: 'Seat -1',
                },
                ...l.history,
              ]
            : l.history,
        };
      })
    );
  }
}
