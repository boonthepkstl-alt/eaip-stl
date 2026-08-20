// Domain types for the Asset Management vertical slice (Phase 4).
// The shape below stays close to the legacy Asset interface in
// src/data/mockData.ts on purpose — Rule "do not recreate UI" means the ported
// AssetList/AssetDetail/Assignment pages keep reading flat fields like
// `asset.assignedTo`/`asset.warrantyExpiry`, and reshaping the wire format
// would force invasive edits across all of them for no behavioral benefit.
// The one deliberate REFACTOR is dropping the embedded `icon: LucideIcon` field
// (a presentation concern — see data/asset-icons.ts) since a real API can never
// return a React component. See ASSET-MANAGEMENT-MIGRATION.md for the full
// KEEP/MIGRATE/REFACTOR rationale.

export type AssetStatus = 'Available' | 'Assigned' | 'In Maintenance' | 'Retired';
export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor';

// Free-text in the legacy mock data (e.g. "IT Hardware", "Mobile") — kept as a plain string
// alias rather than a union until API-SPECIFICATION.md's asset_categories table exists.
export type AssetCategory = string;
export type AssetLocation = string;

export interface AssetSpec {
  label: string;
  value: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  type: string;
  status: AssetStatus;
  condition: AssetCondition;
  location: AssetLocation;
  department: string;
  assignedTo: string | null;
  assignedEmployeeId?: string | null;
  assignedDate?: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  warrantyExpiry: string;
  vendor: string;
  serialNumber: string;
  specs: AssetSpec[];
}

// Structured shape for assignment-history/assignment-service results — not nested onto
// `Asset` itself (see note above), but the named type Section 9 of the Phase 4 brief asks for.
export interface AssetAssignment {
  assetId: string;
  employeeId: string;
  employeeName: string;
  assignedDate: string;
}

export interface AssetWarranty {
  expiryDate: string;
  isActive: boolean;
}

export interface AssetMaintenanceSummary {
  totalTickets: number;
  openTickets: number;
}

export interface CreateAssetInput {
  name: string;
  code?: string;
  category: string;
  type: string;
  serialNumber: string;
  vendor?: string;
  purchaseCost: number;
  purchaseDate: string;
  warrantyExpiry?: string;
  department: string;
  location: string;
  condition: AssetCondition;
  description?: string;
}

export interface AssignAssetInput {
  assetId: string;
  employeeId: string;
  // The asset repository doesn't own employee data (that's the Employee domain, formalized in
  // Phase 5) so the caller — which already has the Employee record on hand — passes the name
  // through for display fields like `Asset.assignedTo`.
  employeeName: string;
  notes?: string;
}

export interface AssetListQuery {
  search?: string;
  status?: AssetStatus | 'all';
  department?: string | 'all';
  page?: number;
  limit?: number;
}

export interface AssetListResult {
  data: Asset[];
  total: number;
}
