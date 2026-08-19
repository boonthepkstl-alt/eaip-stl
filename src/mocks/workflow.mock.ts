// Mock data for Wave 4 (Epic: Workflow & Approval (WF), FR-38..FR-44).
// Sequential Approval supports only 1 step in this wave — ห้ามสมมติว่ามี step >= 2 เสมอ.
// approverId is resolved from the holding employee's directManagerId via organization.mock.ts
// (RESOLVED NEEDS_DECISION #5 — Assignment only ever routes to 'direct_manager', never 'role').
import { ApprovalAction, ApprovalStep, WorkflowDefinition } from '@/types/workflow';

export const mockWorkflowDefinitions: WorkflowDefinition[] = [
  {
    id: 'WF-001',
    entityType: 'assignment',
    name: 'Asset Assignment Approval',
    steps: [{ order: 1, name: 'Direct Manager Approval', approverType: 'direct_manager' }],
    isActive: true,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: 'system.seed',
    updatedAt: '2026-08-01T09:00:00.000Z',
    updatedBy: 'system.seed',
  },
];

export const mockApprovalSteps: ApprovalStep[] = [
  // ASG-014 (AST-006, EMP-005/IT) — still awaiting the direct manager's decision.
  {
    id: 'APR-STEP-001',
    workflowDefinitionId: 'WF-001',
    entityType: 'assignment',
    entityId: 'ASG-014',
    order: 1,
    approverId: 'EMP-001', // direct manager of EMP-005
    status: 'pending',
  },
  // ASG-015 (AST-008, EMP-006/Finance) — approved by the manager, now waiting employee acknowledgement.
  {
    id: 'APR-STEP-002',
    workflowDefinitionId: 'WF-001',
    entityType: 'assignment',
    entityId: 'ASG-015',
    order: 1,
    approverId: 'EMP-002', // direct manager of EMP-006
    status: 'approved',
    actionedBy: 'EMP-002',
    actionedAt: '2026-08-11T10:00:00.000Z',
    comment: 'Approved for Finance dept use.',
  },
  // ASG-016 (AST-011, EMP-007/Sales, checkout) — approved, asset has been checked out.
  {
    id: 'APR-STEP-003',
    workflowDefinitionId: 'WF-001',
    entityType: 'assignment',
    entityId: 'ASG-016',
    order: 1,
    approverId: 'EMP-003', // direct manager of EMP-007
    status: 'approved',
    actionedBy: 'EMP-003',
    actionedAt: '2026-08-12T09:30:00.000Z',
    comment: 'Approved short-term checkout.',
  },
  // Historical step for a previously-rejected assignment request (audit trail example —
  // the requester resubmitted afterwards; see ASG-004 which is now active).
  {
    id: 'APR-STEP-004',
    workflowDefinitionId: 'WF-001',
    entityType: 'assignment',
    entityId: 'ASG-004',
    order: 1,
    approverId: 'EMP-001',
    status: 'rejected',
    actionedBy: 'EMP-001',
    actionedAt: '2026-07-20T09:00:00.000Z',
    comment: 'Rejected — insufficient justification, please resubmit.',
  },
];

export const mockApprovalActions: ApprovalAction[] = [
  {
    id: 'APR-ACTION-001',
    approvalStepId: 'APR-STEP-002',
    action: 'approve',
    actionedBy: 'EMP-002',
    actionedAt: '2026-08-11T10:00:00.000Z',
    comment: 'Approved for Finance dept use.',
  },
  {
    id: 'APR-ACTION-002',
    approvalStepId: 'APR-STEP-003',
    action: 'approve',
    actionedBy: 'EMP-003',
    actionedAt: '2026-08-12T09:30:00.000Z',
    comment: 'Approved short-term checkout.',
  },
  {
    id: 'APR-ACTION-003',
    approvalStepId: 'APR-STEP-004',
    action: 'reject',
    actionedBy: 'EMP-001',
    actionedAt: '2026-07-20T09:00:00.000Z',
    comment: 'Rejected — insufficient justification, please resubmit.',
  },
];
