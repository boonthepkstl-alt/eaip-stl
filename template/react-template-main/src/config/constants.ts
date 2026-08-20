export const APP_NAME = 'React Template';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HOME: '/',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CHECK: '/auth/check',
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
