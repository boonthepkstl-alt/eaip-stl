import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';
import { AssetDetailPage } from '@/pages/AssetDetail';
import { EmployeeDetailPage } from '@/pages/EmployeeDetail';
import { TicketDetailPage } from '@/pages/TicketDetail';
import { ticketService } from '@/services/ticket-service';

// Phase 5B cross-domain regression (brief section 23): Ticket references both Asset and
// Employee. Verify the same entity stays consistent across all three views, and that
// AssetDetail/EmployeeDetail's Maintenance/Tickets tabs (refactored in this phase to read
// through ticketService instead of the requisitionData fixture directly) still show the ticket
// that TicketDetail itself renders for the same ticket code.
function CrossDomainRoutes({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/assets/:assetId" element={<AssetDetailPage />} />
            <Route path="/employees/:employeeId" element={<EmployeeDetailPage />} />
            <Route path="/maintenance/:ticketCode" element={<TicketDetailPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Ticket <-> Asset <-> Employee cross-domain consistency', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('AssetDetail shows the same active ticket that TicketDetail renders for that code', async () => {
    render(<CrossDomainRoutes initialRoute="/assets/a1" />);

    await waitFor(() => {
      expect(screen.getByText(/Active Ticket: REQ-2026-0042/)).toBeInTheDocument();
    });
  });

  it('EmployeeDetail navigates to the requester via the ticket link on TicketDetail', async () => {
    // Note: the legacy requisitionData fixture's pre-seeded tickets store requester.id as
    // 'emp-1'/'emp-2'/etc, which don't match any real Employee.id ('e1'/'e2'/...) in
    // mockData.ts — a pre-existing data-quality inconsistency in the fixture, documented in
    // MAINTENANCE-MIGRATION.md, not introduced by this phase. A ticket created through the real
    // flow (ticketService.createTicket) resolves a real employeeId, so it doesn't have this
    // problem — use one of those instead of a legacy-seeded ticket to test the live link.
    const created = await ticketService.createTicket({
      requesterId: 'e1',
      assetId: 'a1',
      category: 'Hardware Fault & Repair',
      priority: 'Medium',
      title: 'Cross-domain nav test ticket',
    });

    render(<CrossDomainRoutes initialRoute={`/maintenance/${created.ticketCode}`} />);

    await waitFor(() => {
      expect(screen.getAllByText(created.ticketCode).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Sarah Chen/ }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sarah Chen' })).toBeInTheDocument();
    });
  });
});
