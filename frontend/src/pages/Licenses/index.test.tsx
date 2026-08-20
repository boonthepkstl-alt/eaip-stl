import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { LicensesPage } from './index';

describe('LicensesPage', () => {
  it('renders the seeded software licenses with KPI cards', async () => {
    renderWithProviders(<LicensesPage />, { route: '/licenses', path: '/licenses' });

    await waitFor(() => {
      expect(screen.getByText('Microsoft 365 Enterprise')).toBeInTheDocument();
    });
    expect(screen.getByText('Total Annual Spend')).toBeInTheDocument();
  });
});
