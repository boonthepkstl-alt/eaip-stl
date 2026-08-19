import api from '@/services/api';
import { API_ENDPOINTS, USE_MOCK } from '@/config/constants';
import { DashboardSummary } from '@/types/dashboard';
import { dashboardMock } from '@/mocks/dashboard.mock';

// Dashboard API (Wave 2 — UI+mock DoD, no backend wiring yet)
export const dashboardAPI = {
  getSummary: async (): Promise<DashboardSummary> => {
    if (USE_MOCK) {
      return dashboardMock.getSummary();
    }
    const response = await api.get<DashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY);
    return response.data;
  },
};
