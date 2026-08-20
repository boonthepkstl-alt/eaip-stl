import type { ReactNode } from 'react';
import { Dashboard } from '@/pages/Dashboard';
import { AssetList } from '@/pages/AssetList';
import { AssetDetail } from '@/pages/AssetDetail';
import { EmployeeDetail } from '@/pages/EmployeeDetail';
import { TicketDetail } from '@/pages/TicketDetail';
import { CreateAsset } from '@/pages/CreateAsset';
import { Assignment } from '@/pages/Assignment';
import { Maintenance } from '@/pages/Maintenance';
import { SoftwareLicensePage } from '@/pages/SoftwareLicense';
import { LicenseDetail } from '@/pages/LicenseDetail';
import { Inventory } from '@/pages/Inventory';
import { AIDecisionCenter } from '@/pages/AIDecisionCenter';
import { Reconciliation } from '@/pages/Reconciliation';
import { Reports } from '@/pages/Reports';
import { Administration } from '@/pages/Administration';
import { UserManagement } from '@/pages/UserManagement';
import { RoleManagement } from '@/pages/RoleManagement';
import { Settings } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { Login, ForgotPassword, Register } from '@/pages/Auth';
import { NotFound, AccessDenied } from '@/pages/ErrorPages';
import type { Page, NavigateFunction, PageParams } from './types';

/* Placeholder pages for nav items without dedicated builds yet */
export function Placeholder({ title, icon, onNavigate }: { title: string; icon: ReactNode; onNavigate: (id: string) => void }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-sm">
        <div className="h-14 w-14 rounded-full bg-surface-100 flex items-center justify-center text-surface-400 mx-auto mb-4">{icon}</div>
        <h3 className="text-title font-semibold text-surface-900">{title}</h3>
        <p className="text-body text-surface-500 mt-1">This module is part of the RAISE platform design. Connect a backend to activate full functionality.</p>
      </div>
    </div>
  );
}

export function ProcurementPlaceholder({ onNavigate }: { onNavigate: (id: string) => void }) {
  return <Placeholder title="Procurement" icon={<span className="text-2xl">🛒</span>} onNavigate={onNavigate} />;
}
export function AuditPlaceholder({ onNavigate }: { onNavigate: (id: string) => void }) {
  return <Placeholder title="Audit" icon={<span className="text-2xl">📋</span>} onNavigate={onNavigate} />;
}
export function DocumentsPlaceholder({ onNavigate }: { onNavigate: (id: string) => void }) {
  return <Placeholder title="Document Management" icon={<span className="text-2xl">📄</span>} onNavigate={onNavigate} />;
}
export function ApprovalsPlaceholder({ onNavigate }: { onNavigate: (id: string) => void }) {
  return <Placeholder title="Approval Workflow" icon={<span className="text-2xl">✅</span>} onNavigate={onNavigate} />;
}
export function AnalyticsPlaceholder({ onNavigate }: { onNavigate: (id: string) => void }) {
  return <Placeholder title="Analytics" icon={<span className="text-2xl">📊</span>} onNavigate={onNavigate} />;
}

export function renderStandalonePage(page: Page, navigate: NavigateFunction): ReactNode | null {
  switch (page) {
    case 'login':
      return <Login onNavigate={navigate} />;
    case 'forgot-password':
      return <ForgotPassword onNavigate={navigate} />;
    case 'register':
      return <Register onNavigate={navigate} />;
    case '404':
      return <NotFound onNavigate={navigate} />;
    case '403':
      return <AccessDenied onNavigate={navigate} />;
    default:
      return null;
  }
}

export function renderPage(
  page: Page,
  navigate: NavigateFunction,
  params: PageParams = {}
): ReactNode {
  const { assetId, ticketId, employeeId, licenseId } = params;

  switch (page) {
    case 'dashboard':
      return <Dashboard onNavigate={navigate} />;
    case 'ai-decision':
      return <AIDecisionCenter onNavigate={navigate} />;
    case 'reconciliation':
      return <Reconciliation onNavigate={navigate} />;
    case 'assets':
      return <AssetList onNavigate={navigate} />;
    case 'asset-detail':
      return <AssetDetail assetId={assetId ?? 'a1'} onNavigate={navigate} />;
    case 'employee-detail':
      return <EmployeeDetail employeeId={employeeId ?? 'e1'} onNavigate={navigate} />;
    case 'ticket-detail':
      return <TicketDetail ticketCode={ticketId ?? 'REQ-2026-0042'} onNavigate={navigate} />;
    case 'create-asset':
      return <CreateAsset onNavigate={navigate} />;
    case 'assignment':
      return <Assignment onNavigate={navigate} />;
    case 'maintenance':
      return <Maintenance onNavigate={navigate} />;
    case 'licenses':
      return <SoftwareLicensePage onNavigate={navigate} />;
    case 'license-detail':
      return <LicenseDetail licenseId={licenseId ?? 'l1'} onNavigate={navigate} />;
    case 'inventory':
      return <Inventory onNavigate={navigate} />;
    case 'procurement':
      return <ProcurementPlaceholder onNavigate={navigate} />;
    case 'audit':
      return <AuditPlaceholder onNavigate={navigate} />;
    case 'documents':
      return <DocumentsPlaceholder onNavigate={navigate} />;
    case 'approvals':
      return <ApprovalsPlaceholder onNavigate={navigate} />;
    case 'reports':
      return <Reports onNavigate={navigate} />;
    case 'analytics':
      return <AnalyticsPlaceholder onNavigate={navigate} />;
    case 'notifications':
      return <NotificationCenter onNavigate={navigate} />;
    case 'administration':
      return <Administration onNavigate={navigate} />;
    case 'user-management':
      return <UserManagement onNavigate={navigate} />;
    case 'role-management':
      return <RoleManagement onNavigate={navigate} />;
    case 'settings':
      return <Settings onNavigate={navigate} />;
    case 'profile':
      return <Profile onNavigate={navigate} />;
    default:
      return <Dashboard onNavigate={navigate} />;
  }
}
