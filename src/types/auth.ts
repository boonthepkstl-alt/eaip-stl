// User roles supported by RAISE (see docs/01-requirements/01-spec/20260815-02-user-role-permission.md)
export type UserRole =
  | 'administrator'
  | 'it_asset_manager'
  | 'it_support_technician'
  | 'department_manager'
  | 'employee'
  | 'auditor'
  | 'executive';

// User types
export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  permissions: string[];
  mfaEnabled?: boolean;
  // Link -> organization.ts Employee.id (mirrors types/user.ts ManagedUser.employeeId). Needed
  // because the login identity (ManagedUser.id, e.g. "USR-001") is a different id namespace from
  // the Employee entity that Workflow & Approval routing (FR-38..FR-44) keys everything off —
  // directManagerId / ApprovalStep.approverId are always Employee ids, never ManagedUser ids.
  employeeId?: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  permissions: string[];
  mfaRequired?: boolean;
}

// MFA (TOTP) — see FR-04
export interface MfaChallenge {
  challengeToken: string;
}

export interface VerifyMfaRequest {
  challengeToken: string;
  code: string;
}

// Profile/Security — Wave 7 (Supporting).
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MfaEnrollStartResponse {
  challengeToken: string;
  qrCodeUrl: string;
  secret: string;
}

export interface MfaEnrollConfirmRequest {
  challengeToken: string;
  code: string;
}

export interface DisableMfaRequest {
  code: string;
}

export interface SessionInfo {
  id: string;
  device?: string;
  ipAddress?: string;
  lastActiveAt: string;
  isCurrent: boolean;
}
