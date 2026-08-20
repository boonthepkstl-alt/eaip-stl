import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  UserPlus,
  ArrowRightLeft,
  Wrench,
  Trash2,
  FileText,
  KeyRound,
  MessageSquare,
  History,
  ClipboardList,
  Settings,
  Shield,
  Calendar,
  Building2,
  User,
  Package,
  Download,
  Paperclip,
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Send,
  Plus,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, StatusBadge, Avatar, Tabs, EmptyState, useToast, SectionCard, Drawer, Modal, Input, Select, Textarea } from '@/components/ui';
import { AppShell } from '@/components/AppShell';
import { getAssetIcon } from '@/data/asset-icons';
import { getAssetHealth } from '@/data/fixtures/aiData';
import type { RequisitionStatus, TicketCategory, PriorityLevel } from '@/data/fixtures/requisitionData';
import { useAsset } from '@/hooks/useAsset';
import { useTickets } from '@/hooks/useTickets';
import { useLicenses } from '@/hooks/useLicenses';
import { ticketService } from '@/services/ticket-service';
import type { Ticket } from '@/types/ticket';
import { cn } from '@/lib/cn';

// Ported from src/pages/AssetDetail.tsx. The core asset record (header, General Information,
// Technical Specifications, Warranty) goes through assetService/useAsset; the Maintenance &
// Tickets tab now goes through ticketService/useTickets as of Phase 5B (closing the
// cross-domain coupling documented in ASSET-MANAGEMENT-MIGRATION.md) — the License tab now
// goes through licenseService/useLicenses as of Phase 5C, closing the same deferred coupling.

const priorityConfig: Record<PriorityLevel, { variant: 'error' | 'warning' | 'accent' | 'default'; sla: string }> = {
  Critical: { variant: 'error', sla: '2 Hours SLA' },
  High: { variant: 'warning', sla: '8 Hours SLA' },
  Medium: { variant: 'accent', sla: '24 Hours SLA' },
  Low: { variant: 'default', sla: '48 Hours SLA' },
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

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const { asset, loading, error, notFound, refetch } = useAsset(assetId);
  const [tab, setTab] = useState('overview');

  const { tickets, refetch: refetchTickets } = useTickets({});
  const assetTickets = useMemo(
    () => (asset ? tickets.filter((t) => t.asset.id === asset.id || t.asset.code === asset.code) : []),
    [tickets, asset]
  );

  const { licenses: allLicenses } = useLicenses({});
  const assetLicenses = useMemo(
    () => (asset ? allLicenses.filter((l) => l.installedAssets.some((ia) => ia.assetId === asset.id)) : []),
    [allLicenses, asset]
  );
  const activeTicket = useMemo(
    () => assetTickets.find((t) => ['PENDING_DEPT_APPROVAL', 'PENDING_IT_DISPATCH', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status)),
    [assetTickets]
  );

  const [selectedTicket] = useState<Ticket | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('Hardware Fault & Repair');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('Medium');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');

  if (loading) {
    return (
      <AppShell current="assets" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Asset Details' }]}>
        <div className="flex items-center justify-center py-24 text-body text-surface-400">Loading asset...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell current="assets" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Asset Details' }]}>
        <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Unable to load asset" description={error} action={<Button onClick={refetch}>Retry</Button>} />
      </AppShell>
    );
  }

  if (notFound || !asset) {
    return (
      <AppShell current="assets" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Asset Details' }]}>
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Asset not found"
          description="This asset may have been removed or the link is out of date."
          action={<Button onClick={() => navigate('/assets')}>Back to Assets</Button>}
        />
      </AppShell>
    );
  }

  const Icon = getAssetIcon(asset.type);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Settings className="h-4 w-4" /> },
    { id: 'history', label: 'History', icon: <History className="h-4 w-4" />, count: 5 },
    { id: 'files', label: 'Files', icon: <FileText className="h-4 w-4" />, count: 3 },
    { id: 'license', label: 'License', icon: <KeyRound className="h-4 w-4" /> },
    { id: 'maintenance', label: 'Maintenance & Tickets', icon: <Wrench className="h-4 w-4" />, count: assetTickets.length },
    { id: 'audit', label: 'Audit', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" />, count: 2 },
  ];

  const quickActions = [
    { label: 'Assign', icon: UserPlus, onClick: () => push({ variant: 'info', title: 'Assign asset', message: asset.name }) },
    { label: 'Transfer', icon: ArrowRightLeft, onClick: () => push({ variant: 'info', title: 'Transfer asset', message: asset.name }) },
    {
      label: 'Request IT Service',
      icon: Wrench,
      onClick: () => {
        setFormTitle(`Service request for ${asset.name}`);
        setFormLocation(asset.location || 'HQ - Floor 4');
        setIsNewTicketModalOpen(true);
      },
    },
    { label: 'Dispose', icon: Trash2, onClick: () => push({ variant: 'warning', title: 'Disposal requested', message: asset.name }), danger: true },
    { label: 'Print QR', icon: QrCode, onClick: () => push({ variant: 'info', title: 'QR code ready', message: asset.code }) },
  ];

  const handleCreateTicket = async () => {
    if (!formTitle.trim()) {
      push({ variant: 'warning', title: 'Subject Required', message: 'Please provide a title or issue summary.' });
      return;
    }
    // No real auth session yet — 'e1' (Sarah Chen) stands in as the current user, same
    // placeholder the legacy page hardcoded directly into the ticket object.
    const created = await ticketService.createTicket({
      requesterId: 'e1',
      assetId: asset.id,
      category: formCategory,
      priority: formPriority,
      title: formTitle,
      description: formDescription || 'Issue submitted directly from Asset Details ledger.',
      location: formLocation,
    });
    refetchTickets();
    setIsNewTicketModalOpen(false);
    setFormTitle('');
    setFormDescription('');
    push({ variant: 'success', title: 'IT Requisition Created', message: `${created.ticketCode} has been routed to Department Approver for sign-off.` });
  };

  const getStatusBadge = (status: RequisitionStatus) => {
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

  return (
    <AppShell current="assets" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Asset Management', href: '/assets' }, { label: asset.name }]}>
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate('/assets')} className="inline-flex items-center gap-1.5 text-body text-surface-500 hover:text-surface-800 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Assets
        </button>

        <Card className="overflow-hidden">
          <div className="p-5 flex flex-col lg:flex-row gap-5">
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center shrink-0 border border-surface-200">
              <Icon className="h-10 w-10 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-heading font-bold text-surface-900">{asset.name}</h1>
                <StatusBadge status={asset.status} />
                <Badge variant="neutral">{asset.condition}</Badge>
                {activeTicket && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Wrench className="h-3 w-3 text-amber-700" /> Active Ticket: {activeTicket.ticketCode}
                  </span>
                )}
              </div>
              <p className="text-body text-surface-500 mt-1">{asset.code} · {asset.serialNumber}</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap text-caption text-surface-500">
                <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{asset.department}</span>
                <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{asset.location}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Purchased {asset.purchaseDate}</span>
                {asset.assignedTo ? (
                  <button
                    onClick={() => navigate(`/employees/${asset.assignedEmployeeId || 'e1'}`)}
                    className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 hover:underline transition-colors font-medium"
                  >
                    <User className="h-3.5 w-3.5 text-brand-500" />
                    {asset.assignedTo}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Unassigned</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {quickActions.map((a) => (
                <Button
                  key={a.label}
                  variant="outline"
                  size="sm"
                  leftIcon={<a.icon className="h-4 w-4" />}
                  onClick={a.onClick}
                  className={a.danger ? 'text-error-600 hover:bg-error-50 border-error-200' : ''}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
          <Tabs items={tabs} active={tab} onChange={setTab} className="px-5" />
        </Card>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              {activeTicket && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-950">{activeTicket.ticketCode}</span>
                        {getStatusBadge(activeTicket.status)}
                        <Badge variant={priorityConfig[activeTicket.priority].variant} dot>
                          {activeTicket.priority} ({priorityConfig[activeTicket.priority].sla})
                        </Badge>
                      </div>
                      <p className="text-body font-semibold text-surface-900 mt-1">{activeTicket.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => navigate('/maintenance')}>
                      Maintenance Desk
                    </Button>
                  </div>
                </div>
              )}

              <SectionCard title="General Information" description="Core asset details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <InfoRow label="Asset Code" value={asset.code} />
                  <InfoRow label="Serial Number" value={asset.serialNumber} />
                  <InfoRow label="Category" value={asset.category} />
                  <InfoRow label="Type" value={asset.type} />
                  <InfoRow label="Vendor" value={asset.vendor} />
                  <InfoRow label="Condition" value={asset.condition} />
                  <InfoRow label="Department" value={asset.department} />
                  <InfoRow label="Location" value={asset.location} />
                </div>
              </SectionCard>

              {asset.specs && asset.specs.length > 0 && (
                <SectionCard title="Technical Specifications" description="Hardware and system configuration">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {asset.specs.map((spec) => (
                      <InfoRow key={spec.label} label={spec.label} value={spec.value} />
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <SectionCard title="Warranty & Coverage">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-surface-400" />
                    <span className="text-body text-surface-700">Expires {asset.warrantyExpiry}</span>
                  </div>
                  <Badge variant={new Date(asset.warrantyExpiry) < new Date() ? 'error' : 'success'} dot>
                    {new Date(asset.warrantyExpiry) < new Date() ? 'Expired' : 'Active Warranty'}
                  </Badge>
                </div>
              </SectionCard>

              {(() => {
                const health = getAssetHealth(asset.id);
                const riskConfig = {
                  low: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200', label: 'Low Risk', icon: CheckCircle2 },
                  medium: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200', label: 'Medium Risk', icon: AlertTriangle },
                  high: { bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200', label: 'High Risk', icon: AlertTriangle },
                }[health.risk];
                const RiskIcon = riskConfig.icon;
                const scoreColor = health.score >= 70 ? 'bg-success-500' : health.score >= 40 ? 'bg-warning-500' : 'bg-error-500';
                return (
                  <SectionCard title="AI Asset Analysis" description="AI-powered health assessment and recommendations">
                    <div className="flex flex-col gap-4">
                      <div className={cn('flex items-center gap-4 p-4 rounded-lg border', riskConfig.bg, riskConfig.border)}>
                        <div className="relative h-16 w-16 shrink-0">
                          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-200" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={riskConfig.text} strokeDasharray={`${(health.score / 100) * 176} 176`} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-title font-bold text-surface-900">{health.score}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <RiskIcon className={cn('h-4 w-4', riskConfig.text)} />
                            <span className={cn('text-body font-semibold', riskConfig.text)}>{riskConfig.label}</span>
                          </div>
                          <p className="text-caption text-surface-600 mt-0.5">Health Score: {health.score}/100</p>
                          <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden mt-2 max-w-[200px]">
                            <div className={cn('h-full rounded-full transition-all', scoreColor)} style={{ width: `${health.score}%` }} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-brand-500" /> AI Detected
                        </p>
                        <div className="space-y-2">
                          {health.findings.map((finding, i) => (
                            <div key={i} className="flex items-start gap-2 text-body text-surface-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-surface-300 mt-2 shrink-0" />
                              {finding}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
                        <p className="text-caption font-medium text-brand-600 mb-1 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5" /> AI Recommendation
                        </p>
                        <p className="text-body text-surface-800">{health.recommendation}</p>
                      </div>
                    </div>
                  </SectionCard>
                );
              })()}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <Card>
            <CardHeader title="Assignment History" description="Timeline of assignments and transfers" />
            <div className="p-5">
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-surface-200" />
                {[
                  { date: '2024-01-15', title: 'Assigned to Sarah Chen', desc: 'Engineering · HQ - Floor 4', user: 'Admin' },
                  { date: '2023-12-01', title: 'Transferred from Storage', desc: 'Moved to HQ - Floor 4', user: 'IT Operations' },
                  { date: '2023-11-20', title: 'Received from Vendor', desc: 'Purchase order PO-2023-0142', user: 'Procurement' },
                  { date: '2023-11-15', title: 'Asset Registered', desc: 'Created in system', user: 'Admin' },
                ].map((h, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
                    <p className="text-caption text-surface-400">{h.date}</p>
                    <p className="text-body font-medium text-surface-900 mt-0.5">{h.title}</p>
                    <p className="text-caption text-surface-500">{h.desc}</p>
                    <p className="text-caption text-surface-400 mt-0.5">by {h.user}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {tab === 'files' && (
          <Card>
            <CardHeader title="Documents" description="Attached files and documents" action={<Button size="sm" variant="outline" leftIcon={<Paperclip className="h-4 w-4" />}>Attach</Button>} />
            <div className="p-3">
              {[
                { name: 'Purchase_Receipt.pdf', size: '124 KB', date: '2024-01-15' },
                { name: 'Warranty_Certificate.pdf', size: '89 KB', date: '2024-01-15' },
              ].map((f) => (
                <div key={f.name} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-surface-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-surface-900 truncate">{f.name}</p>
                    <p className="text-caption text-surface-500">{f.size} · {f.date}</p>
                  </div>
                  <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'license' && (
          <Card>
            <CardHeader title="Software Licenses" description="Licenses associated with this asset" />
            <div className="p-5">
              {assetLicenses.length === 0 ? (
                <EmptyState icon={<KeyRound className="h-10 w-10 text-surface-400" />} title="No Software Licenses" description="No license has an installed binding recorded for this asset." />
              ) : (
                assetLicenses.map((l) => (
                  <div key={l.id} onClick={() => navigate(`/licenses/${l.id}`)} className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0 cursor-pointer hover:bg-surface-50/60 transition-colors rounded-lg px-2 -mx-2">
                    <div className="h-10 w-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center"><KeyRound className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-surface-900">{l.product}</p>
                      <p className="text-caption text-surface-500">{l.vendor} · {l.type}</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {tab === 'maintenance' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-surface-50 rounded-xl border border-surface-200">
                <span className="text-caption text-surface-500 font-medium">Total Tickets</span>
                <p className="text-title font-bold text-surface-900 mt-1">{assetTickets.length}</p>
              </div>
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                <span className="text-caption text-amber-700 font-medium">Active / Open</span>
                <p className="text-title font-bold text-amber-900 mt-1">
                  {assetTickets.filter((t) => t.status !== 'DONE' && t.status !== 'REJECTED_BY_DEPT').length}
                </p>
              </div>
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <span className="text-caption text-emerald-700 font-medium">Resolved & Closed</span>
                <p className="text-title font-bold text-emerald-900 mt-1">{assetTickets.filter((t) => t.status === 'DONE').length}</p>
              </div>
              <div className="p-3.5 bg-brand-50/50 rounded-xl border border-brand-200">
                <span className="text-caption text-brand-700 font-medium">SLA Resolution Target</span>
                <p className="text-title font-bold text-brand-900 mt-1">100% On-Track</p>
              </div>
            </div>

            <Card>
              <CardHeader
                title="IT Requisition & Maintenance Tickets (REQ-xxxx)"
                description="Full audit history of repairs, upgrades, and IT servicing for this asset"
                action={
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => navigate('/maintenance')}>
                      Open Maintenance Desk
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => {
                        setFormTitle(`Report issue with ${asset.name}`);
                        setFormLocation(asset.location || 'HQ - Floor 4');
                        setIsNewTicketModalOpen(true);
                      }}
                    >
                      New Requisition
                    </Button>
                  </div>
                }
              />
              {assetTickets.length === 0 ? (
                <EmptyState
                  icon={<Wrench className="h-8 w-8 text-surface-400" />}
                  title="No IT Requisition Tickets Recorded"
                  description="This asset is currently in good condition with no open or past maintenance requisitions."
                />
              ) : (
                <div className="divide-y divide-surface-100">
                  {assetTickets.map((t) => (
                    <div key={t.id} className="p-4 hover:bg-surface-50 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Wrench className="h-5 w-5 text-brand-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-surface-900">{t.ticketCode}</span>
                            <Badge variant={priorityConfig[t.priority].variant} dot>{t.priority}</Badge>
                            {getStatusBadge(t.status)}
                          </div>
                          <h4 className="text-body font-semibold text-surface-900 mt-1 truncate">{t.title}</h4>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4 text-surface-400" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'audit' && (
          <Card>
            <CardHeader title="Audit Logs" description="System audit trail for this asset" />
            <div className="p-5">
              <div className="space-y-2">
                {[
                  { action: 'Asset status changed to "In Maintenance"', user: 'David Kim', time: '2025-07-28 14:32' },
                  { action: 'Asset details updated', user: 'Sarah Chen', time: '2025-07-15 09:12' },
                  { action: 'Asset created', user: 'Admin', time: '2024-01-10 08:30' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-surface-100 last:border-0">
                    <ClipboardList className="h-4 w-4 text-surface-400 shrink-0" />
                    <p className="text-body text-surface-700 flex-1">{log.action}</p>
                    <p className="text-caption text-surface-500">{log.user}</p>
                    <p className="text-caption text-surface-400 w-32 text-right">{log.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {tab === 'comments' && (
          <Card>
            <CardHeader title="Comments" description="Team discussion about this asset" />
            <div className="p-5">
              <div className="flex gap-3 mb-6">
                <Avatar initials="AM" color="bg-brand-500" size="sm" />
                <div className="flex-1">
                  <textarea placeholder="Add a comment..." className="input-base min-h-16 resize-none" />
                  <div className="flex justify-end mt-2"><Button size="sm">Post Comment</Button></div>
                </div>
              </div>
              {[
                { name: 'Sarah Chen', initials: 'SC', color: 'bg-brand-500', text: 'Battery life has been degrading. Might need a replacement soon.', time: '2 days ago' },
              ].map((c, i) => (
                <div key={i} className="flex gap-3 py-3 border-t border-surface-100">
                  <Avatar initials={c.initials} color={c.color} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-medium text-surface-900">{c.name}</p>
                      <p className="text-caption text-surface-400">{c.time}</p>
                    </div>
                    <p className="text-body text-surface-700 mt-1">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Drawer
          open={isDetailDrawerOpen && !!selectedTicket}
          onClose={() => setIsDetailDrawerOpen(false)}
          title={selectedTicket ? `Ticket: ${selectedTicket.ticketCode}` : 'Ticket Details'}
          width="max-w-xl"
        >
          {selectedTicket && (
            <div className="flex flex-col gap-2 py-2 text-body text-surface-700">
              {selectedTicket.description}
            </div>
          )}
        </Drawer>

        <Modal
          open={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          title="Submit IT Requisition / Report Issue"
          description={`Creating a service request for ${asset.name} (${asset.code})`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewTicketModalOpen(false)}>Cancel</Button>
              <Button leftIcon={<Send className="h-4 w-4" />} onClick={handleCreateTicket}>Submit Requisition</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900">{asset.name}</p>
                  <p className="text-caption text-surface-500 font-mono">{asset.code} · {asset.serialNumber}</p>
                </div>
              </div>
              <Badge variant="neutral">{asset.type}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Issue Category" value={formCategory} onChange={(e) => setFormCategory(e.target.value as TicketCategory)} options={categoryOptions} />
              <Select
                label="Priority & SLA"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                options={[
                  { value: 'Critical', label: '🔴 Critical (2 Hours SLA)' },
                  { value: 'High', label: '🟠 High (8 Hours SLA)' },
                  { value: 'Medium', label: '🔵 Medium (24 Hours SLA)' },
                  { value: 'Low', label: '⚪ Low (48 Hours SLA)' },
                ]}
              />
            </div>

            <Input label="Subject / Issue Summary" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            <Textarea label="Detailed Description & Symptoms" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
            <Input label="Device Location / Desk Pickup" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-caption text-amber-800 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Automated Routing & Governance:</p>
                <p>This request will be routed to your Department Approver before dispatching to IT Technicians.</p>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-caption text-surface-500">{label}</p>
      <p className="text-body font-medium text-surface-900 mt-0.5">{value}</p>
    </div>
  );
}
