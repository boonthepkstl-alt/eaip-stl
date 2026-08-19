import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { reportMock } from '@/mocks/report.mock';
import {
  AssetAssignmentReportFilter,
  AssetAssignmentReportRow,
  AssetInventoryReportFilter,
  AssetInventoryReportRow,
  ReportColumn,
} from '@/types/report';

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Reporting API (Wave 7 — Supporting: Epic Reporting, FR-57..FR-59). Same USE_MOCK switch
// pattern as services/asset.ts. exportCsv performs a real client-side CSV download (Blob +
// object URL) — not a placeholder.
export const reportAPI = {
  getAssetInventory: async (filter?: AssetInventoryReportFilter): Promise<AssetInventoryReportRow[]> => {
    if (USE_MOCK) {
      return reportMock.getAssetInventory(filter);
    }
    const response = await api.get<AssetInventoryReportRow[]>(API_ENDPOINTS.REPORT.ASSET_INVENTORY, {
      params: filter,
    });
    return response.data;
  },

  getAssetAssignment: async (filter?: AssetAssignmentReportFilter): Promise<AssetAssignmentReportRow[]> => {
    if (USE_MOCK) {
      return reportMock.getAssetAssignment(filter);
    }
    const response = await api.get<AssetAssignmentReportRow[]>(API_ENDPOINTS.REPORT.ASSET_ASSIGNMENT, {
      params: filter,
    });
    return response.data;
  },

  exportCsv: <T,>(rows: T[], columns: ReportColumn<T>[], filename: string): void => {
    const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
    const lines = rows.map((row) => columns.map((column) => escapeCsvValue(column.render(row))).join(','));
    const csv = [header, ...lines].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
