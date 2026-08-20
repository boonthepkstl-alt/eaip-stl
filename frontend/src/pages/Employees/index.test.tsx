import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { EmployeesPage } from './index';

describe('EmployeesPage', () => {
  it('renders the seeded employee roster with KPI cards', async () => {
    renderWithProviders(<EmployeesPage />, { route: '/employees', path: '/employees' });

    await waitFor(() => {
      expect(screen.getByText('Total Personnel')).toBeInTheDocument();
    });
    // AppShell's own header title also reads "Employee Management" (from pageTitles), so this
    // page legitimately renders it twice — assert presence, not uniqueness.
    expect(screen.getAllByText('Employee Management').length).toBeGreaterThan(0);
  });

  it('renders a known employee by name from the shared fixture', async () => {
    renderWithProviders(<EmployeesPage />, { route: '/employees', path: '/employees' });

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });
  });
});
