import { useEffect, useMemo, useState } from 'react';
import { Plus, QrCode, Eye, Edit, Trash2, Filter, X, ArrowRightLeft } from 'lucide-react';
import { getAssetCategoryIcon } from '@/utils/assetIcon';
import { Button, Badge, StatusBadge, Select, Modal, ConfirmDialog, EmptyState, useToast, Avatar } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import Can from '@/components/Can';
import { usePermission } from '@/hooks/usePermission';
import { useTransferAssetForm } from '@/hooks/useAssetAssignmentForms';
import { TransferAssetDrawer } from '@/components/assignment/AssetAssignmentDrawers';
import { assetAPI } from '@/services/asset';
import { masterdataAPI } from '@/services/masterdata';
import { assignmentAPI } from '@/services/assignment';
import { organizationAPI } from '@/services/organization';
import { Asset } from '@/types/asset';
import { AssetCategory, AssetLocation } from '@/types/masterdata';
import type { Assignment } from '@/types/assignment';
import { Employee } from '@/types/organization';
import { generateQrPayload } from '@/utils/qrcode';

interface AssetListProps {
  onNavigate: (id: string, assetId?: string) => void;
}

function resolveLabel<T extends { id: string; name: string }>(id: string, lookup: T[]): string {
  return lookup.find((item) => item.id === id)?.name ?? id;
}

// FR-20..FR-27 (Asset Management) — real data source (assetAPI/masterdataAPI) replacing
// Bolt's @/data/mockData import. Financial fields (currentValue) remain intentionally out of
// scope for this Epic (see types/asset.ts header comment). "Assigned To" was originally left
// out too (Phase E/Assignment wasn't built yet when this page was first rewired) — added back
// 2026-08-18 now that assignmentAPI/organizationAPI are real, resolving the asset's active
// assignment to the holding employee's name/avatar (matches esaps_ai_gemini's AssetList
// pattern, but with real data instead of mock).
export function AssetList({ onNavigate }: AssetListProps) {
  const { push } = useToast();
  const { can } = usePermission();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [transferTarget, setTransferTarget] = useState<Asset | null>(null);

  const fetchAll = () => {
    setLoading(true);
    setError(null);
    return Promise.all([
      assetAPI.list(),
      masterdataAPI.listCategories(),
      masterdataAPI.listLocations(),
      assignmentAPI.list(),
      organizationAPI.listEmployees(),
    ])
      .then(([assetResult, categoryResult, locationResult, assignmentResult, employeeResult]) => {
        setAssets(assetResult.data);
        setCategories(categoryResult);
        setLocations(locationResult);
        setAssignments(assignmentResult);
        setEmployees(employeeResult);
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
  }, []);

  const activeAssignmentByAsset = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignments.filter((a) => a.status === 'active').forEach((a) => map.set(a.assetId, a));
    return map;
  }, [assignments]);

  // Transfer — real, via assignmentAPI.transfer (submits for manager approval); shared with
  // pages/AssetDetail.tsx via hooks/useAssetAssignmentForms.ts (also fixes this page's previous
  // silent no-op when no active assignment is found — the shared hook always shows an error toast).
  const { form: transferForm, onSubmit: onTransferSubmit } = useTransferAssetForm({
    open: !!transferTarget,
    assetId: transferTarget?.id ?? '',
    employees,
    activeAssignment: transferTarget ? activeAssignmentByAsset.get(transferTarget.id) : undefined,
    onSuccess: async () => { setTransferTarget(null); await fetchAll(); },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchSearch =
        !term ||
        a.name.toLowerCase().includes(term) ||
        a.assetTag.toLowerCase().includes(term) ||
        (a.serialNumber ?? '').toLowerCase().includes(term);
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || a.categoryId === categoryFilter;
      const matchLocation = locationFilter === 'all' || a.locationId === locationFilter;
      return matchSearch && matchStatus && matchCategory && matchLocation;
    });
  }, [assets, search, statusFilter, categoryFilter, locationFilter]);

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => {
        const CategoryIcon = getAssetCategoryIcon(resolveLabel(r.categoryId, categories));
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0"><CategoryIcon className="h-4 w-4 text-surface-500" /></div>
            <div className="min-w-0">
              <p className="font-medium text-surface-900 truncate">{r.name}</p>
              <p className="text-caption text-surface-500">{r.assetTag}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'categoryId',
      header: 'Category',
      sortable: true,
      sortValue: (r) => resolveLabel(r.categoryId, categories),
      render: (r) => <span className="text-surface-600">{resolveLabel(r.categoryId, categories)}</span>,
    },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (r) => {
        const emp = employees.find((e) => e.id === activeAssignmentByAsset.get(r.id)?.employeeId);
        return emp ? (
          <div className="flex items-center gap-2">
            <Avatar initials={emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)} size="xs" color="bg-brand-500" />
            <span className="text-surface-700">{emp.name}</span>
          </div>
        ) : <span className="text-surface-400">—</span>;
      },
    },
    {
      key: 'locationId',
      header: 'Location',
      sortable: true,
      sortValue: (r) => resolveLabel(r.locationId, locations),
      render: (r) => <span className="text-surface-600">{resolveLabel(r.locationId, locations)}</span>,
    },
    {
      key: 'serialNumber',
      header: 'Serial Number',
      render: (r) => <span className="text-surface-600">{r.serialNumber ?? '—'}</span>,
    },
  ];

  const rowActions = (row: Asset) => {
    const actions: { label: string; icon?: React.ReactNode; onClick?: () => void; danger?: boolean; divider?: boolean }[] = [
      { label: 'View Details', icon: <Eye className="h-4 w-4" />, onClick: () => onNavigate('asset-detail', row.id) },
    ];
    if (can('asset:update')) {
      actions.push(
        { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => push({ variant: 'info', title: 'Edit mode', message: row.name }) },
      );
    }
    actions.push({ label: 'Print QR Code', icon: <QrCode className="h-4 w-4" />, onClick: () => setQrAsset(row) });
    if (activeAssignmentByAsset.has(row.id)) {
      actions.push({ label: 'Transfer', icon: <ArrowRightLeft className="h-4 w-4" />, onClick: () => setTransferTarget(row) });
    }
    if (can('asset:update')) {
      actions.push(
        { divider: true, label: '' },
        { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setDeleteTarget(row) },
      );
    }
    return actions;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await assetAPI.archive(deleteTarget.id);
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      push({ variant: 'success', title: 'Asset archived', message: deleteTarget.name });
    } catch {
      push({ variant: 'error', title: 'Archive failed', message: deleteTarget.name });
    }
  };

  if (!loading && error) {
    return (
      <EmptyState
        icon={<X className="h-6 w-6" />}
        title="เกิดข้อผิดพลาด"
        description={error}
        action={<Button size="sm" onClick={() => window.location.reload()}>ลองใหม่</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="brand">{filtered.length} assets</Badge>
          {(statusFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all') && (
            <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setLocationFilter('all'); }}>
              Clear filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Can permission="asset:create">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onNavigate('create-asset')}>New Asset</Button>
          </Can>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card-base p-4 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'idle', label: 'Idle' },
            ]} />
            <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]} />
            <Select label="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} options={[
              { value: 'all', label: 'All Locations' },
              ...locations.map((l) => ({ value: l.id, label: l.name })),
            ]} />
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, tag, or serial number..."
        rowActions={rowActions}
        onRowClick={(row) => onNavigate('asset-detail', row.id)}
        toolbar={
          <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>
            Filters
          </Button>
        }
        emptyTitle="No assets found"
        emptyDescription="Try adjusting your search or filters, or create a new asset."
        emptyAction={
          <Can permission="asset:create">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onNavigate('create-asset')}>New Asset</Button>
          </Can>
        }
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Archive this asset?"
        message={`This will archive ${deleteTarget?.name} (${deleteTarget?.assetTag}). Archived assets are hidden from the active list but not permanently deleted.`}
        confirmLabel="Archive"
        variant="danger"
      />

      {/* QR Modal */}
      <Modal open={!!qrAsset} onClose={() => setQrAsset(null)} title="QR Code" description={qrAsset ? `${qrAsset.name} — ${qrAsset.assetTag}` : ''} size="sm">
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
          <p className="text-caption text-surface-500 text-center break-all">{qrAsset ? generateQrPayload(qrAsset) : ''}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setQrAsset(null)}>Close</Button>
            <Button leftIcon={<QrCode className="h-4 w-4" />}>Download QR</Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Drawer — real, via assignmentAPI.transfer (submits for manager approval),
          shared with pages/AssetDetail.tsx via hooks/useAssetAssignmentForms.ts +
          components/assignment/AssetAssignmentDrawers.tsx */}
      <TransferAssetDrawer
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        form={transferForm}
        onSubmit={onTransferSubmit}
        employees={employees}
        currentHolderName={employees.find((e) => e.id === (transferTarget ? activeAssignmentByAsset.get(transferTarget.id)?.employeeId : undefined))?.name ?? ''}
        currentHolderEmployeeId={transferTarget ? activeAssignmentByAsset.get(transferTarget.id)?.employeeId : undefined}
        description={transferTarget ? `Transfer ${transferTarget.name} (${transferTarget.assetTag}) to a new employee — this submits for manager approval` : ''}
      />
    </div>
  );
}
