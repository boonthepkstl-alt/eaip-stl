// Mock data for Wave 2 (Dashboard, UI+mock DoD) — Wave 4 (Epic: Assignment & Lifecycle (ASSIGN),
// FR-30..FR-33 + Epic: Workflow & Approval (WF), FR-38..FR-44) extends this with employeeId/
// type/status/timestamps needed for Assign/Transfer/Check-out/Check-in + approval routing.
// assetId ต้องอ้างอิง mockAssets จริงเสมอ (referential integrity) — ไม่ใช่ทุก asset มี assignment.
//
// The original 13 rows (ASG-001..ASG-013) are preserved exactly (same id/assetId/department/
// isActive) to avoid regressing dashboard.mock.test.ts — only new fields were added to them.
import { Assignment, AssignmentHistoryEntry } from '@/types/assignment';

const seedTimestamp = '2026-08-01T09:00:00.000Z';
const seedUser = 'system.seed';

export const mockAssignments: Assignment[] = [
  {
    id: 'ASG-001',
    assetId: 'AST-001',
    employeeId: 'EMP-001',
    department: 'IT',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-002',
    assetId: 'AST-002',
    employeeId: 'EMP-002',
    department: 'Finance',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-003',
    assetId: 'AST-004',
    employeeId: 'EMP-003',
    department: 'Sales',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-004',
    assetId: 'AST-005',
    employeeId: 'EMP-005',
    department: 'IT',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-005',
    assetId: 'AST-007',
    employeeId: 'EMP-004',
    department: 'HR',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-006',
    assetId: 'AST-009',
    employeeId: 'EMP-006',
    department: 'Finance',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-007',
    assetId: 'AST-010',
    employeeId: 'EMP-007',
    department: 'Sales',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-008',
    assetId: 'AST-012',
    employeeId: 'EMP-001',
    department: 'IT',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-009',
    assetId: 'AST-014',
    employeeId: 'EMP-008',
    department: 'HR',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-010',
    assetId: 'AST-016',
    employeeId: 'EMP-003',
    department: 'Sales',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-011',
    assetId: 'AST-017',
    employeeId: 'EMP-002',
    department: 'Finance',
    type: 'assign',
    status: 'active',
    isActive: true,
    assignedDate: '2026-08-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  // อดีตผู้ถือครองที่คืนอุปกรณ์แล้ว (ไม่นับใน byDepartment ปัจจุบัน)
  {
    id: 'ASG-012',
    assetId: 'AST-003',
    employeeId: 'EMP-004',
    department: 'HR',
    type: 'assign',
    status: 'returned',
    isActive: false,
    assignedDate: '2026-06-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-013',
    assetId: 'AST-013',
    employeeId: 'EMP-005',
    department: 'IT',
    type: 'assign',
    status: 'returned',
    isActive: false,
    assignedDate: '2026-06-01',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },

  // ---- New rows (Wave 4) — not yet active (pending approval/acknowledgement/checked out) ----
  {
    id: 'ASG-014',
    assetId: 'AST-006',
    employeeId: 'EMP-005',
    department: 'IT',
    type: 'assign',
    status: 'pending_manager_approval',
    isActive: false,
    workflowStepId: 'APR-STEP-001',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-015',
    assetId: 'AST-008',
    employeeId: 'EMP-006',
    department: 'Finance',
    type: 'assign',
    status: 'pending_acknowledgement',
    isActive: false,
    assignedDate: '2026-08-10',
    workflowStepId: 'APR-STEP-002',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
  {
    id: 'ASG-016',
    assetId: 'AST-011',
    employeeId: 'EMP-007',
    department: 'Sales',
    type: 'checkout',
    status: 'checked_out',
    isActive: false,
    assignedDate: '2026-08-12',
    expectedReturnDate: '2026-09-12',
    createdAt: seedTimestamp,
    createdBy: seedUser,
    updatedAt: seedTimestamp,
    updatedBy: seedUser,
  },
];

// Minimal history seed, one entry per row above, mirroring how mockHistory is derived from
// mockAssets in src/mocks/asset.mock.ts.
export const mockAssignmentHistory: AssignmentHistoryEntry[] = mockAssignments.map((assignment, index) => ({
  id: `AGHIST-${String(index + 1).padStart(3, '0')}`,
  assignmentId: assignment.id,
  assetId: assignment.assetId,
  employeeId: assignment.employeeId,
  action: assignment.type === 'checkout' ? 'checked_out' : assignment.isActive ? 'assigned' : 'assigned',
  actionedBy: assignment.createdBy,
  actionedAt: assignment.createdAt,
}));

export const assignmentMock = {
  list: async (): Promise<Assignment[]> => mockAssignments,

  getById: async (id: string): Promise<Assignment | undefined> => mockAssignments.find((a) => a.id === id),

  // FR-41 Single Active Assignment — an asset must not have more than one currently-active
  // assignment at a time.
  listActiveByAsset: async (assetId: string): Promise<Assignment[]> =>
    mockAssignments.filter((a) => a.assetId === assetId && a.isActive),

  create: async (
    payload: Omit<Assignment, 'id' | 'isActive' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
  ): Promise<Assignment> => {
    const timestamp = new Date().toISOString();
    const created: Assignment = {
      ...payload,
      id: `ASG-${String(mockAssignments.length + 1).padStart(3, '0')}`,
      isActive: false, // becomes active only once approval + acknowledgement complete
      createdAt: timestamp,
      createdBy: 'current.user',
      updatedAt: timestamp,
      updatedBy: 'current.user',
    };
    mockAssignments.push(created);
    return created;
  },

  update: async (id: string, payload: Partial<Assignment>): Promise<Assignment> => {
    const index = mockAssignments.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Assignment ${id} not found`);
    }
    const updated: Assignment = {
      ...mockAssignments[index],
      ...payload,
      id: mockAssignments[index].id,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current.user',
    };
    mockAssignments[index] = updated;
    return updated;
  },

  addHistoryEntry: (entry: Omit<AssignmentHistoryEntry, 'id'>): void => {
    mockAssignmentHistory.push({ ...entry, id: `AGHIST-${String(mockAssignmentHistory.length + 1).padStart(3, '0')}` });
  },

  getHistory: async (assignmentId: string): Promise<AssignmentHistoryEntry[]> =>
    mockAssignmentHistory.filter((entry) => entry.assignmentId === assignmentId),
};
