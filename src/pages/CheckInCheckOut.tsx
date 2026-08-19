import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Wrench, Clock, Users, ShieldCheck, Send, ArrowRight, Filter, Laptop,
  X, PauseCircle, CheckCircle2, RotateCcw, Sparkles, MapPin,
  Kanban, List, Eye, Printer,
} from 'lucide-react';
import {
  Button, Badge, useToast, Modal, Input, Select, Textarea, Avatar,
} from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { assetAPI } from '@/services/asset';
import { masterdataAPI } from '@/services/masterdata';
import { organizationAPI } from '@/services/organization';
import { assignmentAPI } from '@/services/assignment';
import type { Asset } from '@/types/asset';
import type { AssetCategory } from '@/types/masterdata';
import type { Employee } from '@/types/organization';
import type { Assignment } from '@/types/assignment';
import {
  buildSeedTickets, getStatusBadge, getAssetIcon, CATEGORY_OPTIONS, PRIORITY_CONFIG,
  HOLD_CATEGORY_OPTIONS, TECHNICIANS, type ITRequisitionTicket, type TicketCategory,
  type PriorityLevel, type RequisitionStatus,
} from '@/mocks/itRequisition.mock';
import { cn } from '@/lib/cn';

interface CheckInCheckOutProps {
  onNavigate: (id: string, aid?: string) => void;
}

// ============================================================================================
// MOCKUP ONLY — 2026-08-18
//
// This page used to be the REAL "Check-In / Check-Out" feature (FR-30..FR-33, short-term asset
// borrowing via assignmentAPI.checkOut/checkIn — no manager approval). The user explicitly asked
// to convert this exact route/nav slot into an "IT Requisition & Maintenance" ticket-governance
// page, ported from esaps_ai_gemini-main/src/pages/Maintenance.tsx "ทุกรายละเอียด" (every detail),
// even after being warned this removes a real, working feature from the menu. Confirmed choice:
// "เปลี่ยน route/nav เดียว เป็น IT Req & Maintenance mockup (แปลง)".
//
// IT Requisition & Maintenance ticketing is NOT in the MVP backlog (backlog.md has no FR for a
// 4-stage governance ticket workflow / SLA engine) and there is no backend/service/data model for
// it — everything below is local component state seeded once on mount, never persisted. Every
// action handler shows an honest toast instead of pretending to call a real API.
//
// The real checkOut/checkIn methods are UNTOUCHED in services/assignment.ts — only this page's UI
// was replaced, so the real feature can be restored later by reverting this file.
//
// Shared types/seed-builder live in mocks/itRequisition.mock.tsx — pages/TicketDetail.tsx (its
// own full-page ticket detail mockup, added 2026-08-18) uses the same module. "View Ticket
// Details" below navigates to that page instead of a drawer.
// ============================================================================================

type RolePerspective = 'ALL' | 'USER' | 'DEPT_APPROVER' | 'IT_MANAGER' | 'IT_TECH';

export function CheckInCheckOut({ onNavigate }: CheckInCheckOutProps) {
  const { push } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<ITRequisitionTicket[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([assetAPI.list(), masterdataAPI.listCategories(), organizationAPI.listEmployees(), assignmentAPI.list()])
      .then(([assetResult, categoryResult, employeeResult, assignmentResult]) => {
        if (cancelled) return;
        setAssets(assetResult.data);
        setCategories(categoryResult);
        setEmployees(employeeResult);
        setAssignments(assignmentResult);
        setTickets(buildSeedTickets(assetResult.data, employeeResult));
      })
      .catch((err) => push({ variant: 'error', title: 'Could not load reference data', message: err instanceof Error ? err.message : String(err) }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryLabel = (asset?: Asset) => (asset ? categories.find((c) => c.id === asset.categoryId)?.name ?? '' : '');

  // Built once per `assets` change instead of `.find()`-scanning the array once per ticket row on
  // every render — same pattern AssetList.tsx already uses for its own per-row lookup.
  const assetsById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const [perspective, setPerspective] = useState<RolePerspective>('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const departmentOptions = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  // MOCKUP — the mock "current user" for the New Requisition asset picker is employees[0], same
  // assumption handleCreateRequisition already makes below. My/Shared split uses the real
  // assignmentAPI data already loaded (unlike Gemini, which fakes it with a static assignedTo
  // field on mock assets).
  const myAssignedAssetIds = new Set(
    assignments.filter((a) => a.status === 'active' && a.employeeId === employees[0]?.id).map((a) => a.assetId),
  );
  const myAssignedAssets = assets.filter((a) => myAssignedAssetIds.has(a.id));
  const sharedAssets = assets.filter((a) => !myAssignedAssetIds.has(a.id));

  // MOCKUP AI SEARCH — deterministic client-side keyword parsing (no external AI call), branded
  // as "Ask AI" to match Gemini's own implementation, which is also just string matching.
  const [aiQuery, setAiQuery] = useState('');
  const [aiInterpretation, setAiInterpretation] = useState<{ filters: { label: string; value: string }[]; count: number } | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<ITRequisitionTicket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);

  const [formAssetMode, setFormAssetMode] = useState<'my' | 'shared'>('my');
  const [formCategory, setFormCategory] = useState<TicketCategory>('Hardware Fault & Repair');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('Medium');
  const [formAssetId, setFormAssetId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const [approvalAction, setApprovalAction] = useState<'Approve' | 'Reject'>('Approve');
  const [approvalComments, setApprovalComments] = useState('');

  const [dispatchTechId, setDispatchTechId] = useState('tech-1');
  const [dispatchTargetDate, setDispatchTargetDate] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const [updateTargetStatus, setUpdateTargetStatus] = useState<'Planning' | 'In-Progress' | 'On-Hold' | 'Done'>('In-Progress');
  const [updateHoldCategory, setUpdateHoldCategory] = useState(HOLD_CATEGORY_OPTIONS[0]);
  const [updateHoldReason, setUpdateHoldReason] = useState('');
  const [updateResolutionNotes, setUpdateResolutionNotes] = useState('');
  const [updateDowntimeHours, setUpdateDowntimeHours] = useState('');
  const [updatePartsUsed, setUpdatePartsUsed] = useState('');

  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    const lower = aiQuery.toLowerCase();
    const filters: { label: string; value: string }[] = [];

    if (lower.includes('critical') || lower.includes('urgent')) filters.push({ label: 'Priority', value: 'Critical' });
    else if (lower.includes('high')) filters.push({ label: 'Priority', value: 'High' });

    if (lower.includes('pending approval') || lower.includes('dept approval')) filters.push({ label: 'Status', value: 'PENDING_DEPT_APPROVAL' });
    else if (lower.includes('dispatch')) filters.push({ label: 'Status', value: 'PENDING_IT_DISPATCH' });
    else if (lower.includes('hold') || lower.includes('waiting')) filters.push({ label: 'Status', value: 'ON_HOLD' });
    else if (lower.includes('progress') || lower.includes('repairing')) filters.push({ label: 'Status', value: 'IN_PROGRESS' });
    else if (lower.includes('done') || lower.includes('resolved') || lower.includes('closed')) filters.push({ label: 'Status', value: 'DONE' });

    if (lower.includes('hardware') || lower.includes('repair')) filters.push({ label: 'Category', value: 'Hardware Fault & Repair' });
    else if (lower.includes('software') || lower.includes('os')) filters.push({ label: 'Category', value: 'Software & OS Issue' });
    else if (lower.includes('network') || lower.includes('wifi') || lower.includes('wi-fi')) filters.push({ label: 'Category', value: 'Network & Wi-Fi' });

    const matchedDept = departmentOptions.find((d) => lower.includes(d.toLowerCase()));
    if (matchedDept) filters.push({ label: 'Department', value: matchedDept });

    const count = tickets.filter((t) => filters.every((f) => {
      if (f.label === 'Priority') return t.priority === f.value;
      if (f.label === 'Status') return t.status === f.value;
      if (f.label === 'Category') return t.category === f.value;
      if (f.label === 'Department') return t.requester.department === f.value;
      return true;
    })).length;

    setAiInterpretation({ filters, count });
    filters.forEach((f) => {
      if (f.label === 'Status') setStatusFilter(f.value);
      if (f.label === 'Priority') setPriorityFilter(f.value);
      if (f.label === 'Category') setCategoryFilter(f.value);
      if (f.label === 'Department') setDepartmentFilter(f.value);
    });
  };

  const clearAISearch = () => {
    setAiQuery(''); setAiInterpretation(null);
    setStatusFilter('ALL'); setPriorityFilter('ALL'); setCategoryFilter('ALL'); setDepartmentFilter('ALL'); setPerspective('ALL');
  };

  const resetAllFilters = () => {
    setStatusFilter('ALL'); setPriorityFilter('ALL'); setCategoryFilter('ALL'); setDepartmentFilter('ALL'); setPerspective('ALL');
    setSearchQuery(''); setAiQuery(''); setAiInterpretation(null);
  };

  const hasActiveFilters = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || departmentFilter !== 'ALL' || perspective !== 'ALL' || searchQuery.trim() !== '' || !!aiInterpretation;

  const filteredTickets = tickets.filter((ticket) => {
    if (perspective === 'DEPT_APPROVER' && ticket.status !== 'PENDING_DEPT_APPROVAL') return false;
    if (perspective === 'IT_MANAGER' && ticket.status !== 'PENDING_IT_DISPATCH') return false;
    if (perspective === 'IT_TECH' && !['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(ticket.status)) return false;
    if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && ticket.category !== categoryFilter) return false;
    if (departmentFilter !== 'ALL' && ticket.requester.department !== departmentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = [ticket.title, ticket.ticketCode, ticket.asset.name, ticket.asset.code, ticket.requester.name].some((v) => v.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const stats = {
    pendingDept: tickets.filter((t) => t.status === 'PENDING_DEPT_APPROVAL').length,
    pendingDispatch: tickets.filter((t) => t.status === 'PENDING_IT_DISPATCH').length,
    inProgress: tickets.filter((t) => ['PLANNING', 'IN_PROGRESS'].includes(t.status)).length,
    onHold: tickets.filter((t) => t.status === 'ON_HOLD').length,
    done: tickets.filter((t) => t.status === 'DONE').length,
  };

  const openNewTicketModal = () => {
    setFormAssetMode(myAssignedAssets.length ? 'my' : 'shared');
    setFormCategory('Hardware Fault & Repair');
    setFormPriority('Medium');
    setFormAssetId((myAssignedAssets[0] ?? sharedAssets[0])?.id ?? '');
    setFormTitle('');
    setFormDescription('');
    setFormLocation('');
    setIsNewTicketModalOpen(true);
  };

  const handleCreateRequisition = () => {
    if (!formTitle.trim()) {
      push({ variant: 'warning', title: 'Subject required', message: 'Please enter a summary title for this requisition.' });
      return;
    }
    const asset = assets.find((a) => a.id === formAssetId) ?? assets[0];
    const employee = employees[0];
    if (!asset || !employee) return;
    const code = `ITR-2026-${(tickets.length + 1).toString().padStart(3, '0')}`;
    const approver = employees[Math.min(1, employees.length - 1)];
    const newTicket: ITRequisitionTicket = {
      id: `req-${code}`, ticketCode: code, category: formCategory, priority: formPriority, slaTargetHours: PRIORITY_CONFIG[formPriority].hours,
      title: formTitle, description: formDescription || 'User requested inspection and servicing.',
      location: formLocation || asset.assetTag, createdAt: 'Just now', status: 'PENDING_DEPT_APPROVAL',
      requester: { id: employee.id, name: employee.name, department: employee.department, jobTitle: employee.positionTitle ?? '—', email: `${employee.name.toLowerCase().replace(/\s+/g, '.')}@raise.local`, initials: employee.name.slice(0, 2).toUpperCase(), avatarColor: 'bg-indigo-600' },
      asset: { id: asset.id, code: asset.assetTag, name: asset.name },
      departmentApproval: { status: 'Pending', approverName: approver?.name ?? '—', approverTitle: approver?.positionTitle ?? '—' },
      itAssignment: {}, itExecution: { currentStatus: 'Pending Dept Approval' },
      timeline: [{ id: `tl-${code}-1`, stage: 'Creation', actorName: employee.name, actorRole: 'Requester', timestamp: 'Just now', action: 'Requisition submitted and routed to department head for review.' }],
    };
    setTickets((prev) => [newTicket, ...prev]);
    setIsNewTicketModalOpen(false);
    push({ variant: 'success', title: 'IT requisition submitted (mockup)', message: `${code} routed to department approver — UI mockup only, not a real ticket.` });
  };

  const handleApproveReject = () => {
    if (!selectedTicket) return;
    const approved = approvalAction === 'Approve';
    const nextTicket: ITRequisitionTicket = {
      ...selectedTicket,
      status: approved ? 'PENDING_IT_DISPATCH' : 'REJECTED_BY_DEPT',
      departmentApproval: { ...selectedTicket.departmentApproval, status: approved ? 'Approved' : 'Rejected', approvedAt: 'Just now', comments: approvalComments || undefined },
      timeline: [...selectedTicket.timeline, { id: `tl-${Date.now()}`, stage: 'Dept Approval', actorName: selectedTicket.departmentApproval.approverName, actorRole: 'Department Head', timestamp: 'Just now', action: approved ? 'Department Head Sign-off Approved' : 'Department Head Sign-off Rejected', notes: approvalComments || undefined }],
    };
    setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? nextTicket : t));
    setSelectedTicket(null);
    setIsApproveModalOpen(false);
    setApprovalComments('');
    push({ variant: approved ? 'success' : 'info', title: approved ? 'Requisition approved (mockup)' : 'Requisition rejected (mockup)', message: 'UI mockup only, not a real action yet.' });
  };

  const handleDispatchAssign = () => {
    if (!selectedTicket) return;
    const tech = TECHNICIANS.find((t) => t.id === dispatchTechId) ?? TECHNICIANS[0];
    const nextTicket: ITRequisitionTicket = {
      ...selectedTicket,
      status: 'IN_PROGRESS',
      itAssignment: { ...selectedTicket.itAssignment, technicianId: tech.id, technicianName: tech.name, technicianRole: tech.specialty, assignedAt: 'Just now', targetResolutionDate: dispatchTargetDate || selectedTicket.itAssignment.targetResolutionDate },
      itExecution: { ...selectedTicket.itExecution, currentStatus: 'In-Progress' },
      timeline: [...selectedTicket.timeline, { id: `tl-${Date.now()}`, stage: 'IT Assignment', actorName: 'IT Operations Lead', actorRole: 'IT Operations Lead', timestamp: 'Just now', action: `Assigned to ${tech.name} (${tech.specialty})`, notes: dispatchNotes || undefined }],
    };
    setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? nextTicket : t));
    setSelectedTicket(null);
    setIsDispatchModalOpen(false);
    setDispatchNotes('');
    push({ variant: 'success', title: 'Technician assigned (mockup)', message: `${tech.name} dispatched — UI mockup only, not a real action yet.` });
  };

  const handleTechnicianStatusUpdate = () => {
    if (!selectedTicket) return;
    const nextStatus: RequisitionStatus = updateTargetStatus === 'Planning' ? 'PLANNING' : updateTargetStatus === 'In-Progress' ? 'IN_PROGRESS' : updateTargetStatus === 'On-Hold' ? 'ON_HOLD' : 'DONE';
    const nextTicket: ITRequisitionTicket = {
      ...selectedTicket,
      status: nextStatus,
      itExecution: {
        ...selectedTicket.itExecution,
        currentStatus: updateTargetStatus,
        holdCategory: nextStatus === 'ON_HOLD' ? updateHoldCategory : selectedTicket.itExecution.holdCategory,
        holdReason: nextStatus === 'ON_HOLD' ? updateHoldReason : selectedTicket.itExecution.holdReason,
        resolutionNotes: nextStatus === 'DONE' ? (updateResolutionNotes || 'Repaired and functional test verified.') : selectedTicket.itExecution.resolutionNotes,
        completedAt: nextStatus === 'DONE' ? 'Just now' : selectedTicket.itExecution.completedAt,
        downtimeHours: nextStatus === 'DONE' ? (Number(updateDowntimeHours) || 0) : selectedTicket.itExecution.downtimeHours,
        partsUsed: nextStatus === 'DONE' && updatePartsUsed.trim() ? updatePartsUsed.split(',').map((s) => s.trim()).filter(Boolean) : selectedTicket.itExecution.partsUsed,
      },
      timeline: [...selectedTicket.timeline, { id: `tl-${Date.now()}`, stage: nextStatus === 'DONE' ? 'Resolution' : nextStatus === 'ON_HOLD' ? 'On-Hold' : 'In-Progress', actorName: selectedTicket.itAssignment.technicianName ?? 'Technician', actorRole: selectedTicket.itAssignment.technicianRole ?? 'Assigned Technician', timestamp: 'Just now', action: `Status updated to ${updateTargetStatus}` }],
    };
    setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? nextTicket : t));
    setSelectedTicket(null);
    setIsStatusUpdateModalOpen(false);
    push({ variant: 'success', title: `Status updated: ${updateTargetStatus} (mockup)`, message: 'UI mockup only, not a real action yet.' });
  };

  const columns: Column<ITRequisitionTicket>[] = [
    {
      key: 'ticketCode', header: 'Ticket Code & Subject', sortable: true, sortValue: (r) => r.ticketCode,
      render: (r) => {
        const asset = assetsById.get(r.asset.id);
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">{getAssetIcon(categoryLabel(asset))}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-surface-900">{r.ticketCode}</span>
                <Badge variant={PRIORITY_CONFIG[r.priority].variant} dot>{r.priority}</Badge>
              </div>
              <p className="text-caption text-surface-600 truncate max-w-xs">{r.title}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'asset', header: 'Asset / Device', sortable: true, sortValue: (r) => r.asset.name, render: (r) => (
      <div className="min-w-0">
        <p className="font-medium text-surface-900 truncate">{r.asset.name}</p>
        <p className="text-caption text-surface-500 font-mono">{r.asset.code}</p>
      </div>
    ) },
    { key: 'category', header: 'Category & SLA', sortable: true, sortValue: (r) => r.category, render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-surface-700 text-caption font-medium">{r.category}</span>
        <span className="text-[11px] text-surface-400 font-mono">{PRIORITY_CONFIG[r.priority].sla}</span>
      </div>
    ) },
    { key: 'requester', header: 'Requester', sortable: true, sortValue: (r) => r.requester.name, render: (r) => (
      <div className="flex items-center gap-2">
        <Avatar initials={r.requester.initials} size="xs" color={r.requester.avatarColor} />
        <div className="min-w-0">
          <p className="text-caption font-medium text-surface-800 truncate">{r.requester.name}</p>
          <p className="text-[11px] text-surface-400">{r.requester.department}</p>
        </div>
      </div>
    ) },
    { key: 'status', header: 'Workflow Stage', sortable: true, sortValue: (r) => r.status, render: (r) => getStatusBadge(r.status) },
    { key: 'assignedTech', header: 'Assigned Tech', sortable: true, sortValue: (r) => r.itAssignment.technicianName ?? '', render: (r) => r.itAssignment.technicianName ? (
      <div className="flex items-center gap-1.5">
        <Wrench className="h-3.5 w-3.5 text-brand-600" />
        <div className="min-w-0">
          <span className="text-caption font-medium text-surface-800 truncate block">{r.itAssignment.technicianName}</span>
          <span className="text-[10px] text-surface-400 block">{r.itAssignment.technicianRole}</span>
        </div>
      </div>
    ) : <span className="text-caption text-surface-400 italic">Unassigned</span> },
    { key: 'date', header: 'Created / Location', sortable: true, sortValue: (r) => r.createdAt, render: (r) => (
      <div className="text-[11px] text-surface-500">
        <p className="font-medium text-surface-700">{r.createdAt}</p>
        <p className="text-surface-400 truncate max-w-[140px]">{r.location}</p>
      </div>
    ) },
  ];

  const openTicketDetail = (ticket: ITRequisitionTicket) => onNavigate('ticket-detail', ticket.ticketCode);

  const rowActions = (row: ITRequisitionTicket) => {
    const actions = [
      { label: 'View Ticket Details', icon: <Eye className="h-4 w-4" />, onClick: () => openTicketDetail(row) },
    ];
    if (row.status === 'PENDING_DEPT_APPROVAL') {
      actions.push({ label: 'Department Approval', icon: <ShieldCheck className="h-4 w-4 text-amber-600" />, onClick: () => { setSelectedTicket(row); setApprovalAction('Approve'); setIsApproveModalOpen(true); } });
    }
    if (row.status === 'PENDING_IT_DISPATCH') {
      actions.push({ label: 'Assign IT Technician', icon: <Users className="h-4 w-4 text-brand-600" />, onClick: () => { setSelectedTicket(row); setDispatchTargetDate(''); setIsDispatchModalOpen(true); } });
    }
    if (['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(row.status)) {
      actions.push({ label: 'Update Tech Status', icon: <RotateCcw className="h-4 w-4 text-emerald-600" />, onClick: () => { setSelectedTicket(row); setIsStatusUpdateModalOpen(true); } });
    }
    actions.push(
      { label: 'View Asset Profile', icon: <Laptop className="h-4 w-4" />, onClick: () => onNavigate('asset-detail', row.asset.id) },
      { label: 'Print Work Order', icon: <Printer className="h-4 w-4" />, onClick: () => push({ variant: 'info', title: 'Print work order (mockup)', message: `UI mockup only — would print a slip for ${row.ticketCode}.` }) },
    );
    return actions;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="brand">{filteredTickets.length} tickets</Badge>
          <div className="inline-flex bg-surface-100 rounded-lg p-0.5 border border-surface-200 text-caption">
            {([
              ['ALL', 'All Roles'],
              ['USER', '👤 Employee'],
              ['DEPT_APPROVER', `👔 Dept Approver${stats.pendingDept ? ` (${stats.pendingDept})` : ''}`],
              ['IT_MANAGER', `🛠️ IT Dispatch${stats.pendingDispatch ? ` (${stats.pendingDispatch})` : ''}`],
              ['IT_TECH', '🔧 Technician'],
            ] as [RolePerspective, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPerspective(value)}
                className={cn('px-2.5 py-1 rounded-md font-medium transition-all', perspective === value ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900')}
              >
                {label}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={resetAllFilters}>Clear filters</Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-surface-100 rounded-lg p-0.5 border border-surface-200">
            <button onClick={() => setViewMode('list')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium transition-all flex items-center gap-1.5', viewMode === 'list' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-500 hover:text-surface-800')}>
              <List className="h-4 w-4" /><span>Table</span>
            </button>
            <button onClick={() => setViewMode('board')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium transition-all flex items-center gap-1.5', viewMode === 'board' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-500 hover:text-surface-800')}>
              <Kanban className="h-4 w-4" /><span>Kanban</span>
            </button>
          </div>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openNewTicketModal}>New IT Requisition</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {([
          ['PENDING_DEPT_APPROVAL', '1. Dept Approval', stats.pendingDept, ShieldCheck, 'border-amber-500 ring-1 ring-amber-500', 'Awaiting manager sign-off'],
          ['PENDING_IT_DISPATCH', '2. IT Dispatch', stats.pendingDispatch, Users, 'border-brand-500 ring-1 ring-brand-500', 'Ready to assign technician'],
          ['IN_PROGRESS', '3. In-Progress', stats.inProgress, Clock, 'border-blue-500 ring-1 ring-blue-500', 'Active technician triage'],
          ['ON_HOLD', '3. On-Hold', stats.onHold, PauseCircle, 'border-warning-500 ring-1 ring-warning-500', 'Awaiting spare parts / vendor'],
          ['DONE', '4. Resolved', stats.done, CheckCircle2, 'border-success-500 ring-1 ring-success-500', 'Closed & verified'],
        ] as [string, string, number, typeof ShieldCheck, string, string][]).map(([status, label, count, Icon, activeClass, sub]) => (
          <div
            key={status}
            className={cn('card-base p-3.5 cursor-pointer transition-all border hover:shadow-sm', statusFilter === status ? activeClass : 'hover:border-surface-300')}
            onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
          >
            <div className="flex items-center justify-between text-caption text-surface-500">
              <span className="font-medium">{label}</span>
              <div className="h-7 w-7 rounded-md bg-surface-50 text-surface-600 flex items-center justify-center"><Icon className="h-4 w-4" /></div>
            </div>
            <p className="text-title font-bold text-surface-900 mt-1">{count}</p>
            <p className="text-[11px] text-surface-500 mt-0.5 font-medium">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><Sparkles className="h-4 w-4 text-brand-500" /></div>
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAISearch(); }}
              placeholder="Ask AI: e.g. 'Show critical hardware repairs pending dispatch'"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/30 pl-10 pr-4 py-2.5 text-body text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
          <Button size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={handleAISearch} disabled={!aiQuery.trim()}>Ask AI</Button>
        </div>

        {aiInterpretation && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-white" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-medium text-brand-700 mb-1">AI interpreted:</p>
              <div className="flex flex-wrap gap-1.5">
                {aiInterpretation.filters.length === 0 ? (
                  <span className="text-caption text-surface-500">No specific filters detected — showing all tickets.</span>
                ) : aiInterpretation.filters.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-caption bg-white border border-brand-200 text-brand-700 px-2 py-0.5 rounded-md font-medium">{f.label} = {f.value}</span>
                ))}
              </div>
              <p className="text-caption text-surface-600 mt-1.5">Found <span className="font-bold text-surface-900">{aiInterpretation.count}</span> matching tickets</p>
            </div>
            <button onClick={clearAISearch} className="text-surface-400 hover:text-surface-600 transition-colors shrink-0"><X className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="card-base p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select label="Workflow Stage / Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'PENDING_DEPT_APPROVAL', label: '1. Pending Dept Approval' },
              { value: 'PENDING_IT_DISPATCH', label: '2. Pending IT Dispatch' },
              { value: 'PLANNING', label: '3. Planning' },
              { value: 'IN_PROGRESS', label: '3. In-Progress' },
              { value: 'ON_HOLD', label: '3. On-Hold' },
              { value: 'DONE', label: '4. Resolved & Closed' },
            ]} />
            <Select label="Priority & SLA" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'Critical', label: 'Critical (2 Hours SLA)' },
              { value: 'High', label: 'High (8 Hours SLA)' },
              { value: 'Medium', label: 'Medium (24 Hours SLA)' },
              { value: 'Low', label: 'Low (48 Hours SLA)' },
            ]} />
            <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[
              { value: 'ALL', label: 'All Categories' },
              ...CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` })),
            ]} />
            <Select label="Requester Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} options={[
              { value: 'ALL', label: 'All Departments' },
              ...departmentOptions.map((d) => ({ value: d, label: d })),
            ]} />
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={filteredTickets}
          loading={loading}
          searchable
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by ticket code, asset, or requester..."
          rowActions={rowActions}
          onRowClick={openTicketDetail}
          toolbar={<Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>Filters</Button>}
          emptyTitle="No IT requisition tickets found"
          emptyDescription="Try adjusting your search query, perspective, or filters."
          emptyAction={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openNewTicketModal}>New IT Requisition</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {([
            ['PENDING_DEPT_APPROVAL', '1. Dept Approval', 'bg-amber-500', 'warning'],
            ['PENDING_IT_DISPATCH', '2. IT Dispatch', 'bg-brand-500', 'brand'],
            ['ACTIVE', '3. Active Triage / Hold', 'bg-blue-500', 'accent'],
            ['DONE', '4. Resolved & Verified', 'bg-success-500', 'success'],
          ] as [string, string, string, 'warning' | 'brand' | 'accent' | 'success'][]).map(([key, title, dot, badgeVariant]) => {
            const columnTickets = filteredTickets.filter((t) =>
              key === 'ACTIVE' ? ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status) : t.status === key);
            return (
              <div key={key} className="bg-surface-50 rounded-xl p-3 border border-surface-200 flex flex-col gap-3 min-h-[400px]">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', dot)} /><h3 className="text-body font-semibold text-surface-900">{title}</h3></div>
                  <Badge variant={badgeVariant}>{columnTickets.length}</Badge>
                </div>
                <div className="flex flex-col gap-2.5">
                  {columnTickets.map((ticket) => {
                    const stageAction = ticket.status === 'PENDING_DEPT_APPROVAL'
                      ? { label: 'Approve / Review', onClick: () => { setSelectedTicket(ticket); setApprovalAction('Approve'); setIsApproveModalOpen(true); } }
                      : ticket.status === 'PENDING_IT_DISPATCH'
                      ? { label: 'Assign Tech', onClick: () => { setSelectedTicket(ticket); setDispatchTargetDate(''); setIsDispatchModalOpen(true); } }
                      : ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(ticket.status)
                      ? { label: ticket.status === 'ON_HOLD' ? '⚠️ On-Hold: Update' : 'Update Status', onClick: () => { setSelectedTicket(ticket); setIsStatusUpdateModalOpen(true); } }
                      : { label: 'View Details', onClick: () => openTicketDetail(ticket) };
                    return (
                      <div key={ticket.id} className="bg-white p-3 rounded-lg border border-surface-200 hover:border-brand-300 hover:shadow-sm transition-all">
                        <button onClick={() => openTicketDetail(ticket)} className="w-full text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-caption font-bold text-surface-900">{ticket.ticketCode}</span>
                            <Badge variant={PRIORITY_CONFIG[ticket.priority].variant} dot>{ticket.priority}</Badge>
                          </div>
                          <p className="text-caption text-surface-700 mt-1 line-clamp-2">{ticket.title}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Avatar initials={ticket.requester.initials} size="xs" color={ticket.requester.avatarColor} />
                            <span className="text-[11px] text-surface-500">{ticket.requester.name}</span>
                          </div>
                        </button>
                        <Button variant="outline" size="sm" className="w-full mt-2.5 h-7 text-[11px]" onClick={stageAction.onClick}>{stageAction.label}</Button>
                      </div>
                    );
                  })}
                  {columnTickets.length === 0 && (
                    <div className="p-8 text-center text-caption text-surface-400 border border-dashed border-surface-200 rounded-lg bg-white/50">No tickets</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New IT Requisition Modal */}
      <Modal open={isNewTicketModalOpen} onClose={() => setIsNewTicketModalOpen(false)} title="Create IT Requisition" description="Submit a service ticket or equipment request. Routed to your department head for approval (UI mockup)." size="lg">
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="block text-caption font-medium text-surface-700 mb-1.5">Select Affected Asset <span className="text-error-500">*</span></label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setFormAssetMode('my'); setFormAssetId(myAssignedAssets[0]?.id ?? ''); }}
                className={cn('flex-1 py-1.5 px-3 rounded-md text-caption font-medium border text-center transition-all', formAssetMode === 'my' ? 'bg-brand-50 border-brand-500 text-brand-700 font-semibold shadow-xs' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50')}
              >
                📱 My Assigned Assets ({myAssignedAssets.length})
              </button>
              <button
                type="button"
                onClick={() => { setFormAssetMode('shared'); setFormAssetId(sharedAssets[0]?.id ?? ''); }}
                className={cn('flex-1 py-1.5 px-3 rounded-md text-caption font-medium border text-center transition-all', formAssetMode === 'shared' ? 'bg-brand-50 border-brand-500 text-brand-700 font-semibold shadow-xs' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50')}
              >
                🏢 Shared / Department Assets ({sharedAssets.length})
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg border-surface-200">
              {(formAssetMode === 'my' ? myAssignedAssets : sharedAssets).map((a) => (
                <div
                  key={a.id}
                  onClick={() => setFormAssetId(a.id)}
                  className={cn('p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5', formAssetId === a.id ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500' : 'border-surface-200 bg-white hover:border-surface-300')}
                >
                  <div className="p-2 rounded bg-surface-100 shrink-0">{getAssetIcon(categoryLabel(a))}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-caption font-bold text-surface-900 truncate">{a.name}</p>
                    <p className="text-[11px] text-surface-500 font-mono">{a.assetTag}</p>
                    <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-surface-100 text-surface-600 mt-1">{categoryLabel(a) || '—'}</span>
                  </div>
                </div>
              ))}
              {(formAssetMode === 'my' ? myAssignedAssets : sharedAssets).length === 0 && (
                <p className="text-caption text-surface-400 italic p-2 sm:col-span-2">No assets in this group.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Requisition Category" value={formCategory} onChange={(e) => setFormCategory(e.target.value as TicketCategory)} options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))} />
            <Select label="Urgency & SLA Level" value={formPriority} onChange={(e) => setFormPriority(e.target.value as PriorityLevel)} options={[
              { value: 'Critical', label: '🚨 Critical (2 Hours SLA)' },
              { value: 'High', label: '⚠️ High (8 Hours SLA)' },
              { value: 'Medium', label: '⚡ Medium (24 Hours SLA)' },
              { value: 'Low', label: '🌱 Low (48 Hours SLA)' },
            ]} />
          </div>
          <Input label="Subject / Problem Summary" placeholder="e.g. Laptop screen flickering and battery draining rapidly" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
          <Textarea label="Detailed Description & Error Behavior" placeholder="Describe symptoms, error codes, steps to reproduce, or upgrade justification..." rows={3} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          <Input label="Physical Location / Desk Number" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} leftIcon={<MapPin className="h-4 w-4 text-surface-400" />} />
          <div className="bg-brand-50/70 border border-brand-200 rounded-lg p-3 text-caption text-brand-900">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-brand-800"><Sparkles className="h-3.5 w-3.5 text-brand-600" /> Automated Approval Routing Chain</p>
            <div className="flex items-center gap-1.5 text-[11px] text-brand-700 flex-wrap">
              <span className="font-medium bg-white px-2 py-0.5 rounded border border-brand-200">1. Requester</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium bg-white px-2 py-0.5 rounded border border-brand-200 text-amber-800">2. Department Approver</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium bg-white px-2 py-0.5 rounded border border-brand-200">3. IT Dispatch Lead</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium bg-white px-2 py-0.5 rounded border border-brand-200 text-emerald-800">4. Specialist Repair</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsNewTicketModalOpen(false)}>Cancel</Button>
          <Button leftIcon={<Send className="h-4 w-4" />} onClick={handleCreateRequisition}>Submit IT Requisition</Button>
        </div>
      </Modal>

      {/* Department Approval Modal */}
      <Modal open={isApproveModalOpen && !!selectedTicket} onClose={() => setIsApproveModalOpen(false)} title="Department Approval" description={selectedTicket ? `Reviewing requisition for ${selectedTicket.requester.name} (${selectedTicket.requester.department})` : ''} size="md">
        {selectedTicket && (
          <div className="flex flex-col gap-4 py-2">
            <div className="bg-surface-50 p-3.5 rounded-lg border border-surface-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption font-bold text-surface-900">{selectedTicket.ticketCode}</span>
                <Badge variant={PRIORITY_CONFIG[selectedTicket.priority].variant} dot>{selectedTicket.priority} Priority</Badge>
              </div>
              <h4 className="text-body font-bold text-surface-900 mt-1">{selectedTicket.title}</h4>
              <p className="text-caption text-surface-600 mt-1">{selectedTicket.description}</p>
              <div className="mt-3 pt-2.5 border-t border-surface-200 text-caption text-surface-500">Device: <strong>{selectedTicket.asset.name}</strong> ({selectedTicket.asset.code})</div>
            </div>
            <div>
              <label className="block text-caption font-medium text-surface-700 mb-1.5">Approval Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setApprovalAction('Approve')} className={cn('py-2 px-3 rounded-lg border text-caption font-bold text-center transition-all flex items-center justify-center gap-2', approvalAction === 'Approve' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50')}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve & Forward to IT
                </button>
                <button type="button" onClick={() => setApprovalAction('Reject')} className={cn('py-2 px-3 rounded-lg border text-caption font-bold text-center transition-all flex items-center justify-center gap-2', approvalAction === 'Reject' ? 'bg-error-50 border-error-500 text-error-700 ring-1 ring-error-500' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50')}>
                  <X className="h-4 w-4 text-error-600" /> Reject Requisition
                </button>
              </div>
            </div>
            <Textarea label="Comments" placeholder="Add any comments for this decision..." rows={2} value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} />
          </div>
        )}
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
          <Button leftIcon={<Send className="h-4 w-4" />} onClick={handleApproveReject}>Confirm Decision</Button>
        </div>
      </Modal>

      {/* IT Dispatch Modal */}
      <Modal open={isDispatchModalOpen && !!selectedTicket} onClose={() => setIsDispatchModalOpen(false)} title="Assign IT Technician" description={selectedTicket ? `Dispatching ${selectedTicket.ticketCode}` : ''} size="md">
        {selectedTicket && (
          <div className="flex flex-col gap-4 py-2">
            <Select label="Technician" value={dispatchTechId} onChange={(e) => setDispatchTechId(e.target.value)} options={TECHNICIANS.map((t) => ({ value: t.id, label: `${t.name} — ${t.specialty}` }))} />
            <Input label="Target Resolution Date" type="date" value={dispatchTargetDate} onChange={(e) => setDispatchTargetDate(e.target.value)} />
            <Textarea label="Dispatch Notes" placeholder="Initial diagnostic notes or instructions for the technician..." rows={2} value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} />
          </div>
        )}
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
          <Button leftIcon={<Users className="h-4 w-4" />} onClick={handleDispatchAssign}>Assign Technician</Button>
        </div>
      </Modal>

      {/* Technician Status Update Modal */}
      <Modal open={isStatusUpdateModalOpen && !!selectedTicket} onClose={() => setIsStatusUpdateModalOpen(false)} title="Update Execution Status" description={selectedTicket ? `Work log for ${selectedTicket.ticketCode}` : ''} size="md">
        {selectedTicket && (
          <div className="flex flex-col gap-4 py-2">
            <Select label="Target Status" value={updateTargetStatus} onChange={(e) => setUpdateTargetStatus(e.target.value as typeof updateTargetStatus)} options={[
              { value: 'Planning', label: 'Planning' },
              { value: 'In-Progress', label: 'In-Progress' },
              { value: 'On-Hold', label: 'On-Hold' },
              { value: 'Done', label: 'Done' },
            ]} />
            {updateTargetStatus === 'On-Hold' && (
              <>
                <Select label="Hold Reason Category" value={updateHoldCategory} onChange={(e) => setUpdateHoldCategory(e.target.value)} options={HOLD_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} />
                <Textarea label="Hold Reason Detail" placeholder="e.g. Waiting for spare parts, vendor escalation..." rows={2} value={updateHoldReason} onChange={(e) => setUpdateHoldReason(e.target.value)} />
              </>
            )}
            {updateTargetStatus === 'Done' && (
              <>
                <Textarea label="Resolution Notes" placeholder="Describe how the issue was resolved..." rows={2} value={updateResolutionNotes} onChange={(e) => setUpdateResolutionNotes(e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Asset Downtime (Hours)" type="number" placeholder="e.g. 2.5" value={updateDowntimeHours} onChange={(e) => setUpdateDowntimeHours(e.target.value)} />
                  <Input label="Spare Parts Used" placeholder="e.g. Replacement cable, screws" helpText="Comma-separated, optional" value={updatePartsUsed} onChange={(e) => setUpdatePartsUsed(e.target.value)} />
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsStatusUpdateModalOpen(false)}>Cancel</Button>
          <Button leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleTechnicianStatusUpdate}>Save Update</Button>
        </div>
      </Modal>
    </div>
  );
}
