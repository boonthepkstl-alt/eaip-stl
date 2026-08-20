import type { Asset, AssetListQuery, AssetListResult, AssignAssetInput, CreateAssetInput } from '@/types/asset';

/**
 * Contract the AssetService depends on. MockAssetRepository (below) is the only
 * implementation that exists in Phase 4 — swap it for an HttpAssetRepository backed by
 * GET/POST /api/v1/assets (see API-SPECIFICATION.md and
 * ASSET-MANAGEMENT-API-CONTRACT.md) once the Go backend lands, with no change required
 * to AssetService or any page that consumes it.
 */
export interface AssetRepository {
  list(query: AssetListQuery): Promise<AssetListResult>;
  getById(id: string): Promise<Asset | null>;
  create(input: CreateAssetInput): Promise<Asset>;
  assign(input: AssignAssetInput): Promise<Asset>;
}

function simulateNetwork<T>(value: T, delayMs = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

/**
 * Backed by the legacy ESAPS fixture data (src/data/mockData.ts, copied verbatim into
 * data/fixtures/). Mutates an in-memory copy so create/assign behave like a real backend
 * within a single session — state resets on page reload, same limitation the original
 * ESAPS prototype had.
 */
export class MockAssetRepository implements AssetRepository {
  private assets: Asset[];

  constructor(seed: Asset[]) {
    this.assets = [...seed];
  }

  async list(query: AssetListQuery): Promise<AssetListResult> {
    const search = (query.search ?? '').toLowerCase();
    const filtered = this.assets.filter((a) => {
      const matchesSearch = !search || a.name.toLowerCase().includes(search) || a.code.toLowerCase().includes(search);
      const matchesStatus = !query.status || query.status === 'all' || a.status === query.status;
      const matchesDept = !query.department || query.department === 'all' || a.department === query.department;
      return matchesSearch && matchesStatus && matchesDept;
    });
    return simulateNetwork({ data: filtered, total: filtered.length });
  }

  async getById(id: string): Promise<Asset | null> {
    return simulateNetwork(this.assets.find((a) => a.id === id) ?? null);
  }

  async create(input: CreateAssetInput): Promise<Asset> {
    const id = `a${this.assets.length + 1}`;
    const code = input.code?.trim() || `AST-${(this.assets.length + 1).toString().padStart(4, '0')}`;
    const created: Asset = {
      id,
      code,
      name: input.name,
      category: input.category,
      type: input.type,
      status: 'Available',
      condition: input.condition,
      location: input.location,
      department: input.department,
      assignedTo: null,
      assignedEmployeeId: null,
      purchaseDate: input.purchaseDate,
      purchaseCost: input.purchaseCost,
      currentValue: input.purchaseCost,
      warrantyExpiry: input.warrantyExpiry ?? '',
      vendor: input.vendor ?? '',
      serialNumber: input.serialNumber,
      specs: [],
    };
    this.assets = [created, ...this.assets];
    return simulateNetwork(created);
  }

  async assign(input: AssignAssetInput): Promise<Asset> {
    const asset = this.assets.find((a) => a.id === input.assetId);
    if (!asset) {
      throw new Error(`Asset ${input.assetId} not found`);
    }
    const updated: Asset = {
      ...asset,
      status: 'Assigned',
      assignedTo: input.employeeName,
      assignedEmployeeId: input.employeeId,
      assignedDate: new Date().toISOString().split('T')[0],
    };
    this.assets = this.assets.map((a) => (a.id === input.assetId ? updated : a));
    return simulateNetwork(updated);
  }
}
