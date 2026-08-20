export type Page =
  | 'dashboard' | 'ai-decision' | 'reconciliation'
  | 'assets' | 'asset-detail' | 'create-asset'
  | 'assignment' | 'employee-detail' | 'maintenance' | 'ticket-detail' | 'licenses' | 'license-detail' | 'inventory'
  | 'procurement' | 'audit' | 'documents' | 'approvals'
  | 'reports' | 'analytics' | 'notifications'
  | 'administration' | 'user-management' | 'role-management'
  | 'settings' | 'profile'
  | 'login' | 'forgot-password' | 'register'
  | '404' | '403';

export type NavigateFunction = (id: string, aid?: string) => void;

export interface PageParams {
  assetId?: string;
  ticketId?: string;
  employeeId?: string;
  licenseId?: string;
}

export const STANDALONE_PAGES: readonly Page[] = [
  'login',
  'forgot-password',
  'register',
  '404',
  '403',
] as const;

export function isStandalonePage(page: Page): boolean {
  return (STANDALONE_PAGES as readonly string[]).includes(page);
}
