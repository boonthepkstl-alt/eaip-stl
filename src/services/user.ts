import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { ManagedUser } from '@/types/user';
import { mockUsers } from '@/mocks/user.mock';

export type CreateUserPayload = Omit<ManagedUser, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;
export type UpdateUserPayload = Partial<CreateUserPayload>;

// User API — Wave 6 (Epic: User/Role/Permission + Baseline Administration, FR-08, FR-10, FR-12).
// Same USE_MOCK switch pattern as services/asset.ts. No resetPassword — not in spec, not
// invented here.
export const userAPI = {
  list: async (): Promise<ManagedUser[]> => {
    if (USE_MOCK) {
      return mockUsers;
    }
    const response = await api.get<ManagedUser[]>(API_ENDPOINTS.USER.LIST);
    return response.data;
  },

  getById: async (id: string): Promise<ManagedUser | undefined> => {
    if (USE_MOCK) {
      return mockUsers.find((user) => user.id === id);
    }
    const response = await api.get<ManagedUser>(API_ENDPOINTS.USER.DETAIL(id));
    return response.data;
  },

  create: async (payload: CreateUserPayload): Promise<ManagedUser> => {
    if (USE_MOCK) {
      const timestamp = new Date().toISOString();
      const created: ManagedUser = {
        ...payload,
        id: `USR-${String(mockUsers.length + 1).padStart(3, '0')}`,
        createdAt: timestamp,
        createdBy: 'current.user',
        updatedAt: timestamp,
        updatedBy: 'current.user',
      };
      mockUsers.push(created);
      return created;
    }
    const response = await api.post<ManagedUser>(API_ENDPOINTS.USER.LIST, payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateUserPayload): Promise<ManagedUser> => {
    if (USE_MOCK) {
      const index = mockUsers.findIndex((user) => user.id === id);
      if (index === -1) {
        throw new Error(`User ${id} not found`);
      }
      const updated: ManagedUser = {
        ...mockUsers[index],
        ...payload,
        id: mockUsers[index].id,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current.user',
      };
      mockUsers[index] = updated;
      return updated;
    }
    const response = await api.put<ManagedUser>(API_ENDPOINTS.USER.DETAIL(id), payload);
    return response.data;
  },

  deactivate: async (id: string): Promise<ManagedUser> => userAPI.update(id, { isActive: false }),
};
