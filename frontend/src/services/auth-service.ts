import apiClient from '@/services/api-client';
import { API_ENDPOINTS } from '@/config/constants';
import type { LoginRequest, LoginResponse } from '@/types/auth';

// Maps directly onto go-template-main's authController (POST /auth/login, /auth/logout).
// go-template's demo AuthService is a hardcoded single-user stub (see AUTH-RBAC.md) — this
// service already targets the real contract so swapping the backend implementation later
// requires no frontend change.
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },
};
