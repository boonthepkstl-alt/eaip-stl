// Role set proposed in AUTH-RBAC.md — pending confirmation from the business owner.
export type Role = 'EMPLOYEE' | 'IT_STAFF' | 'IT_MANAGER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// go-template-main's TokenResponse/UserInfo serialize as snake_case (expires_at, full_name) —
// the api-client response interceptor is responsible for mapping into this camelCase shape.
export interface LoginResponse {
  token: string;
  expiresAt: number;
  user: User;
}
