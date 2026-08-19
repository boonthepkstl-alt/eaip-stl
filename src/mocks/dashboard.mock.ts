// Mock implementation of the dashboard summary "API" for Wave 2 (UI+mock DoD).
// ทุกตัวเลขต้องคำนวณจาก mockAssets/mockAssignments จริงเสมอ — ห้าม hardcode
import { DashboardCountGroup, DashboardSummary } from '@/types/dashboard';
import { Asset } from '@/types/asset';
import { AssetCategory, AssetLocation } from '@/types/masterdata';
import { mockAssets } from './asset.mock';
import { mockAssignments } from './assignment.mock';
import { mockAssetCategories, mockAssetLocations } from './masterdata.mock';

function groupCount(items: string[]): DashboardCountGroup[] {
  const counts = new Map<string, number>();
  items.forEach((key) => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function resolveLabel<T extends { id: string; name: string }>(id: string, lookup: T[]): string {
  return lookup.find((item) => item.id === id)?.name ?? id;
}

function buildSummary(
  assets: Asset[],
  assignments = mockAssignments,
  categories: AssetCategory[] = mockAssetCategories,
  locations: AssetLocation[] = mockAssetLocations
): DashboardSummary {
  const totalAssets = assets.length;
  const activeAssets = assets.filter((a) => a.status === 'active').length;
  const idleAssets = assets.filter((a) => a.status === 'idle').length;

  const byCategory = groupCount(assets.map((a) => resolveLabel(a.categoryId, categories)));
  const byLocation = groupCount(assets.map((a) => resolveLabel(a.locationId, locations)));

  // เฉพาะ asset ที่มี assignment active ปัจจุบันเท่านั้น
  const activeAssetIds = new Set(assignments.filter((a) => a.isActive).map((a) => a.assetId));
  const departmentsForActiveAssets = assignments
    .filter((a) => a.isActive && activeAssetIds.has(a.assetId))
    .map((a) => a.department);
  const byDepartment = groupCount(departmentsForActiveAssets);

  return {
    totalAssets,
    activeAssets,
    idleAssets,
    byCategory,
    byLocation,
    byDepartment,
  };
}

export const dashboardMock = {
  getSummary: async (): Promise<DashboardSummary> => {
    return buildSummary(mockAssets, mockAssignments);
  },
};

// exported for testing
export { buildSummary };
