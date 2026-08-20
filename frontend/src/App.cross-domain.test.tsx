import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';
import { AssetDetailPage } from '@/pages/AssetDetail';
import { EmployeeDetailPage } from '@/pages/EmployeeDetail';

// Cross-domain regression (Phase 5A brief, section 23): Employee Management must not break
// Asset Management, and the two domains' one documented link — Asset.assignedTo/
// assignedEmployeeId — must stay navigable in both directions without either service
// depending on the other's fixtures directly.
function CrossDomainRoutes({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/assets/:assetId" element={<AssetDetailPage />} />
            <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Asset <-> Employee cross-domain navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('navigates from an Asset Detail page to the assigned employee', async () => {
    render(<CrossDomainRoutes initialRoute="/assets/a1" />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sarah Chen'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sarah Chen' })).toBeInTheDocument();
    });
  });

  it('navigates from an Employee Detail page to one of their assigned assets', async () => {
    render(<CrossDomainRoutes initialRoute="/employees/e1" />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16" M3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('MacBook Pro 16" M3'));

    await waitFor(() => {
      expect(screen.getByText('AST-0001 · C02XK1ABJGH')).toBeInTheDocument();
    });
  });
});
