// Reporting types — Wave 7 (Supporting: Epic Reporting, FR-57..FR-59).
import { AssetStatus } from '@/types/asset';
import { AssignmentStatus, AssignmentType } from '@/types/assignment';

export interface AssetInventoryReportRow {
  assetId: string;
  assetTag: string;
  name: string;
  categoryName: string;
  locationName: string;
  status: AssetStatus;
  vendorName?: string;
  warrantyExpiryDate?: string;
  currentAssigneeName?: string;
}

export interface AssetInventoryReportFilter {
  categoryId?: string;
  locationId?: string;
  status?: string;
  search?: string;
}

export interface AssetAssignmentReportRow {
  assignmentId: string;
  assetTag: string;
  assetName: string;
  employeeName: string;
  department: string;
  type: AssignmentType;
  status: AssignmentStatus;
  assignedDate?: string;
  expectedReturnDate?: string;
}

export interface AssetAssignmentReportFilter {
  departmentId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type ReportColumn<T> = { key: string; label: string; render: (row: T) => string };
