import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Calendar,
  AlertTriangle,
  Sparkles,
  Wrench,
  History,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  RefreshCw,
  KeyRound,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, CardHeader, Button, Badge, Avatar, Tabs, EmptyState, Progress, useToast, SectionCard, Modal, Select } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { useLicense } from '@/hooks/useLicense';
import { useEmployees } from '@/hooks/useEmployees';
import { useAssets } from '@/hooks/useAssets';
import { useTickets } from '@/hooks/useTickets';
import { licenseService } from '@/services/license-service';
import type { AllocatedSeat, InstalledAssetBinding } from '@/types/license';

// Ported from src/pages/LicenseDetail.tsx (1900+ lines). Reads/writes exclusively through
// licenseService/useLicense. Consolidated the legacy page's 6 tabs into 5 (the standalone "SaaS
// Optimization" tab folds into Overview's sidebar card, same consolidation pattern used for
// AssetDetail/TicketDetail in Phase 4/5B) — see SOFTWARE-LICENSE-MIGRATION.md. The IT Tickets
// tab goes through ticketService (Phase 5B), unlike AssetDetail/EmployeeDetail's equivalent
// tabs which had to defer that when Ticket domain didn't exist yet.

export function LicenseDetailPage() {
  const { licenseId } = useParams<{ licenseId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const { license, loading, error, notFound, refetch } = useLicense(licenseId);
  const { employees } = useEmployees({});
  const { assets } = useAssets({});
  const { tickets: allTickets } = useTickets({});

  const [tab, setTab] = useState('overview');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const [allocateEmployeeId, setAllocateEmployeeId] = useState('');
  const [allocateAssetId, setAllocateAssetId] = useState('');
  const [renewYears, setRenewYears] = useState('1');
  const [renewSeats, setRenewSeats] = useState('');
  const [renewCost, setRenewCost] = useState('');

  const linkedTickets = useMemo(() => {
    if (!license) return [];
    return allTickets.filter((t) => license.linkedTicketCodes.includes(t.ticketCode) || t.title.toLowerCase().includes(license.product.toLowerCase()));
  }, [allTickets, license]);

  const inactiveSeats = useMemo(() => (license ? license.allocatedSeats.filter((s) => s.usageStatus === 'Inactive (>30d)') : []), [license]);

  if (loading) {
    return <AppShell current="licenses" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'License Details' }]}><div className="flex items-center justify-center py-24 text-body text-surface-400">Loading license...</div></AppShell>;
  }
  if (error) {
    return <AppShell current="licenses" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'License Details' }]}><EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Unable to load license" description={error} action={<Button onClick={refetch}>Retry</Button>} /></AppShell>;
  }
  if (notFound || !license) {
    return <AppShell current="licenses" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'License Details' }]}><EmptyState icon={<KeyRound className="h-6 w-6" />} title="License not found" description="This license may have been removed or the link is out of date." action={<Button onClick={() => navigate('/licenses')}>Back to Software Licenses</Button>} /></AppShell>;
  }

  const utilizationPct = Math.round((license.seatsUsed / license.seatsPurchased) * 100);
  const daysUntilExpiry = Math.ceil((new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const potentialWasteSavings = inactiveSeats.length * license.costPerSeat;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <KeyRound className="h-4 w-4" /> },
    { id: 'seats', label: 'Allocated Seats', icon: <Users className="h-4 w-4" />, count: license.allocatedSeats.length },
    { id: 'devices', label: 'Installed Assets', icon: <ExternalLink className="h-4 w-4" />, count: license.installedAssets.length },
    { id: 'tickets', label: 'IT Tickets', icon: <Wrench className="h-4 w-4" />, count: linkedTickets.length },
    { id: 'history', label: 'History & Audit', icon: <History className="h-4 w-4" />, count: license.history.length },
  ];

  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.licenseKey);
    push({ variant: 'success', title: 'License Key Copied', message: 'Master license key copied to clipboard.' });
  };

  const openAllocateModal = () => {
    setAllocateEmployeeId(employees[0]?.id ?? '');
    setAllocateAssetId('');
    setIsAllocateModalOpen(true);
  };

  const openRenewModal = () => {
    setRenewSeats(license.seatsPurchased.toString());
    setRenewCost(license.annualCost.toString());
    setIsRenewModalOpen(true);
  };

  const handleAllocateSeat = async () => {
    if (!allocateEmployeeId) return;
    if (license.seatsUsed >= license.seatsPurchased) {
      push({ variant: 'warning', title: 'Seat Limit Reached', message: `${license.product} has no remaining seats.` });
      return;
    }
    await licenseService.allocateSeat(license.id, { employeeId: allocateEmployeeId, assetId: allocateAssetId || undefined, allocationRole: 'Standard User' });
    refetch();
    setIsAllocateModalOpen(false);
    const emp = employees.find((e) => e.id === allocateEmployeeId);
    push({ variant: 'success', title: 'Seat Allocated', message: `${license.product} assigned to ${emp?.name ?? allocateEmployeeId}.` });
  };

  const handleRevokeSeat = async (seatId: string) => {
    await licenseService.releaseSeat(license.id, seatId);
    refetch();
    push({ variant: 'info', title: 'Seat Revoked', message: 'The seat has been released back to the available pool.' });
  };

  const handleSubmitRenew = async () => {
    const updated = await licenseService.renewLicense(license.id, {
      addedYears: parseInt(renewYears, 10) || 1,
      seatsPurchased: parseInt(renewSeats, 10) || license.seatsPurchased,
      annualCost: parseFloat(renewCost) || license.annualCost,
    });
    refetch();
    setIsRenewModalOpen(false);
    push({ variant: 'success', title: 'Contract Renewed', message: `${updated.product} renewed through ${updated.expiryDate}.` });
  };

  const seatColumns: Column<AllocatedSeat>[] = [
    { key: 'employee', header: 'Employee', render: (r) => (
      <div className="flex items-center gap-2">
        <Avatar initials={r.employeeName.split(' ').map((n) => n[0]).join('')} size="sm" />
        <div>
          <button onClick={() => navigate(`/employees/${r.employeeId}`)} className="font-medium text-surface-900 hover:text-brand-600 transition-colors text-left block">{r.employeeName}</button>
          <p className="text-caption text-surface-500">{r.department}</p>
        </div>
      </div>
    ) },
    { key: 'role', header: 'Role', render: (r) => <Badge variant="neutral">{r.allocationRole}</Badge> },
    { key: 'usage', header: 'Usage Status', render: (r) => <Badge variant={r.usageStatus === 'Daily Active' ? 'success' : r.usageStatus === 'Inactive (>30d)' ? 'error' : 'warning'}>{r.usageStatus}</Badge> },
    { key: 'asset', header: 'Bound Asset', render: (r) => r.assetId ? <button onClick={() => navigate(`/assets/${r.assetId}`)} className="text-caption font-mono text-brand-600 hover:underline">{r.assetCode}</button> : <span className="text-caption text-surface-400">Cloud / SSO Only</span> },
    { key: 'action', header: 'Actions', align: 'right', render: (r) => <Button variant="outline" size="sm" leftIcon={<UserMinus className="h-3.5 w-3.5" />} onClick={() => handleRevokeSeat(r.id)}>Revoke</Button> },
  ];

  const assetColumns: Column<InstalledAssetBinding>[] = [
    { key: 'asset', header: 'Asset', render: (r) => <button onClick={() => navigate(`/assets/${r.assetId}`)} className="font-medium text-surface-900 hover:text-brand-600 text-left">{r.assetName}<p className="text-caption text-surface-500 font-mono">{r.assetCode}</p></button> },
    { key: 'employee', header: 'Assigned To', render: (r) => <span className="text-body-sm text-surface-700">{r.assignedEmployeeName}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'Activated' ? 'success' : r.status === 'Deactivated' ? 'error' : 'warning'}>{r.status}</Badge> },
  ];

  return (
    <AppShell current="licenses" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Software Licenses', href: '/licenses' }, { label: license.product }]}>
      <div className="space-y-6">
        <button onClick={() => navigate('/licenses')} className="inline-flex items-center gap-1.5 text-body text-surface-500 hover:text-surface-800 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Software Licenses
        </button>

        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-surface-900">{license.product}</h1>
                <Badge variant="neutral" className="font-mono">{license.licenseCode}</Badge>
                <Badge variant={license.status === 'Active' ? 'success' : license.status === 'Expired' ? 'error' : 'warning'}>{license.status}</Badge>
              </div>
              <p className="text-body-sm text-surface-500 mt-1">{license.vendor} · {license.category} · {license.type}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={openAllocateModal}>Allocate Seat</Button>
              <Button size="sm" variant="outline" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={openRenewModal}>Renew Contract</Button>
            </div>
          </div>
          <Tabs items={tabs} active={tab} onChange={setTab} className="mt-4" />
        </Card>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <SectionCard title="License Key & Activation">
                <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-surface-200">
                  <span className="font-mono text-body-sm text-surface-800">{isKeyVisible ? license.licenseKey : '••••••••••••••••'}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsKeyVisible((v) => !v)}>{isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                    <Button variant="ghost" size="sm" onClick={handleCopyKey}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="text-caption text-surface-500 mt-2">Activation: {license.activationMethod}</p>
              </SectionCard>
              <SectionCard title="Financials & Contract">
                <div className="grid grid-cols-2 gap-4 text-body-sm">
                  <div><p className="text-caption text-surface-500">Annual Cost</p><p className="font-bold text-surface-900">${license.annualCost.toLocaleString()}</p></div>
                  <div><p className="text-caption text-surface-500">Cost / Seat</p><p className="font-bold text-surface-900">${license.costPerSeat}</p></div>
                  <div><p className="text-caption text-surface-500">PO Number</p><p className="font-medium text-surface-800">{license.poNumber}</p></div>
                  <div><p className="text-caption text-surface-500">Contract Number</p><p className="font-medium text-surface-800">{license.contractNumber}</p></div>
                </div>
              </SectionCard>
            </div>
            <div className="flex flex-col gap-4">
              <Card><CardHeader title="Renewal & Expiry" /><div className="p-5">
                <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-surface-400" /><span className="text-body font-medium text-surface-800">{license.expiryDate}</span></div>
                <Badge variant={daysUntilExpiry <= 0 ? 'error' : daysUntilExpiry <= 30 ? 'warning' : 'success'}>{daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days left`}</Badge>
              </div></Card>
              <Card><CardHeader title="Seat Utilization" /><div className="p-5">
                <div className="flex justify-between text-caption mb-1"><span className="font-bold text-surface-900">{license.seatsUsed} / {license.seatsPurchased}</span><span>{utilizationPct}%</span></div>
                <Progress value={license.seatsUsed} max={license.seatsPurchased} barClass={utilizationPct > 95 ? 'bg-error-500' : utilizationPct > 80 ? 'bg-amber-500' : 'bg-brand-500'} />
              </div></Card>
              {inactiveSeats.length > 0 && (
                <Card className="bg-emerald-50 border-emerald-200"><div className="p-5">
                  <p className="flex items-center gap-1.5 text-caption font-bold text-emerald-800 mb-1"><Sparkles className="h-3.5 w-3.5" />SaaS Optimization</p>
                  <p className="text-body-sm text-emerald-900">{inactiveSeats.length} dormant seats — reclaiming saves <strong>${potentialWasteSavings.toLocaleString()}/yr</strong></p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setTab('seats')}>Review Seats</Button>
                </div></Card>
              )}
            </div>
          </div>
        )}

        {tab === 'seats' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900">Allocated Seats</h2>
              <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={openAllocateModal}>Allocate New Seat</Button>
            </div>
            {license.allocatedSeats.length === 0 ? (
              <EmptyState icon={<Users className="h-10 w-10 text-surface-400" />} title="No Seats Allocated" description="No employees currently hold a seat for this license." />
            ) : (
              <DataTable columns={seatColumns} data={license.allocatedSeats} pageSize={8} />
            )}
          </Card>
        )}

        {tab === 'devices' && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4">Installed Assets</h2>
            {license.installedAssets.length === 0 ? (
              <EmptyState icon={<ExternalLink className="h-10 w-10 text-surface-400" />} title="No Installed Assets" description="This license has no device-bound installations recorded." />
            ) : (
              <DataTable columns={assetColumns} data={license.installedAssets} pageSize={8} />
            )}
          </Card>
        )}

        {tab === 'tickets' && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4">Linked IT Tickets</h2>
            {linkedTickets.length === 0 ? (
              <EmptyState icon={<Wrench className="h-10 w-10 text-surface-400" />} title="No Linked Tickets" description="No IT requisition tickets reference this license." />
            ) : (
              <div className="space-y-3">
                {linkedTickets.map((t) => (
                  <div key={t.id} onClick={() => navigate(`/maintenance/${t.ticketCode}`)} className="p-4 rounded-xl border border-surface-200 hover:border-brand-300 bg-white cursor-pointer flex items-center justify-between">
                    <div><span className="font-mono font-bold text-caption text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{t.ticketCode}</span><p className="text-body-sm font-semibold text-surface-900 mt-1">{t.title}</p></div>
                    <ChevronRight className="h-4 w-4 text-surface-400" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'history' && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4">History & Audit</h2>
            <div className="space-y-2">
              {license.history.map((h) => (
                <div key={h.id} className="p-3 rounded-lg border border-surface-200 bg-surface-50/50">
                  <div className="flex items-center justify-between"><span className="font-semibold text-surface-900 text-body-sm">{h.title}</span><span className="text-caption text-surface-400">{h.date}</span></div>
                  <p className="text-caption text-surface-600 mt-1">{h.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Modal open={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate Seat" size="md">
          <div className="space-y-4">
            <Select label="Employee *" value={allocateEmployeeId} onChange={(e) => setAllocateEmployeeId(e.target.value)} options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))} />
            <Select label="Link Hardware Asset (Optional)" value={allocateAssetId} onChange={(e) => setAllocateAssetId(e.target.value)} options={[{ value: '', label: 'No Hardware Binding' }, ...assets.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))]} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
              <Button variant="outline" onClick={() => setIsAllocateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAllocateSeat}>Confirm Allocation</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Software Subscription" size="md">
          <div className="space-y-4">
            <Select label="Term Extension" value={renewYears} onChange={(e) => setRenewYears(e.target.value)} options={[{ value: '1', label: '+1 Year' }, { value: '2', label: '+2 Years' }, { value: '3', label: '+3 Years' }]} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
              <Button variant="outline" onClick={() => setIsRenewModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmitRenew}>Submit Renewal</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
