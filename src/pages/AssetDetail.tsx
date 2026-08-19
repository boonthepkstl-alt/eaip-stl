import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  QrCode,
  Edit,
  FileText,
  History,
  Settings,
  Shield,
  Calendar,
  Building2,
  Package,
  Download,
  Paperclip,
  Boxes,
  UserPlus,
  ArrowRightLeft,
  Wrench,
  Trash2,
  KeyRound,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, StatusBadge, Tabs, EmptyState, useToast, SectionCard, Avatar } from '@/components/ui';
import Can from '@/components/Can';
import { usePermission } from '@/hooks/usePermission';
import { useAssignAssetForm, useTransferAssetForm } from '@/hooks/useAssetAssignmentForms';
import { AssignAssetDrawer, TransferAssetDrawer } from '@/components/assignment/AssetAssignmentDrawers';
import { assetAPI } from '@/services/asset';
import { masterdataAPI } from '@/services/masterdata';
import { assignmentAPI } from '@/services/assignment';
import { organizationAPI } from '@/services/organization';
import { Asset, AssetHistoryEntry } from '@/types/asset';
import { AssetCategory, AssetLocation, Vendor } from '@/types/masterdata';
import type { Assignment } from '@/types/assignment';
import { Employee } from '@/types/organization';
import { generateQrPayload } from '@/utils/qrcode';
import { formatDateTime } from '@/utils/format';
import { getAssetCategoryIcon } from '@/utils/assetIcon';

interface AssetDetailProps {
  assetId: string;
  onNavigate: (id: string) => void;
}

function resolveLabel<T extends { id: string; name: string }>(id: string | undefined, lookup: T[]): string {
  if (!id) return '—';
  return lookup.find((item) => item.id === id)?.name ?? id;
}

// FR-20..FR-29 (Asset Management) — real data source (assetAPI/masterdataAPI) replacing
// Bolt's @/data/mockData import. Per BOLT_BASE_MIGRATION_PLAN Phase D: Financial Information
// is deleted (out of MVP scope), not just left unimplemented.
//
// MOCKUP-ONLY SECTIONS (added 2026-08-18 per explicit user request, after being shown a
// screenshot of esaps_ai_gemini's AssetDetail): the "License"/"Maintenance & Tickets"/"Audit"/
// "Comments" tabs, the "Active Ticket" banner, the "AI Asset Analysis" card, and the
// "Technical Specifications" section are **static UI mockup only** — there is no AI backend, no
// IT Request service/data model, no license/audit/comment service, and no `specs` field on
// `Asset` (types/asset.ts) behind any of it. Every value in these sections is hardcoded demo
// data — do not wire real state/services into them without re-confirming scope; do not copy this
// pattern into other pages.
//
// Assign/Transfer (below) were re-checked 2026-08-18 and found to sit on top of a REAL,
// workflow-backed service (assignmentAPI.assign/transfer — the same one Assignment.tsx already
// uses) that had simply not been wired here yet; they were wrongly lumped into the mockup list
// above. Wired for real now: both submit for manager approval exactly like Assignment.tsx, not
// an instant local mutation. "Request IT Service"/"Dispose" remain mockup — no such service
// exists.
export function AssetDetail({ assetId, onNavigate }: AssetDetailProps) {
  const { push } = useToast();
  const { can } = usePermission();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistoryEntry[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(null);
    return Promise.all([
      assetAPI.getById(assetId),
      masterdataAPI.listCategories(),
      masterdataAPI.listLocations(),
      masterdataAPI.listVendors(),
      assetAPI.getHistory(assetId),
      organizationAPI.listEmployees(),
      assignmentAPI.list(),
    ])
      .then(([assetResult, categoryResult, locationResult, vendorResult, historyResult, employeeResult, assignmentResult]) => {
        setAsset(assetResult ?? null);
        setCategories(categoryResult);
        setLocations(locationResult);
        setVendors(vendorResult);
        setHistory(historyResult);
        setEmployees(employeeResult);
        setAssignments(assignmentResult);
      })
      .catch(() => {
        setError('ไม่สามารถโหลดข้อมูล Asset ได้ กรุณาลองใหม่อีกครั้ง');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    fetchAll().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  const activeAssignment = assignments.find((a) => a.assetId === assetId && a.status === 'active');

  const { form: assignForm, onSubmit: onAssignSubmit } = useAssignAssetForm({
    open: assignOpen, assetId, employees,
    onSuccess: async () => { setAssignOpen(false); await fetchAll(); },
  });
  const { form: transferForm, onSubmit: onTransferSubmit } = useTransferAssetForm({
    open: transferOpen, assetId, employees, activeAssignment,
    onSuccess: async () => { setTransferOpen(false); await fetchAll(); },
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Settings className="h-4 w-4" /> },
    { id: 'history', label: 'History', icon: <History className="h-4 w-4" />, count: history.length },
    { id: 'files', label: 'Files', icon: <FileText className="h-4 w-4" />, count: asset?.documents?.length ?? 0 },
    { id: 'license', label: 'License', icon: <KeyRound className="h-4 w-4" /> },
    { id: 'maintenance', label: 'Maintenance & Tickets', icon: <Wrench className="h-4 w-4" />, count: 2 },
    { id: 'audit', label: 'Audit', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" />, count: 2 },
  ];

  if (loading) {
    return <div className="text-body text-surface-500">กำลังโหลด...</div>;
  }

  if (error || !asset) {
    return (
      <EmptyState
        icon={<Boxes className="h-6 w-6" />}
        title={error ? 'เกิดข้อผิดพลาด' : 'ไม่พบ Asset นี้'}
        description={error ?? 'Asset ที่ระบุอาจถูกลบหรือไม่มีอยู่ในระบบ'}
        action={<Button size="sm" onClick={() => onNavigate('assets')}>Back to Assets</Button>}
      />
    );
  }

  const CategoryIcon = getAssetCategoryIcon(resolveLabel(asset.categoryId, categories));

  // MOCKUP ONLY — see file header comment.
  const mockupAction = (title: string) => () => push({ variant: 'info', title, message: `${asset.name} — UI mockup only, not a real action yet` });

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => onNavigate('assets')} className="inline-flex items-center gap-1.5 text-body text-surface-500 hover:text-surface-800 transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </button>

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="p-5 flex flex-col lg:flex-row gap-5">
          <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center shrink-0 border border-surface-200">
            <CategoryIcon className="h-10 w-10 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-heading font-bold text-surface-900">{asset.name}</h1>
              <StatusBadge status={asset.status} />
              {/* MOCKUP ONLY */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-bold bg-warning-50 text-warning-700 border border-warning-200">
                <Wrench className="h-3 w-3" /> Active Ticket: REQ-2026-0042
              </span>
            </div>
            <p className="text-body text-surface-500 mt-1">{asset.assetTag}{asset.serialNumber ? ` · ${asset.serialNumber}` : ''}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap text-caption text-surface-500">
              <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{resolveLabel(asset.locationId, locations)}</span>
              <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{resolveLabel(asset.vendorId, vendors)}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Registered {formatDateTime(asset.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeAssignment ? (
              <Button variant="outline" size="sm" leftIcon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => setTransferOpen(true)}>Transfer</Button>
            ) : (
              <Button variant="outline" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>Assign</Button>
            )}
            {/* MOCKUP ONLY — Request IT Service/Dispose */}
            <Button variant="outline" size="sm" leftIcon={<Wrench className="h-4 w-4" />} onClick={mockupAction('Request IT service')}>Request IT Service</Button>
            <Button variant="outline" size="sm" className="text-error-600 hover:bg-error-50 border-error-200" leftIcon={<Trash2 className="h-4 w-4" />} onClick={mockupAction('Disposal requested')}>Dispose</Button>
            <Button variant="outline" size="sm" leftIcon={<QrCode className="h-4 w-4" />} onClick={() => push({ variant: 'info', title: 'QR payload', message: generateQrPayload(asset) })}>
              Print QR
            </Button>
            <Can permission="asset:update">
              <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />} onClick={() => push({ variant: 'info', title: 'Edit mode', message: asset.name })}>
                Edit
              </Button>
            </Can>
          </div>
        </div>
        <Tabs items={tabs} active={tab} onChange={setTab} className="px-5" />
      </Card>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* MOCKUP ONLY — Active Ticket banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-amber-950">REQ-2026-0042</span>
                    <Badge variant="warning" dot>3. In-Progress</Badge>
                    <Badge variant="warning" dot>High (8 Hours SLA)</Badge>
                  </div>
                  <p className="text-body font-semibold text-surface-900 mt-1">Display flickering &amp; battery overheating</p>
                  <p className="text-caption text-surface-600 mt-0.5">Assigned: Alex Rivera · Requester: Sarah Chen</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button size="sm" variant="outline" onClick={mockupAction('View ticket')}>View Ticket</Button>
              </div>
            </div>

            <SectionCard title="General Information" description="Core asset details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Asset Tag" value={asset.assetTag} />
                <InfoRow label="Serial Number" value={asset.serialNumber ?? '—'} />
                <InfoRow label="Category" value={resolveLabel(asset.categoryId, categories)} />
                <InfoRow label="Location" value={resolveLabel(asset.locationId, locations)} />
                <InfoRow label="Vendor" value={resolveLabel(asset.vendorId, vendors)} />
                <InfoRow label="Description" value={asset.description ?? '—'} />
              </div>
            </SectionCard>

            {/* MOCKUP ONLY — `Asset` (types/asset.ts) has no specs field and no service
                populates hardware specs; these are static placeholder rows, same as the other
                MOCKUP ONLY sections noted in the file header comment. */}
            <SectionCard title="Technical Specifications" description="Hardware and system configuration">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Processor" value="Intel Core i7-1355U" />
                <InfoRow label="Memory (RAM)" value="16 GB LPDDR5" />
                <InfoRow label="Storage" value="512 GB SSD" />
                <InfoRow label="Display" value={'14" FHD (1920x1080)'} />
                <InfoRow label="Operating System" value="Windows 11 Pro" />
                <InfoRow label="Graphics" value="Intel Iris Xe" />
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            <SectionCard title="Warranty">
              {asset.warrantyExpiryDate ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-surface-400" />
                    <span className="text-body text-surface-700">Expires {formatDateTime(asset.warrantyExpiryDate)}</span>
                  </div>
                  <Badge variant={new Date(asset.warrantyExpiryDate) < new Date() ? 'error' : 'success'} dot>
                    {new Date(asset.warrantyExpiryDate) < new Date() ? 'Expired' : 'Active'}
                  </Badge>
                </div>
              ) : (
                <p className="text-body text-surface-500">ไม่มีข้อมูลการรับประกัน</p>
              )}
            </SectionCard>

            {/* MOCKUP ONLY — AI Asset Analysis */}
            <SectionCard title="AI Asset Analysis" description="AI-powered health assessment and recommendations">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-success-50 border-success-200">
                  <div className="relative h-16 w-16 shrink-0">
                    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-200" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-success-600" strokeDasharray="155 176" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-title font-bold text-surface-900">88</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-600" />
                      <span className="text-body font-semibold text-success-600">Low Risk</span>
                    </div>
                    <p className="text-caption text-surface-600 mt-0.5">Health Score: 88/100</p>
                    <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden mt-2 max-w-[200px]">
                      <div className="h-full rounded-full bg-success-500" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-500" /> AI Detected
                  </p>
                  <div className="space-y-2">
                    {['Warranty active until January 2027', 'Excellent physical condition', 'Battery cycle count low (22 of 1000)'].map((finding) => (
                      <div key={finding} className="flex items-start gap-2 text-body text-surface-700">
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
                  <p className="text-body text-surface-800">Asset is in optimal condition. No action needed at this time.</p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader title="Asset History" description="Timeline of status/location/field changes" />
          {history.length === 0 ? (
            <EmptyState icon={<History className="h-6 w-6" />} title="No history yet" description="This asset has no recorded change history." />
          ) : (
            <div className="p-5">
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-surface-200" />
                {history.map((h) => (
                  <div key={h.id} className="relative pb-6 last:pb-0">
                    <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
                    <p className="text-caption text-surface-400">{formatDateTime(h.changedAt)}</p>
                    <p className="text-body font-medium text-surface-900 mt-0.5">{h.description}</p>
                    <p className="text-caption text-surface-400 mt-0.5">by {h.changedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'files' && (
        <Card>
          <CardHeader title="Documents" description="Attached files and documents" action={can('asset:update') ? <Button size="sm" variant="outline" leftIcon={<Paperclip className="h-4 w-4" />}>Attach</Button> : undefined} />
          {!asset.documents || asset.documents.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title="No documents" description="No files have been attached to this asset yet." />
          ) : (
            <div className="p-3">
              {asset.documents.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-surface-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-surface-900 truncate">{f.fileName}</p>
                    <p className="text-caption text-surface-500">uploaded by {f.uploadedBy} · {formatDateTime(f.uploadedAt)}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Download ${f.fileName}`}><Download className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* MOCKUP ONLY — License tab, static demo rows, no service behind this */}
      {tab === 'license' && (
        <Card>
          <CardHeader title="Software Licenses" description="Licenses associated with this asset" />
          <div className="p-5">
            {[
              { product: 'Microsoft 365 E5', vendor: 'Microsoft', type: 'Subscription', status: 'Active' },
              { product: 'Adobe Creative Cloud', vendor: 'Adobe', type: 'Subscription', status: 'Expiring Soon' },
            ].map((l) => (
              <div key={l.product} className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
                <div className="h-10 w-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center"><KeyRound className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-surface-900">{l.product}</p>
                  <p className="text-caption text-surface-500">{l.vendor} · {l.type}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MOCKUP ONLY — Maintenance & Tickets tab, static demo rows, no service behind this */}
      {tab === 'maintenance' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-surface-50 rounded-xl border border-surface-200">
              <span className="text-caption text-surface-500 font-medium">Total Tickets</span>
              <p className="text-title font-bold text-surface-900 mt-1">2</p>
            </div>
            <div className="p-3.5 bg-warning-50/60 rounded-xl border border-warning-200">
              <span className="text-caption text-warning-700 font-medium">Active / Open</span>
              <p className="text-title font-bold text-warning-800 mt-1">1</p>
            </div>
            <div className="p-3.5 bg-success-50/60 rounded-xl border border-success-200">
              <span className="text-caption text-success-700 font-medium">Resolved</span>
              <p className="text-title font-bold text-success-800 mt-1">1</p>
            </div>
            <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-200">
              <span className="text-caption text-brand-700 font-medium">SLA Target</span>
              <p className="text-title font-bold text-brand-800 mt-1">100% On-Track</p>
            </div>
          </div>

          <Card>
            <CardHeader
              title="IT Requisition & Maintenance Tickets"
              description="Full history of repairs, upgrades, and IT servicing for this asset"
              action={<Button size="sm" onClick={mockupAction('New requisition')}>New Requisition</Button>}
            />
            <div className="divide-y divide-surface-100">
              {[
                { code: 'REQ-2026-0042', title: 'Display flickering & battery overheating', status: 'In-Progress', priority: 'High' },
                { code: 'REQ-2025-0891', title: 'Annual preventive maintenance check', status: 'Resolved', priority: 'Low' },
              ].map((t) => (
                <div key={t.code} onClick={mockupAction('Open ticket')} className="p-4 hover:bg-surface-50 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0 mt-0.5"><Wrench className="h-5 w-5 text-brand-600" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-surface-900">{t.code}</span>
                        <Badge variant={t.priority === 'High' ? 'warning' : 'neutral'} dot>{t.priority}</Badge>
                        <Badge variant={t.status === 'Resolved' ? 'success' : 'warning'} dot>{t.status}</Badge>
                      </div>
                      <h4 className="text-body font-semibold text-surface-900 mt-1 truncate">{t.title}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* MOCKUP ONLY — Audit tab, static demo rows, no service behind this */}
      {tab === 'audit' && (
        <Card>
          <CardHeader title="Audit Logs" description="System audit trail for this asset" />
          <div className="p-5">
            <div className="space-y-2">
              {[
                { action: 'Asset status changed to "In Maintenance"', user: 'David Kim', time: '2025-07-28 14:32' },
                { action: 'Asset details updated', user: 'Sarah Chen', time: '2025-07-15 09:12' },
                { action: 'Asset assigned', user: 'Admin', time: '2024-01-15 10:00' },
                { action: 'Asset created', user: 'Admin', time: '2024-01-10 08:30' },
              ].map((log) => (
                <div key={log.action + log.time} className="flex items-center gap-3 py-2 border-b border-surface-100 last:border-0">
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

      {/* MOCKUP ONLY — Comments tab, static demo thread, no service behind this */}
      {tab === 'comments' && (
        <Card>
          <CardHeader title="Comments" description="Team discussion about this asset" />
          <div className="p-5">
            <div className="flex gap-3 mb-6">
              <Avatar initials="SP" color="bg-brand-500" size="sm" />
              <div className="flex-1">
                <textarea placeholder="Add a comment..." className="input-base min-h-16 resize-none" />
                <div className="flex justify-end mt-2"><Button size="sm" onClick={mockupAction('Post comment')}>Post Comment</Button></div>
              </div>
            </div>
            {[
              { name: 'Sarah Chen', initials: 'SC', color: 'bg-brand-500', text: 'Battery life has been degrading. Might need a replacement soon.', time: '2 days ago' },
              { name: 'David Kim', initials: 'DK', color: 'bg-warning-500', text: 'I will schedule a diagnostic check for next week.', time: '1 day ago' },
            ].map((c) => (
              <div key={c.name} className="flex gap-3 py-3 border-t border-surface-100">
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

      {/* Assign/Transfer Drawers — real, via assignmentAPI.assign/transfer (submits for manager
          approval), shared with pages/AssetList.tsx via hooks/useAssetAssignmentForms.ts +
          components/assignment/AssetAssignmentDrawers.tsx */}
      <AssignAssetDrawer open={assignOpen} onClose={() => setAssignOpen(false)} form={assignForm} onSubmit={onAssignSubmit} employees={employees} />
      <TransferAssetDrawer
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        form={transferForm}
        onSubmit={onTransferSubmit}
        employees={employees}
        currentHolderName={employees.find((e) => e.id === activeAssignment?.employeeId)?.name ?? activeAssignment?.employeeId ?? ''}
        currentHolderEmployeeId={activeAssignment?.employeeId}
      />
    </div>
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
