// Role domain types (Phase 6 — Administration). `users`/`permissions` on Role are precomputed
// display counts in the legacy fixture, not a live join against the User list (User.role is a
// free-text label, not a foreign key to Role.id) — preserved as-is, not invented here.

export interface Role {
  id: string;
  name: string;
  description: string;
  users: number;
  permissions: number;
  system: boolean;
}

export interface CreateRoleInput {
  name: string;
  description: string;
}

export interface RoleListResult {
  data: Role[];
  total: number;
}
