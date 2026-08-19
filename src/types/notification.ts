// Notification types — Epic Notification (NOTIF), FR-34..FR-37.
// `NotificationEventType` is defined here directly rather than imported from a Zustand
// unread-counter store (archived's src/stores/useNotificationStore.ts) — raise-frontend has no
// stores/ directory yet (Zustand is installed but unused until Phase E+ needs it for real
// shared state). it_request_* members are kept for forward-compat with Phase F (IT Request) but
// nothing produces them yet — see mocks/notification.mock.ts.
export type NotificationEventType =
  | 'assign'
  | 'transfer'
  | 'approve'
  | 'reject'
  | 'it_request_create'
  | 'it_request_comment'
  | 'it_request_status_change'
  | 'it_request_close'
  | 'it_request_reopen';

export type NotificationCategory = 'assignment' | 'approval' | 'it_request';

export interface NotificationItem {
  id: string;
  recipientId: string; // Employee.id (src/types/organization.ts)
  type: NotificationEventType;
  category: NotificationCategory;
  title: string;
  message: string;
  entityType: 'assignment' | 'itRequest';
  entityId: string;
  isRead: boolean;
  createdAt: string;
}
