import type { InviteUserInput, User, UserListQuery, UserListResult } from '@/types/user';

/**
 * Contract userService depends on. MockUserRepository is the only implementation in Phase 6 —
 * swap it for an HttpUserRepository backed by GET/POST /api/v1/users (see
 * ADMINISTRATION-API-CONTRACT.md) once the Go backend lands, same pattern as AssetRepository.
 */
export interface UserRepository {
  list(query: UserListQuery): Promise<UserListResult>;
  getById(id: string): Promise<User | null>;
  invite(input: InviteUserInput): Promise<User>;
  updateStatus(id: string, status: User['status']): Promise<User>;
}

function simulateNetwork<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

const AVATAR_COLORS = ['bg-brand-500', 'bg-accent-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-violet-500'];

/** Backed by the legacy ESAPS fixture data (data/fixtures/mockData.ts `users` export). */
export class MockUserRepository implements UserRepository {
  private users: User[];

  constructor(seed: User[]) {
    this.users = [...seed];
  }

  async list(query: UserListQuery): Promise<UserListResult> {
    const search = (query.search ?? '').toLowerCase().trim();
    const filtered = this.users.filter((u) => {
      const matchesSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
      const matchesStatus = !query.status || query.status === 'all' || u.status === query.status;
      return matchesSearch && matchesStatus;
    });
    return simulateNetwork({ data: filtered, total: filtered.length });
  }

  async getById(id: string): Promise<User | null> {
    return simulateNetwork(this.users.find((u) => u.id === id) ?? null);
  }

  async invite(input: InviteUserInput): Promise<User> {
    const seq = this.users.length + 1;
    const initials = input.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'US';
    const created: User = {
      id: `u${seq}`,
      name: input.name,
      email: input.email,
      role: input.role,
      department: input.department,
      status: 'Active',
      lastActive: 'Just invited',
      initials,
      avatarColor: AVATAR_COLORS[this.users.length % AVATAR_COLORS.length],
    };
    this.users = [created, ...this.users];
    return simulateNetwork(created);
  }

  async updateStatus(id: string, status: User['status']): Promise<User> {
    const existing = this.users.find((u) => u.id === id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }
    const updated: User = { ...existing, status };
    this.users = this.users.map((u) => (u.id === id ? updated : u));
    return simulateNetwork(updated);
  }
}
