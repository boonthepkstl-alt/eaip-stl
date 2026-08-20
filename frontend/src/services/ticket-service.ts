import { initialRequisitions, initialTechnicians, initialDelegationSettings } from '@/data/fixtures/requisitionData';
import { assetService } from '@/services/asset-service';
import { employeeService } from '@/services/employee-service';
import { MockTicketRepository, type TicketRepository } from '@/services/ticket-repository';
import type { ApprovalDecisionInput, CreateTicketInput, DispatchInput, StatusUpdateInput, Ticket, TicketListQuery } from '@/types/ticket';

const repository: TicketRepository = new MockTicketRepository(initialRequisitions, initialTechnicians);

const SLA_HOURS: Record<CreateTicketInput['priority'], number> = { Critical: 2, High: 8, Medium: 24, Low: 48 };

/**
 * The stable frontend contract for the IT Requisition & Maintenance vertical slice
 * (pages/Maintenance, pages/TicketDetail). Ticket is its own domain — this file depends on
 * assetService/employeeService one-way (to resolve requesterId/assetId into display
 * snapshots), and neither of those services imports anything from here. See
 * MAINTENANCE-MIGRATION.md "Cross-domain relationships".
 */
export const ticketService = {
  listTickets: (query: TicketListQuery = {}) => repository.list(query),
  getTicket: (ticketCode: string) => repository.getByCode(ticketCode),
  listTechnicians: () => repository.listTechnicians(),
  listDelegationSettings: async () => initialDelegationSettings,

  createTicket: async (input: CreateTicketInput): Promise<Ticket> => {
    const [requester, asset] = await Promise.all([employeeService.getEmployee(input.requesterId), assetService.getAsset(input.assetId)]);
    if (!requester) throw new Error(`Employee ${input.requesterId} not found`);
    if (!asset) throw new Error(`Asset ${input.assetId} not found`);

    const seq = (await repository.list({})).total + 1;
    const ticket: Ticket = {
      id: `req-${Date.now()}`,
      ticketCode: `ITR-2026-${seq.toString().padStart(3, '0')}`,
      category: input.category,
      priority: input.priority,
      slaTargetHours: SLA_HOURS[input.priority],
      title: input.title,
      description: input.description || 'User requested inspection and servicing.',
      location: input.location || asset.location,
      createdAt: 'Just now',
      status: 'PENDING_DEPT_APPROVAL',
      requester: {
        id: requester.id,
        name: requester.name,
        email: requester.email,
        jobTitle: requester.jobTitle,
        department: requester.department,
        initials: requester.initials,
        avatarColor: requester.avatarColor,
      },
      asset: {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        type: asset.type,
        serialNumber: asset.serialNumber,
        location: asset.location,
        isMyAssignedAsset: asset.assignedEmployeeId === requester.id,
        purchaseCost: asset.purchaseCost,
        currentValue: asset.currentValue,
      },
      departmentApproval: {
        status: 'Pending',
        approverName: requester.manager || 'Department Lead',
        approverTitle: 'Department Head',
        isDelegated: false,
      },
      itAssignment: {},
      itExecution: { currentStatus: 'Pending Dispatch' },
      timeline: [
        {
          id: `t-${Date.now()}`,
          stage: 'Creation',
          actorName: requester.name,
          actorRole: `Requester (${requester.jobTitle})`,
          timestamp: 'Just now',
          action: 'Requisition submitted and routed to department head for review.',
        },
      ],
    };
    return repository.create(ticket);
  },

  decideApproval: (id: string, input: ApprovalDecisionInput) => repository.decideApproval(id, input),

  dispatchTicket: async (id: string, input: DispatchInput) => {
    const technicians = await repository.listTechnicians();
    const tech = technicians.find((t) => t.id === input.technicianId) ?? technicians[0];
    return repository.dispatch(id, input, tech);
  },

  updateExecutionStatus: (id: string, input: StatusUpdateInput) => repository.updateExecutionStatus(id, input),

  changeAsset: async (id: string, assetId: string, requesterName: string) => {
    const asset = await assetService.getAsset(assetId);
    if (!asset) throw new Error(`Asset ${assetId} not found`);
    return repository.changeAsset(id, {
      id: asset.id,
      code: asset.code,
      name: asset.name,
      type: asset.type,
      serialNumber: asset.serialNumber,
      location: asset.location,
      isMyAssignedAsset: asset.assignedTo === requesterName,
      purchaseCost: asset.purchaseCost,
      currentValue: asset.currentValue,
    });
  },

  changeRequester: async (id: string, employeeId: string) => {
    const employee = await employeeService.getEmployee(employeeId);
    if (!employee) throw new Error(`Employee ${employeeId} not found`);
    return repository.changeRequester(
      id,
      { id: employee.id, name: employee.name, email: employee.email, jobTitle: employee.jobTitle, department: employee.department, initials: employee.initials, avatarColor: employee.avatarColor },
      employee.location
    );
  },
};
