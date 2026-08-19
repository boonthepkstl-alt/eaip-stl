import { Laptop, Monitor, Printer, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { Asset } from '@/types/asset';
import type { Employee } from '@/types/organization';

// MOCKUP ONLY — shared by pages/CheckInCheckOut.tsx (the IT Requisition & Maintenance list/
// kanban mockup) and pages/TicketDetail.tsx (its ticket detail mockup page), ported from
// esaps_ai_gemini-main/src/pages/Maintenance.tsx + TicketDetail.tsx. No backend/service/data
// model exists for any of this — see pages/CheckInCheckOut.tsx's header comment for the full
// scope-decision history. Ticket state itself stays LOCAL to whichever page mounted it (each
// page re-seeds from real asset/employee data on mount) — there is no shared store, so actions
// taken on the list page are not visible if you then open the same ticket's detail page, and
// vice versa. That is an accepted limitation of a non-persistent mockup, not a bug.

export type TicketCategory =
  | 'Hardware Fault & Repair'
  | 'Equipment Replacement'
  | 'Software & OS Issue'
  | 'Network & Wi-Fi'
  | 'Peripherals & Accessories'
  | 'Account & Access'
  | 'Preventive Maintenance';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type RequisitionStatus =
  | 'PENDING_DEPT_APPROVAL'
  | 'PENDING_IT_DISPATCH'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'DONE'
  | 'REJECTED_BY_DEPT';

export interface TimelineEvent {
  id: string;
  stage: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  action: string;
  notes?: string;
  badge?: string;
}

export interface ITRequisitionTicket {
  id: string;
  ticketCode: string;
  category: TicketCategory;
  priority: PriorityLevel;
  slaTargetHours: number;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  status: RequisitionStatus;
  requester: { id: string; name: string; department: string; jobTitle: string; email: string; initials: string; avatarColor: string };
  asset: { id: string; code: string; name: string };
  departmentApproval: {
    status: 'Pending' | 'Approved' | 'Rejected';
    approverName: string;
    approverTitle?: string;
    isDelegated?: boolean;
    delegatedBy?: string;
    approvedAt?: string;
    comments?: string;
  };
  itAssignment: {
    technicianId?: string;
    technicianName?: string;
    technicianRole?: string;
    assignedBy?: string;
    assignedAt?: string;
    estimatedCost?: number;
    targetResolutionDate?: string;
  };
  itExecution: {
    currentStatus: string;
    diagnosticNotes?: string;
    holdCategory?: string;
    holdReason?: string;
    resolutionNotes?: string;
    completedAt?: string;
    downtimeHours?: number;
    partsUsed?: string[];
  };
  timeline: TimelineEvent[];
}

export const CATEGORY_OPTIONS: { label: string; value: TicketCategory; icon: string }[] = [
  { label: 'Hardware Fault & Repair', value: 'Hardware Fault & Repair', icon: '💻' },
  { label: 'Equipment Replacement / Upgrade', value: 'Equipment Replacement', icon: '🔄' },
  { label: 'Software & OS Issue', value: 'Software & OS Issue', icon: '🖥️' },
  { label: 'Network & Wi-Fi', value: 'Network & Wi-Fi', icon: '📡' },
  { label: 'Peripherals & Accessories', value: 'Peripherals & Accessories', icon: '⌨️' },
  { label: 'Account & Access', value: 'Account & Access', icon: '🔑' },
  { label: 'Preventive Maintenance', value: 'Preventive Maintenance', icon: '🛠️' },
];

export const PRIORITY_CONFIG: Record<PriorityLevel, { variant: 'error' | 'warning' | 'accent' | 'default'; sla: string; hours: number }> = {
  Critical: { variant: 'error', sla: '2 Hours SLA', hours: 2 },
  High: { variant: 'warning', sla: '8 Hours SLA', hours: 8 },
  Medium: { variant: 'accent', sla: '24 Hours SLA', hours: 24 },
  Low: { variant: 'default', sla: '48 Hours SLA', hours: 48 },
};

export const HOLD_CATEGORY_OPTIONS = [
  'Waiting for Spare Parts',
  'Awaiting User Response',
  'Vendor Escalation',
  'Scheduled Maintenance Window',
];

export const TECHNICIANS = [
  { id: 'tech-1', name: 'Somchai Prasert', specialty: 'Hardware & Peripherals' },
  { id: 'tech-2', name: 'Napat Wongsuwan', specialty: 'Network & Infrastructure' },
  { id: 'tech-3', name: 'Kanokwan Srisai', specialty: 'Software & OS' },
];

export function getStatusBadge(status: RequisitionStatus) {
  switch (status) {
    case 'PENDING_DEPT_APPROVAL': return <Badge variant="warning" dot>1. Dept Approval</Badge>;
    case 'PENDING_IT_DISPATCH': return <Badge variant="brand" dot>2. IT Dispatch</Badge>;
    case 'PLANNING': return <Badge variant="accent" dot>3. Planning</Badge>;
    case 'IN_PROGRESS': return <Badge variant="warning" dot>3. In-Progress</Badge>;
    case 'ON_HOLD': return <Badge variant="error" dot>3. On-Hold</Badge>;
    case 'DONE': return <Badge variant="success" dot>4. Resolved</Badge>;
    case 'REJECTED_BY_DEPT': return <Badge variant="error" dot>Rejected</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
}

export function getAssetIcon(categoryLabel: string) {
  const lower = categoryLabel.toLowerCase();
  if (lower.includes('notebook') || lower.includes('laptop')) return <Laptop className="h-4 w-4 text-brand-600" />;
  if (lower.includes('monitor')) return <Monitor className="h-4 w-4 text-blue-600" />;
  if (lower.includes('printer')) return <Printer className="h-4 w-4 text-surface-600" />;
  return <Wrench className="h-4 w-4 text-brand-600" />;
}

function pick<T>(arr: T[], index: number): T {
  return arr[Math.min(index, arr.length - 1)];
}

function requesterOf(e: Employee, id: string): ITRequisitionTicket['requester'] {
  return { id, name: e.name, department: e.department, jobTitle: e.positionTitle ?? '—', email: `${e.name.toLowerCase().replace(/\s+/g, '.')}@raise.local`, initials: e.name.slice(0, 2).toUpperCase(), avatarColor: 'bg-indigo-600' };
}

/** MOCKUP ONLY — builds a fixed set of 5 seed tickets referencing real asset/employee records
 * so links like "View Asset Profile" resolve to real, existing Asset Detail pages. Re-run on
 * every mount by whichever page needs it (see file header comment on why this isn't shared
 * live state). */
export function buildSeedTickets(assets: Asset[], employees: Employee[]): ITRequisitionTicket[] {
  if (!assets.length || !employees.length) return [];
  const a = assets;
  const e = employees;

  return [
    {
      id: 'req-seed-1', ticketCode: 'ITR-2026-001', category: 'Hardware Fault & Repair', priority: 'Critical', slaTargetHours: PRIORITY_CONFIG.Critical.hours,
      title: 'Laptop screen flickering and battery draining rapidly', description: 'Screen flickers intermittently under load; battery drops from 100% to 20% within an hour.',
      location: a[0].assetTag, createdAt: '2 hours ago', status: 'PENDING_DEPT_APPROVAL',
      requester: requesterOf(e[0], 'req-emp-0'),
      asset: { id: a[0].id, code: a[0].assetTag, name: a[0].name },
      departmentApproval: { status: 'Pending', approverName: pick(e, 1).name, approverTitle: pick(e, 1).positionTitle ?? '—' },
      itAssignment: {}, itExecution: { currentStatus: 'Pending Dept Approval' },
      timeline: [
        { id: 'tl-1', stage: 'Creation', actorName: e[0].name, actorRole: 'Requester', timestamp: '2 hours ago', action: 'Requisition submitted and routed to department head for review.' },
      ],
    },
    {
      id: 'req-seed-2', ticketCode: 'ITR-2026-002', category: 'Network & Wi-Fi', priority: 'High', slaTargetHours: PRIORITY_CONFIG.High.hours,
      title: 'Cannot connect to office Wi-Fi from meeting room B', description: 'Device repeatedly disconnects from the corporate SSID every few minutes.',
      location: pick(a, 1).assetTag, createdAt: '1 day ago', status: 'PENDING_IT_DISPATCH',
      requester: requesterOf(pick(e, 1), 'req-emp-1'),
      asset: { id: pick(a, 1).id, code: pick(a, 1).assetTag, name: pick(a, 1).name },
      departmentApproval: { status: 'Approved', approverName: e[0].name, approvedAt: 'Yesterday', comments: 'Approved — please expedite.' },
      itAssignment: {}, itExecution: { currentStatus: 'Pending Dispatch' },
      timeline: [
        { id: 'tl-1', stage: 'Creation', actorName: pick(e, 1).name, actorRole: 'Requester', timestamp: '1 day ago', action: 'Requisition submitted and routed to department head for review.' },
        { id: 'tl-2', stage: 'Dept Approval', actorName: e[0].name, actorRole: 'Department Head', timestamp: 'Yesterday', action: 'Department Head Sign-off Approved', notes: 'Approved — please expedite.' },
      ],
    },
    {
      id: 'req-seed-3', ticketCode: 'ITR-2026-003', category: 'Software & OS Issue', priority: 'Medium', slaTargetHours: PRIORITY_CONFIG.Medium.hours,
      title: 'OS update stuck at 40% for over an hour', description: 'Windows update has been stuck on the same screen since this morning.',
      location: pick(a, 2).assetTag, createdAt: '3 days ago', status: 'IN_PROGRESS',
      requester: requesterOf(pick(e, 2), 'req-emp-2'),
      asset: { id: pick(a, 2).id, code: pick(a, 2).assetTag, name: pick(a, 2).name },
      departmentApproval: { status: 'Approved', approverName: e[0].name, approvedAt: '3 days ago' },
      itAssignment: { technicianId: 'tech-3', technicianName: 'Kanokwan Srisai', technicianRole: 'Software & OS', assignedBy: 'IT Operations Lead', assignedAt: '2 days ago' },
      itExecution: { currentStatus: 'In-Progress', diagnosticNotes: 'Ran Windows Update troubleshooter; re-attempting update in Safe Mode.' },
      timeline: [
        { id: 'tl-1', stage: 'Creation', actorName: pick(e, 2).name, actorRole: 'Requester', timestamp: '3 days ago', action: 'Requisition submitted and routed to department head for review.' },
        { id: 'tl-2', stage: 'Dept Approval', actorName: e[0].name, actorRole: 'Department Head', timestamp: '3 days ago', action: 'Department Head Sign-off Approved' },
        { id: 'tl-3', stage: 'IT Assignment', actorName: 'IT Operations Lead', actorRole: 'IT Operations Lead', timestamp: '2 days ago', action: 'Assigned to Kanokwan Srisai (Software & OS)' },
      ],
    },
    {
      id: 'req-seed-4', ticketCode: 'ITR-2026-004', category: 'Hardware Fault & Repair', priority: 'Low', slaTargetHours: PRIORITY_CONFIG.Low.hours,
      title: 'Keyboard missing two keycaps', description: 'Spacebar and Enter keycaps came off; keys still register when pressed.',
      location: a[0].assetTag, createdAt: '5 days ago', status: 'ON_HOLD',
      requester: requesterOf(e[0], 'req-emp-0'),
      asset: { id: a[0].id, code: a[0].assetTag, name: a[0].name },
      departmentApproval: { status: 'Approved', approverName: pick(e, 1).name, approvedAt: '5 days ago' },
      itAssignment: { technicianId: 'tech-1', technicianName: 'Somchai Prasert', technicianRole: 'Hardware & Peripherals', assignedBy: 'IT Operations Lead', assignedAt: '4 days ago' },
      itExecution: { currentStatus: 'On-Hold', holdCategory: 'Waiting for Spare Parts', holdReason: 'Waiting for replacement keycap set from vendor.', diagnosticNotes: 'Confirmed missing keycaps; key switches intact and functional.' },
      timeline: [
        { id: 'tl-1', stage: 'Creation', actorName: e[0].name, actorRole: 'Requester', timestamp: '5 days ago', action: 'Requisition submitted and routed to department head for review.' },
        { id: 'tl-2', stage: 'Dept Approval', actorName: pick(e, 1).name, actorRole: 'Department Head', timestamp: '5 days ago', action: 'Department Head Sign-off Approved' },
        { id: 'tl-3', stage: 'IT Assignment', actorName: 'IT Operations Lead', actorRole: 'IT Operations Lead', timestamp: '4 days ago', action: 'Assigned to Somchai Prasert (Hardware & Peripherals)' },
        { id: 'tl-4', stage: 'On-Hold', actorName: 'Somchai Prasert', actorRole: 'Hardware & Peripherals', timestamp: '2 days ago', action: 'Status updated to On-Hold', notes: 'Waiting for Spare Parts - Waiting for replacement keycap set from vendor.' },
      ],
    },
    {
      id: 'req-seed-5', ticketCode: 'ITR-2026-005', category: 'Preventive Maintenance', priority: 'Low', slaTargetHours: PRIORITY_CONFIG.Low.hours,
      title: 'Quarterly dust cleaning and thermal paste check', description: 'Routine preventive maintenance per asset lifecycle schedule.',
      location: pick(a, 1).assetTag, createdAt: '2 weeks ago', status: 'DONE',
      requester: requesterOf(pick(e, 1), 'req-emp-1'),
      asset: { id: pick(a, 1).id, code: pick(a, 1).assetTag, name: pick(a, 1).name },
      departmentApproval: { status: 'Approved', approverName: e[0].name, approvedAt: '2 weeks ago' },
      itAssignment: { technicianId: 'tech-1', technicianName: 'Somchai Prasert', technicianRole: 'Hardware & Peripherals', assignedBy: 'IT Operations Lead', assignedAt: '2 weeks ago' },
      itExecution: { currentStatus: 'Done', diagnosticNotes: 'Opened chassis, inspected internals for dust buildup and thermal degradation.', resolutionNotes: 'Cleaned internals, re-applied thermal paste, verified temps under load.', completedAt: '13 days ago', downtimeHours: 1.5, partsUsed: ['Thermal Paste'] },
      timeline: [
        { id: 'tl-1', stage: 'Creation', actorName: pick(e, 1).name, actorRole: 'Requester', timestamp: '2 weeks ago', action: 'Requisition submitted and routed to department head for review.' },
        { id: 'tl-2', stage: 'Dept Approval', actorName: e[0].name, actorRole: 'Department Head', timestamp: '2 weeks ago', action: 'Department Head Sign-off Approved' },
        { id: 'tl-3', stage: 'IT Assignment', actorName: 'IT Operations Lead', actorRole: 'IT Operations Lead', timestamp: '2 weeks ago', action: 'Assigned to Somchai Prasert (Hardware & Peripherals)' },
        { id: 'tl-4', stage: 'Resolution', actorName: 'Somchai Prasert', actorRole: 'Hardware & Peripherals', timestamp: '13 days ago', action: 'Status updated to Done', notes: 'Cleaned internals, re-applied thermal paste, verified temps under load.' },
      ],
    },
  ];
}
