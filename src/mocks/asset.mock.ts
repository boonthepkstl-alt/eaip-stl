// Mock data + in-memory mock API for Asset Management (Wave 3, Epic ASSET, FR-20..FR-27).
// Wave 2 (Dashboard) used flat category/location label strings — Wave 3 replaces those with
// categoryId/locationId FKs resolved via masterdata.mock.ts. Row count/category-location-status
// distribution is preserved exactly (18 rows) to avoid regressing dashboard.mock.test.ts.
import { Asset, AssetHistoryEntry } from '@/types/asset';
import { PaginatedResponse, PaginationParams } from '@/types/common';

const now = '2026-08-01T09:00:00.000Z';
const seedUser = 'system.seed';

export const mockAssets: Asset[] = [
  {
    id: 'AST-001',
    assetTag: 'NB-0001',
    name: 'Lenovo ThinkPad T14',
    categoryId: 'CAT-001',
    locationId: 'LOC-001',
    status: 'active',
    serialNumber: 'SN-NB-0001',
    vendorId: 'VEN-003',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-002',
    assetTag: 'NB-0002',
    name: 'Lenovo ThinkPad T14',
    categoryId: 'CAT-001',
    locationId: 'LOC-001',
    status: 'active',
    serialNumber: 'SN-NB-0002',
    vendorId: 'VEN-003',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-003',
    assetTag: 'NB-0003',
    name: 'Dell Latitude 5420',
    categoryId: 'CAT-001',
    locationId: 'LOC-002',
    status: 'idle',
    serialNumber: 'SN-NB-0003',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-004',
    assetTag: 'NB-0004',
    name: 'Dell Latitude 5420',
    categoryId: 'CAT-001',
    locationId: 'LOC-003',
    status: 'active',
    serialNumber: 'SN-NB-0004',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-005',
    assetTag: 'DT-0001',
    name: 'Dell OptiPlex 7090',
    categoryId: 'CAT-002',
    locationId: 'LOC-001',
    status: 'active',
    serialNumber: 'SN-DT-0001',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-006',
    assetTag: 'DT-0002',
    name: 'Dell OptiPlex 7090',
    categoryId: 'CAT-002',
    locationId: 'LOC-001',
    status: 'idle',
    serialNumber: 'SN-DT-0002',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-007',
    assetTag: 'DT-0003',
    name: 'HP EliteDesk 800',
    categoryId: 'CAT-002',
    locationId: 'LOC-002',
    status: 'active',
    serialNumber: 'SN-DT-0003',
    vendorId: 'VEN-002',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-008',
    assetTag: 'DT-0004',
    name: 'HP EliteDesk 800',
    categoryId: 'CAT-002',
    locationId: 'LOC-003',
    status: 'idle',
    serialNumber: 'SN-DT-0004',
    vendorId: 'VEN-002',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-009',
    assetTag: 'MN-0001',
    name: 'Dell UltraSharp 24',
    categoryId: 'CAT-003',
    locationId: 'LOC-001',
    status: 'active',
    serialNumber: 'SN-MN-0001',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-010',
    assetTag: 'MN-0002',
    name: 'Dell UltraSharp 24',
    categoryId: 'CAT-003',
    locationId: 'LOC-002',
    status: 'active',
    serialNumber: 'SN-MN-0002',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-011',
    assetTag: 'MN-0003',
    name: 'HP E24 G5',
    categoryId: 'CAT-003',
    locationId: 'LOC-002',
    status: 'idle',
    serialNumber: 'SN-MN-0003',
    vendorId: 'VEN-002',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-012',
    assetTag: 'MN-0004',
    name: 'HP E24 G5',
    categoryId: 'CAT-003',
    locationId: 'LOC-003',
    status: 'active',
    serialNumber: 'SN-MN-0004',
    vendorId: 'VEN-002',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-013',
    assetTag: 'PR-0001',
    name: 'HP LaserJet Pro M404',
    categoryId: 'CAT-004',
    locationId: 'LOC-001',
    status: 'idle',
    serialNumber: 'SN-PR-0001',
    vendorId: 'VEN-002',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-014',
    assetTag: 'PR-0002',
    name: 'HP LaserJet Pro M404',
    categoryId: 'CAT-004',
    locationId: 'LOC-002',
    status: 'active',
    serialNumber: 'SN-PR-0002',
    vendorId: 'VEN-002',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-015',
    assetTag: 'PR-0003',
    name: 'Dell E515dw',
    categoryId: 'CAT-004',
    locationId: 'LOC-003',
    status: 'idle',
    serialNumber: 'SN-PR-0003',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-016',
    assetTag: 'NB-0005',
    name: 'Lenovo ThinkPad T14',
    categoryId: 'CAT-001',
    locationId: 'LOC-002',
    status: 'active',
    serialNumber: 'SN-NB-0005',
    vendorId: 'VEN-003',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-017',
    assetTag: 'DT-0005',
    name: 'Dell OptiPlex 7090',
    categoryId: 'CAT-002',
    locationId: 'LOC-003',
    status: 'active',
    serialNumber: 'SN-DT-0005',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'AST-018',
    assetTag: 'MN-0005',
    name: 'Dell UltraSharp 24',
    categoryId: 'CAT-003',
    locationId: 'LOC-001',
    status: 'idle',
    serialNumber: 'SN-MN-0005',
    vendorId: 'VEN-001',
    isArchived: false,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
];

const mockHistory: AssetHistoryEntry[] = mockAssets.map((asset, index) => ({
  id: `AHIST-${String(index + 1).padStart(3, '0')}`,
  assetId: asset.id,
  changeType: 'field_update',
  description: 'Asset registered in system',
  changedBy: seedUser,
  changedAt: now,
}));

export interface AssetListParams extends Partial<PaginationParams> {
  categoryId?: string;
  locationId?: string;
  status?: string;
  search?: string;
}

function matchesFilters(asset: Asset, params?: AssetListParams): boolean {
  if (!params) return true;
  if (params.categoryId && asset.categoryId !== params.categoryId) return false;
  if (params.locationId && asset.locationId !== params.locationId) return false;
  if (params.status && asset.status !== params.status) return false;
  if (params.search) {
    const term = params.search.toLowerCase();
    const haystack = `${asset.assetTag} ${asset.name} ${asset.serialNumber ?? ''}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  return true;
}

export const assetMock = {
  list: async (params?: AssetListParams): Promise<PaginatedResponse<Asset>> => {
    const filtered = mockAssets.filter((asset) => !asset.isArchived && matchesFilters(asset, params));
    const page = params?.page ?? 1;
    const limit = params?.limit ?? filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    };
  },

  getById: async (id: string): Promise<Asset | undefined> => {
    return mockAssets.find((asset) => asset.id === id);
  },

  create: async (payload: Omit<Asset, 'id' | 'isArchived' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<Asset> => {
    const timestamp = new Date().toISOString();
    const newAsset: Asset = {
      ...payload,
      id: `AST-${String(mockAssets.length + 1).padStart(3, '0')}`,
      isArchived: false,
      createdAt: timestamp,
      createdBy: 'current.user',
      updatedAt: timestamp,
      updatedBy: 'current.user',
    };
    mockAssets.push(newAsset);
    return newAsset;
  },

  update: async (id: string, payload: Partial<Asset>): Promise<Asset> => {
    const index = mockAssets.findIndex((asset) => asset.id === id);
    if (index === -1) {
      throw new Error(`Asset ${id} not found`);
    }
    const updated: Asset = {
      ...mockAssets[index],
      ...payload,
      id: mockAssets[index].id,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current.user',
    };
    mockAssets[index] = updated;
    return updated;
  },

  archive: async (id: string): Promise<Asset> => {
    return assetMock.update(id, { isArchived: true });
  },

  getHistory: async (assetId: string): Promise<AssetHistoryEntry[]> => {
    return mockHistory.filter((entry) => entry.assetId === assetId);
  },
};
