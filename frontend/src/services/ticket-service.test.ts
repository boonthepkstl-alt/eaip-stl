import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshTicketService() {
  vi.resetModules();
  const mod = await import('@/services/ticket-service');
  return mod.ticketService;
}

describe('ticketService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('listTickets returns the seeded fixture tickets', async () => {
    const ticketService = await freshTicketService();
    const result = await ticketService.listTickets({});
    expect(result.total).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.total);
  });

  it('listTickets filters by status', async () => {
    const ticketService = await freshTicketService();
    const result = await ticketService.listTickets({ status: 'IN_PROGRESS' });
    expect(result.data.every((t) => t.status === 'IN_PROGRESS')).toBe(true);
  });

  it('getTicket returns null for an unknown code', async () => {
    const ticketService = await freshTicketService();
    const result = await ticketService.getTicket('DOES-NOT-EXIST');
    expect(result).toBeNull();
  });

  it('createTicket resolves requesterId/assetId into a real requester/asset snapshot (one-way Employee/Asset dependency)', async () => {
    const ticketService = await freshTicketService();
    const before = await ticketService.listTickets({});
    const created = await ticketService.createTicket({
      requesterId: 'e1',
      assetId: 'a1',
      category: 'Hardware Fault & Repair',
      priority: 'High',
      title: 'Test ticket',
    });
    const after = await ticketService.listTickets({});
    expect(after.total).toBe(before.total + 1);
    expect(created.requester.name).toBe('Sarah Chen'); // e1 in the fixture
    expect(created.asset.code).toBe('AST-0001'); // a1 in the fixture
    expect(created.status).toBe('PENDING_DEPT_APPROVAL');
    expect(created.ticketCode).toMatch(/^ITR-2026-/);
  });

  it('createTicket rejects an unknown requester or asset id', async () => {
    const ticketService = await freshTicketService();
    await expect(ticketService.createTicket({ requesterId: 'nope', assetId: 'a1', category: 'Hardware Fault & Repair', priority: 'Low', title: 'x' })).rejects.toThrow();
    await expect(ticketService.createTicket({ requesterId: 'e1', assetId: 'nope', category: 'Hardware Fault & Repair', priority: 'Low', title: 'x' })).rejects.toThrow();
  });

  it('decideApproval transitions a pending ticket to IT dispatch on Approve', async () => {
    const ticketService = await freshTicketService();
    const pending = (await ticketService.listTickets({ status: 'PENDING_DEPT_APPROVAL' })).data[0];
    expect(pending).toBeDefined();

    const updated = await ticketService.decideApproval(pending.id, { decision: 'Approve', comments: 'Looks good' });
    expect(updated.status).toBe('PENDING_IT_DISPATCH');
    expect(updated.departmentApproval.status).toBe('Approved');
  });

  it('dispatchTicket assigns a technician and moves the ticket to IN_PROGRESS', async () => {
    const ticketService = await freshTicketService();
    const dispatchable = (await ticketService.listTickets({ status: 'PENDING_IT_DISPATCH' })).data[0];
    expect(dispatchable).toBeDefined();

    const technicians = await ticketService.listTechnicians();
    expect(technicians.length).toBeGreaterThan(0);

    const updated = await ticketService.dispatchTicket(dispatchable.id, { technicianId: technicians[0].id, estimatedCost: 200 });
    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.itAssignment.technicianId).toBe(technicians[0].id);
  });

  it('updateExecutionStatus marks a ticket DONE with resolution notes', async () => {
    const ticketService = await freshTicketService();
    const active = (await ticketService.listTickets({ status: 'IN_PROGRESS' })).data[0];
    expect(active).toBeDefined();

    const updated = await ticketService.updateExecutionStatus(active.id, { status: 'Done', resolutionNotes: 'Fixed it' });
    expect(updated.status).toBe('DONE');
    expect(updated.itExecution.resolutionNotes).toBe('Fixed it');
  });
});
