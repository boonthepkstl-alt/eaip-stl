import { describe, it, expect } from 'vitest';
import { buildSummary, dashboardMock } from './dashboard.mock';
import { mockAssets } from './asset.mock';
import { mockAssignments } from './assignment.mock';
import { Asset } from '@/types/asset';
import { Assignment } from '@/types/assignment';

describe('dashboard.mock buildSummary', () => {
  it('byCategory and byLocation counts sum to totalAssets', () => {
    const summary = buildSummary(mockAssets, mockAssignments);

    const categorySum = summary.byCategory.reduce((sum, g) => sum + g.count, 0);
    const locationSum = summary.byLocation.reduce((sum, g) => sum + g.count, 0);

    expect(categorySum).toBe(summary.totalAssets);
    expect(locationSum).toBe(summary.totalAssets);
    expect(summary.totalAssets).toBe(mockAssets.length);
  });

  it('activeAssets + idleAssets does not exceed totalAssets (status may include other values)', () => {
    const summary = buildSummary(mockAssets, mockAssignments);
    expect(summary.activeAssets + summary.idleAssets).toBeLessThanOrEqual(summary.totalAssets);
  });

  it('byDepartment only counts assignments that are currently active', () => {
    const assets: Asset[] = [
      {
        id: 'A1',
        assetTag: 'T1',
        name: 'Test Notebook 1',
        categoryId: 'CAT-001',
        locationId: 'LOC-001',
        status: 'active',
        isArchived: false,
        createdAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'seed',
        updatedAt: '2026-08-01T00:00:00.000Z',
        updatedBy: 'seed',
      },
      {
        id: 'A2',
        assetTag: 'T2',
        name: 'Test Notebook 2',
        categoryId: 'CAT-001',
        locationId: 'LOC-001',
        status: 'idle',
        isArchived: false,
        createdAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'seed',
        updatedAt: '2026-08-01T00:00:00.000Z',
        updatedBy: 'seed',
      },
    ];
    const assignments: Assignment[] = [
      {
        id: 'AS1',
        assetId: 'A1',
        employeeId: 'EMP-001',
        department: 'IT',
        type: 'assign',
        status: 'active',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'seed',
        updatedAt: '2026-08-01T00:00:00.000Z',
        updatedBy: 'seed',
      },
      {
        id: 'AS2',
        assetId: 'A2',
        employeeId: 'EMP-004',
        department: 'HR',
        type: 'assign',
        status: 'returned',
        isActive: false,
        createdAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'seed',
        updatedAt: '2026-08-01T00:00:00.000Z',
        updatedBy: 'seed',
      },
    ];

    const summary = buildSummary(assets, assignments);

    expect(summary.byDepartment).toEqual([{ label: 'IT', count: 1 }]);
  });

  it('recomputes from the data instead of hardcoding numbers', () => {
    const smallerAssets = mockAssets.slice(0, 3);
    const summary = buildSummary(smallerAssets, mockAssignments);
    expect(summary.totalAssets).toBe(3);
  });

  it('getSummary resolves using the shared mock data', async () => {
    const summary = await dashboardMock.getSummary();
    expect(summary.totalAssets).toBe(mockAssets.length);
  });
});
