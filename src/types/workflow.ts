// Workflow & Approval types — Wave 4 (Epic: Workflow & Approval (WF), FR-38..FR-44).
// Sequential Approval supports only 1 step in this wave (Policy TBD on max step count) — ห้าม
// สมมติว่ามี step >= 2 เสมอ. No escalation logic (Phase 2 only).
export type EntityType = 'assignment' | 'itRequest';

export interface WorkflowStepDefinition {
  order: number;
  name: string;
  approverType: 'direct_manager' | 'role';
  roleId?: string;
}

export interface WorkflowDefinition {
  id: string;
  entityType: EntityType;
  name: string;
  steps: WorkflowStepDefinition[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalStep {
  id: string;
  workflowDefinitionId: string;
  entityType: EntityType;
  entityId: string;
  order: number;
  approverId: string | null;
  status: ApprovalStatus;
  actionedBy?: string;
  actionedAt?: string;
  comment?: string;
}

export interface ApprovalAction {
  id: string;
  approvalStepId: string;
  action: 'approve' | 'reject';
  actionedBy: string;
  actionedAt: string;
  comment?: string;
}

export interface ApprovalInboxItem {
  step: ApprovalStep;
  entityType: EntityType;
  entitySummary: {
    id: string;
    title: string;
    requestedBy: string;
    requestedAt: string;
  };
}
