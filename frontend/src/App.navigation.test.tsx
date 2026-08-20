import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';
import { AssetsPage } from '@/pages/Assets';
import { EmployeesPage } from '@/pages/Employees';
import { MaintenancePage } from '@/pages/Maintenance';
import { LicensesPage } from '@/pages/Licenses';
import { AdministrationPage } from '@/pages/Administration';
import { SettingsPage } from '@/pages/Settings';
import { AiDecisionPage } from '@/pages/modules';
import NotFound from '@/pages/NotFound';

/**
 * Regression test for the bug reported after Phase 5A: clicking the "Employee Management"
 * sidebar link (rendered by AppShell from config/navigation.ts) landed on a 404 because the
 * nav item's `id` ('assignment') didn't match the route App.tsx actually registers
 * ('/employees'). Every prior test navigated by URL directly, so this class of bug went
 * undetected — this test drives navigation the way a real user does: clicking the sidebar,
 * not calling navigate('/employees') directly.
 */
function AppNavigationRoutes({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/licenses" element={<LicensesPage />} />
            <Route path="/administration" element={<AdministrationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/ai" element={<AiDecisionPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Sidebar navigation matches registered routes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clicking "Employee Management" in the sidebar reaches the Employees page, not a 404', async () => {
    render(<AppNavigationRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ assets/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Employee Management' }));

    await waitFor(() => {
      expect(screen.getByText('Total Personnel')).toBeInTheDocument();
    });
    expect(screen.queryByText('404 — Page not found')).not.toBeInTheDocument();
  });

  it('clicking "AI Decision Center" in the sidebar reaches its placeholder, not a 404', async () => {
    render(<AppNavigationRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ assets/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'AI Decision Center' }));

    await waitFor(() => {
      expect(screen.getByText(/AI Decision Center — foundation placeholder/)).toBeInTheDocument();
    });
    expect(screen.queryByText('404 — Page not found')).not.toBeInTheDocument();
  });

  it('clicking "IT Requisition & Maintenance" in the sidebar reaches the real Maintenance page, not a 404', async () => {
    render(<AppNavigationRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ assets/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'IT Requisition & Maintenance' }));

    await waitFor(() => {
      expect(screen.getByText(/\d+ tickets/)).toBeInTheDocument();
    });
    expect(screen.queryByText('404 — Page not found')).not.toBeInTheDocument();
  });

  it('clicking "Software License" in the sidebar reaches the real Licenses page, not a 404', async () => {
    render(<AppNavigationRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ assets/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Software License' }));

    await waitFor(() => {
      expect(screen.getByText('Microsoft 365 Enterprise')).toBeInTheDocument();
    });
    expect(screen.queryByText('404 — Page not found')).not.toBeInTheDocument();
  });

  it('clicking "Administration" in the sidebar reaches the real Administration page, not a 404', async () => {
    render(<AppNavigationRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ assets/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Administration' }));

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
    expect(screen.queryByText('404 — Page not found')).not.toBeInTheDocument();
  });

  it('clicking "System Settings" in the sidebar reaches the real Settings page, not a 404', async () => {
    render(<AppNavigationRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ assets/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'System Settings' }));

    await waitFor(() => {
      expect(screen.getByText('General Settings')).toBeInTheDocument();
    });
    expect(screen.queryByText('404 — Page not found')).not.toBeInTheDocument();
  });

  it('nav item ids for scaffolded pages exactly match the route path segment App.tsx registers', async () => {
    // Cheap static guard against the same class of bug recurring: config/navigation.ts ids are
    // used directly as route paths via AppShell's onNavigate={(id) => navigate(`/${id}`)}, so an
    // id that doesn't match its ROUTES.* constant is a silent 404 waiting to happen. Un-scaffolded
    // nav items (inventory, procurement, audit, documents, approvals, reports, analytics,
    // notifications, administration, settings) aren't checked here — they're expected to 404
    // until their own migration phase; that's not this bug.
    const { navGroups } = await import('@/config/navigation');
    const idsByLabel = new Map(navGroups.flatMap((g) => g.items).map((i) => [i.label, i.id]));

    expect(idsByLabel.get('Dashboard')).toBe('dashboard');
    expect(idsByLabel.get('AI Decision Center')).toBe('ai');
    expect(idsByLabel.get('Asset Management')).toBe('assets');
    expect(idsByLabel.get('Employee Management')).toBe('employees');
    expect(idsByLabel.get('IT Requisition & Maintenance')).toBe('maintenance');
    expect(idsByLabel.get('Software License')).toBe('licenses');
    expect(idsByLabel.get('Oracle FA Reconcile')).toBe('reconciliation');
    expect(idsByLabel.get('Administration')).toBe('administration');
    expect(idsByLabel.get('System Settings')).toBe('settings');
  });
});
