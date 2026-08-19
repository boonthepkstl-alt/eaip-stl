import { lazy, Suspense, useCallback, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, ClipboardCheck, FileText, BarChart3, Building2, MapPin, Database } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RedirectIfAuthenticated from '@/routes/RedirectIfAuthenticated';
import RequirePermission from '@/routes/RequirePermission';
import { ROUTES } from '@/config/constants';
import { AppShell } from '@/components/AppShell';
import { ToastProvider } from '@/components/ui';
import { pageTitles } from '@/config/navigation';

// Route-level code splitting — each page is its own chunk, fetched only when
// the user actually navigates to it, instead of all pages shipping in the
// initial bundle regardless of which single page is being viewed.
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const AssetList = lazy(() => import('@/pages/AssetList').then((m) => ({ default: m.AssetList })));
const AssetDetail = lazy(() => import('@/pages/AssetDetail').then((m) => ({ default: m.AssetDetail })));
const CreateAsset = lazy(() => import('@/pages/CreateAsset').then((m) => ({ default: m.CreateAsset })));
const Assignment = lazy(() => import('@/pages/Assignment').then((m) => ({ default: m.Assignment })));
const CheckInCheckOut = lazy(() => import('@/pages/CheckInCheckOut').then((m) => ({ default: m.CheckInCheckOut })));
const TicketDetail = lazy(() => import('@/pages/TicketDetail').then((m) => ({ default: m.TicketDetail })));
const ApprovalInbox = lazy(() => import('@/pages/ApprovalInbox').then((m) => ({ default: m.ApprovalInbox })));
const WorkflowDefinition = lazy(() => import('@/pages/WorkflowDefinition').then((m) => ({ default: m.WorkflowDefinition })));
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })));
const Administration = lazy(() => import('@/pages/Administration').then((m) => ({ default: m.Administration })));
const UserManagement = lazy(() => import('@/pages/UserManagement').then((m) => ({ default: m.UserManagement })));
const RoleManagement = lazy(() => import('@/pages/RoleManagement').then((m) => ({ default: m.RoleManagement })));
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })));
const NotificationCenter = lazy(() => import('@/pages/NotificationCenter').then((m) => ({ default: m.NotificationCenter })));
const SoftwareLicensePage = lazy(() => import('@/pages/SoftwareLicense').then((m) => ({ default: m.SoftwareLicensePage })));
const Inventory = lazy(() => import('@/pages/Inventory').then((m) => ({ default: m.Inventory })));
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const PlaceholderPage = lazy(() => import('@/pages/Placeholder').then((m) => ({ default: m.PlaceholderPage })));
const Login = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.ForgotPassword })));
const NotFound = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.NotFound })));
const AccessDenied = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.AccessDenied })));

// Legacy page-id -> real URL path — kept so every existing page component can keep receiving
// `onNavigate(id, aid?)` exactly as before (no signature changes needed on Dashboard.tsx,
// AssetList.tsx, etc.) — this just translates legacy ids into real paths for react-router-dom.
const PATH_BY_ID: Record<string, string | ((aid?: string) => string)> = {
  dashboard: ROUTES.DASHBOARD,
  assets: ROUTES.ASSETS,
  'asset-detail': (aid) => `/assets/${aid ?? 'a1'}`,
  'create-asset': ROUTES.ASSET_CREATE,
  assignment: ROUTES.ASSIGNMENTS,
  'checkin-checkout': ROUTES.ASSIGNMENT_CHECKINOUT,
  'ticket-detail': (aid) => ROUTES.ASSIGNMENT_CHECKINOUT_TICKET(aid ?? 'ITR-2026-001'),
  'workflow-admin': ROUTES.WORKFLOW_ADMIN,
  licenses: ROUTES.LICENSES,
  inventory: ROUTES.INVENTORY,
  procurement: ROUTES.PROCUREMENT,
  audit: ROUTES.AUDIT,
  documents: ROUTES.DOCUMENTS,
  approvals: ROUTES.APPROVALS,
  reports: ROUTES.REPORTS_ASSET_INVENTORY,
  'reports-assignment': ROUTES.REPORTS_ASSET_ASSIGNMENT,
  analytics: ROUTES.ANALYTICS,
  notifications: ROUTES.NOTIFICATIONS,
  administration: ROUTES.ADMIN,
  'user-management': ROUTES.ADMIN_USERS,
  'role-management': ROUTES.ADMIN_ROLES,
  departments: ROUTES.ADMIN_DEPARTMENTS,
  locations: ROUTES.ADMIN_ASSET_LOCATIONS,
  'master-data': ROUTES.ADMIN_ASSET_CATEGORIES,
  settings: ROUTES.SETTINGS,
  profile: ROUTES.PROFILE,
  login: ROUTES.LOGIN,
  'forgot-password': ROUTES.FORGOT_PASSWORD,
  '403': ROUTES.ACCESS_DENIED,
};

function useLegacyNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (id: string, aid?: string) => {
      const target = PATH_BY_ID[id];
      const path = typeof target === 'function' ? target(aid) : target ?? ROUTES.DASHBOARD;
      navigate(path);
      window.scrollTo(0, 0);
    },
    [navigate],
  );
}

function buildBreadcrumb(pageId: string): { label: string; href?: string }[] {
  const meta = pageTitles[pageId] ?? { title: 'RAISE', subtitle: '' };
  const crumbs: { label: string; href?: string }[] = [{ label: 'Home', href: '#' }];

  if (pageId === 'asset-detail') {
    crumbs.push({ label: 'Asset Management', href: '#' });
    crumbs.push({ label: 'Asset Details' });
  } else if (pageId === 'ticket-detail') {
    crumbs.push({ label: 'IT Requisition & Maintenance', href: '#' });
    crumbs.push({ label: 'Ticket Details' });
  } else if (pageId === 'create-asset') {
    crumbs.push({ label: 'Asset Management', href: '#' });
    crumbs.push({ label: 'Create Asset' });
  } else if (pageId === 'user-management' || pageId === 'role-management' || pageId === 'departments' || pageId === 'locations' || pageId === 'master-data') {
    crumbs.push({ label: 'Administration', href: '#' });
    crumbs.push({ label: meta.title });
  } else {
    crumbs.push({ label: meta.title });
  }

  return crumbs;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 rounded-full border-2 border-surface-200 border-t-brand-500 animate-spin" />
    </div>
  );
}

// Each page is wrapped by a small component that knows its own legacy id, so it can pass the
// right `current`/`onNavigate`/`breadcrumb` down to AppShell — AppShell's own signature is
// unchanged (still just current/onNavigate/breadcrumb/children).
function ShellPage({
  pageId,
  children,
}: {
  pageId: string;
  children: (navigate: (id: string, aid?: string) => void) => ReactNode;
}) {
  const navigate = useLegacyNavigate();
  return (
    <AppShell current={pageId} onNavigate={navigate} breadcrumb={buildBreadcrumb(pageId)}>
      {children(navigate)}
    </AppShell>
  );
}

function AssetDetailWithParams({ onNavigate }: { onNavigate: (id: string, aid?: string) => void }) {
  const { id } = useParams();
  return <AssetDetail assetId={id ?? 'a1'} onNavigate={onNavigate} />;
}

function TicketDetailWithParams({ onNavigate }: { onNavigate: (id: string, aid?: string) => void }) {
  const { ticketCode } = useParams();
  return <TicketDetail ticketCode={ticketCode ?? 'ITR-2026-001'} onNavigate={onNavigate} />;
}

function AppRoutes() {
  const navigate = useLegacyNavigate();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path={ROUTES.LOGIN} element={<Login onNavigate={navigate} />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword onNavigate={navigate} />} />
        </Route>
        <Route path={ROUTES.ACCESS_DENIED} element={<AccessDenied onNavigate={navigate} />} />

        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<ShellPage pageId="dashboard">{(nav) => <Dashboard onNavigate={nav} />}</ShellPage>} />
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

          <Route element={<RequirePermission permission="asset:read" />}>
            <Route path={ROUTES.ASSETS} element={<ShellPage pageId="assets">{(nav) => <AssetList onNavigate={nav} />}</ShellPage>} />
            <Route path="/assets/:id" element={<ShellPage pageId="asset-detail">{(nav) => <AssetDetailWithParams onNavigate={nav} />}</ShellPage>} />
          </Route>

          <Route element={<RequirePermission permission="asset:create" />}>
            <Route path={ROUTES.ASSET_CREATE} element={<ShellPage pageId="create-asset">{(nav) => <CreateAsset onNavigate={nav} />}</ShellPage>} />
          </Route>

          <Route element={<RequirePermission permission="assignment:read" />}>
            <Route path={ROUTES.ASSIGNMENTS} element={<ShellPage pageId="assignment">{(nav) => <Assignment onNavigate={nav} />}</ShellPage>} />
          </Route>

          {/* MOCKUP ONLY (2026-08-18) — this route used to gate the real Check-In/Check-Out
              feature; now gates the IT Requisition & Maintenance UI mockup (converted per
              explicit user request, see pages/CheckInCheckOut.tsx header comment). */}
          <Route element={<RequirePermission permission="itrequest:read" />}>
            <Route path={ROUTES.ASSIGNMENT_CHECKINOUT} element={<ShellPage pageId="checkin-checkout">{(nav) => <CheckInCheckOut onNavigate={nav} />}</ShellPage>} />
            <Route path={`${ROUTES.ASSIGNMENT_CHECKINOUT}/tickets/:ticketCode`} element={<ShellPage pageId="ticket-detail">{(nav) => <TicketDetailWithParams onNavigate={nav} />}</ShellPage>} />
          </Route>

          <Route element={<RequirePermission permission="approval:action" />}>
            <Route path={ROUTES.APPROVALS} element={<ShellPage pageId="approvals">{(nav) => <ApprovalInbox onNavigate={nav} />}</ShellPage>} />
          </Route>

          <Route element={<RequirePermission permission="workflow:configure" />}>
            <Route path={ROUTES.WORKFLOW_ADMIN} element={<ShellPage pageId="workflow-admin">{(nav) => <WorkflowDefinition onNavigate={nav} />}</ShellPage>} />
          </Route>

          <Route element={<RequirePermission permission="report:read" />}>
            <Route path={ROUTES.REPORTS_ASSET_INVENTORY} element={<ShellPage pageId="reports">{(nav) => <Reports onNavigate={nav} />}</ShellPage>} />
            <Route path={ROUTES.REPORTS_ASSET_ASSIGNMENT} element={<ShellPage pageId="reports-assignment">{(nav) => <Reports onNavigate={nav} />}</ShellPage>} />
          </Route>

          <Route path={ROUTES.LICENSES} element={<ShellPage pageId="licenses">{(nav) => <SoftwareLicensePage onNavigate={nav} />}</ShellPage>} />
          <Route path={ROUTES.INVENTORY} element={<ShellPage pageId="inventory">{(nav) => <Inventory onNavigate={nav} />}</ShellPage>} />

          <Route path={ROUTES.PROCUREMENT} element={<ShellPage pageId="procurement">{(nav) => <PlaceholderPage title="Procurement" icon={<ShoppingCart className="h-6 w-6" />} onNavigate={nav} />}</ShellPage>} />
          <Route path={ROUTES.AUDIT} element={<ShellPage pageId="audit">{(nav) => <PlaceholderPage title="Audit" icon={<ClipboardCheck className="h-6 w-6" />} onNavigate={nav} />}</ShellPage>} />
          <Route path={ROUTES.DOCUMENTS} element={<ShellPage pageId="documents">{(nav) => <PlaceholderPage title="Document Management" icon={<FileText className="h-6 w-6" />} onNavigate={nav} />}</ShellPage>} />

          <Route path={ROUTES.ANALYTICS} element={<ShellPage pageId="analytics">{(nav) => <PlaceholderPage title="Analytics" icon={<BarChart3 className="h-6 w-6" />} onNavigate={nav} />}</ShellPage>} />

          <Route path={ROUTES.NOTIFICATIONS} element={<ShellPage pageId="notifications">{(nav) => <NotificationCenter onNavigate={nav} />}</ShellPage>} />
          <Route path={ROUTES.PROFILE} element={<ShellPage pageId="profile">{(nav) => <Profile onNavigate={nav} />}</ShellPage>} />

          <Route element={<RequirePermission permission="admin:access" />}>
            <Route path={ROUTES.ADMIN} element={<ShellPage pageId="administration">{(nav) => <Administration onNavigate={nav} />}</ShellPage>} />
          </Route>
          <Route element={<RequirePermission permission="user:manage" />}>
            <Route path={ROUTES.ADMIN_USERS} element={<ShellPage pageId="user-management">{(nav) => <UserManagement onNavigate={nav} />}</ShellPage>} />
          </Route>
          <Route element={<RequirePermission permission="role:manage" />}>
            <Route path={ROUTES.ADMIN_ROLES} element={<ShellPage pageId="role-management">{(nav) => <RoleManagement onNavigate={nav} />}</ShellPage>} />
          </Route>
          {/* F-02 fix: Administration's Departments/Locations/Master Data cards used to navigate
              to page-ids with no entry in PATH_BY_ID, silently falling back to Dashboard (R-1).
              Real CRUD screens for these are a future phase — until then they point to the same
              Placeholder pattern already used for Procurement/Audit/Documents/Analytics. */}
          <Route element={<RequirePermission permission="masterdata:manage" />}>
            <Route path={ROUTES.ADMIN_DEPARTMENTS} element={<ShellPage pageId="departments">{(nav) => <PlaceholderPage title="Departments" icon={<Building2 className="h-6 w-6" />} onNavigate={nav} />}</ShellPage>} />
            <Route path={ROUTES.ADMIN_ASSET_LOCATIONS} element={<ShellPage pageId="locations">{(nav) => <PlaceholderPage title="Locations" icon={<MapPin className="h-6 w-6" />} onNavigate={nav} />}</ShellPage>} />
            <Route path={ROUTES.ADMIN_ASSET_CATEGORIES} element={<ShellPage pageId="master-data">{(nav) => <PlaceholderPage title="Master Data" icon={<Database className="h-6 w-6" />} onNavigate={nav} />}</ShellPage>} />
          </Route>
          <Route path={ROUTES.SETTINGS} element={<ShellPage pageId="settings">{(nav) => <SettingsPage onNavigate={nav} />}</ShellPage>} />
        </Route>

        <Route path="*" element={<NotFound onNavigate={navigate} />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
