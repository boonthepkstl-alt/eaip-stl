import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { Asset, AssetHistoryEntry } from '@/types/asset';
import { PaginatedResponse } from '@/types/common';
import { assetMock, type AssetListParams } from '@/mocks/asset.mock';

export type { AssetListParams };

export type CreateAssetPayload = Omit<
  Asset,
  'id' | 'isArchived' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;

export type UpdateAssetPayload = Partial<CreateAssetPayload>;

// Asset API (Wave 3 — Epic ASSET, FR-20..FR-27). Uses USE_MOCK to switch between the
// in-memory mock (assetMock) and the real backend, same pattern as services/dashboard.ts.
export const assetAPI = {
  list: async (params?: AssetListParams): Promise<PaginatedResponse<Asset>> => {
    if (USE_MOCK) {
      return assetMock.list(params);
    }
    const response = await api.get<PaginatedResponse<Asset>>(API_ENDPOINTS.ASSET.LIST, { params });
    return response.data;
  },

  getById: async (id: string): Promise<Asset | undefined> => {
    if (USE_MOCK) {
      return assetMock.getById(id);
    }
    const response = await api.get<Asset>(API_ENDPOINTS.ASSET.DETAIL(id));
    return response.data;
  },

  /**
   * Client-side duplicate assetTag check. This is a UX convenience only (fast inline
   * feedback while typing) — it is NOT the source of truth for uniqueness. The backend
   * must still enforce assetTag uniqueness server-side regardless of this check.
   */
  isDuplicateAssetTag: async (assetTag: string, excludeId?: string): Promise<boolean> => {
    const { data } = await assetAPI.list();
    return data.some(
      (asset) => asset.assetTag.toLowerCase() === assetTag.toLowerCase() && asset.id !== excludeId
    );
  },

  create: async (payload: CreateAssetPayload): Promise<Asset> => {
    if (USE_MOCK) {
      return assetMock.create(payload);
    }
    const response = await api.post<Asset>(API_ENDPOINTS.ASSET.LIST, payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateAssetPayload): Promise<Asset> => {
    if (USE_MOCK) {
      return assetMock.update(id, payload);
    }
    const response = await api.put<Asset>(API_ENDPOINTS.ASSET.DETAIL(id), payload);
    return response.data;
  },

  archive: async (id: string): Promise<Asset> => {
    if (USE_MOCK) {
      return assetMock.archive(id);
    }
    const response = await api.post<Asset>(API_ENDPOINTS.ASSET.ARCHIVE(id));
    return response.data;
  },

  getHistory: async (id: string): Promise<AssetHistoryEntry[]> => {
    if (USE_MOCK) {
      return assetMock.getHistory(id);
    }
    const response = await api.get<AssetHistoryEntry[]>(API_ENDPOINTS.ASSET.HISTORY(id));
    return response.data;
  },
};
