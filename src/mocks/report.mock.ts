// Mock data for Wave 7 (Supporting: Epic Reporting, FR-57..FR-59). 100% DERIVED — every row is
// joined from existing mock arrays (asset/masterdata/assignment/organization), never hardcoded.
import { mockAssets } from '@/mocks/asset.mock';
import { mockAssetCategories, mockAssetLocations, mockVendors, mockDepartments } from '@/mocks/masterdata.mock';
import { mockAssignments } from '@/mocks/assignment.mock';
import { mockEmployees } from '@/mocks/organization.mock';
import {
  AssetAssignmentReportFilter,
  AssetAssignmentReportRow,
  AssetInventoryReportFilter,
  AssetInventoryReportRow,
} from '@/types/report';

function resolveName(id: string | undefined, lookup: { id: string; name: string }[]): string | undefined {
  if (!id) return undefined;
  return lookup.find((item) => item.id === id)?.name;
}

function buildInventoryRows(): AssetInventoryReportRow[] {
  return mockAssets
    .filter((asset) => !asset.isArchived)
    .map((asset) => {
      const activeAssignment = mockAssignments.find((a) => a.assetId === asset.id && a.isActive);
      const assignee = activeAssignment ? mockEmployees.find((e) => e.id === activeAssignment.employeeId) : undefined;

      return {
        assetId: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        categoryName: resolveName(asset.categoryId, mockAssetCategories) ?? asset.categoryId,
        locationName: resolveName(asset.locationId, mockAssetLocations) ?? asset.locationId,
        status: asset.status,
        vendorName: resolveName(asset.vendorId, mockVendors),
        warrantyExpiryDate: asset.warrantyExpiryDate,
        currentAssigneeName: assignee?.name,
      };
    });
}

function matchesInventoryFilter(row: AssetInventoryReportRow, filter?: AssetInventoryReportFilter): boolean {
  if (!filter) return true;
  const asset = mockAssets.find((a) => a.id === row.assetId);
  if (filter.categoryId && asset?.categoryId !== filter.categoryId) return false;
  if (filter.locationId && asset?.locationId !== filter.locationId) return false;
  if (filter.status && row.status !== filter.status) return false;
  if (filter.search) {
    const term = filter.search.toLowerCase();
    const haystack = `${row.assetTag} ${row.name}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  return true;
}

function buildAssignmentRows(): AssetAssignmentReportRow[] {
  return mockAssignments.map((assignment) => {
    const asset = mockAssets.find((a) => a.id === assignment.assetId);
    const employee = mockEmployees.find((e) => e.id === assignment.employeeId);

    return {
      assignmentId: assignment.id,
      assetTag: asset?.assetTag ?? assignment.assetId,
      assetName: asset?.name ?? assignment.assetId,
      employeeName: employee?.name ?? assignment.employeeId,
      department: assignment.department,
      type: assignment.type,
      status: assignment.status,
      assignedDate: assignment.assignedDate,
      expectedReturnDate: assignment.expectedReturnDate,
    };
  });
}

function matchesAssignmentFilter(row: AssetAssignmentReportRow, filter?: AssetAssignmentReportFilter): boolean {
  if (!filter) return true;
  if (filter.departmentId) {
    const department = mockDepartments.find((d) => d.id === filter.departmentId);
    if (!department || row.department !== department.name) return false;
  }
  if (filter.status && row.status !== filter.status) return false;
  if (filter.dateFrom && (!row.assignedDate || row.assignedDate < filter.dateFrom)) return false;
  if (filter.dateTo && (!row.assignedDate || row.assignedDate > filter.dateTo)) return false;
  return true;
}

export const reportMock = {
  getAssetInventory: async (filter?: AssetInventoryReportFilter): Promise<AssetInventoryReportRow[]> =>
    buildInventoryRows().filter((row) => matchesInventoryFilter(row, filter)),

  getAssetAssignment: async (filter?: AssetAssignmentReportFilter): Promise<AssetAssignmentReportRow[]> =>
    buildAssignmentRows().filter((row) => matchesAssignmentFilter(row, filter)),
};
