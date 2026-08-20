import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { TicketDetailPage } from './index';

describe('TicketDetailPage', () => {
  it('loads and displays a known ticket by route param', async () => {
    renderWithProviders(<TicketDetailPage />, { route: '/maintenance/REQ-2026-0042', path: '/maintenance/:ticketCode' });

    // AppShell's breadcrumb also renders the ticket code, so this page legitimately shows it
    // twice — assert presence, not uniqueness (same pattern as EmployeesPage's title test).
    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-0042').length).toBeGreaterThan(0);
    });
  });

  it('shows a not-found state for an unknown ticket code', async () => {
    renderWithProviders(<TicketDetailPage />, { route: '/maintenance/DOES-NOT-EXIST', path: '/maintenance/:ticketCode' });

    await waitFor(() => {
      expect(screen.getByText('Ticket not found')).toBeInTheDocument();
    });
  });
});
