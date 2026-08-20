import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Printer,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  MapPin,
  ExternalLink,
  RotateCcw,
  User,
  Users,
  Calendar,
  CheckCircle2,
  PauseCircle,
  Edit,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, CardHeader, Button, Badge, Avatar, Tabs, EmptyState, Progress, useToast, SectionCard, Modal, Input, Select, Textarea } from '@/components/ui';
import { getAssetIcon } from '@/data/asset-icons';
import { useTicket } from '@/hooks/useTicket';
import { useAssets } from '@/hooks/useAssets';
import { useEmployees } from '@/hooks/useEmployees';
import { ticketService } from '@/services/ticket-service';
import type { TicketCategory, TicketPriority, ITTechnician } from '@/types/ticket';
import { cn } from '@/lib/cn';

// Ported from src/pages/TicketDetail.tsx (1900+ lines). Reads/writes exclusively through
// ticketService/useTicket — never the requisitionData fixture directly. Consolidated the
// legacy page's 7 tabs into 4 (Overview absorbs Request Details' governance timeline; the
// separate "Approval & Governance" and "Assignment & Work Order" tabs are folded into
// Overview's sidebar cards, matching how AssetDetail/EmployeeDetail condensed their own
// governance sections in Phase 4/5A) — documented in MAINTENANCE-MIGRATION.md, not a silent cut.

const priorityConfig: Record<TicketPriority, { variant: 'error' | 'warning' | 'accent' | 'default'; sla: string; hours: number }> = {
  Critical: { variant: 'error', sla: '2 Hours SLA', hours: 2 },
  High: { variant: 'warning', sla: '8 Hours SLA', hours: 8 },
  Medium: { variant: 'accent', sla: '24 Hours SLA', hours: 24 },
  Low: { variant: 'default', sla: '48 Hours SLA', hours: 48 },
};

const categoryOptions: { label: string; value: TicketCategory }[] = [
  { label: 'Hardware Fault & Repair', value: 'Hardware Fault & Repair' },
  { label: 'Equipment Replacement / Upgrade', value: 'Equipment Replacement' },
  { label: 'Software & OS Issue', value: 'Software & OS Issue' },
  { label: 'Network & Wi-Fi', value: 'Network & Wi-Fi' },
  { label: 'Peripherals & Accessories', value: 'Peripherals & Accessories' },
  { label: 'Account & Access', value: 'Account & Access' },
  { label: 'Preventive Maintenance', value: 'Preventive Maintenance' },
];

export function TicketDetailPage() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const { ticket, loading, error, notFound, refetch } = useTicket(ticketCode);
  const { assets } = useAssets({});
  const { employees } = useEmployees({});

  const [tab, setTab] = useState('overview');
  const [technicians, setTechnicians] = useState<ITTechnician[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [isChangeAssetModalOpen, setIsChangeAssetModalOpen] = useState(false);
  const [isChangeRequesterModalOpen, setIsChangeRequesterModalOpen] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TicketCategory>('Hardware Fault & Repair');
  const [editPriority, setEditPriority] = useState<TicketPriority>('Medium');
  const [editDescription, setEditDescription] = useState('');

  const [approvalDecision, setApprovalDecision] = useState<'Approve' | 'Reject'>('Approve');
  const [approvalComments, setApprovalComments] = useState('');

  const [dispatchTechId, setDispatchTechId] = useState('');
  const [dispatchEstimatedCost, setDispatchEstimatedCost] = useState('250');

  const [updateTargetStatus, setUpdateTargetStatus] = useState<'Planning' | 'In-Progress' | 'On-Hold' | 'Done'>('In-Progress');
  const [updateHoldReason, setUpdateHoldReason] = useState('');
  const [updateResolutionNotes, setUpdateResolutionNotes] = useState('');

  const [changeAssetId, setChangeAssetId] = useState('');
  const [changeRequesterId, setChangeRequesterId] = useState('');

  const [commentsList, setCommentsList] = useState<{ id: string; author: string; text: string; timestamp: string; initials: string; avatarColor: string }[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (ticket) {
      setCommentsList([{ id: 'c1', author: ticket.requester.name, text: ticket.description, timestamp: ticket.createdAt, initials: ticket.requester.initials, avatarColor: ticket.requester.avatarColor }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed comments once per ticket id, not on every ticket field change (e.g. after a status update refetch)
  }, [ticket?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_DEPT_APPROVAL': return <Badge variant="warning" dot>1. Pending Dept Approval</Badge>;
      case 'PENDING_IT_DISPATCH': return <Badge variant="brand" dot>2. Pending IT Dispatch</Badge>;
      case 'PLANNING': return <Badge variant="accent" dot>3. Planning</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning" dot>3. In-Progress</Badge>;
      case 'ON_HOLD': return <Badge variant="error" dot>3. On-Hold</Badge>;
      case 'DONE': return <Badge variant="success" dot>4. Resolved & Closed</Badge>;
      case 'REJECTED_BY_DEPT': return <Badge variant="error" dot>Rejected by Dept</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading) {
    return <AppShell current="maintenance" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Ticket Details' }]}><div className="flex items-center justify-center py-24 text-body text-surface-400">Loading ticket...</div></AppShell>;
  }
  if (error) {
    return <AppShell current="maintenance" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Ticket Details' }]}><EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Unable to load ticket" description={error} action={<Button onClick={refetch}>Retry</Button>} /></AppShell>;
  }
  if (notFound || !ticket) {
    return <AppShell current="maintenance" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Ticket Details' }]}><EmptyState icon={<Wrench className="h-6 w-6" />} title="Ticket not found" description="This ticket may have been removed or the link is out of date." action={<Button onClick={() => navigate('/maintenance')}>Back to IT Requisition Desk</Button>} /></AppShell>;
  }

  const Icon = getAssetIcon(ticket.asset.type);

  const openEditModal = () => {
    setEditTitle(ticket.title);
    setEditCategory(ticket.category);
    setEditPriority(ticket.priority);
    setEditDescription(ticket.description);
    setIsEditModalOpen(true);
  };

  const openDispatchModal = () => {
    ticketService.listTechnicians().then((t) => {
      setTechnicians(t);
      setDispatchTechId(t[0]?.id ?? '');
    });
    setIsDispatchModalOpen(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Wrench className="h-4 w-4" /> },
    { id: 'asset', label: 'Affected Asset', icon: <ExternalLink className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Trail', icon: <ClipboardList className="h-4 w-4" />, count: ticket.timeline.length },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" />, count: commentsList.length },
  ];

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      push({ variant: 'warning', title: 'Subject Required', message: 'Please enter a ticket subject title.' });
      return;
    }
    // Category/priority/title edits aren't yet exposed on ticketService (only workflow-transition
    // operations are — see MAINTENANCE-API-CONTRACT.md); this stays a documented gap rather than
    // a silent no-op.
    push({ variant: 'info', title: 'Not Yet Supported', message: 'Editing ticket scope fields is not implemented in the mock service yet.' });
    setIsEditModalOpen(false);
  };

  const handleDepartmentApproval = async () => {
    await ticketService.decideApproval(ticket.id, { decision: approvalDecision, comments: approvalComments });
    refetch();
    setIsApproveModalOpen(false);
    push({ variant: approvalDecision === 'Approve' ? 'success' : 'warning', title: approvalDecision === 'Approve' ? 'Approved by Department' : 'Requisition Rejected', message: `${ticket.ticketCode} has been ${approvalDecision === 'Approve' ? 'routed to IT Dispatch Desk' : 'rejected'}.` });
  };

  const handleAssignTechnician = async () => {
    const tech = technicians.find((t) => t.id === dispatchTechId) ?? technicians[0];
    await ticketService.dispatchTicket(ticket.id, { technicianId: dispatchTechId, estimatedCost: Number(dispatchEstimatedCost) || 250 });
    refetch();
    setIsDispatchModalOpen(false);
    push({ variant: 'success', title: 'Technician Assigned', message: `${tech?.name ?? 'Technician'} is now working on ${ticket.ticketCode}.` });
  };

  const handleTechnicianStatusUpdate = async () => {
    await ticketService.updateExecutionStatus(ticket.id, { status: updateTargetStatus, holdReason: updateHoldReason, resolutionNotes: updateResolutionNotes });
    refetch();
    setIsStatusUpdateModalOpen(false);
    push({ variant: 'success', title: `Status Updated: ${updateTargetStatus}`, message: `Work log recorded for ${ticket.ticketCode}.` });
  };

  const handleChangeAsset = async () => {
    if (!changeAssetId) return;
    await ticketService.changeAsset(ticket.id, changeAssetId, ticket.requester.name);
    refetch();
    setIsChangeAssetModalOpen(false);
    push({ variant: 'info', title: 'Affected Asset Updated', message: 'The linked asset has been changed.' });
  };

  const handleChangeRequester = async () => {
    if (!changeRequesterId) return;
    const emp = employees.find((e) => e.id === changeRequesterId);
    await ticketService.changeRequester(ticket.id, changeRequesterId);
    refetch();
    setIsChangeRequesterModalOpen(false);
    push({ variant: 'info', title: 'Requester Updated', message: `Ticket requester set to ${emp?.name ?? changeRequesterId}.` });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    setCommentsList([...commentsList, { id: `c-${Date.now()}`, author: 'Sarah Chen', text: newCommentText.trim(), timestamp: 'Just now', initials: 'SC', avatarColor: 'bg-brand-600' }]);
    setNewCommentText('');
    push({ variant: 'success', title: 'Comment Added', message: 'Your message has been posted to the ticket.' });
  };

  return (
    <AppShell current="maintenance" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'IT Requisition & Maintenance', href: '/maintenance' }, { label: ticket.ticketCode }]}>
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate('/maintenance')} className="inline-flex items-center gap-1.5 text-body text-surface-500 hover:text-surface-800 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to IT Requisition Desk
        </button>

        <Card>
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0"><Icon className="h-6 w-6 text-brand-600" /></div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-title font-bold text-surface-900 bg-surface-100 px-2 py-0.5 rounded-lg border border-surface-200">{ticket.ticketCode}</span>
                  {getStatusBadge(ticket.status)}
                  <Badge variant={priorityConfig[ticket.priority].variant} dot>{ticket.priority} ({priorityConfig[ticket.priority].sla})</Badge>
                  <Badge variant="neutral">{ticket.category}</Badge>
                </div>
                <h1 className="text-heading font-bold text-surface-900 mt-2">{ticket.title}</h1>
                <div className="flex items-center gap-4 mt-3 flex-wrap text-caption text-surface-500">
                  <button onClick={() => navigate(`/employees/${ticket.requester.id}`)} className="flex items-center gap-1.5 hover:text-brand-600 transition-colors text-left">
                    <User className="h-3.5 w-3.5 text-brand-500" />
                    <strong className="text-brand-700 hover:underline">{ticket.requester.name}</strong>
                    <span className="text-surface-500 font-normal">({ticket.requester.department})</span>
                  </button>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-surface-400" />{ticket.location}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-surface-400" />Created: {ticket.createdAt}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" leftIcon={<Edit className="h-4 w-4" />} onClick={openEditModal}>Edit Ticket</Button>
              {ticket.status === 'PENDING_DEPT_APPROVAL' && <Button size="sm" variant="outline" leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={() => setIsApproveModalOpen(true)}>Dept Sign-off</Button>}
              {ticket.status === 'PENDING_IT_DISPATCH' && <Button size="sm" variant="outline" leftIcon={<Users className="h-4 w-4" />} onClick={openDispatchModal}>Assign Tech</Button>}
              {['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(ticket.status) && <Button size="sm" variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setIsStatusUpdateModalOpen(true)}>Update Status</Button>}
              <Button size="sm" variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => push({ variant: 'info', title: 'Work Order Printed', message: `Sent work order for ${ticket.ticketCode} to printer.` })}>Print Work Order</Button>
            </div>
          </div>
          <Tabs items={tabs} active={tab} onChange={setTab} className="px-5" />
        </Card>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              {ticket.status === 'ON_HOLD' && (
                <div className="p-4 rounded-xl bg-error-50 border border-error-200 text-error-900 flex items-start gap-3">
                  <PauseCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div><span className="font-bold">Ticket Currently On-Hold</span><p className="text-body mt-1">{ticket.itExecution.holdReason || 'Awaiting parts/vendor.'}</p></div>
                </div>
              )}
              {ticket.status === 'DONE' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <div><span className="font-bold">Requisition Resolved & Closed</span><p className="text-body mt-1">{ticket.itExecution.resolutionNotes || 'All tasks verified.'}</p></div>
                </div>
              )}

              <SectionCard title="Request Details & Symptoms" description="Problem statement and business impact">
                <div className="bg-surface-50 p-4 rounded-xl border border-surface-200">
                  <p className="text-body font-medium text-surface-900">{ticket.description}</p>
                </div>
              </SectionCard>

              <SectionCard title="4-Stage Governance & Audit Trail" description="Complete chain of custody, approvals, dispatch, and work logs">
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200">
                  <GovernanceStep n={1} done label="User Requisition Submitted" detail={`By ${ticket.requester.name} (${ticket.requester.jobTitle})`} timestamp={ticket.createdAt} />
                  <GovernanceStep n={2} done={ticket.departmentApproval.status !== 'Pending'} label="Department Head Sign-off" detail={`Approver: ${ticket.departmentApproval.approverName}`} timestamp={ticket.departmentApproval.approvedAt} extra={ticket.departmentApproval.comments} />
                  <GovernanceStep n={3} done={!!ticket.itAssignment.technicianName} label="IT Dispatch & Assignment" detail={ticket.itAssignment.technicianName ? `Assigned to ${ticket.itAssignment.technicianName} (${ticket.itAssignment.technicianRole})` : 'Awaiting dispatch'} timestamp={ticket.itAssignment.assignedAt} />
                  <GovernanceStep n={4} done={ticket.status === 'DONE'} label="IT Servicing & Resolution" detail={ticket.itExecution.currentStatus} timestamp={ticket.itExecution.completedAt} extra={ticket.itExecution.resolutionNotes} />
                </div>
              </SectionCard>
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader title="SLA & Resolution Target" />
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between"><span className="text-body font-semibold text-surface-800">Priority SLA</span><Badge variant={priorityConfig[ticket.priority].variant} dot>{ticket.priority}</Badge></div>
                  <Progress value={Math.min(100, Math.round((4.5 / ticket.slaTargetHours) * 100))} barClass={ticket.priority === 'Critical' ? 'bg-error-500' : 'bg-brand-500'} />
                  <p className="text-caption text-surface-500">Target: {ticket.slaTargetHours} hours</p>
                </div>
              </Card>
              <Card>
                <CardHeader title="Support Group & Assignment" action={<Button size="sm" variant="ghost" onClick={openDispatchModal}>Reassign</Button>} />
                <div className="p-5">
                  {ticket.itAssignment.technicianName ? (
                    <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 flex items-center gap-3">
                      <Avatar initials={ticket.itAssignment.technicianName.split(' ').map((n) => n[0]).join('')} color={ticket.itAssignment.technicianAvatar || 'bg-brand-600'} />
                      <div><p className="text-body font-bold text-surface-900">{ticket.itAssignment.technicianName}</p><p className="text-caption text-surface-500">{ticket.itAssignment.technicianRole}</p></div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-caption text-amber-800">Awaiting technician dispatch.</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'asset' && (
          <Card>
            <CardHeader title="Affected Asset Profile" action={
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => navigate(`/assets/${ticket.asset.id}`)}>Open Asset Details</Button>
                <Button size="sm" variant="outline" leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />} onClick={() => { setChangeAssetId(ticket.asset.id); setIsChangeAssetModalOpen(true); }}>Change Asset</Button>
              </div>
            } />
            <div className="p-6">
              <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-white border border-surface-200 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-brand-600" /></div>
                <div><h4 className="text-body font-bold text-surface-900">{ticket.asset.name}</h4><p className="text-caption text-surface-500 font-mono">Code: {ticket.asset.code} · S/N: {ticket.asset.serialNumber}</p></div>
              </div>
            </div>
          </Card>
        )}

        {tab === 'audit' && (
          <Card>
            <CardHeader title="Audit Trail" />
            <div className="p-6 space-y-3">
              {ticket.timeline.map((event) => (
                <div key={event.id} className="p-3 rounded-lg border border-surface-200 bg-surface-50/50">
                  <div className="flex items-center justify-between"><span className="font-semibold text-surface-900 text-body-sm">{event.stage}</span><span className="text-caption text-surface-400">{event.timestamp}</span></div>
                  <p className="text-caption text-surface-600 mt-1">{event.action}</p>
                  <p className="text-caption text-surface-500 mt-0.5">By {event.actorName} ({event.actorRole})</p>
                  {event.notes && <p className="text-caption text-surface-500 italic mt-1">{event.notes}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'comments' && (
          <Card>
            <CardHeader title="Comments" description="Team discussion about this ticket" />
            <div className="p-5">
              <div className="flex gap-3 mb-6">
                <Avatar initials="SC" color="bg-brand-500" />
                <div className="flex-1">
                  <textarea placeholder="Add a comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} className="input-base min-h-16 resize-none" />
                  <div className="flex justify-end mt-2"><Button size="sm" onClick={handleAddComment}>Post Comment</Button></div>
                </div>
              </div>
              {commentsList.map((c) => (
                <div key={c.id} className="flex gap-3 py-3 border-t border-surface-100">
                  <Avatar initials={c.initials} color={c.avatarColor} />
                  <div className="flex-1"><div className="flex items-center gap-2"><p className="text-body font-medium text-surface-900">{c.author}</p><p className="text-caption text-surface-400">{c.timestamp}</p></div><p className="text-body text-surface-700 mt-1">{c.text}</p></div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Ticket" size="lg">
          <div className="flex flex-col gap-4 py-2">
            <Input label="Subject" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Category" value={editCategory} onChange={(e) => setEditCategory(e.target.value as TicketCategory)} options={categoryOptions} />
              <Select label="Priority" value={editPriority} onChange={(e) => setEditPriority(e.target.value as TicketPriority)} options={[{ value: 'Critical', label: 'Critical' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
            </div>
            <Textarea label="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Department Approval" size="md">
          <div className="flex flex-col gap-4 py-2">
            <Select label="Decision" value={approvalDecision} onChange={(e) => setApprovalDecision(e.target.value as 'Approve' | 'Reject')} options={[{ value: 'Approve', label: 'Approve' }, { value: 'Reject', label: 'Reject' }]} />
            <Textarea label="Comments" value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} rows={2} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleDepartmentApproval}>Confirm Decision</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title="Assign Technician" size="md">
          <div className="flex flex-col gap-4 py-2">
            <Select label="Technician" value={dispatchTechId} onChange={(e) => setDispatchTechId(e.target.value)} options={technicians.map((t) => ({ value: t.id, label: `${t.name} (${t.specialty})` }))} />
            <Input label="Estimated Cost ($)" type="number" value={dispatchEstimatedCost} onChange={(e) => setDispatchEstimatedCost(e.target.value)} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAssignTechnician}>Confirm Assignment</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isStatusUpdateModalOpen} onClose={() => setIsStatusUpdateModalOpen(false)} title="Update Technician Status" size="md">
          <div className="flex flex-col gap-4 py-2">
            <Select label="Status" value={updateTargetStatus} onChange={(e) => setUpdateTargetStatus(e.target.value as typeof updateTargetStatus)} options={[{ value: 'Planning', label: 'Planning' }, { value: 'In-Progress', label: 'In-Progress' }, { value: 'On-Hold', label: 'On-Hold' }, { value: 'Done', label: 'Done' }]} />
            {updateTargetStatus === 'On-Hold' && <Textarea label="Hold Reason" value={updateHoldReason} onChange={(e) => setUpdateHoldReason(e.target.value)} rows={2} />}
            {updateTargetStatus === 'Done' && <Textarea label="Resolution Notes" value={updateResolutionNotes} onChange={(e) => setUpdateResolutionNotes(e.target.value)} rows={2} />}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setIsStatusUpdateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleTechnicianStatusUpdate}>Save Update</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isChangeAssetModalOpen} onClose={() => setIsChangeAssetModalOpen(false)} title="Change Linked Asset" size="md">
          <div className="flex flex-col gap-4 py-2">
            <Select label="Asset" value={changeAssetId} onChange={(e) => setChangeAssetId(e.target.value)} options={assets.map((a) => ({ value: a.id, label: `${a.code} • ${a.name}` }))} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setIsChangeAssetModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleChangeAsset}>Confirm</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isChangeRequesterModalOpen} onClose={() => setIsChangeRequesterModalOpen(false)} title="Select Requester" size="md">
          <div className="flex flex-col gap-4 py-2">
            <Select label="Employee" value={changeRequesterId} onChange={(e) => setChangeRequesterId(e.target.value)} options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setIsChangeRequesterModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleChangeRequester}>Confirm</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}

function GovernanceStep({ n, done, label, detail, timestamp, extra }: { n: number; done: boolean; label: string; detail: string; timestamp?: string; extra?: string }) {
  return (
    <div className="relative flex items-start gap-3 pl-1">
      <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 text-white shrink-0', done ? 'bg-emerald-600' : 'bg-surface-400')}>{done ? '✓' : n}</div>
      <div className="flex-1 bg-surface-50 p-3 rounded-xl border border-surface-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-body font-bold text-surface-900">{n}. {label}</p>
          {timestamp && <span className="text-caption text-surface-400 font-mono">{timestamp}</span>}
        </div>
        <p className="text-caption text-surface-600 mt-1">{detail}</p>
        {extra && <p className="text-caption text-surface-500 italic mt-1 bg-white p-1.5 rounded border border-surface-200">"{extra}"</p>}
      </div>
    </div>
  );
}
