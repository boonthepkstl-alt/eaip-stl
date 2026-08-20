// License domain types (Phase 5C). Re-exports the fixture's types instead of redefining this
// large nested shape (same reasoning as types/ticket.ts in Phase 5B — SoftwareLicenseDetail
// already IS the License domain model; Product/Vendor/Entitlement/Compliance are attributes on
// one aggregate in the actual data, not separate normalized entities, so this is one domain
// with one repository — not four).
export type {
  SoftwareLicenseDetail as SoftwareLicense,
  LicenseCategory,
  LicenseType,
  LicenseStatus,
  ComplianceStatus,
  AllocatedSeat,
  InstalledAssetBinding,
  LicenseHistoryEvent,
  LicenseAuditLog,
} from '@/data/fixtures/licenseData';

import type { LicenseCategory, LicenseType } from '@/data/fixtures/licenseData';

export interface CreateLicenseInput {
  product: string;
  edition?: string;
  vendor: string;
  category: LicenseCategory;
  type: LicenseType;
  seatsPurchased: number;
  annualCost: number;
  expiryDate: string;
  poNumber?: string;
  licenseKey?: string;
  autoRenew?: boolean;
}

export interface UpdateLicenseInput {
  product?: string;
  edition?: string;
  vendor?: string;
  annualCost?: number;
  licenseKey?: string;
  autoRenew?: boolean;
}

export interface RenewLicenseInput {
  addedYears: number;
  seatsPurchased: number;
  annualCost: number;
}

// `employeeId`/`assetId` are references, not embedded objects — licenseService resolves them
// against employeeService/assetService when allocating a seat. See services/license-service.ts.
export interface AllocateSeatInput {
  employeeId: string;
  assetId?: string;
  allocationRole: 'Admin' | 'Standard User' | 'Read Only' | 'Developer';
}

export interface LicenseListQuery {
  search?: string;
  category?: LicenseCategory | 'all';
  status?: string | 'all';
  vendor?: string | 'all';
}
