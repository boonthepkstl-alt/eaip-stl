import type { Ticket, TicketListQuery, ApprovalDecisionInput, DispatchInput, StatusUpdateInput } from '@/types/ticket';
import type { ITTechnician, TimelineEvent } from '@/data/fixtures/requisitionData';

/**
 * Contract ticketService depends on. MockTicketRepository is the only implementation in
 * Phase 5B — swap it for an HttpTicketRepository backed by GET/POST /api/v1/tickets (see
 * MAINTENANCE-API-CONTRACT.md) once the Go backend lands, same pattern as
 * AssetRepository/EmployeeRepository.
 */
export interface TicketRepository {
  list(query: TicketListQuery): Promise<{ data: Ticket[]; total: number }>;
  getByCode(ticketCode: string): Promise<Ticket | null>;
  create(ticket: Ticket): Promise<Ticket>;
  decideApproval(id: string, input: ApprovalDecisionInput): Promise<Ticket>;
  dispatch(id: string, input: DispatchInput, tech: ITTechnician): Promise<Ticket>;
  updateExecutionStatus(id: string, input: StatusUpdateInput): Promise<Ticket>;
  changeAsset(id: string, asset: Ticket['asset']): Promise<Ticket>;
  changeRequester(id: string, requester: Ticket['requester'], location?: string): Promise<Ticket>;
  listTechnicians(): Promise<ITTechnician[]>;
}

function simulateNetwork<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

function appendTimeline(ticket: Ticket, event: TimelineEvent): Ticket {
  return { ...ticket, timeline: [...ticket.timeline, event] };
}

/** Backed by the legacy ESAPS fixture data (data/fixtures/requisitionData.ts). */
export class MockTicketRepository implements TicketRepository {
  private tickets: Ticket[];
  private technicians: ITTechnician[];

  constructor(seedTickets: Ticket[], seedTechnicians: ITTechnician[]) {
    this.tickets = [...seedTickets];
    this.technicians = [...seedTechnicians];
  }

  async list(query: TicketListQuery): Promise<{ data: Ticket[]; total: number }> {
    const search = (query.search ?? '').toLowerCase().trim();
    const filtered = this.tickets.filter((t) => {
      if (query.status && query.status !== 'ALL') {
        if (query.status === 'ACTIVE') {
          if (!['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status)) return false;
        } else if (t.status !== query.status) {
          return false;
        }
      }
      if (query.priority && query.priority !== 'ALL' && t.priority !== query.priority) return false;
      if (query.category && query.category !== 'ALL' && t.category !== query.category) return false;
      if (query.department && query.department !== 'ALL' && t.requester.department !== query.department) return false;
      if (query.requesterName && t.requester.name !== query.requesterName) return false;
      if (search) {
        const matches =
          t.title.toLowerCase().includes(search) ||
          t.ticketCode.toLowerCase().includes(search) ||
          t.asset.name.toLowerCase().includes(search) ||
          t.asset.code.toLowerCase().includes(search) ||
          t.requester.name.toLowerCase().includes(search) ||
          (t.itAssignment.technicianName?.toLowerCase().includes(search) ?? false);
        if (!matches) return false;
      }
      return true;
    });
    return simulateNetwork({ data: filtered, total: filtered.length });
  }

  async getByCode(ticketCode: string): Promise<Ticket | null> {
    return simulateNetwork(this.tickets.find((t) => t.ticketCode === ticketCode || t.id === ticketCode) ?? null);
  }

  async create(ticket: Ticket): Promise<Ticket> {
    this.tickets = [ticket, ...this.tickets];
    return simulateNetwork(ticket);
  }

  private update(id: string, updater: (t: Ticket) => Ticket): Ticket {
    const existing = this.tickets.find((t) => t.id === id);
    if (!existing) throw new Error(`Ticket ${id} not found`);
    const updated = updater(existing);
    this.tickets = this.tickets.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async decideApproval(id: string, input: ApprovalDecisionInput): Promise<Ticket> {
    const isApproved = input.decision === 'Approve';
    const updated = this.update(id, (t) =>
      appendTimeline(
        {
          ...t,
          status: isApproved ? 'PENDING_IT_DISPATCH' : 'REJECTED_BY_DEPT',
          departmentApproval: {
            ...t.departmentApproval,
            status: isApproved ? 'Approved' : 'Rejected',
            approverName: input.approverName ?? t.departmentApproval.approverName,
            isDelegated: input.isDelegated ?? t.departmentApproval.isDelegated,
            delegatedBy: input.delegatedBy ?? t.departmentApproval.delegatedBy,
            approvedAt: 'Just now',
            comments: input.comments || (isApproved ? 'Approved.' : 'Rejected.'),
          },
        },
        {
          id: `tl-${Date.now()}`,
          stage: 'Dept Approval',
          actorName: input.approverName ?? t.departmentApproval.approverName,
          actorRole: input.isDelegated ? 'Delegated Acting Approver' : 'Department Head',
          timestamp: 'Just now',
          action: isApproved ? 'Department Head Sign-off Approved' : 'Department Head Sign-off Rejected',
          notes: input.comments,
        }
      )
    );
    return simulateNetwork(updated);
  }

  async dispatch(id: string, input: DispatchInput, tech: ITTechnician): Promise<Ticket> {
    const updated = this.update(id, (t) =>
      appendTimeline(
        {
          ...t,
          status: 'IN_PROGRESS',
          itAssignment: {
            ...t.itAssignment,
            assignedAt: 'Just now',
            technicianId: tech.id,
            technicianName: tech.name,
            technicianRole: tech.role || tech.specialty,
            technicianAvatar: tech.avatarColor,
            estimatedCost: input.estimatedCost,
            targetResolutionDate: input.targetResolutionDate,
          },
          itExecution: { ...t.itExecution, currentStatus: 'In-Progress', diagnosticNotes: input.notes ?? t.itExecution.diagnosticNotes },
        },
        {
          id: `tl-${Date.now()}`,
          stage: 'IT Assignment',
          actorName: tech.name,
          actorRole: tech.role || tech.specialty,
          timestamp: 'Just now',
          action: `Assigned to ${tech.name} (${tech.role || tech.specialty})`,
          notes: input.notes,
        }
      )
    );
    return simulateNetwork(updated);
  }

  async updateExecutionStatus(id: string, input: StatusUpdateInput): Promise<Ticket> {
    const statusMap: Record<StatusUpdateInput['status'], Ticket['status']> = {
      Planning: 'PLANNING',
      'In-Progress': 'IN_PROGRESS',
      'On-Hold': 'ON_HOLD',
      Done: 'DONE',
    };
    const nextStatus = statusMap[input.status];
    const updated = this.update(id, (t) =>
      appendTimeline(
        {
          ...t,
          status: nextStatus,
          itExecution: {
            ...t.itExecution,
            currentStatus: input.status,
            holdCategory: nextStatus === 'ON_HOLD' ? input.holdCategory : t.itExecution.holdCategory,
            holdReason: nextStatus === 'ON_HOLD' ? input.holdReason : t.itExecution.holdReason,
            diagnosticNotes: input.diagnosticNotes ?? t.itExecution.diagnosticNotes,
            resolutionNotes: nextStatus === 'DONE' ? input.resolutionNotes ?? t.itExecution.resolutionNotes : t.itExecution.resolutionNotes,
            actualCost: nextStatus === 'DONE' ? input.actualCost ?? t.itExecution.actualCost : t.itExecution.actualCost,
            downtimeHours: nextStatus === 'DONE' ? input.downtimeHours ?? t.itExecution.downtimeHours : t.itExecution.downtimeHours,
            partsUsed: nextStatus === 'DONE' ? input.partsUsed ?? t.itExecution.partsUsed : t.itExecution.partsUsed,
            completedAt: nextStatus === 'DONE' ? 'Just now' : t.itExecution.completedAt,
          },
        },
        {
          id: `tl-${Date.now()}`,
          stage: nextStatus === 'DONE' ? 'Resolution' : nextStatus === 'ON_HOLD' ? 'On-Hold' : 'In-Progress',
          actorName: t.itAssignment.technicianName || 'Unassigned Technician',
          actorRole: t.itAssignment.technicianRole || 'Assigned Technician',
          timestamp: 'Just now',
          action: `Status updated to ${input.status}`,
          notes: nextStatus === 'ON_HOLD' ? `Hold: ${input.holdCategory} — ${input.holdReason}` : nextStatus === 'DONE' ? input.resolutionNotes : input.diagnosticNotes,
        }
      )
    );
    return simulateNetwork(updated);
  }

  async changeAsset(id: string, asset: Ticket['asset']): Promise<Ticket> {
    const updated = this.update(id, (t) =>
      appendTimeline(
        { ...t, asset },
        { id: `tl-${Date.now()}`, stage: 'Creation', actorName: t.requester.name, actorRole: 'Requester', timestamp: 'Just now', action: `Affected Asset changed to ${asset.name} (${asset.code})` }
      )
    );
    return simulateNetwork(updated);
  }

  async changeRequester(id: string, requester: Ticket['requester'], location?: string): Promise<Ticket> {
    const updated = this.update(id, (t) =>
      appendTimeline(
        { ...t, requester, location: location ?? t.location },
        { id: `tl-${Date.now()}`, stage: 'Creation', actorName: 'Administrator', actorRole: 'System Admin', timestamp: 'Just now', action: `Requester re-assigned to ${requester.name} (${requester.department})` }
      )
    );
    return simulateNetwork(updated);
  }

  async listTechnicians(): Promise<ITTechnician[]> {
    return simulateNetwork(this.technicians);
  }
}
