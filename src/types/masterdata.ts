// Master data types — Wave 3 introduced read-only AssetCategory/AssetLocation/Vendor (3-field
// shape). Wave 6 (Epic: User/Role/Permission + Baseline Administration) extends these to full
// CRUD and adds Department/Company/Branch for org-wide master data management.
export type MasterDataType = 'category' | 'location' | 'vendor' | 'department' | 'company' | 'branch';

export interface MasterDataEntity {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export type AssetCategory = MasterDataEntity;

export type AssetLocation = MasterDataEntity;

export type Vendor = MasterDataEntity;

export type Department = MasterDataEntity;

export type Company = MasterDataEntity;

export interface Branch extends MasterDataEntity {
  companyId: string;
}
