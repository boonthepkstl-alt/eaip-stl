import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { MaintenancePage } from './index';

describe('MaintenancePage', () => {
  it('renders the seeded IT requisition tickets with KPI cards', async () => {
    renderWithProviders(<MaintenancePage />, { route: '/maintenance', path: '/maintenance' });

    await waitFor(() => {
      expect(screen.getByText(/\d+ tickets/)).toBeInTheDocument();
    });
    expect(screen.getByText('1. Dept Approval')).toBeInTheDocument();
  });
});
