export const APP_NAME = 'RAISE';
export const APP_VERSION = '0.1.0';

// Kept in sync with the Page union removed from the legacy ESAPS App.tsx (src/routes/types.ts)
// and the route mapping in FRONTEND-MIGRATION-BOUNDARY.md. Only routes scaffolded in this phase
// have a real page component — the rest resolve to the placeholder page for now.
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ASSETS: '/assets',
  ASSET_DETAIL: '/assets/:assetId',
  ASSET_CREATE: '/assets/create',
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/:employeeId',
  MAINTENANCE: '/maintenance',
  TICKET_DETAIL: '/maintenance/:ticketCode',
  LICENSES: '/licenses',
  LICENSE_DETAIL: '/licenses/:licenseId',
  RECONCILIATION: '/reconciliation',
  AI_DECISION: '/ai',
  ADMINISTRATION: '/administration',
  ADMIN_USERS: '/administration/users',
  ADMIN_ROLES: '/administration/roles',
  SETTINGS: '/settings',
  HOME: '/',
} as const;

export function assetDetailRoute(assetId: string) {
  return `/assets/${assetId}`;
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'raise_token',
  USER: 'raise_user',
} as const;
