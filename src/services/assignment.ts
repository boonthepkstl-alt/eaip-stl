import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { Assignment, AssignmentHistoryEntry } from '@/types/assignment';
import { assignmentMock } from '@/mocks/assignment.mock';
import { workflowAPI } from '@/services/workflow';

// Assignment & Lifecycle API (Wave 4 — Epic: Assignment & Lifecycle (ASSIGN), FR-30..FR-33 +
// Epic: Workflow & Approval (WF), FR-38..FR-44). Uses USE_MOCK to switch between the in-memory
// mock (assignmentMock) and the real backend, same pattern as services/asset.ts.
//
// Sequential Approval รองรับแค่ 1 step ในเวฟนี้ — ห้ามสมมติว่ามี step >= 2 เสมอ. No escalation
// logic (Phase 2 only). FR-40 (due date)/FR-44 (acknowledge timeout) เป็น optional field เท่านั้น
// — ห้าม implement enforcement/timeout logic.

export interface AssignAssetPayload {
  assetId: string;
  employeeId: string;
  department: string;
  assignedDate?: string;
  expectedReturnDate?: string;
}

export interface TransferAssetPayload {
  toEmployeeId: string;
  department: string;
}

export interface CheckOutPayload {
  assetId: string;
  employeeId: string;
  department: string;
  checkOutDate?: string;
  expectedReturnDate?: string;
}

export const assignmentAPI = {
  list: async (): Promise<Assignment[]> => {
    if (USE_MOCK) {
      return assignmentMock.list();
    }
    const response = await api.get<Assignment[]>(API_ENDPOINTS.ASSIGNMENT.LIST);
    return response.data;
  },

  getById: async (id: string): Promise<Assignment | undefined> => {
    if (USE_MOCK) {
      return assignmentMock.getById(id);
    }
    const response = await api.get<Assignment>(API_ENDPOINTS.ASSIGNMENT.DETAIL(id));
    return response.data;
  },

  /**
   * FR-41 Single Active Assignment — an asset must not have more than one currently-active
   * assignment at a time. This is business logic shared regardless of USE_MOCK (mirrors the
   * assetTag duplicate check pattern in services/asset.ts) — the real backend must still
   * enforce this server-side too.
   */
  hasActiveAssignment: async (assetId: string): Promise<boolean> => {
    const all = await assignmentAPI.list();
    return all.some((a) => a.assetId === assetId && a.isActive);
  },

  assign: async (payload: AssignAssetPayload): Promise<Assignment> => {
    const alreadyActive = await assignmentAPI.hasActiveAssignment(payload.assetId);
    if (alreadyActive) {
      throw new Error(
        `Asset ${payload.assetId} already has an active assignment (FR-41 Single Active Assignment).`
      );
    }

    if (USE_MOCK) {
      const created = await assignmentMock.create({
        assetId: payload.assetId,
        employeeId: payload.employeeId,
        department: payload.department,
        type: 'assign',
        status: 'pending_manager_approval',
        assignedDate: payload.assignedDate,
        expectedReturnDate: payload.expectedReturnDate,
      });

      // ห้าม implement approve/reject logic เอง — ส่งเข้า workflow engine กลางเสมอ
      const step = await workflowAPI.submitForApproval('assignment', created.id);
      const withStep = await assignmentMock.update(created.id, { workflowStepId: step.id });

      assignmentMock.addHistoryEntry({
        assignmentId: created.id,
        assetId: created.assetId,
        employeeId: created.employeeId,
        action: 'assigned',
        actionedBy: 'current.user',
        actionedAt: new Date().toISOString(),
      });

      return withStep;
    }

    const response = await api.post<Assignment>(API_ENDPOINTS.ASSIGNMENT.LIST, payload);
    return response.data;
  },

  transfer: async (id: string, payload: TransferAssetPayload): Promise<Assignment> => {
    if (USE_MOCK) {
      const existing = await assignmentMock.getById(id);
      if (!existing) {
        throw new Error(`Assignment ${id} not found`);
      }

      const updated = await assignmentMock.update(id, {
        previousEmployeeId: existing.employeeId,
        employeeId: payload.toEmployeeId,
        department: payload.department,
        type: 'transfer',
        status: 'pending_manager_approval',
      });

      // ห้าม implement approve/reject logic เอง — ส่งเข้า workflow engine กลางเสมอ
      const step = await workflowAPI.submitForApproval('assignment', id);
      const withStep = await assignmentMock.update(id, { workflowStepId: step.id });

      assignmentMock.addHistoryEntry({
        assignmentId: id,
        assetId: updated.assetId,
        employeeId: payload.toEmployeeId,
        action: 'transferred',
        actionedBy: 'current.user',
        actionedAt: new Date().toISOString(),
      });

      return withStep;
    }

    const response = await api.post<Assignment>(API_ENDPOINTS.ASSIGNMENT.TRANSFER(id), payload);
    return response.data;
  },

  checkOut: async (payload: CheckOutPayload): Promise<Assignment> => {
    const alreadyActive = await assignmentAPI.hasActiveAssignment(payload.assetId);
    if (alreadyActive) {
      throw new Error(
        `Asset ${payload.assetId} already has an active assignment (FR-41 Single Active Assignment).`
      );
    }

    if (USE_MOCK) {
      const created = await assignmentMock.create({
        assetId: payload.assetId,
        employeeId: payload.employeeId,
        department: payload.department,
        type: 'checkout',
        status: 'checked_out',
        assignedDate: payload.checkOutDate,
        expectedReturnDate: payload.expectedReturnDate,
      });

      // Check-out does not go through manager approval in this wave.
      const activated = await assignmentMock.update(created.id, { isActive: true });

      assignmentMock.addHistoryEntry({
        assignmentId: created.id,
        assetId: created.assetId,
        employeeId: created.employeeId,
        action: 'checked_out',
        actionedBy: 'current.user',
        actionedAt: new Date().toISOString(),
      });

      return activated;
    }

    const response = await api.post<Assignment>(API_ENDPOINTS.ASSIGNMENT.CHECKOUT, payload);
    return response.data;
  },

  checkIn: async (id: string): Promise<Assignment> => {
    if (USE_MOCK) {
      const updated = await assignmentMock.update(id, { status: 'returned', isActive: false });

      assignmentMock.addHistoryEntry({
        assignmentId: id,
        assetId: updated.assetId,
        employeeId: updated.employeeId,
        action: 'checked_in',
        actionedBy: 'current.user',
        actionedAt: new Date().toISOString(),
      });

      return updated;
    }

    const response = await api.post<Assignment>(API_ENDPOINTS.ASSIGNMENT.CHECKIN(id));
    return response.data;
  },

  acknowledge: async (id: string): Promise<Assignment> => {
    if (USE_MOCK) {
      const updated = await assignmentMock.update(id, {
        status: 'active',
        isActive: true,
        acknowledgedAt: new Date().toISOString(),
      });

      assignmentMock.addHistoryEntry({
        assignmentId: id,
        assetId: updated.assetId,
        employeeId: updated.employeeId,
        action: 'acknowledged',
        actionedBy: 'current.user',
        actionedAt: new Date().toISOString(),
      });

      return updated;
    }

    const response = await api.post<Assignment>(API_ENDPOINTS.ASSIGNMENT.ACKNOWLEDGE(id));
    return response.data;
  },

  /**
   * Applies the outcome of a workflow approval decision (see services/workflow.ts `action`) onto
   * the Assignment entity's own status. This is NOT approve/reject decision-making itself (that
   * lives solely in workflowAPI, which stays entity-agnostic) — it only reacts to a decision the
   * workflow engine already recorded, transitioning this domain entity's status accordingly.
   * Called by the Approval Inbox page right after workflowAPI.action() resolves.
   */
  applyApprovalDecision: async (id: string, approved: boolean): Promise<Assignment> => {
    if (USE_MOCK) {
      const updated = await assignmentMock.update(id, {
        status: approved ? 'pending_acknowledgement' : 'rejected',
        isActive: false,
      });

      assignmentMock.addHistoryEntry({
        assignmentId: id,
        assetId: updated.assetId,
        employeeId: updated.employeeId,
        action: approved ? 'approved' : 'rejected',
        actionedBy: 'current.user',
        actionedAt: new Date().toISOString(),
      });

      return updated;
    }

    const response = await api.put<Assignment>(API_ENDPOINTS.ASSIGNMENT.DETAIL(id), {
      status: approved ? 'pending_acknowledgement' : 'rejected',
    });
    return response.data;
  },

  getHistory: async (id: string): Promise<AssignmentHistoryEntry[]> => {
    if (USE_MOCK) {
      return assignmentMock.getHistory(id);
    }
    const response = await api.get<AssignmentHistoryEntry[]>(API_ENDPOINTS.ASSIGNMENT.HISTORY(id));
    return response.data;
  },
};
