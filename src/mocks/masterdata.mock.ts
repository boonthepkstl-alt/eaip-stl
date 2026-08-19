// Mock data for master data lookups. Wave 3 introduced read-only listCategories/listLocations/
// listVendors. Wave 6 (Epic: User/Role/Permission + Baseline Administration) extends this with
// full CRUD on these same arrays and adds Department/Company/Branch.
import { AssetCategory, AssetLocation, Vendor, Department, Company, Branch, MasterDataType, MasterDataEntity } from '@/types/masterdata';

export const mockAssetCategories: AssetCategory[] = [
  { id: 'CAT-001', name: 'Notebook', isActive: true },
  { id: 'CAT-002', name: 'Desktop', isActive: true },
  { id: 'CAT-003', name: 'Monitor', isActive: true },
  { id: 'CAT-004', name: 'Printer', isActive: true },
];

export const mockAssetLocations: AssetLocation[] = [
  { id: 'LOC-001', name: 'Head Office', isActive: true },
  { id: 'LOC-002', name: 'Branch A', isActive: true },
  { id: 'LOC-003', name: 'Branch B', isActive: true },
];

export const mockVendors: Vendor[] = [
  { id: 'VEN-001', name: 'Dell', isActive: true },
  { id: 'VEN-002', name: 'HP', isActive: true },
  { id: 'VEN-003', name: 'Lenovo', isActive: true },
];

// Department names below must match the label strings used by assignment.mock.ts /
// organization.mock.ts Employee.department exactly (IT/Finance/Sales/HR).
export const mockDepartments: Department[] = [
  { id: 'DEPT-001', name: 'IT', isActive: true },
  { id: 'DEPT-002', name: 'Finance', isActive: true },
  { id: 'DEPT-003', name: 'Sales', isActive: true },
  { id: 'DEPT-004', name: 'HR', isActive: true },
];

export const mockCompanies: Company[] = [
  { id: 'CO-001', name: 'Singer Thailand PCL', code: 'SINGER', isActive: true },
];

export const mockBranches: Branch[] = [
  { id: 'BR-001', name: 'Head Office', companyId: 'CO-001', isActive: true },
  { id: 'BR-002', name: 'Branch A', companyId: 'CO-001', isActive: true },
  { id: 'BR-003', name: 'Branch B', companyId: 'CO-001', isActive: true },
];

const registry: Record<MasterDataType, MasterDataEntity[]> = {
  category: mockAssetCategories,
  location: mockAssetLocations,
  vendor: mockVendors,
  department: mockDepartments,
  company: mockCompanies,
  branch: mockBranches,
};

const prefixes: Record<MasterDataType, string> = {
  category: 'CAT',
  location: 'LOC',
  vendor: 'VEN',
  department: 'DEPT',
  company: 'CO',
  branch: 'BR',
};

function nextId(type: MasterDataType): string {
  const list = registry[type];
  return `${prefixes[type]}-${String(list.length + 1).padStart(3, '0')}`;
}

// Generic CRUD payload — a superset that also covers Branch.companyId. Non-branch types simply
// never set companyId.
export type MasterDataPayload = Omit<MasterDataEntity, 'id'> & Partial<Pick<Branch, 'companyId'>>;

export const masterdataMock = {
  listCategories: async (): Promise<AssetCategory[]> => mockAssetCategories,
  listLocations: async (): Promise<AssetLocation[]> => mockAssetLocations,
  listVendors: async (): Promise<Vendor[]> => mockVendors,
  listDepartments: async (): Promise<Department[]> => mockDepartments,
  listCompanies: async (): Promise<Company[]> => mockCompanies,
  listBranches: async (): Promise<Branch[]> => mockBranches,

  list: async (type: MasterDataType): Promise<MasterDataEntity[]> => registry[type],

  create: async (type: MasterDataType, payload: MasterDataPayload): Promise<MasterDataEntity> => {
    const created = { ...payload, id: nextId(type) } as MasterDataEntity;
    registry[type].push(created);
    return created;
  },

  update: async (
    type: MasterDataType,
    id: string,
    payload: Partial<MasterDataPayload>
  ): Promise<MasterDataEntity> => {
    const list = registry[type];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`${type} ${id} not found`);
    }
    const updated = { ...list[index], ...payload, id: list[index].id };
    list[index] = updated;
    return updated;
  },

  // Soft-delete only — master data may be referenced by Asset (FK). Physical delete is not
  // permitted (ข้อจำกัด #4).
  deactivate: async (type: MasterDataType, id: string): Promise<MasterDataEntity> => {
    return masterdataMock.update(type, id, { isActive: false });
  },
};
