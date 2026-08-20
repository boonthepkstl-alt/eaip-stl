import { users as userFixtures } from '@/data/fixtures/mockData';
import { MockUserRepository, type UserRepository } from '@/services/user-repository';
import type { InviteUserInput, User, UserListQuery, UserListResult } from '@/types/user';

const repository: UserRepository = new MockUserRepository(userFixtures);

/**
 * The stable frontend contract for the User Management page (pages/UserManagement). User is its
 * own domain — a platform login/identity account, distinct from Employee (see types/user.ts) —
 * this file has no dependency on employeeService/assetService and nothing else imports from it.
 */
export const userService = {
  listUsers: (query: UserListQuery = {}): Promise<UserListResult> => repository.list(query),
  getUser: (id: string): Promise<User | null> => repository.getById(id),
  inviteUser: (input: InviteUserInput): Promise<User> => repository.invite(input),
  updateUserStatus: (id: string, status: User['status']): Promise<User> => repository.updateStatus(id, status),
};
