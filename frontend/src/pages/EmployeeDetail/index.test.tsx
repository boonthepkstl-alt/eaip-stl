import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { EmployeeDetailPage } from './index';

describe('EmployeeDetailPage', () => {
  it('loads and displays a known employee by route param, with their assigned assets', async () => {
    renderWithProviders(<EmployeeDetailPage />, { route: '/employees/e1', path: '/employees/:employeeId' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sarah Chen' })).toBeInTheDocument();
    });
    // e1 (Sarah Chen) has AST-0001/AST-0002 assigned in the fixture — confirms
    // employeeService.getEmployeeAssignments actually reached assetService's data.
    await waitFor(() => {
      expect(screen.getByText('2 Devices')).toBeInTheDocument();
    });
  });

  it('shows a not-found state for an unknown employee id', async () => {
    renderWithProviders(<EmployeeDetailPage />, { route: '/employees/does-not-exist', path: '/employees/:employeeId' });

    await waitFor(() => {
      expect(screen.getByText('Employee not found')).toBeInTheDocument();
    });
  });
});
