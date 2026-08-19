import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import {
  AssetCategory,
  AssetLocation,
  Vendor,
  Department,
  Company,
  Branch,
  MasterDataType,
  MasterDataEntity,
} from '@/types/masterdata';
import { masterdataMock, type MasterDataPayload } from '@/mocks/masterdata.mock';

export type { MasterDataPayload };

const ENDPOINT_BY_TYPE: Record<MasterDataType, string> = {
  category: API_ENDPOINTS.MASTERDATA.CATEGORIES,
  location: API_ENDPOINTS.MASTERDATA.LOCATIONS,
  vendor: API_ENDPOINTS.MASTERDATA.VENDORS,
  department: API_ENDPOINTS.MASTERDATA.DEPARTMENTS,
  company: API_ENDPOINTS.MASTERDATA.COMPANIES,
  branch: API_ENDPOINTS.MASTERDATA.BRANCHES,
};

// Master data API. Wave 3 introduced read-only list() per type. Wave 6 (Epic: User/Role/
// Permission + Baseline Administration) extends this to a generic CRUD surface shared by all
// 6 master data types, backed by the same USE_MOCK switch pattern as services/asset.ts.
export const masterdataAPI = {
  list: async (type: MasterDataType): Promise<MasterDataEntity[]> => {
    if (USE_MOCK) {
      return masterdataMock.list(type);
    }
    const response = await api.get<MasterDataEntity[]>(ENDPOINT_BY_TYPE[type]);
    return response.data;
  },

  create: async (type: MasterDataType, payload: MasterDataPayload): Promise<MasterDataEntity> => {
    if (USE_MOCK) {
      return masterdataMock.create(type, payload);
    }
    const response = await api.post<MasterDataEntity>(ENDPOINT_BY_TYPE[type], payload);
    return response.data;
  },

  update: async (
    type: MasterDataType,
    id: string,
    payload: Partial<MasterDataPayload>
  ): Promise<MasterDataEntity> => {
    if (USE_MOCK) {
      return masterdataMock.update(type, id, payload);
    }
    const response = await api.put<MasterDataEntity>(`${ENDPOINT_BY_TYPE[type]}/${id}`, payload);
    return response.data;
  },

  // Soft-delete only (isActive:false) — physical delete is never permitted (Asset holds FKs
  // into master data).
  deactivate: async (type: MasterDataType, id: string): Promise<MasterDataEntity> => {
    if (USE_MOCK) {
      return masterdataMock.deactivate(type, id);
    }
    const response = await api.post<MasterDataEntity>(`${ENDPOINT_BY_TYPE[type]}/${id}/deactivate`);
    return response.data;
  },

  // Backward-compat wrappers — Wave 3 (AssetList/CreateAsset/EditAsset) calls these directly and
  // must keep working with the exact same signatures.
  listCategories: (): Promise<AssetCategory[]> => masterdataAPI.list('category') as Promise<AssetCategory[]>,
  listLocations: (): Promise<AssetLocation[]> => masterdataAPI.list('location') as Promise<AssetLocation[]>,
  listVendors: (): Promise<Vendor[]> => masterdataAPI.list('vendor') as Promise<Vendor[]>,
  listDepartments: (): Promise<Department[]> => masterdataAPI.list('department') as Promise<Department[]>,
  listCompanies: (): Promise<Company[]> => masterdataAPI.list('company') as Promise<Company[]>,
  listBranches: (): Promise<Branch[]> => masterdataAPI.list('branch') as Promise<Branch[]>,
};
