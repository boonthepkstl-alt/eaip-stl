// Assignment & Lifecycle types — Wave 2 (Dashboard) started with a MINIMAL SEED
// ({id, assetId, department, isActive}). Wave 4 (Epic: Assignment & Lifecycle (ASSIGN),
// FR-30..FR-33 + Epic: Workflow & Approval (WF), FR-38..FR-44) extends it with the fields
// needed for Assign/Transfer/Check-out/Check-in + approval routing.
//
// `department` is intentionally kept as-is — src/mocks/dashboard.mock.ts and
// dashboard.mock.test.ts (Wave 2/3) depend on this field for byDepartment aggregation.
export type AssignmentType = 'assign' | 'transfer' | 'checkout';

// placeholder string fallback, same pattern as AssetStatus (src/types/asset.ts) — ห้าม enforce
// state machine เข้มงวดในเวฟนี้ (ข้อจำกัด #5)
export type AssignmentStatus =
  | 'pending_manager_approval'
  | 'pending_acknowledgement'
  | 'active'
  | 'rejected'
  | 'checked_out'
  | 'returned'
  | string;

export interface Assignment {
  id: string;
  assetId: string;
  employeeId: string;
  department: string;
  type: AssignmentType;
  status: AssignmentStatus;
  isActive: boolean;
  assignedDate?: string;
  expectedReturnDate?: string; // FR-40 (due date) — optional only, ห้าม implement enforcement
  previousEmployeeId?: string;
  workflowStepId?: string;
  acknowledgedAt?: string; // FR-44 (acknowledge timeout) — optional only, ห้าม implement timeout logic
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AssignmentHistoryEntry {
  id: string;
  assignmentId: string;
  assetId: string;
  employeeId: string;
  action: 'assigned' | 'transferred' | 'checked_out' | 'checked_in' | 'approved' | 'rejected' | 'acknowledged';
  actionedBy: string;
  actionedAt: string;
}
