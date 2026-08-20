import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';
import ErrorBoundary from '@/components/ErrorBoundary';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import { AssetsPage } from '@/pages/Assets';
import { AssetDetailPage } from '@/pages/AssetDetail';
import { CreateAssetPage } from '@/pages/CreateAsset';
import { EmployeesPage } from '@/pages/Employees';
import { EmployeeDetailPage } from '@/pages/EmployeeDetail';
import { MaintenancePage } from '@/pages/Maintenance';
import { TicketDetailPage } from '@/pages/TicketDetail';
import { LicensesPage } from '@/pages/Licenses';
import { LicenseDetailPage } from '@/pages/LicenseDetail';
import { ReconciliationPage, AiDecisionPage } from '@/pages/modules';
import { AdministrationPage } from '@/pages/Administration';
import { UserManagementPage } from '@/pages/UserManagement';
import { RoleManagementPage } from '@/pages/RoleManagement';
import { SettingsPage } from '@/pages/Settings';
import { ROUTES } from '@/config/constants';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-body text-surface-500">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path={ROUTES.LOGIN} element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.ASSETS} element={<AssetsPage />} />
                <Route path={ROUTES.ASSET_CREATE} element={<CreateAssetPage />} />
                <Route path={ROUTES.ASSET_DETAIL} element={<AssetDetailPage />} />
                <Route path={ROUTES.EMPLOYEES} element={<EmployeesPage />} />
                <Route path={ROUTES.EMPLOYEE_DETAIL} element={<EmployeeDetailPage />} />
                <Route path={ROUTES.MAINTENANCE} element={<MaintenancePage />} />
                <Route path={ROUTES.TICKET_DETAIL} element={<TicketDetailPage />} />
                <Route path={ROUTES.LICENSES} element={<LicensesPage />} />
                <Route path={ROUTES.LICENSE_DETAIL} element={<LicenseDetailPage />} />
                <Route path={ROUTES.RECONCILIATION} element={<ReconciliationPage />} />
                <Route path={ROUTES.AI_DECISION} element={<AiDecisionPage />} />
                <Route path={ROUTES.ADMINISTRATION} element={<AdministrationPage />} />
                <Route path={ROUTES.ADMIN_USERS} element={<UserManagementPage />} />
                <Route path={ROUTES.ADMIN_ROLES} element={<RoleManagementPage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              </Route>

              <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
