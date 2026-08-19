// Asset Management types — Wave 3 (Epic: Asset Management, FR-20..FR-27).
// Financial (purchaseCost/currentValue/depreciationMethod/usefulLifeYears/salvageValue),
// License (licenseKey), Maintenance (maintenanceSchedule/condition) and Assignment
// (assignedTo/department — see Wave 4) fields are intentionally excluded from this wave.
export type AssetStatus = 'active' | 'idle' | string; // placeholder รอ FR-23 — ห้ามกำหนด enum เต็ม

export interface AssetDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AssetHistoryEntry {
  id: string;
  assetId: string;
  changeType: 'location' | 'status' | 'field_update' | string;
  description: string;
  changedBy: string;
  changedAt: string;
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  status: AssetStatus;
  serialNumber?: string;
  barcodeValue?: string;
  qrCodeValue?: string;
  vendorId?: string;
  warrantyExpiryDate?: string;
  documents?: AssetDocument[];
  isArchived: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
