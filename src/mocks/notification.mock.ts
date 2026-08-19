// Mock data for Epic Notification (NOTIF), FR-34..FR-37. 100% DERIVED — every row is computed
// from existing mock arrays (assignment/workflow), never hardcoded, so it stays referentially
// consistent as those mocks change.
//
// IT Request-derived notifications (archived's buildRaw() items 3 & 4: status-change/comment
// events sourced from mocks/itRequest.mock.ts) are intentionally omitted — IT Request itself is
// deferred to Phase F and that mock does not exist in raise-frontend yet. Re-add those sections
// verbatim from raise-frontend-archived/src/mocks/notification.mock.ts once itRequest.mock.ts is
// ported.
import { mockAssignments } from '@/mocks/assignment.mock';
import { mockApprovalActions, mockApprovalSteps } from '@/mocks/workflow.mock';
import { NotificationCategory, NotificationEventType, NotificationItem } from '@/types/notification';

function buildRaw(): Omit<NotificationItem, 'id' | 'isRead'>[] {
  const items: Omit<NotificationItem, 'id' | 'isRead'>[] = [];

  // 1) mockAssignments (assign/transfer) -> notify the receiving employee.
  mockAssignments
    .filter((assignment) => assignment.type === 'assign' || assignment.type === 'transfer')
    .forEach((assignment) => {
      items.push({
        recipientId: assignment.employeeId,
        type: assignment.type as NotificationEventType,
        category: 'assignment' as NotificationCategory,
        title: assignment.type === 'assign' ? 'ได้รับมอบหมายทรัพย์สิน' : 'มีการโอนย้ายทรัพย์สิน',
        message: `Assignment ${assignment.id} (Asset ${assignment.assetId})`,
        entityType: 'assignment',
        entityId: assignment.id,
        createdAt: assignment.createdAt,
      });
    });

  // 2) mockApprovalActions + mockApprovalSteps -> resolve to the assignment's employeeId
  //    (the requester who should be notified of the approve/reject decision, not the approver).
  mockApprovalActions.forEach((action) => {
    const step = mockApprovalSteps.find((s) => s.id === action.approvalStepId);
    if (!step || step.entityType !== 'assignment') return;
    const assignment = mockAssignments.find((a) => a.id === step.entityId);
    if (!assignment) return;

    items.push({
      recipientId: assignment.employeeId,
      type: action.action === 'approve' ? 'approve' : 'reject',
      category: 'approval',
      title: action.action === 'approve' ? 'คำขอได้รับการอนุมัติ' : 'คำขอถูกปฏิเสธ',
      message: action.comment ?? `Assignment ${assignment.id}`,
      entityType: 'assignment',
      entityId: assignment.id,
      createdAt: action.actionedAt,
    });
  });

  return items;
}

// Dedup: key = `${type}:${entityType}:${entityId}`, keep only the latest (by createdAt).
// FR-36 placeholder — this dedup strategy is a stand-in only, NOT the final rule (a real
// notification feed would keep every discrete event, e.g. every comment). ห้ามถือว่าเป็นค่าสุดท้าย.
function dedup(items: Omit<NotificationItem, 'id' | 'isRead'>[]): Omit<NotificationItem, 'id' | 'isRead'>[] {
  const byKey = new Map<string, Omit<NotificationItem, 'id' | 'isRead'>>();
  items.forEach((item) => {
    const key = `${item.type}:${item.entityType}:${item.entityId}`;
    const existing = byKey.get(key);
    if (!existing || item.createdAt > existing.createdAt) {
      byKey.set(key, item);
    }
  });
  return Array.from(byKey.values());
}

// isRead: for each recipient, sort by createdAt desc — only the most recent notification for
// that recipient is unread (isRead:false); all older ones are isRead:true.
function applyReadState(items: Omit<NotificationItem, 'id' | 'isRead'>[]): Omit<NotificationItem, 'id'>[] {
  const byRecipient = new Map<string, Omit<NotificationItem, 'id' | 'isRead'>[]>();
  items.forEach((item) => {
    const list = byRecipient.get(item.recipientId) ?? [];
    list.push(item);
    byRecipient.set(item.recipientId, list);
  });

  const result: Omit<NotificationItem, 'id'>[] = [];
  byRecipient.forEach((list) => {
    const sorted = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    sorted.forEach((item, index) => {
      result.push({ ...item, isRead: index !== 0 });
    });
  });
  return result;
}

export const mockNotifications: NotificationItem[] = applyReadState(dedup(buildRaw())).map((item, index) => ({
  ...item,
  id: `NOTIF-${String(index + 1).padStart(3, '0')}`,
}));

export const notificationMock = {
  list: async (recipientId: string): Promise<NotificationItem[]> =>
    mockNotifications
      .filter((n) => n.recipientId === recipientId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)),

  markRead: async (id: string): Promise<void> => {
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`Notification ${id} not found`);
    }
    mockNotifications[index] = { ...mockNotifications[index], isRead: true };
  },

  deleteNotification: async (id: string): Promise<void> => {
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`Notification ${id} not found`);
    }
    mockNotifications.splice(index, 1);
  },
};
