import type { CreateRoleInput, Role, RoleListResult } from '@/types/role';

/**
 * Contract roleService depends on. MockRoleRepository is the only implementation in Phase 6 —
 * swap it for an HttpRoleRepository backed by GET/POST /api/v1/roles (see
 * ADMINISTRATION-API-CONTRACT.md) once the Go backend lands, same pattern as AssetRepository.
 */
export interface RoleRepository {
  list(): Promise<RoleListResult>;
  getById(id: string): Promise<Role | null>;
  create(input: CreateRoleInput): Promise<Role>;
  remove(id: string): Promise<void>;
}

function simulateNetwork<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

/** Backed by the legacy ESAPS fixture data (data/fixtures/mockData.ts `roles` export). */
export class MockRoleRepository implements RoleRepository {
  private roles: Role[];

  constructor(seed: Role[]) {
    this.roles = [...seed];
  }

  async list(): Promise<RoleListResult> {
    return simulateNetwork({ data: this.roles, total: this.roles.length });
  }

  async getById(id: string): Promise<Role | null> {
    return simulateNetwork(this.roles.find((r) => r.id === id) ?? null);
  }

  async create(input: CreateRoleInput): Promise<Role> {
    const seq = this.roles.length + 1;
    const created: Role = {
      id: `r${seq}`,
      name: input.name,
      description: input.description,
      users: 0,
      permissions: 1, // default 'View' on every module, matching RoleManagement's initial matrix state
      system: false,
    };
    this.roles = [...this.roles, created];
    return simulateNetwork(created);
  }

  async remove(id: string): Promise<void> {
    const existing = this.roles.find((r) => r.id === id);
    if (!existing) {
      throw new Error(`Role ${id} not found`);
    }
    if (existing.system) {
      throw new Error(`Role ${id} is a system role and cannot be deleted`);
    }
    this.roles = this.roles.filter((r) => r.id !== id);
    return simulateNetwork(undefined);
  }
}
