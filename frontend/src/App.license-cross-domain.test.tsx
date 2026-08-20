import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';
import { AssetDetailPage } from '@/pages/AssetDetail';
import { EmployeeDetailPage } from '@/pages/EmployeeDetail';
import { LicenseDetailPage } from '@/pages/LicenseDetail';

// Phase 5C cross-domain regression (section 22/23 of the phase brief): License references both
// Employee (via allocated seats) and Asset (via installed asset bindings). Verify navigation
// works in both directions for each pair, following the same pattern established in
// App.ticket-cross-domain.test.tsx for the Ticket <-> Asset <-> Employee triangle.
function CrossDomainRoutes({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/assets/:assetId" element={<AssetDetailPage />} />
            <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
            <Route path="/licenses/:licenseId" element={<LicenseDetailPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('License <-> Employee <-> Asset cross-domain navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('License -> Employee: clicking an allocated seat on LicenseDetail reaches that employee', async () => {
    render(<CrossDomainRoutes initialRoute="/licenses/l1" />);

    await waitFor(() => {
      expect(screen.getAllByText('Microsoft 365 Enterprise').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Allocated Seats/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sarah Chen' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sarah Chen' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sarah Chen' })).toBeInTheDocument();
    });
  });

  it('License -> Asset: clicking an installed asset on LicenseDetail reaches that asset', async () => {
    render(<CrossDomainRoutes initialRoute="/licenses/l1" />);

    await waitFor(() => {
      expect(screen.getAllByText('Microsoft 365 Enterprise').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Installed Assets/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /MacBook Pro 16" M3/ })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /MacBook Pro 16" M3/ }));

    await waitFor(() => {
      expect(screen.getAllByText(/AST-0001/).length).toBeGreaterThan(0);
    });
  });

  it('Employee -> License: clicking a licensed seat row on EmployeeDetail reaches that license', async () => {
    render(<CrossDomainRoutes initialRoute="/employees/e1" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sarah Chen' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Software & SaaS/ }));

    await waitFor(() => {
      expect(screen.getByText('Microsoft 365 Enterprise')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Microsoft 365 Enterprise'));

    await waitFor(() => {
      expect(screen.getAllByText('Microsoft 365 Enterprise').length).toBeGreaterThan(0);
      expect(screen.getByText('Allocated Seats')).toBeInTheDocument();
    });
  });

  it('Asset -> License: clicking a bound license on AssetDetail reaches that license', async () => {
    render(<CrossDomainRoutes initialRoute="/assets/a1" />);

    await waitFor(() => {
      expect(screen.getAllByText(/AST-0001/).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'License' }));

    await waitFor(() => {
      expect(screen.getByText('Microsoft 365 Enterprise')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Microsoft 365 Enterprise'));

    await waitFor(() => {
      expect(screen.getAllByText('Microsoft 365 Enterprise').length).toBeGreaterThan(0);
      expect(screen.getByText('Allocated Seats')).toBeInTheDocument();
    });
  });
});
