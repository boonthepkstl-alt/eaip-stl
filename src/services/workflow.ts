import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import {
  ApprovalAction,
  ApprovalInboxItem,
  ApprovalStatus,
  ApprovalStep,
  EntityType,
  WorkflowDefinition,
} from '@/types/workflow';
import { mockApprovalActions, mockApprovalSteps, mockWorkflowDefinitions } from '@/mocks/workflow.mock';
import { mockEmployees } from '@/mocks/organization.mock';
import { mockAssignments } from '@/mocks/assignment.mock';
import { mockAssets } from '@/mocks/asset.mock';

export type CreateWorkflowDefinitionPayload = Omit<
  WorkflowDefinition,
  'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;

function resolveEmployeeName(employeeId: string | null | undefined): string {
  if (!employeeId) return '-';
  return mockEmployees.find((employee) => employee.id === employeeId)?.name ?? employeeId;
}

function buildAssignmentEntitySummary(entityId: string): ApprovalInboxItem['entitySummary'] {
  const assignment = mockAssignments.find((a) => a.id === entityId);
  const asset = assignment ? mockAssets.find((a) => a.id === assignment.assetId) : undefined;
  return {
    id: entityId,
    title: asset ? `${asset.name} (${asset.assetTag})` : entityId,
    requestedBy: assignment ? resolveEmployeeName(assignment.employeeId) : '-',
    requestedAt: assignment?.createdAt ?? '',
  };
}

// Workflow & Approval engine (Wave 4 — Epic: Workflow & Approval (WF), FR-38..FR-44). Sequential
// Approval รองรับแค่ 1 step ในเวฟนี้ (ห้ามสมมติว่ามี step >= 2 เสมอ) ไม่มี escalation logic ใดๆ
// (Phase 2 เท่านั้น). ใช้ USE_MOCK switch pattern เดียวกับ src/services/asset.ts.
export const workflowAPI = {
  listDefinitions: async (): Promise<WorkflowDefinition[]> => {
    if (USE_MOCK) {
      return mockWorkflowDefinitions;
    }
    const response = await api.get<WorkflowDefinition[]>(API_ENDPOINTS.WORKFLOW.DEFINITIONS);
    return response.data;
  },

  getDefinition: async (id: string): Promise<WorkflowDefinition | undefined> => {
    if (USE_MOCK) {
      return mockWorkflowDefinitions.find((definition) => definition.id === id);
    }
    const response = await api.get<WorkflowDefinition>(API_ENDPOINTS.WORKFLOW.DEFINITION_DETAIL(id));
    return response.data;
  },

  createDefinition: async (payload: CreateWorkflowDefinitionPayload): Promise<WorkflowDefinition> => {
    if (USE_MOCK) {
      const timestamp = new Date().toISOString();
      const created: WorkflowDefinition = {
        ...payload,
        id: `WF-${String(mockWorkflowDefinitions.length + 1).padStart(3, '0')}`,
        createdAt: timestamp,
        createdBy: 'current.user',
        updatedAt: timestamp,
        updatedBy: 'current.user',
      };
      mockWorkflowDefinitions.push(created);
      return created;
    }
    const response = await api.post<WorkflowDefinition>(API_ENDPOINTS.WORKFLOW.DEFINITIONS, payload);
    return response.data;
  },

  updateDefinition: async (id: string, payload: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    if (USE_MOCK) {
      const index = mockWorkflowDefinitions.findIndex((definition) => definition.id === id);
      if (index === -1) {
        throw new Error(`Workflow definition ${id} not found`);
      }
      const updated: WorkflowDefinition = {
        ...mockWorkflowDefinitions[index],
        ...payload,
        id: mockWorkflowDefinitions[index].id,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current.user',
      };
      mockWorkflowDefinitions[index] = updated;
      return updated;
    }
    const response = await api.put<WorkflowDefinition>(API_ENDPOINTS.WORKFLOW.DEFINITION_DETAIL(id), payload);
    return response.data;
  },

  submitForApproval: async (entityType: EntityType, entityId: string): Promise<ApprovalStep> => {
    if (USE_MOCK) {
      const definition = mockWorkflowDefinitions.find((d) => d.entityType === entityType && d.isActive);
      if (!definition) {
        throw new Error(`No active workflow definition for entityType "${entityType}"`);
      }

      // Sequential Approval รองรับแค่ 1 step ในเวฟนี้ — ใช้เฉพาะ step แรกเสมอ
      const firstStep = definition.steps.find((s) => s.order === 1);
      if (!firstStep) {
        throw new Error(`Workflow definition ${definition.id} has no first step`);
      }

      let approverId: string | null = null;
      if (firstStep.approverType === 'direct_manager') {
        const assignment = mockAssignments.find((a) => a.id === entityId);
        const employee = assignment ? mockEmployees.find((e) => e.id === assignment.employeeId) : undefined;
        approverId = employee?.directManagerId ?? null;
      }

      const step: ApprovalStep = {
        id: `APR-STEP-${String(mockApprovalSteps.length + 1).padStart(3, '0')}`,
        workflowDefinitionId: definition.id,
        entityType,
        entityId,
        order: firstStep.order,
        approverId,
        status: 'pending',
      };
      mockApprovalSteps.push(step);
      return step;
    }
    const response = await api.post<ApprovalStep>(API_ENDPOINTS.WORKFLOW.SUBMIT, { entityType, entityId });
    return response.data;
  },

  getApprovalStatus: async (entityType: EntityType, entityId: string): Promise<ApprovalStatus | undefined> => {
    if (USE_MOCK) {
      const steps = mockApprovalSteps.filter((s) => s.entityType === entityType && s.entityId === entityId);
      return steps.length ? steps[steps.length - 1].status : undefined;
    }
    const response = await api.get<ApprovalStep>(API_ENDPOINTS.WORKFLOW.APPROVAL_STATUS(entityType, entityId));
    return response.data.status;
  },

  // Query ผ่าน organization mock — directManagerId เท่านั้น (RESOLVED NEEDS_DECISION #5) —
  // ห้ามใช้ roleId ตัดสินผู้อนุมัติของ Assignment
  listInboxForCurrentUser: async (userId: string): Promise<ApprovalInboxItem[]> => {
    if (USE_MOCK) {
      return mockApprovalSteps
        .filter((step) => step.status === 'pending' && step.approverId === userId)
        .map((step) => ({
          step,
          entityType: step.entityType,
          entitySummary:
            step.entityType === 'assignment'
              ? buildAssignmentEntitySummary(step.entityId)
              : { id: step.entityId, title: step.entityId, requestedBy: '-', requestedAt: '' },
        }));
    }
    const response = await api.get<ApprovalInboxItem[]>(API_ENDPOINTS.WORKFLOW.INBOX, { params: { userId } });
    return response.data;
  },

  action: async (approvalStepId: string, action: 'approve' | 'reject', comment?: string): Promise<ApprovalStep> => {
    if (USE_MOCK) {
      const index = mockApprovalSteps.findIndex((s) => s.id === approvalStepId);
      if (index === -1) {
        throw new Error(`Approval step ${approvalStepId} not found`);
      }

      const timestamp = new Date().toISOString();
      const updated: ApprovalStep = {
        ...mockApprovalSteps[index],
        status: action === 'approve' ? 'approved' : 'rejected',
        actionedBy: 'current.user',
        actionedAt: timestamp,
        comment,
      };
      mockApprovalSteps[index] = updated;

      mockApprovalActions.push({
        id: `APR-ACTION-${String(mockApprovalActions.length + 1).padStart(3, '0')}`,
        approvalStepId,
        action,
        actionedBy: 'current.user',
        actionedAt: timestamp,
        comment,
      });

      return updated;
    }
    const response = await api.post<ApprovalStep>(API_ENDPOINTS.WORKFLOW.ACTION(approvalStepId), { action, comment });
    return response.data;
  },

  getAuditTrail: async (entityType: EntityType, entityId: string): Promise<ApprovalAction[]> => {
    if (USE_MOCK) {
      const stepIds = mockApprovalSteps
        .filter((s) => s.entityType === entityType && s.entityId === entityId)
        .map((s) => s.id);
      return mockApprovalActions.filter((a) => stepIds.includes(a.approvalStepId));
    }
    const response = await api.get<ApprovalAction[]>(API_ENDPOINTS.WORKFLOW.AUDIT_TRAIL(entityType, entityId));
    return response.data;
  },
};
