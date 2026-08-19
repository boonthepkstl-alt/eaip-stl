export const APP_NAME = 'RAISE';
export const APP_VERSION = '1.0.0';

// Toggle mock data vs real backend calls (Wave 2 dashboard has no backend yet).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  HOME: '/',
  ACCESS_DENIED: '/403',
  ASSETS: '/assets',
  ASSET_CREATE: '/assets/create',
  ASSET_DETAIL: (id: string) => `/assets/${id}`,
  ASSET_EDIT: (id: string) => `/assets/${id}/edit`,
  ASSIGNMENTS: '/assignments',
  ASSIGNMENT_CHECKINOUT: '/assignments/checkin-checkout',
  // MOCKUP ONLY — ticket detail page for the IT Requisition & Maintenance mockup (see
  // pages/TicketDetail.tsx). Deliberately NOT under IT_REQUEST_DETAIL below, which is reserved
  // for the real future Phase F IT Request feature.
  ASSIGNMENT_CHECKINOUT_TICKET: (ticketCode: string) => `/assignments/checkin-checkout/tickets/${ticketCode}`,
  APPROVALS: '/approvals',
  LICENSES: '/licenses',
  INVENTORY: '/inventory',
  PROCUREMENT: '/procurement',
  AUDIT: '/audit',
  DOCUMENTS: '/documents',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  WORKFLOW_ADMIN: '/admin/workflows',
  IT_REQUESTS: '/it-requests',
  IT_REQUEST_CREATE: '/it-requests/create',
  IT_REQUEST_DETAIL: (id: string) => `/it-requests/${id}`,
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_ORGANIZATION: '/admin/organization',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_COMPANIES_BRANCHES: '/admin/companies-branches',
  ADMIN_ASSET_CATEGORIES: '/admin/asset-categories',
  ADMIN_ASSET_LOCATIONS: '/admin/asset-locations',
  ADMIN_VENDORS: '/admin/vendors',
  PROFILE: '/profile',
  REPORTS_ASSET_INVENTORY: '/reports/asset-inventory',
  REPORTS_ASSET_ASSIGNMENT: '/reports/asset-assignment',
  SEARCH: '/search',
  NOTIFICATIONS: '/notifications',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CHECK: '/auth/check',
    VERIFY_MFA: '/auth/verify-mfa',
    CHANGE_PASSWORD: '/auth/change-password',
    MFA_ENROLL: '/auth/mfa/enroll',
    MFA_DISABLE: '/auth/mfa/disable',
    SESSIONS: '/auth/sessions',
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
  },
  ASSET: {
    LIST: '/assets',
    DETAIL: (id: string) => `/assets/${id}`,
    HISTORY: (id: string) => `/assets/${id}/history`,
    ARCHIVE: (id: string) => `/assets/${id}/archive`,
  },
  MASTERDATA: {
    CATEGORIES: '/masterdata/categories',
    LOCATIONS: '/masterdata/locations',
    VENDORS: '/masterdata/vendors',
    DEPARTMENTS: '/masterdata/departments',
    COMPANIES: '/masterdata/companies',
    BRANCHES: '/masterdata/branches',
  },
  ASSIGNMENT: {
    LIST: '/assignments',
    DETAIL: (id: string) => `/assignments/${id}`,
    HISTORY: (id: string) => `/assignments/${id}/history`,
    TRANSFER: (id: string) => `/assignments/${id}/transfer`,
    CHECKOUT: '/assignments/checkout',
    CHECKIN: (id: string) => `/assignments/${id}/checkin`,
    ACKNOWLEDGE: (id: string) => `/assignments/${id}/acknowledge`,
  },
  ORGANIZATION: {
    EMPLOYEES: '/organization/employees',
    EMPLOYEE_DETAIL: (id: string) => `/organization/employees/${id}`,
  },
  USER: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
  },
  ROLE: {
    LIST: '/roles',
    DETAIL: (id: string) => `/roles/${id}`,
  },
  WORKFLOW: {
    DEFINITIONS: '/workflows/definitions',
    DEFINITION_DETAIL: (id: string) => `/workflows/definitions/${id}`,
    SUBMIT: '/workflows/submit',
    APPROVAL_STATUS: (entityType: string, entityId: string) => `/workflows/status/${entityType}/${entityId}`,
    INBOX: '/workflows/inbox',
    ACTION: (approvalStepId: string) => `/workflows/steps/${approvalStepId}/action`,
    AUDIT_TRAIL: (entityType: string, entityId: string) => `/workflows/audit/${entityType}/${entityId}`,
  },
  IT_REQUEST: {
    LIST: '/it-requests',
    DETAIL: (id: string) => `/it-requests/${id}`,
    COMMENTS: (id: string) => `/it-requests/${id}/comments`,
    ASSIGN: (id: string) => `/it-requests/${id}/assign`,
    STATUS: (id: string) => `/it-requests/${id}/status`,
    HISTORY: (id: string) => `/it-requests/${id}/history`,
  },
  REPORT: {
    ASSET_INVENTORY: '/reports/asset-inventory',
    ASSET_ASSIGNMENT: '/reports/asset-assignment',
  },
  NOTIFICATION: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/mark-read`,
    DELETE: (id: string) => `/notifications/${id}`,
  },
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
} as const;
