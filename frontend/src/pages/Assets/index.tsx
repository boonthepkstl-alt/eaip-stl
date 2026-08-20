import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, QrCode, Eye, Edit, Trash2, ArrowRightLeft, Wrench, Filter, X, Sparkles, Send } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button, Badge, Avatar, StatusBadge, Select, Modal, ConfirmDialog, useToast, Alert } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { departments, locations } from '@/data/fixtures/mockData';
import { getAssetIcon } from '@/data/asset-icons';
import { useAssets } from '@/hooks/useAssets';
import type { Asset } from '@/types/asset';

// Ported from src/pages/AssetList.tsx — see ASSET-MANAGEMENT-MIGRATION.md for the
// KEEP/MIGRATE/REFACTOR breakdown. Preserves the natural-language "Ask AI" filter box exactly
// as it was: it's a client-side keyword matcher over whatever page of assets is currently
// loaded, not a real AI call — same limitation the legacy page had, not something this
// migration introduced.
export function AssetsPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Asset['status']>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiInterpretation, setAiInterpretation] = useState<{ filters: { label: string; value: string }[]; count: number } | null>(null);

  const { assets, loading, error, refetch } = useAssets({
    search,
    status: statusFilter,
    department: deptFilter,
  });

  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    const lower = aiQuery.toLowerCase();
    const filters: { label: string; value: string }[] = [];

    if (lower.includes('laptop') || lower.includes('notebook')) filters.push({ label: 'Type', value: 'Laptop' });
    if (lower.includes('monitor') || lower.includes('display')) filters.push({ label: 'Type', value: 'Monitor' });
    if (lower.includes('phone') || lower.includes('smartphone') || lower.includes('mobile')) filters.push({ label: 'Type', value: 'Smartphone' });
    if (lower.includes('idle') || lower.includes('available')) filters.push({ label: 'Status', value: 'Available' });
    if (lower.includes('assigned') || lower.includes('in use')) filters.push({ label: 'Status', value: 'Assigned' });
    if (lower.includes('maintenance') || lower.includes('repair')) filters.push({ label: 'Status', value: 'In Maintenance' });
    if (lower.includes('engineering')) filters.push({ label: 'Department', value: 'Engineering' });
    if (lower.includes('sales')) filters.push({ label: 'Department', value: 'Sales' });

    const statusMatch = filters.find((f) => f.label === 'Status');
    const deptMatch = filters.find((f) => f.label === 'Department');
    if (statusMatch) setStatusFilter(statusMatch.value as Asset['status']);
    if (deptMatch) setDeptFilter(deptMatch.value);

    setAiInterpretation({ filters, count: assets.length });
  };

  const clearAISearch = () => {
    setAiQuery('');
    setAiInterpretation(null);
    setStatusFilter('all');
    setDeptFilter('all');
  };

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => {
        const Icon = getAssetIcon(r.type);
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
              <Icon className="h-4.5 w-4.5 text-surface-500" style={{ width: 18, height: 18 }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-surface-900 truncate">{r.name}</p>
              <p className="text-caption text-surface-500">{r.code}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'category', header: 'Category', sortable: true, sortValue: (r) => r.category, render: (r) => <span className="text-surface-600">{r.category}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'department', header: 'Department', sortable: true, sortValue: (r) => r.department, render: (r) => <span className="text-surface-600">{r.department}</span> },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (r) =>
        r.assignedTo ? (
          <div className="flex items-center gap-2">
            <Avatar initials={r.assignedTo.split(' ').map((n) => n[0]).join('').slice(0, 2)} size="xs" color="bg-brand-500" />
            <span className="text-surface-700">{r.assignedTo}</span>
          </div>
        ) : (
          <span className="text-surface-400">—</span>
        ),
    },
    { key: 'location', header: 'Location', sortable: true, sortValue: (r) => r.location, render: (r) => <span className="text-surface-600">{r.location}</span> },
    {
      key: 'value',
      header: 'Current Value',
      sortable: true,
      sortValue: (r) => r.currentValue,
      align: 'right',
      render: (r) => <span className="font-medium text-surface-900">${r.currentValue.toLocaleString()}</span>,
    },
  ];

  const rowActions = (row: Asset) => [
    { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/assets/${row.id}`) },
    { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => push({ variant: 'info', title: 'Edit mode', message: row.name }) },
    { label: 'Transfer', icon: <ArrowRightLeft className="h-4 w-4" />, onClick: () => push({ variant: 'info', title: 'Transfer asset', message: row.name }) },
    { label: 'Schedule Maintenance', icon: <Wrench className="h-4 w-4" />, onClick: () => push({ variant: 'info', title: 'Maintenance scheduled', message: row.name }) },
    { label: 'Print QR Code', icon: <QrCode className="h-4 w-4" />, onClick: () => setQrAsset(row) },
    { divider: true, label: '' },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setDeleteTarget(row) },
  ];

  return (
    <AppShell current="assets" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Asset Management' }]}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="brand">{assets.length} assets</Badge>
            {(statusFilter !== 'all' || deptFilter !== 'all') && (
              <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => { setStatusFilter('all'); setDeptFilter('all'); }}>
                Clear filters
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />}>Import</Button>
            <Button variant="outline" size="sm" leftIcon={<QrCode className="h-4 w-4" />}>Scan QR</Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/assets/create')}>New Asset</Button>
          </div>
        </div>

        {showFilters && (
          <div className="card-base p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Asset['status'] | 'all')}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Available', label: 'Available' },
                  { value: 'Assigned', label: 'Assigned' },
                  { value: 'In Maintenance', label: 'In Maintenance' },
                  { value: 'Retired', label: 'Retired' },
                ]}
              />
              <Select
                label="Department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: d, label: d }))]}
              />
              <Select label="Location" options={[{ value: 'all', label: 'All Locations' }, ...locations.map((l) => ({ value: l, label: l }))]} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Sparkles className="h-4 w-4 text-brand-500" />
              </div>
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAISearch(); }}
                placeholder="Ask AI: e.g. 'Show me idle laptops in Engineering'"
                className="w-full rounded-xl border border-brand-200 bg-brand-50/30 pl-10 pr-4 py-2.5 text-body text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
              />
            </div>
            <Button size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={handleAISearch} disabled={!aiQuery.trim()}>
              Ask AI
            </Button>
          </div>

          {aiInterpretation && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-caption font-medium text-brand-700 mb-1">AI interpreted:</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiInterpretation.filters.length === 0 ? (
                    <span className="text-caption text-surface-500">No specific filters detected — showing all assets.</span>
                  ) : (
                    aiInterpretation.filters.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-caption bg-white border border-brand-200 text-brand-700 px-2 py-0.5 rounded-md font-medium">
                        {f.label} = {f.value}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <button onClick={clearAISearch} className="text-surface-400 hover:text-surface-600 transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {error ? (
          <Alert variant="error" title="Unable to load assets">
            {error}{' '}
            <button onClick={refetch} className="underline font-medium">
              Retry
            </button>
          </Alert>
        ) : (
          <DataTable
            columns={columns}
            data={assets}
            loading={loading}
            searchable
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name or code..."
            rowActions={rowActions}
            onRowClick={(row) => navigate(`/assets/${row.id}`)}
            toolbar={
              <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>
                Filters
              </Button>
            }
            emptyTitle="No assets found"
            emptyDescription="Try adjusting your search or filters, or create a new asset."
            emptyAction={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/assets/create')}>New Asset</Button>}
          />
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => push({ variant: 'success', title: 'Asset deleted', message: deleteTarget?.name })}
          title="Delete this asset?"
          message={`This will permanently remove ${deleteTarget?.name} (${deleteTarget?.code}) and all associated records. This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
        />

        <Modal open={!!qrAsset} onClose={() => setQrAsset(null)} title="QR Code" description={qrAsset ? `${qrAsset.name} — ${qrAsset.code}` : ''} size="sm">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 border-2 border-surface-200 rounded-lg">
              <svg viewBox="0 0 100 100" className="h-40 w-40">
                <rect width="100" height="100" fill="white" />
                {Array.from({ length: 256 }).map((_, i) => {
                  const x = (i % 16) * 6 + 2;
                  const y = Math.floor(i / 16) * 6 + 2;
                  const fill = (i * 7 + 3) % 3 === 0 || (i * 13 + 5) % 5 === 0;
                  return fill ? <rect key={i} x={x} y={y} width="5" height="5" fill="#0f172a" /> : null;
                })}
                <rect x="2" y="2" width="20" height="20" fill="none" stroke="#0f172a" strokeWidth="3" />
                <rect x="78" y="2" width="20" height="20" fill="none" stroke="#0f172a" strokeWidth="3" />
                <rect x="2" y="78" width="20" height="20" fill="none" stroke="#0f172a" strokeWidth="3" />
              </svg>
            </div>
            <p className="text-body text-surface-600 text-center">Scan to view asset details</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setQrAsset(null)}>Close</Button>
              <Button leftIcon={<QrCode className="h-4 w-4" />}>Download QR</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
