import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { Role } from '@/types/role';
import { mockRoles } from '@/mocks/role.mock';

export type CreateRolePayload = Omit<Role, 'id' | 'isSystemRole' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;
export type UpdateRolePayload = Partial<Omit<CreateRolePayload, never>>;

// Role API — Wave 6 (Epic: User/Role/Permission + Baseline Administration, FR-09, FR-11). Same
// USE_MOCK switch pattern as services/asset.ts. System roles (isSystemRole:true) may never be
// deleted (ข้อจำกัด #5) — deactivate() throws for them instead.
export const roleAPI = {
  list: async (): Promise<Role[]> => {
    if (USE_MOCK) {
      return mockRoles;
    }
    const response = await api.get<Role[]>(API_ENDPOINTS.ROLE.LIST);
    return response.data;
  },

  getById: async (id: string): Promise<Role | undefined> => {
    if (USE_MOCK) {
      return mockRoles.find((role) => role.id === id);
    }
    const response = await api.get<Role>(API_ENDPOINTS.ROLE.DETAIL(id));
    return response.data;
  },

  create: async (payload: CreateRolePayload): Promise<Role> => {
    if (USE_MOCK) {
      const timestamp = new Date().toISOString();
      const created: Role = {
        ...payload,
        id: payload.name.trim().toLowerCase().replace(/\s+/g, '_'),
        isSystemRole: false,
        createdAt: timestamp,
        createdBy: 'current.user',
        updatedAt: timestamp,
        updatedBy: 'current.user',
      };
      mockRoles.push(created);
      return created;
    }
    const response = await api.post<Role>(API_ENDPOINTS.ROLE.LIST, payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateRolePayload): Promise<Role> => {
    if (USE_MOCK) {
      const index = mockRoles.findIndex((role) => role.id === id);
      if (index === -1) {
        throw new Error(`Role ${id} not found`);
      }
      const updated: Role = {
        ...mockRoles[index],
        ...payload,
        id: mockRoles[index].id,
        isSystemRole: mockRoles[index].isSystemRole,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current.user',
      };
      mockRoles[index] = updated;
      return updated;
    }
    const response = await api.put<Role>(API_ENDPOINTS.ROLE.DETAIL(id), payload);
    return response.data;
  },

  // System roles (isSystemRole:true) may never be deleted (ข้อจำกัด #5) — throws instead.
  // Custom (non-system) roles are removed from the mock registry.
  deactivate: async (id: string): Promise<Role> => {
    const existing = await roleAPI.getById(id);
    if (!existing) {
      throw new Error(`Role ${id} not found`);
    }
    if (existing.isSystemRole) {
      throw new Error(`Role ${id} is a system role and cannot be deleted`);
    }
    if (USE_MOCK) {
      const index = mockRoles.findIndex((role) => role.id === id);
      mockRoles.splice(index, 1);
      return existing;
    }
    const response = await api.delete<Role>(API_ENDPOINTS.ROLE.DETAIL(id));
    return response.data;
  },
};
