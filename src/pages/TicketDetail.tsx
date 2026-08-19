import { useEffect, useState } from 'react';
import {
  ArrowLeft, Wrench, Printer, FileText, MessageSquare, ClipboardList, ShieldCheck,
  MapPin, ExternalLink, RotateCcw, User, Users, Calendar, Laptop, Send, Edit, PauseCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Card, CardHeader, Button, Badge, Avatar, Tabs, Progress, useToast, SectionCard, Modal,
  Input, Select, Textarea,
} from '@/components/ui';
import { assetAPI } from '@/services/asset';
import { masterdataAPI } from '@/services/masterdata';
import { organizationAPI } from '@/services/organization';
import type { Asset } from '@/types/asset';
import type { AssetCategory } from '@/types/masterdata';
import {
  buildSeedTickets, getStatusBadge, getAssetIcon, CATEGORY_OPTIONS, PRIORITY_CONFIG,
  HOLD_CATEGORY_OPTIONS, TECHNICIANS, type ITRequisitionTicket, type TicketCategory,
  type PriorityLevel, type RequisitionStatus,
} from '@/mocks/itRequisition.mock';
import { cn } from '@/lib/cn';

interface TicketDetailProps {
  ticketCode: string;
  onNavigate: (id: string, aid?: string) => void;
}

// MOCKUP ONLY — 2026-08-18. Full-page ticket detail view for the IT Requisition & Maintenance
// mockup (see pages/CheckInCheckOut.tsx header comment for the full scope-decision history),
// ported from esaps_ai_gemini-main/src/pages/TicketDetail.tsx. Re-seeds the same fixed ticket set
// from real asset/employee data on every mount — see mocks/itRequisition.mock.tsx's header
// comment on why this isn't shared live state with the list page. "Change Asset"/"Change
// Requester" pickers from the Gemini original were intentionally dropped (low-value admin
// reassignment flows for a non-persistent mockup) — everything else is ported.
export function TicketDetail({ ticketCode, onNavigate }: TicketDetailProps) {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [allTickets, setAllTickets] = useState<ITRequisitionTicket[]>([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    let cancelled = false;
    Promise.all([assetAPI.list(), masterdataAPI.listCategories(), organizationAPI.listEmployees()])
      .then(([assetResult, categoryResult, employeeResult]) => {
        if (cancelled) return;
        setAssets(assetResult.data);
        setCategories(categoryResult);
        setAllTickets(buildSeedTickets(assetResult.data, employeeResult));
      })
      .catch((err) => push({ variant: 'error', title: 'Could not load reference data', message: err instanceof Error ? err.message : String(err) }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Do NOT fall back to allTickets[0] when the code doesn't match — this page re-seeds its own
  // ticket list independently from CheckInCheckOut.tsx's (see mocks/itRequisition.mock.tsx's
  // header comment), so a ticket created there won't exist here yet. Silently substituting a
  // different ticket would render completely wrong data with no indication of an error; showing
  // "Ticket not found" below is the correct behavior for an unmatched code.
  const ticket = allTickets.find((t) => t.ticketCode === ticketCode);
  const categoryLabel = (assetId?: string) => (assetId ? categories.find((c) => c.id === assets.find((a) => a.id === assetId)?.categoryId)?.name ?? '' : '');

  const updateTicket = (updated: ITRequisitionTicket) => setAllTickets((prev) => prev.map((t) => t.id === updated.id ? updated : t));

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TicketCategory>('Hardware Fault & Repair');
  const [editPriority, setEditPriority] = useState<PriorityLevel>('Medium');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');

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

  const [commentsList, setCommentsList] = useState<{ id: string; author: string; role: string; timestamp: string; text: string; initials: string; avatarColor: string }[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (!ticket) return;
    setCommentsList([
      { id: 'c1', author: ticket.requester.name, role: 'Requester', timestamp: ticket.createdAt, text: ticket.description, initials: ticket.requester.initials, avatarColor: ticket.requester.avatarColor },
      ...(ticket.itAssignment.technicianName ? [{ id: 'c2', author: ticket.itAssignment.technicianName, role: ticket.itAssignment.technicianRole ?? 'Assigned Technician', timestamp: ticket.itAssignment.assignedAt ?? 'Recently', text: ticket.itExecution.diagnosticNotes ?? 'Assigned and began diagnostics.', initials: ticket.itAssignment.technicianName.split(' ').map((n) => n[0]).join(''), avatarColor: 'bg-brand-600' }] : []),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]);

  if (loading) {
    return <div className="text-body text-surface-500">กำลังโหลด...</div>;
  }
  if (!ticket) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => onNavigate('checkin-checkout')} className="inline-flex items-center gap-1.5 text-body text-surface-500 hover:text-surface-800 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to IT Requisition Desk
        </button>
        <p className="text-body text-surface-500">Ticket not found.</p>
      </div>
    );
  }

  const openEditModal = () => {
    setEditTitle(ticket.title);
    setEditCategory(ticket.category);
    setEditPriority(ticket.priority);
    setEditDescription(ticket.description);
    setEditLocation(ticket.location);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      push({ variant: 'warning', title: 'Subject required', message: 'Please enter a ticket subject title.' });
      return;
    }
    updateTicket({
      ...ticket, title: editTitle, category: editCategory, priority: editPriority, slaTargetHours: PRIORITY_CONFIG[editPriority].hours, description: editDescription, location: editLocation,
      timeline: [...ticket.timeline, { id: `tl-${Date.now()}`, stage: 'Creation', actorName: ticket.requester.name, actorRole: 'Requester / Editor', timestamp: 'Just now', action: 'Updated Ticket Details & Scope', notes: `Category: ${editCategory} · Priority: ${editPriority}` }],
    });
    setIsEditModalOpen(false);
    push({ variant: 'success', title: 'Ticket updated (mockup)', message: `${ticket.ticketCode} has been saved.` });
  };

  const handleDepartmentApproval = () => {
    const approved = approvalAction === 'Approve';
    updateTicket({
      ...ticket, status: approved ? 'PENDING_IT_DISPATCH' : 'REJECTED_BY_DEPT',
      departmentApproval: { ...ticket.departmentApproval, status: approved ? 'Approved' : 'Rejected', approvedAt: 'Just now', comments: approvalComments || ticket.departmentApproval.comments },
      timeline: [...ticket.timeline, { id: `tl-${Date.now()}`, stage: 'Dept Approval', actorName: ticket.departmentApproval.approverName, actorRole: 'Department Head', timestamp: 'Just now', action: approved ? 'Department Head Sign-off Approved' : 'Department Head Sign-off Rejected', notes: approvalComments || undefined }],
    });
    setIsApproveModalOpen(false);
    setApprovalComments('');
    push({ variant: approved ? 'success' : 'info', title: approved ? 'Approved by department (mockup)' : 'Requisition rejected (mockup)', message: `${ticket.ticketCode} — UI mockup only, not a real action yet.` });
  };

  const handleAssignTechnician = () => {
    const tech = TECHNICIANS.find((t) => t.id === dispatchTechId) ?? TECHNICIANS[0];
    updateTicket({
      ...ticket, status: 'IN_PROGRESS',
      itAssignment: { ...ticket.itAssignment, technicianId: tech.id, technicianName: tech.name, technicianRole: tech.specialty, assignedBy: 'IT Operations Lead', assignedAt: 'Just now', targetResolutionDate: dispatchTargetDate || ticket.itAssignment.targetResolutionDate },
      itExecution: { ...ticket.itExecution, currentStatus: 'In-Progress' },
      timeline: [...ticket.timeline, { id: `tl-${Date.now()}`, stage: 'IT Assignment', actorName: 'IT Operations Lead', actorRole: 'IT Operations Lead', timestamp: 'Just now', action: `Assigned to ${tech.name} (${tech.specialty})`, notes: dispatchNotes || undefined }],
    });
    setIsDispatchModalOpen(false);
    setDispatchNotes('');
    push({ variant: 'success', title: 'Technician assigned (mockup)', message: `${tech.name} is now working on ${ticket.ticketCode} — UI mockup only.` });
  };

  const handleTechnicianStatusUpdate = () => {
    const nextStatus: RequisitionStatus = updateTargetStatus === 'Planning' ? 'PLANNING' : updateTargetStatus === 'In-Progress' ? 'IN_PROGRESS' : updateTargetStatus === 'On-Hold' ? 'ON_HOLD' : 'DONE';
    updateTicket({
      ...ticket, status: nextStatus,
      itExecution: {
        ...ticket.itExecution,
        currentStatus: updateTargetStatus,
        holdCategory: nextStatus === 'ON_HOLD' ? updateHoldCategory : ticket.itExecution.holdCategory,
        holdReason: nextStatus === 'ON_HOLD' ? updateHoldReason : ticket.itExecution.holdReason,
        resolutionNotes: nextStatus === 'DONE' ? (updateResolutionNotes || 'Issue diagnosed and repaired successfully.') : ticket.itExecution.resolutionNotes,
        completedAt: nextStatus === 'DONE' ? 'Just now' : ticket.itExecution.completedAt,
        // Blank input preserves the prior value; an explicit "0" must be saved as 0, not
        // discarded by `||` falling through to the stale prior value (0 is falsy in JS).
        downtimeHours: nextStatus === 'DONE' ? (updateDowntimeHours.trim() === '' ? ticket.itExecution.downtimeHours : Number(updateDowntimeHours) || 0) : ticket.itExecution.downtimeHours,
        partsUsed: nextStatus === 'DONE' && updatePartsUsed.trim() ? updatePartsUsed.split(',').map((s) => s.trim()).filter(Boolean) : ticket.itExecution.partsUsed,
      },
      timeline: [...ticket.timeline, { id: `tl-${Date.now()}`, stage: nextStatus === 'DONE' ? 'Resolution' : nextStatus === 'ON_HOLD' ? 'On-Hold' : 'In-Progress', actorName: ticket.itAssignment.technicianName ?? 'Technician', actorRole: ticket.itAssignment.technicianRole ?? 'Assigned Technician', timestamp: 'Just now', action: `Status updated to ${updateTargetStatus}` }],
    });
    setIsStatusUpdateModalOpen(false);
    push({ variant: 'success', title: `Status updated: ${updateTargetStatus} (mockup)`, message: `Work log recorded for ${ticket.ticketCode}.` });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    setCommentsList((prev) => [...prev, { id: `c-${Date.now()}`, author: 'You', role: 'Requester', timestamp: 'Just now', text: newCommentText.trim(), initials: 'YO', avatarColor: 'bg-brand-600' }]);
    setNewCommentText('');
    push({ variant: 'success', title: 'Comment added (mockup)', message: 'Your message has been posted to the ticket.' });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Wrench className="h-4 w-4" /> },
    { id: 'details', label: 'Request Details', icon: <FileText className="h-4 w-4" /> },
    { id: 'asset', label: 'Affected Asset', icon: <Laptop className="h-4 w-4" /> },
    { id: 'approval', label: 'Approval & Governance', icon: <ShieldCheck className="h-4 w-4" /> },
    { id: 'assignment', label: 'Assignment & Work Order', icon: <Users className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Trail', icon: <ClipboardList className="h-4 w-4" />, count: ticket.timeline.length },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" />, count: commentsList.length },
  ];

  const quickActions: { label: string; icon: typeof Edit; onClick: () => void }[] = [
    { label: 'Edit Ticket', icon: Edit, onClick: openEditModal },
    ...(ticket.status === 'PENDING_DEPT_APPROVAL' ? [{ label: 'Dept Sign-off', icon: ShieldCheck, onClick: () => { setApprovalAction('Approve'); setIsApproveModalOpen(true); } }] : []),
    ...(ticket.status === 'PENDING_IT_DISPATCH' ? [{ label: 'Assign Tech', icon: Users, onClick: () => { setDispatchTargetDate(''); setIsDispatchModalOpen(true); } }] : []),
    ...(['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(ticket.status) ? [{ label: 'Update Status', icon: RotateCcw, onClick: () => setIsStatusUpdateModalOpen(true) }] : []),
    { label: 'Print Work Order', icon: Printer, onClick: () => push({ variant: 'info', title: 'Print work order (mockup)', message: `UI mockup only — would print a slip for ${ticket.ticketCode}.` }) },
  ];

  const elapsedHours = ticket.status === 'DONE' ? (ticket.itExecution.downtimeHours ?? ticket.slaTargetHours) : Math.min(ticket.slaTargetHours, 4.5);

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb + back link */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={() => onNavigate('checkin-checkout')} className="inline-flex items-center gap-1.5 text-body text-surface-500 hover:text-surface-800 transition-colors w-fit group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to IT Requisition Desk</span>
        </button>
        <div className="flex items-center gap-2 text-caption text-surface-400">
          <span>Home</span>
          <span>/</span>
          <button onClick={() => onNavigate('checkin-checkout')} className="hover:text-surface-700">IT Service</button>
          <span>/</span>
          <button onClick={() => onNavigate('checkin-checkout')} className="hover:text-surface-700">Tickets</button>
          <span>/</span>
          <span className="font-semibold text-surface-800 font-mono">{ticket.ticketCode}</span>
        </div>
      </div>

      {/* Header card */}
      <Card>
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 shadow-xs">
              {getAssetIcon(categoryLabel(ticket.asset.id))}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-title font-bold text-surface-900 bg-surface-100 px-2 py-0.5 rounded-lg border border-surface-200">{ticket.ticketCode}</span>
                {getStatusBadge(ticket.status)}
                <Badge variant={PRIORITY_CONFIG[ticket.priority].variant} dot>{ticket.priority} ({PRIORITY_CONFIG[ticket.priority].sla})</Badge>
                <Badge variant="neutral">{ticket.category}</Badge>
              </div>
              <h1 className="text-heading font-bold text-surface-900 mt-2">{ticket.title}</h1>
              <div className="flex items-center gap-4 mt-3 flex-wrap text-caption text-surface-500">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-brand-500" /><strong className="text-brand-700">{ticket.requester.name}</strong><span className="text-surface-500 font-normal">({ticket.requester.department})</span></span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-surface-400" />{ticket.location}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-surface-400" />Created: {ticket.createdAt}</span>
                {ticket.itAssignment.technicianName && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1.5 text-brand-700 font-medium"><Wrench className="h-3.5 w-3.5" />Assigned: {ticket.itAssignment.technicianName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap lg:self-center">
            {quickActions.map((action) => (
              <Button key={action.label} size="sm" variant="outline" leftIcon={<action.icon className="h-4 w-4" />} onClick={action.onClick}>{action.label}</Button>
            ))}
          </div>
        </div>
        <Tabs items={tabs} active={tab} onChange={setTab} className="px-5" />
      </Card>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {ticket.status === 'ON_HOLD' && (
              <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-900 shadow-xs flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-error-600 text-white flex items-center justify-center shrink-0"><PauseCircle className="h-5 w-5" /></div>
                  <div>
                    <div className="flex items-center gap-2"><span className="font-bold">Ticket Currently On-Hold</span><Badge variant="error" dot>{ticket.itExecution.holdCategory ?? 'Waiting for Spare Parts'}</Badge></div>
                    <p className="text-body text-error-800 mt-1">{ticket.itExecution.holdReason ?? 'Awaiting parts / vendor.'}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="bg-white text-error-700 border-error-300 hover:bg-error-50 shrink-0" onClick={() => { setUpdateTargetStatus('In-Progress'); setIsStatusUpdateModalOpen(true); }}>Resume Work</Button>
              </div>
            )}
            {ticket.status === 'DONE' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <span className="font-bold">Requisition Resolved & Closed</span>
                  <p className="text-body text-emerald-800 mt-1">{ticket.itExecution.resolutionNotes ?? 'All tasks verified successfully.'}</p>
                  <p className="text-caption text-emerald-700 mt-0.5">Completed: {ticket.itExecution.completedAt ?? 'Recently'} · Downtime: {ticket.itExecution.downtimeHours ?? 0} hrs · SLA Target: Met</p>
                </div>
              </div>
            )}

            <SectionCard title="Request Details & Symptoms" description="Detailed issue statement and impact">
              <div className="flex flex-col gap-4">
                <div className="flex justify-end -mt-2 -mb-1">
                  <Button size="sm" variant="ghost" leftIcon={<Edit className="h-3.5 w-3.5" />} onClick={openEditModal}>Edit</Button>
                </div>
                <div className="bg-surface-50 p-4 rounded-xl border border-surface-200">
                  <span className="text-caption text-surface-400 font-semibold block mb-1">Problem / Incident Statement:</span>
                  <p className="text-body font-medium text-surface-900 leading-relaxed">{ticket.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <InfoRow label="Ticket Code" value={ticket.ticketCode} isMono />
                  <InfoRow label="Category" value={ticket.category} />
                  <InfoRow label="Priority / Urgency" value={`${ticket.priority} (${PRIORITY_CONFIG[ticket.priority].sla})`} />
                  <InfoRow label="Device Location" value={ticket.location} />
                  <InfoRow label="Creation Timestamp" value={ticket.createdAt} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Requester Information" description="Employee identity and department linkage">
              <div className="flex items-start justify-between p-3.5 bg-surface-50 rounded-xl border border-surface-200 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={ticket.requester.initials} color={ticket.requester.avatarColor} size="md" />
                  <div>
                    <h4 className="font-bold text-surface-900">{ticket.requester.name}</h4>
                    <p className="text-caption text-surface-500">{ticket.requester.jobTitle} · {ticket.requester.department}</p>
                  </div>
                </div>
                <Badge variant="brand">Requester</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Department" value={ticket.requester.department} />
                <InfoRow label="Job Title" value={ticket.requester.jobTitle} />
                <InfoRow label="Corporate Email" value={ticket.requester.email} />
                <InfoRow label="Desk Location" value={ticket.location} />
              </div>
            </SectionCard>

            <SectionCard
              title="Affected Asset Profile"
              description="Hardware or equipment item requiring maintenance"
            >
              <div className="flex justify-end -mt-2 -mb-1">
                <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => onNavigate('asset-detail', ticket.asset.id)}>Open Asset Details</Button>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-white border border-surface-200 flex items-center justify-center shrink-0 shadow-xs">{getAssetIcon(categoryLabel(ticket.asset.id))}</div>
                  <div>
                    <h4 className="text-body font-bold text-surface-900">{ticket.asset.name}</h4>
                    <p className="text-caption text-surface-500 font-mono mt-0.5">Code: {ticket.asset.code}</p>
                  </div>
                </div>
                <Badge variant="brand" dot>Active in Service</Badge>
              </div>
            </SectionCard>

            <SectionCard title="4-Stage Governance & Audit Trail" description="Complete chain of custody, approvals, dispatch, and work logs">
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-200">
                <div className="relative flex items-start gap-4 pl-1">
                  <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold z-10 shadow-xs">✓</div>
                  <div className="flex-1 bg-surface-50 p-3.5 rounded-xl border border-surface-200">
                    <div className="flex items-center justify-between flex-wrap gap-2"><p className="text-body font-bold text-surface-900">1. User Requisition Submitted</p><span className="text-caption text-surface-400 font-mono">{ticket.createdAt}</span></div>
                    <p className="text-caption text-surface-600 mt-1">Submitted by <strong>{ticket.requester.name}</strong> ({ticket.requester.jobTitle})</p>
                    <p className="text-caption text-surface-500 mt-0.5">Selected Asset: {ticket.asset.name} ({ticket.asset.code})</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4 pl-1">
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold z-10 text-white shadow-xs', ticket.departmentApproval.status === 'Approved' ? 'bg-emerald-600' : ticket.departmentApproval.status === 'Rejected' ? 'bg-error-600' : 'bg-surface-400')}>
                    {ticket.departmentApproval.status === 'Approved' ? '✓' : ticket.departmentApproval.status === 'Rejected' ? '✕' : '2'}
                  </div>
                  <div className="flex-1 bg-surface-50 p-3.5 rounded-xl border border-surface-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-bold text-surface-900">2. Department Head Sign-off</p>
                        {ticket.departmentApproval.status === 'Approved' && <Badge variant="success">Approved</Badge>}
                        {ticket.departmentApproval.status === 'Rejected' && <Badge variant="error">Rejected</Badge>}
                        {ticket.departmentApproval.status === 'Pending' && <Badge variant="warning">Pending Sign-off</Badge>}
                      </div>
                      {ticket.departmentApproval.approvedAt && <span className="text-caption text-surface-400 font-mono">{ticket.departmentApproval.approvedAt}</span>}
                    </div>
                    <p className="mt-2 text-caption text-surface-700">Approver: <strong>{ticket.departmentApproval.approverName}</strong>{ticket.departmentApproval.approverTitle ? ` (${ticket.departmentApproval.approverTitle})` : ''}</p>
                    {ticket.departmentApproval.comments && <div className="mt-2 bg-white p-2.5 rounded border border-surface-200 italic text-surface-600 text-caption">"{ticket.departmentApproval.comments}"</div>}
                  </div>
                </div>
                <div className="relative flex items-start gap-4 pl-1">
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold z-10 text-white shadow-xs', ticket.itAssignment.technicianName ? 'bg-emerald-600' : 'bg-surface-400')}>{ticket.itAssignment.technicianName ? '✓' : '3'}</div>
                  <div className="flex-1 bg-surface-50 p-3.5 rounded-xl border border-surface-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2"><p className="text-body font-bold text-surface-900">3. IT Dispatch Desk</p>{ticket.itAssignment.technicianName ? <Badge variant="brand">Assigned</Badge> : <Badge variant="neutral">Pending Dispatch</Badge>}</div>
                      {ticket.itAssignment.assignedAt && <span className="text-caption text-surface-400 font-mono">{ticket.itAssignment.assignedAt}</span>}
                    </div>
                    {ticket.itAssignment.technicianName ? (
                      <p className="mt-2 text-caption text-surface-700">Assigned to: <strong>{ticket.itAssignment.technicianName}</strong> ({ticket.itAssignment.technicianRole})</p>
                    ) : <p className="text-caption text-surface-400 mt-1 italic">Awaiting IT dispatch assignment to a qualified technician.</p>}
                  </div>
                </div>
                <div className="relative flex items-start gap-4 pl-1">
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold z-10 text-white shadow-xs', ticket.status === 'DONE' ? 'bg-emerald-600' : ticket.status === 'ON_HOLD' ? 'bg-warning-500' : ['PLANNING', 'IN_PROGRESS'].includes(ticket.status) ? 'bg-brand-600' : 'bg-surface-400')}>{ticket.status === 'DONE' ? '✓' : '4'}</div>
                  <div className="flex-1 bg-surface-50 p-3.5 rounded-xl border border-surface-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-bold text-surface-900">4. IT Servicing & Resolution</p>
                        {ticket.status === 'DONE' && <Badge variant="success">Completed</Badge>}
                        {ticket.status === 'IN_PROGRESS' && <Badge variant="warning">In-Progress</Badge>}
                        {ticket.status === 'ON_HOLD' && <Badge variant="error">On-Hold</Badge>}
                      </div>
                      {ticket.itExecution.completedAt && <span className="text-caption text-surface-400 font-mono">{ticket.itExecution.completedAt}</span>}
                    </div>
                    {ticket.itExecution.diagnosticNotes && <div className="mt-2 bg-white p-2.5 rounded border border-surface-200 text-caption"><span className="font-semibold text-surface-800 block mb-0.5">Diagnostic & Work Log:</span><p className="text-surface-600">{ticket.itExecution.diagnosticNotes}</p></div>}
                    {ticket.itExecution.holdReason && <div className="mt-2 bg-warning-50 p-2.5 rounded border border-warning-200 text-caption text-warning-800"><span className="font-semibold block mb-0.5">⚠️ Hold Details ({ticket.itExecution.holdCategory}):</span><p>{ticket.itExecution.holdReason}</p></div>}
                    {ticket.itExecution.resolutionNotes && <div className="mt-2 bg-emerald-50 p-2.5 rounded border border-emerald-200 text-caption text-emerald-900"><span className="font-semibold block mb-0.5">Resolution Summary:</span><p>{ticket.itExecution.resolutionNotes}</p></div>}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="SLA & Resolution Target" description="Service level agreement tracking" />
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-body font-semibold text-surface-800">Priority SLA</span>
                  <Badge variant={PRIORITY_CONFIG[ticket.priority].variant} dot>{ticket.priority} ({PRIORITY_CONFIG[ticket.priority].sla})</Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between text-caption mb-1.5">
                    <span className="text-surface-500">Resolution Progress</span>
                    <span className="font-mono font-bold text-surface-900">{elapsedHours} / {ticket.slaTargetHours} Hours</span>
                  </div>
                  <Progress value={Math.min(100, Math.round((elapsedHours / ticket.slaTargetHours) * 100))} barClass={ticket.priority === 'Critical' ? 'bg-error-500' : 'bg-brand-500'} />
                </div>
                <div className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-[11px] text-surface-600">
                  {ticket.status === 'DONE' ? <>Resolved within target — <strong className="text-surface-800">SLA met</strong></> : <>Remaining: <strong className="text-surface-800">{Math.max(0, ticket.slaTargetHours - elapsedHours).toFixed(1)} Hours</strong></>}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Support Group & Assignment" description="Assigned technical team" />
              <div className="p-5 flex flex-col gap-3">
                {ticket.itAssignment.technicianName ? (
                  <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 flex items-center gap-3">
                    <Avatar initials={ticket.itAssignment.technicianName.split(' ').map((n) => n[0]).join('')} color="bg-brand-600" />
                    <div className="min-w-0">
                      <p className="text-body font-bold text-surface-900 truncate">{ticket.itAssignment.technicianName}</p>
                      <p className="text-caption text-surface-500 truncate">{ticket.itAssignment.technicianRole}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-caption text-amber-800">Awaiting technician dispatch assignment.</div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Department Approver" description="Sign-off hierarchy" />
              <div className="p-5 flex flex-col gap-3 text-caption">
                <div>
                  <span className="text-surface-400 block text-[11px]">Approver</span>
                  <span className="font-semibold text-surface-900">{ticket.departmentApproval.approverName}{ticket.departmentApproval.approverTitle ? ` (${ticket.departmentApproval.approverTitle})` : ''}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Request Details */}
      {tab === 'details' && (
        <Card>
          <CardHeader title="Comprehensive Request Specification" description="Full problem statement and scope" action={<Button size="sm" leftIcon={<Edit className="h-4 w-4" />} onClick={openEditModal}>Edit Scope</Button>} />
          <div className="p-6 flex flex-col gap-6">
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
              <h4 className="text-body font-bold text-surface-900 mb-2">Subject / Issue Summary</h4>
              <p className="text-heading font-semibold text-surface-900">{ticket.title}</p>
              <p className="text-body text-surface-700 mt-2 leading-relaxed">{ticket.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
              <InfoRow label="Ticket Category" value={ticket.category} />
              <InfoRow label="Device Model" value={ticket.asset.name} />
              <InfoRow label="Location / Building" value={ticket.location} />
              <InfoRow label="Creation Timestamp" value={ticket.createdAt} />
              <InfoRow label="Resolution Target SLA" value={PRIORITY_CONFIG[ticket.priority].sla} />
            </div>
          </div>
        </Card>
      )}

      {/* Affected Asset */}
      {tab === 'asset' && (
        <Card>
          <CardHeader
            title="Affected Asset Ledger & Specifications"
            description="Hardware details and ownership"
            action={<Button size="sm" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => onNavigate('asset-detail', ticket.asset.id)}>Open Full Asset Profile</Button>}
          />
          <div className="p-6 flex flex-col gap-6">
            <div className="p-5 bg-surface-50 rounded-2xl border border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white border border-surface-200 flex items-center justify-center shrink-0 shadow-xs">{getAssetIcon(categoryLabel(ticket.asset.id))}</div>
                <div>
                  <h3 className="text-title font-bold text-surface-900">{ticket.asset.name}</h3>
                  <p className="text-body text-surface-500 font-mono mt-0.5">{ticket.asset.code}</p>
                </div>
              </div>
              <Badge variant="brand" dot>Active in Service</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow label="Asset Code" value={ticket.asset.code} isMono />
              <InfoRow label="Equipment Category" value={categoryLabel(ticket.asset.id) || '—'} />
              <InfoRow label="Department" value={ticket.requester.department} />
              <InfoRow label="Location" value={ticket.location} />
            </div>
          </div>
        </Card>
      )}

      {/* Approval & Governance */}
      {tab === 'approval' && (
        <Card>
          <CardHeader
            title="Department Approval & Governance"
            description="Sign-off authority and approval audit"
            action={ticket.status === 'PENDING_DEPT_APPROVAL' ? <Button size="sm" leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={() => { setApprovalAction('Approve'); setIsApproveModalOpen(true); }}>Perform Sign-Off</Button> : undefined}
          />
          <div className="p-6 flex flex-col gap-6">
            <div className="p-5 rounded-2xl border border-surface-200 bg-surface-50">
              <span className="text-caption text-surface-400 font-semibold block mb-2">Department Approver</span>
              <div className="flex items-center gap-3">
                <Avatar initials={ticket.departmentApproval.approverName.slice(0, 2).toUpperCase()} color="bg-indigo-600" size="md" />
                <div>
                  <h4 className="font-bold text-surface-900">{ticket.departmentApproval.approverName}</h4>
                  <p className="text-caption text-surface-500">{ticket.departmentApproval.approverTitle ?? '—'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-surface-200">
              <h4 className="text-body font-bold text-surface-900 mb-2">Approval Decision & Notes</h4>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {ticket.departmentApproval.status === 'Approved' && <Badge variant="success">Approved</Badge>}
                {ticket.departmentApproval.status === 'Rejected' && <Badge variant="error">Rejected</Badge>}
                {ticket.departmentApproval.status === 'Pending' && <Badge variant="warning">Pending Sign-off</Badge>}
                <span className="text-caption text-surface-500">Signed off by {ticket.departmentApproval.approverName} on {ticket.departmentApproval.approvedAt ?? 'Pending'}</span>
              </div>
              {ticket.departmentApproval.comments && (
                <p className="text-body text-surface-700 italic bg-surface-50 p-3 rounded-lg border border-surface-200">"{ticket.departmentApproval.comments}"</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Assignment & Work Order */}
      {tab === 'assignment' && (
        <Card>
          <CardHeader
            title="IT Assignment & Work Order Execution"
            description="Technician, diagnostic notes, parts used, and downtime"
            action={
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" leftIcon={<Users className="h-4 w-4" />} onClick={() => { setDispatchTargetDate(''); setIsDispatchModalOpen(true); }}>Reassign Tech</Button>
                <Button size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setIsStatusUpdateModalOpen(true)}>Update Work Log</Button>
              </div>
            }
          />
          <div className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-caption text-surface-400 block text-[11px]">Assigned Technician</span>
                <p className="text-body font-bold text-surface-900 mt-1">{ticket.itAssignment.technicianName ?? 'Unassigned'}</p>
                <p className="text-caption text-surface-500">{ticket.itAssignment.technicianRole ?? '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <span className="text-caption text-surface-400 block text-[11px]">Target Resolution Window</span>
                <p className="text-body font-bold text-surface-900 mt-1">{ticket.itAssignment.targetResolutionDate ?? '—'}</p>
                <p className="text-caption text-surface-500">Priority SLA: {PRIORITY_CONFIG[ticket.priority].sla}</p>
              </div>
            </div>
            {ticket.itExecution.diagnosticNotes && (
              <div className="p-4 bg-white rounded-xl border border-surface-200">
                <h4 className="text-body font-bold text-surface-900 mb-2">Technical Diagnostic Log</h4>
                <p className="text-body text-surface-700 leading-relaxed bg-surface-50 p-3.5 rounded-xl border border-surface-200">{ticket.itExecution.diagnosticNotes}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-caption text-surface-400 block text-[11px]">Parts Utilized</span>
                <p className="text-body font-semibold text-surface-900 mt-1">{ticket.itExecution.partsUsed?.join(', ') || '—'}</p>
              </div>
              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-caption text-surface-400 block text-[11px]">Asset Total Downtime</span>
                <p className="text-title font-bold text-surface-900 mt-1">{ticket.itExecution.downtimeHours ?? '—'} {ticket.itExecution.downtimeHours != null ? 'Hours' : ''}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Audit Trail */}
      {tab === 'audit' && (
        <Card>
          <CardHeader title="System Audit Logs & Governance History" description="Immutable audit trail of all actions" />
          <div className="divide-y divide-surface-100">
            {ticket.timeline.map((event) => (
              <div key={event.id} className="p-4 flex items-start gap-4 hover:bg-surface-50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-0.5"><ClipboardList className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-semibold text-surface-900">{event.action}</p>
                      {event.badge && <Badge variant="warning">{event.badge}</Badge>}
                    </div>
                    <span className="text-caption text-surface-400 font-mono">{event.timestamp}</span>
                  </div>
                  <p className="text-caption text-surface-600 mt-0.5">Actor: <strong>{event.actorName}</strong> ({event.actorRole})</p>
                  {event.notes && <p className="text-caption text-surface-500 mt-1 bg-surface-50 p-2 rounded border border-surface-200">{event.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comments */}
      {tab === 'comments' && (
        <Card>
          <CardHeader title="Discussion & Team Communications" description="Threaded messages between user, manager, and technician" />
          <div className="p-5 flex flex-col gap-4">
            <div className="space-y-3">
              {commentsList.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-start gap-3">
                  <Avatar initials={c.initials} color={c.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2"><span className="text-body font-bold text-surface-900">{c.author}</span><Badge variant="neutral">{c.role}</Badge></div>
                      <span className="text-caption text-surface-400 font-mono">{c.timestamp}</span>
                    </div>
                    <p className="text-body text-surface-700 mt-1.5 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-surface-200 flex flex-col gap-3">
              <Textarea placeholder="Type your message, work update, or question..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} rows={3} />
              <div className="flex justify-end">
                <Button size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={handleAddComment} disabled={!newCommentText.trim()}>Post Comment</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Ticket Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Ticket: ${ticket.ticketCode}`} description="Update ticket title, category, priority, or location (UI mockup)">
        <div className="flex flex-col gap-4 py-2">
          <Input label="Subject / Summary" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Issue Category" value={editCategory} onChange={(e) => setEditCategory(e.target.value as TicketCategory)} options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))} />
            <Select label="Priority & SLA" value={editPriority} onChange={(e) => setEditPriority(e.target.value as PriorityLevel)} options={[
              { value: 'Critical', label: '🔴 Critical (2 Hours SLA)' },
              { value: 'High', label: '🟠 High (8 Hours SLA)' },
              { value: 'Medium', label: '🔵 Medium (24 Hours SLA)' },
              { value: 'Low', label: '⚪ Low (48 Hours SLA)' },
            ]} />
          </div>
          <Textarea label="Problem Description & Symptoms" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} />
          <Input label="Desk / Pickup Location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit}>Save Changes</Button>
        </div>
      </Modal>

      {/* Department Approval Modal */}
      <Modal open={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Department Head Sign-Off & Approval" description={`Review requisition ${ticket.ticketCode} for ${ticket.requester.name}`}>
        <div className="flex flex-col gap-4 py-2">
          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
            <p className="text-caption text-surface-500">Request Subject:</p>
            <p className="font-semibold text-surface-900">{ticket.title}</p>
            <p className="text-caption text-surface-600 mt-1">Asset: {ticket.asset.name} ({ticket.asset.code})</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setApprovalAction('Approve')} className={cn('p-3 rounded-xl border text-center font-bold transition-all', approvalAction === 'Approve' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20' : 'border-surface-200 text-surface-600 hover:bg-surface-50')}>✓ Approve Request</button>
            <button type="button" onClick={() => setApprovalAction('Reject')} className={cn('p-3 rounded-xl border text-center font-bold transition-all', approvalAction === 'Reject' ? 'border-error-500 bg-error-50 text-error-900 ring-2 ring-error-500/20' : 'border-surface-200 text-surface-600 hover:bg-surface-50')}>✕ Reject Request</button>
          </div>
          <Textarea label="Approval Comments & Instructions" placeholder="Add operational notes or expedited triage instructions..." value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} rows={3} />
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDepartmentApproval}>{approvalAction === 'Approve' ? 'Confirm Approval' : 'Reject Requisition'}</Button>
        </div>
      </Modal>

      {/* Dispatch Modal */}
      <Modal open={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title="IT Dispatch Desk: Assign Technician" description={`Assign technical specialist for ${ticket.ticketCode}`}>
        <div className="flex flex-col gap-4 py-2">
          <Select label="Technician" value={dispatchTechId} onChange={(e) => setDispatchTechId(e.target.value)} options={TECHNICIANS.map((t) => ({ value: t.id, label: `${t.name} — ${t.specialty}` }))} />
          <Input label="Target Resolution Date" type="date" value={dispatchTargetDate} onChange={(e) => setDispatchTargetDate(e.target.value)} />
          <Textarea label="Dispatch Notes" placeholder="Initial diagnostic notes or instructions..." rows={2} value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignTechnician}>Dispatch & Assign</Button>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal open={isStatusUpdateModalOpen} onClose={() => setIsStatusUpdateModalOpen(false)} title="Update Execution Status" description={`Work log for ${ticket.ticketCode}`}>
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
              <Textarea label="Hold Reason Detail" rows={2} value={updateHoldReason} onChange={(e) => setUpdateHoldReason(e.target.value)} />
            </>
          )}
          {updateTargetStatus === 'Done' && (
            <>
              <Textarea label="Resolution Notes" rows={2} value={updateResolutionNotes} onChange={(e) => setUpdateResolutionNotes(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Asset Downtime (Hours)" type="number" value={updateDowntimeHours} onChange={(e) => setUpdateDowntimeHours(e.target.value)} />
                <Input label="Spare Parts Used" helpText="Comma-separated, optional" value={updatePartsUsed} onChange={(e) => setUpdatePartsUsed(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsStatusUpdateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleTechnicianStatusUpdate}>Save Update</Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div>
      <p className="text-caption text-surface-500">{label}</p>
      <p className={cn('text-body font-medium text-surface-900 mt-0.5', isMono && 'font-mono')}>{value}</p>
    </div>
  );
}
