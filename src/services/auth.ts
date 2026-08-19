import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import {
  ChangePasswordRequest,
  DisableMfaRequest,
  LoginRequest,
  LoginResponse,
  MfaEnrollConfirmRequest,
  MfaEnrollStartResponse,
  SessionInfo,
  VerifyMfaRequest,
} from '@/types/auth';
import { authMock } from '@/mocks/auth.mock';

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    if (USE_MOCK) {
      return authMock.login(credentials);
    }
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  verifyMfa: async (payload: VerifyMfaRequest): Promise<LoginResponse> => {
    if (USE_MOCK) {
      return authMock.verifyMfa(payload);
    }
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.VERIFY_MFA, payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK) {
      return authMock.logout();
    }
    await api.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  checkAuth: async (): Promise<{ valid: boolean }> => {
    if (USE_MOCK) {
      return authMock.checkAuth();
    }
    const response = await api.get<{ valid: boolean }>(API_ENDPOINTS.AUTH.CHECK);
    return response.data;
  },

  // Profile/Security (Wave 7 — Supporting). No USE_MOCK branch — auth always calls the real
  // endpoint regardless of USE_MOCK, same as login/verifyMfa/logout/checkAuth above.
  changePassword: async (payload: ChangePasswordRequest): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
  },

  // No payload = start enrollment, payload = confirm enrollment with the TOTP code.
  enrollMfa: async (payload?: MfaEnrollConfirmRequest): Promise<MfaEnrollStartResponse> => {
    const response = await api.post<MfaEnrollStartResponse>(API_ENDPOINTS.AUTH.MFA_ENROLL, payload);
    return response.data;
  },

  disableMfa: async (payload: DisableMfaRequest): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.MFA_DISABLE, payload);
  },

  listSessions: async (): Promise<SessionInfo[]> => {
    const response = await api.get<SessionInfo[]>(API_ENDPOINTS.AUTH.SESSIONS);
    return response.data;
  },
};
