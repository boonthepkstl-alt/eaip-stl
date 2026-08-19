import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { NotificationItem } from '@/types/notification';
import { notificationMock } from '@/mocks/notification.mock';

// Notification API (Wave 7 — Supporting: Epic Notification (NOTIF), FR-34..FR-37). Same
// USE_MOCK switch pattern as services/asset.ts.
export const notificationAPI = {
  list: async (recipientId: string): Promise<NotificationItem[]> => {
    if (USE_MOCK) {
      return notificationMock.list(recipientId);
    }
    const response = await api.get<NotificationItem[]>(API_ENDPOINTS.NOTIFICATION.LIST, {
      params: { recipientId },
    });
    return response.data;
  },

  markRead: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      return notificationMock.markRead(id);
    }
    await api.post(API_ENDPOINTS.NOTIFICATION.MARK_READ(id));
  },

  deleteNotification: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      return notificationMock.deleteNotification(id);
    }
    await api.delete(API_ENDPOINTS.NOTIFICATION.DELETE(id));
  },
};
