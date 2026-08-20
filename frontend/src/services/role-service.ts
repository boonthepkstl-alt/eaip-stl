import { roles as roleFixtures } from '@/data/fixtures/mockData';
import { MockRoleRepository, type RoleRepository } from '@/services/role-repository';
import type { CreateRoleInput, Role, RoleListResult } from '@/types/role';

const repository: RoleRepository = new MockRoleRepository(roleFixtures);

/**
 * The stable frontend contract for the Role Management page (pages/RoleManagement). Role is its
 * own domain — has no dependency on userService (Role.users is a precomputed display count, not
 * a live join, see types/role.ts) and nothing else imports from it.
 */
export const roleService = {
  listRoles: (): Promise<RoleListResult> => repository.list(),
  getRole: (id: string): Promise<Role | null> => repository.getById(id),
  createRole: (input: CreateRoleInput): Promise<Role> => repository.create(input),
  deleteRole: (id: string): Promise<void> => repository.remove(id),
};
