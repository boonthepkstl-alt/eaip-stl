import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Clock,
  ShieldCheck,
  Send,
  Filter,
  Kanban,
  List,
  Users,
  PauseCircle,
  CheckCircle2,
  Sparkles,
  X,
  Eye,
  ChevronRight,
  Printer as PrintIcon,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, Button, Badge, useToast, Modal, Input, Select, Textarea, Avatar, Alert } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { getAssetIcon } from '@/data/asset-icons';
import { useAssets } from '@/hooks/useAssets';
import { useTickets } from '@/hooks/useTickets';
import { ticketService } from '@/services/ticket-service';
import type { Ticket, TicketCategory, TicketPriority, TicketStatus, ITTechnician, DelegatedApproverSetting } from '@/types/ticket';
import { cn } from '@/lib/cn';

// Ported from src/pages/Maintenance.tsx. This IS the Ticket domain's list/board view — reads
// through ticketService/useTickets only, never the fixture directly (see
// MAINTENANCE-MIGRATION.md). One deliberate simplification vs. the legacy page: the inline
// slide-over "quick view" Drawer was dropped in favor of navigating to the real
// pages/TicketDetail route, since that full page now exists (it didn't in the legacy app in
// the same form — "ticket-detail" was a client-state page swap, not a URL). Everything else
// (KPIs, role-perspective pills, AI search, table + Kanban views, and all workflow modals) is
// preserved.

type RolePerspective = 'ALL' | 'USER' | 'DEPT_APPROVER' | 'IT_MANAGER' | 'IT_TECH';

const categoryOptions: { label: string; value: TicketCategory; icon: string }[] = [
  { label: 'Hardware Fault & Repair', value: 'Hardware Fault & Repair', icon: '💻' },
  { label: 'Equipment Replacement / Upgrade', value: 'Equipment Replacement', icon: '🔄' },
  { label: 'Software & OS Issue', value: 'Software & OS Issue', icon: '🖥️' },
  { label: 'Network & Wi-Fi', value: 'Network & Wi-Fi', icon: '📡' },
  { label: 'Peripherals & Accessories', value: 'Peripherals & Accessories', icon: '⌨️' },
  { label: 'Account & Access', value: 'Account & Access', icon: '🔑' },
  { label: 'Preventive Maintenance', value: 'Preventive Maintenance', icon: '🛠️' },
];

const priorityConfig: Record<TicketPriority, { variant: 'error' | 'warning' | 'accent' | 'default'; sla: string }> = {
  Critical: { variant: 'error', sla: '2 Hours SLA' },
  High: { variant: 'warning', sla: '8 Hours SLA' },
  Medium: { variant: 'accent', sla: '24 Hours SLA' },
  Low: { variant: 'default', sla: '48 Hours SLA' },
};

export function MaintenancePage() {
  const navigate = useNavigate();
  const { push } = useToast();

  const [perspective, setPerspective] = useState<RolePerspective>('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL' | 'ACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const [aiQuery, setAiQuery] = useState('');
  const [aiInterpretation, setAiInterpretation] = useState<{ filters: { label: string; value: string }[]; count: number } | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);

  const [formCategory, setFormCategory] = useState<TicketCategory>('Hardware Fault & Repair');
  const [formPriority, setFormPriority] = useState<TicketPriority>('Medium');
  const [formAssetId, setFormAssetId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('HQ - Floor 4, Desk E-412');

  const [approvalAction, setApprovalAction] = useState<'Approve' | 'Reject'>('Approve');
  const [approvalComments, setApprovalComments] = useState('');

  const [technicians, setTechnicians] = useState<ITTechnician[]>([]);
  const [delegationSettings, setDelegationSettings] = useState<DelegatedApproverSetting[]>([]);
  const [dispatchTechId, setDispatchTechId] = useState('');
  const [dispatchEstimatedCost, setDispatchEstimatedCost] = useState('150');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const [updateTargetStatus, setUpdateTargetStatus] = useState<'Planning' | 'In-Progress' | 'On-Hold' | 'Done'>('In-Progress');
  const [updateHoldReason, setUpdateHoldReason] = useState('');
  const [updateResolutionNotes, setUpdateResolutionNotes] = useState('');

  useEffect(() => {
    ticketService.listTechnicians().then((t) => {
      setTechnicians(t);
      if (t[0]) setDispatchTechId(t[0].id);
    });
    ticketService.listDelegationSettings().then(setDelegationSettings);
  }, []);

  const { assets } = useAssets({});
  const myAssignedAssets = useMemo(() => assets.filter((a) => a.assignedTo === 'Sarah Chen'), [assets]);

  const {
    tickets: filteredTickets,
    total,
    loading,
    error,
    refetch,
  } = useTickets({
    search: searchQuery,
    status: statusFilter,
    priority: priorityFilter,
    category: categoryFilter,
    department: deptFilter,
    requesterName: perspective === 'USER' ? 'Sarah Chen' : undefined,
  });

  // Perspective filters beyond USER (dept approver / IT manager / IT tech queues) narrow the
  // already-fetched list client-side, same as "ACTIVE" in the legacy page's status shortcut.
  const perspectiveTickets = useMemo(() => {
    if (perspective === 'DEPT_APPROVER') return filteredTickets.filter((t) => t.status === 'PENDING_DEPT_APPROVAL');
    if (perspective === 'IT_MANAGER') return filteredTickets.filter((t) => t.status === 'PENDING_IT_DISPATCH');
    if (perspective === 'IT_TECH') return filteredTickets.filter((t) => ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status));
    return filteredTickets;
  }, [filteredTickets, perspective]);

  // Overall KPIs come from a company-wide read (unaffected by the current filter/search),
  // same as Assets/Employees pages' KPI cards — a second unfiltered fetch is the established
  // pattern rather than deriving totals from whatever subset happens to be on screen.
  const { tickets: allTickets } = useTickets({});
  const stats = useMemo(
    () => ({
      pendingDept: allTickets.filter((t) => t.status === 'PENDING_DEPT_APPROVAL').length,
      pendingDispatch: allTickets.filter((t) => t.status === 'PENDING_IT_DISPATCH').length,
      inProgress: allTickets.filter((t) => ['PLANNING', 'IN_PROGRESS'].includes(t.status)).length,
      onHold: allTickets.filter((t) => t.status === 'ON_HOLD').length,
      done: allTickets.filter((t) => t.status === 'DONE').length,
    }),
    [allTickets]
  );

  const hasActiveFilters = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || deptFilter !== 'ALL' || perspective !== 'ALL' || searchQuery.trim() !== '' || !!aiInterpretation;

  const resetAllFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setDeptFilter('ALL');
    setPerspective('ALL');
    setSearchQuery('');
    setAiQuery('');
    setAiInterpretation(null);
  };

  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    const lower = aiQuery.toLowerCase();
    const parsedFilters: { label: string; value: string }[] = [];
    if (lower.includes('critical') || lower.includes('urgent')) parsedFilters.push({ label: 'Priority', value: 'Critical' });
    else if (lower.includes('high')) parsedFilters.push({ label: 'Priority', value: 'High' });
    if (lower.includes('pending approval') || lower.includes('dept approval')) parsedFilters.push({ label: 'Status', value: 'PENDING_DEPT_APPROVAL' });
    else if (lower.includes('dispatch')) parsedFilters.push({ label: 'Status', value: 'PENDING_IT_DISPATCH' });
    else if (lower.includes('hold')) parsedFilters.push({ label: 'Status', value: 'ON_HOLD' });
    else if (lower.includes('progress')) parsedFilters.push({ label: 'Status', value: 'IN_PROGRESS' });
    else if (lower.includes('done') || lower.includes('resolved')) parsedFilters.push({ label: 'Status', value: 'DONE' });
    if (lower.includes('hardware') || lower.includes('repair')) parsedFilters.push({ label: 'Category', value: 'Hardware Fault & Repair' });
    else if (lower.includes('network') || lower.includes('wifi')) parsedFilters.push({ label: 'Category', value: 'Network & Wi-Fi' });
    if (lower.includes('engineering')) parsedFilters.push({ label: 'Department', value: 'Engineering' });

    const statusMatch = parsedFilters.find((f) => f.label === 'Status');
    const priorityMatch = parsedFilters.find((f) => f.label === 'Priority');
    const categoryMatch = parsedFilters.find((f) => f.label === 'Category');
    const deptMatch = parsedFilters.find((f) => f.label === 'Department');
    if (statusMatch) setStatusFilter(statusMatch.value as TicketStatus);
    if (priorityMatch) setPriorityFilter(priorityMatch.value as TicketPriority);
    if (categoryMatch) setCategoryFilter(categoryMatch.value as TicketCategory);
    if (deptMatch) setDeptFilter(deptMatch.value);
    setAiInterpretation({ filters: parsedFilters, count: total });
  };

  const clearAISearch = () => {
    setAiQuery('');
    setAiInterpretation(null);
    resetAllFilters();
  };

  const handleCreateRequisition = async () => {
    if (!formTitle.trim() || !formAssetId) {
      push({ variant: 'warning', title: 'Missing Information', message: 'Please provide a title and select an asset.' });
      return;
    }
    const created = await ticketService.createTicket({
      requesterId: 'e1',
      assetId: formAssetId,
      category: formCategory,
      priority: formPriority,
      title: formTitle,
      description: formDescription,
      location: formLocation,
    });
    refetch();
    setIsNewTicketModalOpen(false);
    setFormTitle('');
    setFormDescription('');
    push({ variant: 'success', title: 'IT Requisition Submitted', message: `${created.ticketCode} routed to Department Approver for sign-off.` });
  };

  const handleApproveReject = async () => {
    if (!selectedTicket) return;
    await ticketService.decideApproval(selectedTicket.id, { decision: approvalAction, comments: approvalComments });
    refetch();
    setIsApproveModalOpen(false);
    setApprovalComments('');
    push({
      variant: approvalAction === 'Approve' ? 'success' : 'info',
      title: approvalAction === 'Approve' ? 'Requisition Approved' : 'Requisition Rejected',
      message: `${selectedTicket.ticketCode} ${approvalAction === 'Approve' ? 'passed to IT Dispatch Desk' : 'returned to requester'}.`,
    });
  };

  const handleDispatchAssign = async () => {
    if (!selectedTicket) return;
    const tech = technicians.find((t) => t.id === dispatchTechId) ?? technicians[0];
    await ticketService.dispatchTicket(selectedTicket.id, { technicianId: dispatchTechId, estimatedCost: Number(dispatchEstimatedCost) || 0, notes: dispatchNotes });
    refetch();
    setIsDispatchModalOpen(false);
    push({ variant: 'success', title: 'Technician Assigned', message: `${tech?.name ?? 'Technician'} has been dispatched for ${selectedTicket.ticketCode}.` });
  };

  const handleTechnicianStatusUpdate = async () => {
    if (!selectedTicket) return;
    await ticketService.updateExecutionStatus(selectedTicket.id, {
      status: updateTargetStatus,
      holdReason: updateHoldReason,
      resolutionNotes: updateResolutionNotes,
    });
    refetch();
    setIsStatusUpdateModalOpen(false);
    push({ variant: 'success', title: `Status Updated: ${updateTargetStatus}`, message: `Work log recorded for ${selectedTicket.ticketCode}.` });
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'PENDING_DEPT_APPROVAL':
        return <Badge variant="warning" dot>1. Dept Approval</Badge>;
      case 'PENDING_IT_DISPATCH':
        return <Badge variant="brand" dot>2. IT Dispatch</Badge>;
      case 'PLANNING':
        return <Badge variant="accent" dot>3. Planning</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning" dot>3. In-Progress</Badge>;
      case 'ON_HOLD':
        return <Badge variant="error" dot>3. On-Hold</Badge>;
      case 'DONE':
        return <Badge variant="success" dot>4. Resolved</Badge>;
      case 'REJECTED_BY_DEPT':
        return <Badge variant="error" dot>Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'ticketCode',
      header: 'Ticket Code & Subject',
      sortable: true,
      sortValue: (r) => r.ticketCode,
      render: (r) => {
        const Icon = getAssetIcon(r.asset.type);
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-brand-600" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-surface-900">{r.ticketCode}</span>
                <Badge variant={priorityConfig[r.priority].variant} dot>{r.priority}</Badge>
              </div>
              <p className="text-caption text-surface-600 truncate max-w-xs">{r.title}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'asset', header: 'Asset / Device', sortable: true, sortValue: (r) => r.asset.name, render: (r) => (
      <div className="min-w-0"><p className="font-medium text-surface-900 truncate">{r.asset.name}</p><p className="text-caption text-surface-500 font-mono">{r.asset.code} · {r.asset.serialNumber}</p></div>
    ) },
    { key: 'requester', header: 'Requester', sortable: true, sortValue: (r) => r.requester.name, render: (r) => (
      <div className="flex items-center gap-2">
        <Avatar initials={r.requester.initials} size="xs" color={r.requester.avatarColor || 'bg-brand-500'} />
        <div className="min-w-0"><p className="text-caption font-medium text-surface-800 truncate">{r.requester.name}</p><p className="text-[11px] text-surface-400">{r.requester.department}</p></div>
      </div>
    ) },
    { key: 'status', header: 'Workflow Stage', sortable: true, sortValue: (r) => r.status, render: (r) => getStatusBadge(r.status) },
    { key: 'assignedTech', header: 'Assigned Tech', sortable: true, sortValue: (r) => r.itAssignment.technicianName || '', render: (r) => r.itAssignment.technicianName ? (
      <span className="text-caption font-medium text-surface-800">{r.itAssignment.technicianName}</span>
    ) : <span className="text-caption text-surface-400 italic">Unassigned</span> },
    { key: 'date', header: 'Created', sortable: true, sortValue: (r) => r.createdAt, render: (r) => <span className="text-caption text-surface-500">{r.createdAt}</span> },
  ];

  const rowActions = (row: Ticket) => {
    const actions = [{ label: 'View Ticket Details', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/maintenance/${row.ticketCode}`) }];
    if (row.status === 'PENDING_DEPT_APPROVAL') actions.push({ label: 'Department Approval', icon: <ShieldCheck className="h-4 w-4 text-amber-600" />, onClick: () => { setSelectedTicket(row); setIsApproveModalOpen(true); } });
    if (row.status === 'PENDING_IT_DISPATCH') actions.push({ label: 'Assign IT Technician', icon: <Users className="h-4 w-4 text-brand-600" />, onClick: () => { setSelectedTicket(row); setIsDispatchModalOpen(true); } });
    if (['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(row.status)) actions.push({ label: 'Update Tech Status', icon: <ChevronRight className="h-4 w-4 text-emerald-600" />, onClick: () => { setSelectedTicket(row); setIsStatusUpdateModalOpen(true); } });
    actions.push({ label: 'Print Work Order', icon: <PrintIcon className="h-4 w-4" />, onClick: () => push({ variant: 'info', title: 'Print Work Order', message: `Generated printable slip for ${row.ticketCode}` }) });
    return actions;
  };

  return (
    <AppShell current="maintenance" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'IT Requisition & Maintenance' }]}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand">{total} tickets</Badge>
            <div className="inline-flex bg-surface-100 rounded-lg p-0.5 border border-surface-200 text-caption">
              {(['ALL', 'USER', 'DEPT_APPROVER', 'IT_MANAGER', 'IT_TECH'] as RolePerspective[]).map((p) => (
                <button key={p} onClick={() => setPerspective(p)} className={cn('px-2.5 py-1 rounded-md font-medium transition-all', perspective === p ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900')}>
                  {{ ALL: 'All Roles', USER: '👤 Employee', DEPT_APPROVER: '👔 Dept Approver', IT_MANAGER: '🛠️ IT Dispatch', IT_TECH: '🔧 Technician' }[p]}
                </button>
              ))}
            </div>
            {hasActiveFilters && <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={resetAllFilters}>Clear filters</Button>}
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-surface-100 rounded-lg p-0.5 border border-surface-200">
              <button onClick={() => setViewMode('list')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium transition-all flex items-center gap-1.5', viewMode === 'list' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-500')}><List className="h-4 w-4" /><span>Table</span></button>
              <button onClick={() => setViewMode('board')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium transition-all flex items-center gap-1.5', viewMode === 'board' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-500')}><Kanban className="h-4 w-4" /><span>Kanban</span></button>
            </div>
            <Button variant="outline" size="sm" leftIcon={<ShieldCheck className="h-4 w-4 text-amber-600" />} onClick={() => setIsDelegationModalOpen(true)}>Delegated Approvers</Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setFormAssetId(myAssignedAssets[0]?.id || ''); setIsNewTicketModalOpen(true); }}>New IT Requisition</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {([
            { key: 'PENDING_DEPT_APPROVAL', label: '1. Dept Approval', value: stats.pendingDept, icon: ShieldCheck, color: 'amber' },
            { key: 'PENDING_IT_DISPATCH', label: '2. IT Dispatch', value: stats.pendingDispatch, icon: Users, color: 'brand' },
            { key: 'IN_PROGRESS', label: '3. In-Progress', value: stats.inProgress, icon: Clock, color: 'blue' },
            { key: 'ON_HOLD', label: '3. On-Hold', value: stats.onHold, icon: PauseCircle, color: 'warning' },
            { key: 'DONE', label: '4. Resolved', value: stats.done, icon: CheckCircle2, color: 'success' },
          ] as const).map((kpi) => (
            <Card key={kpi.key} className={cn('p-3.5 cursor-pointer transition-all border hover:shadow-sm', statusFilter === kpi.key ? 'border-brand-500 ring-1 ring-brand-500' : 'hover:border-surface-300')} onClick={() => setStatusFilter(statusFilter === kpi.key ? 'ALL' : kpi.key)}>
              <div className="flex items-center justify-between text-caption text-surface-500">
                <span className="font-medium">{kpi.label}</span>
                <div className="h-7 w-7 rounded-md bg-surface-100 flex items-center justify-center"><kpi.icon className="h-4 w-4" /></div>
              </div>
              <p className="text-title font-bold text-surface-900 mt-1">{kpi.value}</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Sparkles className="h-4 w-4 text-brand-500" /></div>
              <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAISearch(); }} placeholder="Ask AI: e.g. 'Show critical hardware repairs pending dispatch'" className="w-full rounded-xl border border-brand-200 bg-brand-50/30 pl-10 pr-4 py-2.5 text-body text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </div>
            <Button size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={handleAISearch} disabled={!aiQuery.trim()}>Ask AI</Button>
          </div>
          {aiInterpretation && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-caption font-medium text-brand-700 mb-1">AI interpreted:</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiInterpretation.filters.map((f, i) => <span key={i} className="inline-flex items-center gap-1 text-caption bg-white border border-brand-200 text-brand-700 px-2 py-0.5 rounded-md font-medium">{f.label} = {f.value}</span>)}
                </div>
                <p className="text-caption text-surface-600 mt-1.5">Found <span className="font-bold text-surface-900">{aiInterpretation.count}</span> matching IT requisition tickets</p>
              </div>
              <button onClick={clearAISearch} className="text-surface-400 hover:text-surface-600 shrink-0"><X className="h-4 w-4" /></button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="card-base p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select label="Workflow Stage" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')} options={[{ value: 'ALL', label: 'All Statuses' }, { value: 'PENDING_DEPT_APPROVAL', label: '1. Pending Dept Approval' }, { value: 'PENDING_IT_DISPATCH', label: '2. Pending IT Dispatch' }, { value: 'IN_PROGRESS', label: '3. In-Progress' }, { value: 'ON_HOLD', label: '3. On-Hold' }, { value: 'DONE', label: '4. Resolved & Closed' }]} />
              <Select label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'ALL')} options={[{ value: 'ALL', label: 'All Priorities' }, { value: 'Critical', label: 'Critical' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
              <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'ALL')} options={[{ value: 'ALL', label: 'All Categories' }, ...categoryOptions.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))]} />
              <Input label="Requester Department" value={deptFilter === 'ALL' ? '' : deptFilter} onChange={(e) => setDeptFilter(e.target.value || 'ALL')} placeholder="e.g. Engineering" />
            </div>
          </div>
        )}

        {error ? (
          <Alert variant="error" title="Unable to load tickets">
            {error} <button onClick={refetch} className="underline font-medium">Retry</button>
          </Alert>
        ) : viewMode === 'list' ? (
          <DataTable
            columns={columns}
            data={perspectiveTickets}
            loading={loading}
            searchable
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by ticket code, asset name, serial, or requester..."
            rowActions={rowActions}
            onRowClick={(row) => navigate(`/maintenance/${row.ticketCode}`)}
            toolbar={<Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>Filters</Button>}
            emptyTitle="No IT requisition tickets found"
            emptyDescription="Try adjusting your search query, perspective, or filters."
            emptyAction={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setFormAssetId(myAssignedAssets[0]?.id || ''); setIsNewTicketModalOpen(true); }}>New IT Requisition</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {([
              { key: 'PENDING_DEPT_APPROVAL' as const, label: '1. Dept Approval', filter: (t: Ticket) => t.status === 'PENDING_DEPT_APPROVAL', action: (t: Ticket) => { setSelectedTicket(t); setIsApproveModalOpen(true); }, actionLabel: 'Approve / Review' },
              { key: 'PENDING_IT_DISPATCH' as const, label: '2. IT Dispatch', filter: (t: Ticket) => t.status === 'PENDING_IT_DISPATCH', action: (t: Ticket) => { setSelectedTicket(t); setIsDispatchModalOpen(true); }, actionLabel: 'Assign Tech' },
              { key: 'ACTIVE' as const, label: '3. Active Triage / Hold', filter: (t: Ticket) => ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status), action: (t: Ticket) => { setSelectedTicket(t); setIsStatusUpdateModalOpen(true); }, actionLabel: 'Update Status' },
              { key: 'DONE' as const, label: '4. Resolved & Verified', filter: (t: Ticket) => t.status === 'DONE', action: (t: Ticket) => navigate(`/maintenance/${t.ticketCode}`), actionLabel: 'View Details' },
            ]).map((col) => {
              const colTickets = perspectiveTickets.filter(col.filter);
              return (
                <div key={col.key} className="bg-surface-50 rounded-xl p-3 border border-surface-200 flex flex-col gap-3 min-h-[400px]">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-body font-semibold text-surface-900">{col.label}</h3>
                    <Badge variant="neutral">{colTickets.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {colTickets.length === 0 ? (
                      <div className="p-8 text-center text-caption text-surface-400 border border-dashed border-surface-200 rounded-lg bg-white/50">No tickets</div>
                    ) : (
                      colTickets.map((t) => (
                        <div key={t.id} onClick={() => navigate(`/maintenance/${t.ticketCode}`)} className="p-3 rounded-lg border border-surface-200 bg-white cursor-pointer hover:border-brand-300 transition-all">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono text-caption font-bold text-surface-900">{t.ticketCode}</span>
                            <Badge variant={priorityConfig[t.priority].variant} dot>{t.priority}</Badge>
                          </div>
                          <p className="text-caption text-surface-700 truncate mb-2">{t.title}</p>
                          <Button size="sm" variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); col.action(t); }}>{col.actionLabel}</Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal open={isNewTicketModalOpen} onClose={() => setIsNewTicketModalOpen(false)} title="Create IT Requisition" description="Submit a service ticket or equipment request." size="lg">
          <div className="flex flex-col gap-4 py-2">
            <Select label="Affected Asset *" value={formAssetId} onChange={(e) => setFormAssetId(e.target.value)} options={[{ value: '', label: '— Select asset —' }, ...assets.map((a) => ({ value: a.id, label: `${a.code} • ${a.name}` }))]} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Category *" value={formCategory} onChange={(e) => setFormCategory(e.target.value as TicketCategory)} options={categoryOptions.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))} />
              <Select label="Priority *" value={formPriority} onChange={(e) => setFormPriority(e.target.value as TicketPriority)} options={[{ value: 'Critical', label: 'Critical (2h SLA)' }, { value: 'High', label: 'High (8h SLA)' }, { value: 'Medium', label: 'Medium (24h SLA)' }, { value: 'Low', label: 'Low (48h SLA)' }]} />
            </div>
            <Input label="Subject / Problem Summary" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            <Textarea label="Detailed Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
            <Input label="Physical Location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setIsNewTicketModalOpen(false)}>Cancel</Button>
              <Button variant="primary" leftIcon={<Send className="h-4 w-4" />} onClick={handleCreateRequisition}>Submit IT Requisition</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isApproveModalOpen && !!selectedTicket} onClose={() => setIsApproveModalOpen(false)} title="Department Approval" description={selectedTicket ? `Reviewing ${selectedTicket.ticketCode} for ${selectedTicket.requester.name}` : ''} size="md">
          {selectedTicket && (
            <div className="flex flex-col gap-4 py-2">
              <div className="bg-surface-50 p-3.5 rounded-lg border border-surface-200">
                <span className="font-mono text-caption font-bold text-surface-900">{selectedTicket.ticketCode}</span>
                <h4 className="text-body font-bold text-surface-900 mt-1">{selectedTicket.title}</h4>
              </div>
              <Select label="Decision" value={approvalAction} onChange={(e) => setApprovalAction(e.target.value as 'Approve' | 'Reject')} options={[{ value: 'Approve', label: 'Approve' }, { value: 'Reject', label: 'Reject' }]} />
              <Textarea label="Comments" value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} rows={2} />
              <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
                <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleApproveReject}>Confirm Decision</Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal open={isDispatchModalOpen && !!selectedTicket} onClose={() => setIsDispatchModalOpen(false)} title="Assign IT Technician" size="md">
          {selectedTicket && (
            <div className="flex flex-col gap-4 py-2">
              <Select label="Technician" value={dispatchTechId} onChange={(e) => setDispatchTechId(e.target.value)} options={technicians.map((t) => ({ value: t.id, label: `${t.name} (${t.specialty})` }))} />
              <Input label="Estimated Cost ($)" type="number" value={dispatchEstimatedCost} onChange={(e) => setDispatchEstimatedCost(e.target.value)} />
              <Textarea label="Dispatch Notes" value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} rows={2} />
              <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
                <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleDispatchAssign}>Confirm Assignment</Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal open={isStatusUpdateModalOpen && !!selectedTicket} onClose={() => setIsStatusUpdateModalOpen(false)} title="Update Technician Status" size="md">
          {selectedTicket && (
            <div className="flex flex-col gap-4 py-2">
              <Select label="Status" value={updateTargetStatus} onChange={(e) => setUpdateTargetStatus(e.target.value as typeof updateTargetStatus)} options={[{ value: 'Planning', label: 'Planning' }, { value: 'In-Progress', label: 'In-Progress' }, { value: 'On-Hold', label: 'On-Hold' }, { value: 'Done', label: 'Done' }]} />
              {updateTargetStatus === 'On-Hold' && <Textarea label="Hold Reason" value={updateHoldReason} onChange={(e) => setUpdateHoldReason(e.target.value)} rows={2} />}
              {updateTargetStatus === 'Done' && <Textarea label="Resolution Notes" value={updateResolutionNotes} onChange={(e) => setUpdateResolutionNotes(e.target.value)} rows={2} />}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
                <Button variant="outline" onClick={() => setIsStatusUpdateModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleTechnicianStatusUpdate}>Save Update</Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal open={isDelegationModalOpen} onClose={() => setIsDelegationModalOpen(false)} title="Delegated Approvers" description="Departments with an acting approver covering for the primary" size="lg">
          <div className="flex flex-col gap-3 py-2">
            {delegationSettings.length === 0 ? (
              <p className="text-body text-surface-500">No delegation settings configured.</p>
            ) : (
              delegationSettings.map((d) => (
                <div key={d.department} className="p-3 rounded-lg border border-surface-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-surface-900">{d.department}</p>
                    <p className="text-caption text-surface-500">{d.primaryApprover.name} → {d.delegatedApprover.name}</p>
                  </div>
                  <Badge variant={d.isActive ? 'success' : 'neutral'}>{d.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              ))
            )}
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
