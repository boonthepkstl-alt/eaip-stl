import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  KeyRound,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  UserPlus,
  List,
  LayoutGrid,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, Button, Badge, Progress, useToast, EmptyState, Modal, Input, Select, Alert } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { useAssets } from '@/hooks/useAssets';
import { useEmployees } from '@/hooks/useEmployees';
import { useLicenses } from '@/hooks/useLicenses';
import { licenseService } from '@/services/license-service';
import type { SoftwareLicense, LicenseCategory, LicenseType, LicenseStatus } from '@/types/license';
import { cn } from '@/lib/cn';

// Ported from src/pages/SoftwareLicense.tsx. Reads/writes exclusively through
// licenseService/useLicenses — never data/fixtures/licenseData.ts directly. See
// SOFTWARE-LICENSE-MIGRATION.md.

const statusStyles: Record<LicenseStatus, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  Active: { variant: 'success', label: 'Active' },
  'Expiring Soon': { variant: 'warning', label: 'Expiring Soon' },
  Expired: { variant: 'error', label: 'Expired' },
  'Over-Allocated': { variant: 'error', label: 'Over-Allocated' },
  'Under-Utilized': { variant: 'default', label: 'Under-Utilized' },
};

export function LicensesPage() {
  const navigate = useNavigate();
  const { push } = useToast();

  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'optimization'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<'all' | 'expiring' | 'high-spend' | 'risk'>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<SoftwareLicense | null>(null);

  const [newProduct, setNewProduct] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newCategory, setNewCategory] = useState<LicenseCategory>('Productivity & Office');
  const [newType, setNewType] = useState<LicenseType>('Subscription (Named User)');
  const [newSeatsPurchased, setNewSeatsPurchased] = useState('50');
  const [newAnnualCost, setNewAnnualCost] = useState('12000');
  const [newExpiryDate, setNewExpiryDate] = useState('2027-08-30');

  const [allocateLicenseId, setAllocateLicenseId] = useState('');
  const [allocateEmployeeId, setAllocateEmployeeId] = useState('');
  const [allocateAssetId, setAllocateAssetId] = useState('');

  const [renewYears, setRenewYears] = useState('1');
  const [renewSeats, setRenewSeats] = useState('100');
  const [renewCost, setRenewCost] = useState('24000');

  const { employees } = useEmployees({});
  const { assets } = useAssets({});
  const { licenses: filteredByChip, total, loading, error, refetch } = useLicenses({
    search: searchQuery,
    status: activeChip === 'expiring' ? undefined : 'all',
  });

  const filteredLicenses = useMemo(() => {
    return filteredByChip.filter((l) => {
      if (activeChip === 'expiring') return l.status === 'Expiring Soon' || l.status === 'Expired';
      if (activeChip === 'high-spend') return l.annualCost >= 40000;
      if (activeChip === 'risk') return l.complianceStatus === 'Audit Warning' || l.complianceStatus === 'True-Up Required';
      return true;
    });
  }, [filteredByChip, activeChip]);

  const totalSpend = useMemo(() => filteredByChip.reduce((sum, l) => sum + l.annualCost, 0), [filteredByChip]);
  const expiringCount = useMemo(() => filteredByChip.filter((l) => l.status === 'Expiring Soon').length, [filteredByChip]);
  const totalSeatsPurchased = useMemo(() => filteredByChip.reduce((sum, l) => sum + l.seatsPurchased, 0), [filteredByChip]);
  const totalSeatsUsed = useMemo(() => filteredByChip.reduce((sum, l) => sum + l.seatsUsed, 0), [filteredByChip]);
  const overallUtilizationPct = totalSeatsPurchased > 0 ? Math.round((totalSeatsUsed / totalSeatsPurchased) * 100) : 0;
  const totalPotentialSavings = useMemo(
    () => filteredByChip.reduce((sum, l) => sum + l.allocatedSeats.filter((s) => s.usageStatus === 'Inactive (>30d)').length * l.costPerSeat, 0),
    [filteredByChip]
  );

  const handleOpenAllocateModal = (lic?: SoftwareLicense) => {
    setAllocateLicenseId((lic ?? filteredByChip[0])?.id ?? '');
    setAllocateEmployeeId(employees[0]?.id ?? '');
    setAllocateAssetId('');
    setIsAllocateModalOpen(true);
  };

  const handleOpenRenewModal = (lic: SoftwareLicense) => {
    setSelectedLicense(lic);
    setRenewSeats(lic.seatsPurchased.toString());
    setRenewCost(lic.annualCost.toString());
    setIsRenewModalOpen(true);
  };

  const handleAddLicense = async () => {
    if (!newProduct.trim() || !newVendor.trim()) {
      push({ variant: 'warning', title: 'Missing Required Fields', message: 'Please provide at least a Product Name and Vendor.' });
      return;
    }
    const created = await licenseService.createLicense({
      product: newProduct,
      vendor: newVendor,
      category: newCategory,
      type: newType,
      seatsPurchased: parseInt(newSeatsPurchased, 10) || 10,
      annualCost: parseFloat(newAnnualCost) || 5000,
      expiryDate: newExpiryDate,
    });
    refetch();
    setIsAddModalOpen(false);
    setNewProduct('');
    setNewVendor('');
    push({ variant: 'success', title: 'Software License Registered', message: `${created.product} (${created.licenseCode}) added to the ledger.` });
  };

  const handleSubmitAllocate = async () => {
    const targetLicense = filteredByChip.find((l) => l.id === allocateLicenseId);
    if (!targetLicense || !allocateEmployeeId) return;
    if (targetLicense.seatsUsed >= targetLicense.seatsPurchased) {
      push({ variant: 'warning', title: 'Seat Limit Reached', message: `${targetLicense.product} has no remaining seats.` });
      return;
    }
    await licenseService.allocateSeat(targetLicense.id, { employeeId: allocateEmployeeId, assetId: allocateAssetId || undefined, allocationRole: 'Standard User' });
    refetch();
    setIsAllocateModalOpen(false);
    const emp = employees.find((e) => e.id === allocateEmployeeId);
    push({ variant: 'success', title: 'Seat Allocated', message: `Allocated ${targetLicense.product} to ${emp?.name ?? allocateEmployeeId}.` });
  };

  const handleSubmitRenew = async () => {
    if (!selectedLicense) return;
    const updated = await licenseService.renewLicense(selectedLicense.id, {
      addedYears: parseInt(renewYears, 10) || 1,
      seatsPurchased: parseInt(renewSeats, 10) || selectedLicense.seatsPurchased,
      annualCost: parseFloat(renewCost) || selectedLicense.annualCost,
    });
    refetch();
    setIsRenewModalOpen(false);
    push({ variant: 'success', title: 'Contract Renewed', message: `${updated.product} renewed through ${updated.expiryDate}.` });
  };

  const columns: Column<SoftwareLicense>[] = [
    {
      key: 'product', header: 'Product & Package', sortable: true, sortValue: (r) => r.product, render: (r) => (
        <div className="min-w-0">
          <button onClick={() => navigate(`/licenses/${r.id}`)} className="font-bold text-surface-900 hover:text-brand-600 transition-colors text-left block truncate max-w-[220px]">{r.product}</button>
          <div className="flex items-center gap-2 mt-0.5"><span className="font-mono text-caption font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded">{r.licenseCode}</span><span className="text-caption text-surface-500 truncate max-w-[140px]">{r.vendor}</span></div>
        </div>
      ),
    },
    { key: 'category', header: 'Category & Model', render: (r) => <div><span className="text-surface-800 font-medium text-body-sm block">{r.category}</span><span className="text-caption text-surface-500 font-mono">{r.type}</span></div> },
    {
      key: 'seatsUsed', header: 'Seat Utilization', sortable: true, sortValue: (r) => r.seatsUsed, render: (r) => {
        const pct = Math.round((r.seatsUsed / r.seatsPurchased) * 100);
        return (
          <div className="w-40 space-y-1">
            <div className="flex justify-between text-caption font-medium"><span className="text-surface-900 font-bold">{r.seatsUsed} / {r.seatsPurchased}</span><span className={pct > 95 ? 'text-error-600 font-bold' : pct > 80 ? 'text-amber-600 font-bold' : 'text-surface-600'}>{pct}%</span></div>
            <Progress value={r.seatsUsed} max={r.seatsPurchased} barClass={pct > 95 ? 'bg-error-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'} />
          </div>
        );
      },
    },
    { key: 'annualCost', header: 'Financials', sortable: true, sortValue: (r) => r.annualCost, render: (r) => <div><span className="font-bold text-surface-900 text-body-sm block">${r.annualCost.toLocaleString()}/yr</span><span className="text-caption text-surface-500">${r.costPerSeat} / seat</span></div> },
    { key: 'expiryDate', header: 'Renewal Date', sortable: true, sortValue: (r) => r.expiryDate, render: (r) => <span className="text-surface-900 font-medium text-body-sm flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-surface-400" />{r.expiryDate}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={statusStyles[r.status]?.variant || 'default'}>{statusStyles[r.status]?.label || r.status}</Badge> },
    { key: 'actions', header: 'Actions', align: 'right', render: (r) => <Button variant="outline" size="sm" onClick={() => navigate(`/licenses/${r.id}`)} rightIcon={<ChevronRight className="h-3 w-3" />}>Details</Button> },
  ];

  return (
    <AppShell current="licenses" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Software Licenses' }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-surface-900">Software Licenses & SaaS Management</h1>
            <p className="text-body-sm text-surface-500">Monitor enterprise software subscriptions, seat utilization, and vendor contracts</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => handleOpenAllocateModal()}>Allocate Seat</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsAddModalOpen(true)}>Add License</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-surface-50/50"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center shrink-0"><DollarSign className="h-6 w-6" /></div><div><p className="text-caption font-semibold text-surface-500 uppercase">Total Annual Spend</p><p className="text-2xl font-bold text-surface-900">${(totalSpend / 1000).toFixed(1)}K / yr</p></div></div></Card>
          <Card className="p-4 bg-surface-50/50"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Users className="h-6 w-6" /></div><div><p className="text-caption font-semibold text-surface-500 uppercase">Seat Utilization</p><p className="text-2xl font-bold text-surface-900">{totalSeatsUsed} <span className="text-base font-normal text-surface-500">/ {totalSeatsPurchased}</span></p><p className="text-caption text-brand-600 font-medium">{overallUtilizationPct}% Org-wide</p></div></div></Card>
          <Card className={cn('p-4 cursor-pointer', expiringCount > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-surface-50/50')} onClick={() => setActiveChip(activeChip === 'expiring' ? 'all' : 'expiring')}><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><AlertTriangle className="h-6 w-6" /></div><div><p className="text-caption font-semibold text-surface-500 uppercase">Upcoming Renewals</p><p className="text-2xl font-bold text-surface-900">{expiringCount} Contracts</p></div></div></Card>
          <Card className="p-4 bg-surface-50/50 cursor-pointer" onClick={() => setViewMode('optimization')}><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Sparkles className="h-6 w-6" /></div><div><p className="text-caption font-semibold text-surface-500 uppercase">Potential SaaS Savings</p><p className="text-2xl font-bold text-emerald-900">${(totalPotentialSavings / 1000).toFixed(1)}K / yr</p></div></div></Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input type="text" placeholder="Search software by product, vendor, license code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-surface-100 rounded-lg shrink-0">
                <button onClick={() => setViewMode('table')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium', viewMode === 'table' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600')}><List className="h-4 w-4" />Table</button>
                <button onClick={() => setViewMode('grid')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium', viewMode === 'grid' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600')}><LayoutGrid className="h-4 w-4" />Grid</button>
                <button onClick={() => setViewMode('optimization')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium', viewMode === 'optimization' ? 'bg-white text-emerald-700 shadow-xs' : 'text-surface-600')}><Zap className="h-4 w-4 text-emerald-600" />Waste Scanner</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100">
              <span className="text-caption font-semibold text-surface-500 flex items-center gap-1 mr-1"><Filter className="h-3.5 w-3.5" /> Filter:</span>
              <button onClick={() => setActiveChip('all')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium', activeChip === 'all' ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600')}>All ({total})</button>
              <button onClick={() => setActiveChip('expiring')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium', activeChip === 'expiring' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800')}>Expiring Soon ({expiringCount})</button>
              <button onClick={() => setActiveChip('high-spend')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium', activeChip === 'high-spend' ? 'bg-accent-600 text-white' : 'bg-surface-100 text-surface-600')}>High Spend ($40K+)</button>
              <button onClick={() => setActiveChip('risk')} className={cn('px-2.5 py-1 rounded-md text-caption font-medium', activeChip === 'risk' ? 'bg-error-600 text-white' : 'bg-error-50 text-error-800')}>Audit / True-up Risk</button>
            </div>
          </div>
        </Card>

        {error ? (
          <Alert variant="error" title="Unable to load licenses">{error} <button onClick={refetch} className="underline font-medium">Retry</button></Alert>
        ) : viewMode === 'table' ? (
          <Card className="p-6">
            <p className="text-body-sm text-surface-500 mb-4">Showing <strong>{filteredLicenses.length}</strong> of <strong>{total}</strong> registered software licenses</p>
            {filteredLicenses.length === 0 && !loading ? (
              <EmptyState icon={<KeyRound className="h-10 w-10 text-surface-400" />} title="No Software Licenses Found" description="No licenses match your current filter parameters." action={<Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setActiveChip('all'); }}>Clear Filters</Button>} />
            ) : (
              <DataTable columns={columns} data={filteredLicenses} loading={loading} searchable={false} pageSize={8} onRowClick={(row) => navigate(`/licenses/${row.id}`)} />
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLicenses.map((lic) => {
              const pct = Math.round((lic.seatsUsed / lic.seatsPurchased) * 100);
              return (
                <Card key={lic.id} className="p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <button onClick={() => navigate(`/licenses/${lic.id}`)} className="font-bold text-surface-900 hover:text-brand-600 text-left truncate">{lic.product}</button>
                      <Badge variant={statusStyles[lic.status]?.variant || 'default'}>{lic.status}</Badge>
                    </div>
                    <p className="text-caption text-surface-500 truncate mt-0.5">{lic.vendor}</p>
                    <div className="mt-4 pt-3 border-t border-surface-100">
                      <div className="flex items-center justify-between mb-1.5 text-caption"><span className="text-surface-600">Seats Utilized</span><span className="font-bold text-surface-900">{lic.seatsUsed} / {lic.seatsPurchased} ({pct}%)</span></div>
                      <Progress value={lic.seatsUsed} max={lic.seatsPurchased} barClass={pct > 95 ? 'bg-error-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-surface-100">
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => navigate(`/licenses/${lic.id}`)}>View Details</Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenAllocateModal(lic)}><UserPlus className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenRenewModal(lic)}><RefreshCw className="h-4 w-4" /></Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-body font-bold text-surface-900 mb-2">Enterprise SaaS Waste & Cost Optimization</p>
            <p className="text-caption text-surface-500 mb-4">Estimated annual recoup potential: <strong className="text-emerald-700">${(totalPotentialSavings / 1000).toFixed(1)}K / yr</strong> from dormant seats</p>
            <div className="space-y-3">
              {filteredByChip.filter((l) => l.allocatedSeats.some((s) => s.usageStatus === 'Inactive (>30d)')).map((l) => {
                const dormantCount = l.allocatedSeats.filter((s) => s.usageStatus === 'Inactive (>30d)').length;
                return (
                  <div key={l.id} className="p-4 rounded-xl border border-surface-200 bg-surface-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div><span className="font-bold text-surface-900">{l.product}</span> <Badge variant="warning">{dormantCount} Dormant Seats</Badge><p className="text-caption text-surface-600 mt-1">Reclaiming saves ${(dormantCount * l.costPerSeat).toLocaleString()}/yr.</p></div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/licenses/${l.id}`)}>Review Users</Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Software License" size="lg">
          <div className="space-y-4">
            <Input label="Product Name *" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} />
            <Input label="Vendor / Publisher *" value={newVendor} onChange={(e) => setNewVendor(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value as LicenseCategory)} options={[
                { value: 'Productivity & Office', label: 'Productivity & Office' },
                { value: 'Developer Tools & IDE', label: 'Developer Tools & IDE' },
                { value: 'Design & Creative', label: 'Design & Creative' },
                { value: 'Collaboration & Communication', label: 'Collaboration & Communication' },
                { value: 'Cloud & Infrastructure', label: 'Cloud & Infrastructure' },
                { value: 'Database & Analytics', label: 'Database & Analytics' },
                { value: 'Security & Compliance', label: 'Security & Compliance' },
              ]} />
              <Select label="License Model" value={newType} onChange={(e) => setNewType(e.target.value as LicenseType)} options={[
                { value: 'Subscription (Named User)', label: 'Subscription (Named User)' },
                { value: 'Subscription (Floating / Concurrent)', label: 'Subscription (Floating)' },
                { value: 'Perpetual License', label: 'Perpetual License' },
                { value: 'Volume Enterprise Agreement', label: 'Volume Enterprise Agreement' },
                { value: 'Usage / Consumption Based', label: 'Usage / Consumption Based' },
              ]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Purchased Seats" type="number" value={newSeatsPurchased} onChange={(e) => setNewSeatsPurchased(e.target.value)} />
              <Input label="Annual Cost ($)" type="number" value={newAnnualCost} onChange={(e) => setNewAnnualCost(e.target.value)} />
              <Input label="Expiry Date" type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddLicense}>Register License</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate Software License Seat" size="md">
          <div className="space-y-4">
            <Select label="Software License *" value={allocateLicenseId} onChange={(e) => setAllocateLicenseId(e.target.value)} options={filteredByChip.map((l) => ({ value: l.id, label: `${l.product} (${l.seatsPurchased - l.seatsUsed} available)` }))} />
            <Select label="Employee Recipient *" value={allocateEmployeeId} onChange={(e) => setAllocateEmployeeId(e.target.value)} options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))} />
            <Select label="Link Hardware Asset (Optional)" value={allocateAssetId} onChange={(e) => setAllocateAssetId(e.target.value)} options={[{ value: '', label: 'No Hardware Binding' }, ...assets.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))]} />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
              <Button variant="outline" onClick={() => setIsAllocateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmitAllocate}>Confirm Allocation</Button>
            </div>
          </div>
        </Modal>

        <Modal open={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Software Subscription" size="md">
          <div className="space-y-4">
            {selectedLicense && <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-body-sm text-brand-800">Renewal for <strong>{selectedLicense.product}</strong> ({selectedLicense.vendor}).</div>}
            <Select label="Term Extension" value={renewYears} onChange={(e) => setRenewYears(e.target.value)} options={[{ value: '1', label: '+1 Year' }, { value: '2', label: '+2 Years' }, { value: '3', label: '+3 Years' }]} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Seat Capacity" type="number" value={renewSeats} onChange={(e) => setRenewSeats(e.target.value)} />
              <Input label="Annual Cost ($)" type="number" value={renewCost} onChange={(e) => setRenewCost(e.target.value)} />
            </div>
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
