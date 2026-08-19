// Mock authentication — DEV ONLY. Real login always calls the backend (services/auth.ts เดิม
// ไม่มี USE_MOCK เพราะตั้งใจให้ auth เป็นของจริงเสมอ) ไฟล์นี้เป็นทางเลือกเสริมสำหรับ dev/demo
// ก่อนมี backend จริง ผูกกับ mockUsers/mockRoles ที่ port มาจริงแล้ว ไม่ได้สร้างบัญชีใหม่
import { mockUsers } from './user.mock';
import { mockRoles } from './role.mock';
import { LoginRequest, LoginResponse, User, UserRole, VerifyMfaRequest } from '@/types/auth';

// รหัสผ่าน demo ที่ใช้ร่วมกันทุกบัญชี mock (ไม่ใช่รหัสผ่านจริง — ไม่มีบัญชีจริงในระบบนี้)
export const MOCK_DEMO_PASSWORD = 'Demo@1234';

const MFA_ENABLED = import.meta.env.VITE_MFA_ENABLED === 'true';
const MFA_CHALLENGE_PREFIX = 'mfa-challenge:';
const MOCK_MFA_CODE = '123456';

function toAuthUser(userId: string): User {
  const managedUser = mockUsers.find((u) => u.id === userId);
  if (!managedUser) throw new Error('User not found');
  const role = mockRoles.find((r) => r.id === managedUser.roleId);
  return {
    id: managedUser.id,
    username: managedUser.username,
    email: managedUser.email,
    role: managedUser.roleId as UserRole,
    permissions: role?.permissionKeys ?? [],
    mfaEnabled: MFA_ENABLED,
    employeeId: managedUser.employeeId,
  };
}

export const authMock = {
  login: async ({ username, password }: LoginRequest): Promise<LoginResponse> => {
    const managedUser = mockUsers.find((u) => u.username === username && u.isActive);
    if (!managedUser || password !== MOCK_DEMO_PASSWORD) {
      throw new Error('Invalid username or password');
    }
    if (MFA_ENABLED) {
      return {
        token: `${MFA_CHALLENGE_PREFIX}${managedUser.id}`,
        user: toAuthUser(managedUser.id),
        permissions: toAuthUser(managedUser.id).permissions,
        mfaRequired: true,
      };
    }
    return {
      token: `mock-token:${managedUser.id}`,
      user: toAuthUser(managedUser.id),
      permissions: toAuthUser(managedUser.id).permissions,
    };
  },

  verifyMfa: async ({ challengeToken, code }: VerifyMfaRequest): Promise<LoginResponse> => {
    if (!challengeToken.startsWith(MFA_CHALLENGE_PREFIX)) {
      throw new Error('Invalid MFA challenge');
    }
    if (code !== MOCK_MFA_CODE) {
      throw new Error('Invalid MFA code');
    }
    const userId = challengeToken.slice(MFA_CHALLENGE_PREFIX.length);
    return {
      token: `mock-token:${userId}`,
      user: toAuthUser(userId),
      permissions: toAuthUser(userId).permissions,
    };
  },

  logout: async (): Promise<void> => {},

  checkAuth: async (): Promise<{ valid: boolean }> => ({ valid: true }),
};
