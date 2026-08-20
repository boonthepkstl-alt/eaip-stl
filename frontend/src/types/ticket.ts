// Ticket domain types (Phase 5B). Re-exports the fixture's types instead of redefining this
// large nested shape — `ITRequisitionTicket` already IS the Ticket domain model (see
// MAINTENANCE-MIGRATION.md section 3: Maintenance.tsx and TicketDetail.tsx both operate on the
// exact same entity through its status lifecycle; "IT Requisition" and "Maintenance" are two
// views/perspectives of one Ticket, not two domains).
export type {
  ITRequisitionTicket as Ticket,
  RequisitionStatus as TicketStatus,
  PriorityLevel as TicketPriority,
  TicketCategory,
  TimelineEvent,
  ITTechnician,
  DelegatedApproverSetting,
} from '@/data/fixtures/requisitionData';

import type { PriorityLevel, RequisitionStatus, TicketCategory } from '@/data/fixtures/requisitionData';

// `requesterId`/`assetId` are references, not embedded objects — ticketService resolves them
// against employeeService/assetService when building/updating the ticket's snapshot fields
// (Ticket.requester / Ticket.asset). See services/ticket-service.ts.
export interface CreateTicketInput {
  requesterId: string;
  assetId: string;
  category: TicketCategory;
  priority: PriorityLevel;
  title: string;
  description?: string;
  location?: string;
}

export interface ApprovalDecisionInput {
  decision: 'Approve' | 'Reject';
  approverName?: string;
  isDelegated?: boolean;
  delegatedBy?: string;
  comments?: string;
}

export interface DispatchInput {
  technicianId: string;
  estimatedCost?: number;
  targetResolutionDate?: string;
  notes?: string;
}

export type ExecutionStatus = 'Planning' | 'In-Progress' | 'On-Hold' | 'Done';

export interface StatusUpdateInput {
  status: ExecutionStatus;
  holdCategory?: 'Waiting for Spare Parts' | 'Awaiting User Response' | 'Vendor Escalation' | 'Scheduled Maintenance Window';
  holdReason?: string;
  diagnosticNotes?: string;
  resolutionNotes?: string;
  actualCost?: number;
  downtimeHours?: number;
  partsUsed?: string[];
}

export interface TicketListQuery {
  search?: string;
  status?: RequisitionStatus | 'ALL' | 'ACTIVE';
  priority?: PriorityLevel | 'ALL';
  category?: TicketCategory | 'ALL';
  department?: string | 'ALL';
  requesterName?: string; // "USER" perspective filter in the legacy page
}
