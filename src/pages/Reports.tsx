import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileBarChart, UserCheck, Download, Package } from 'lucide-react';
import { getAssetCategoryIcon } from '@/utils/assetIcon';
import { Card, Tabs, Select, Input, Button, StatusBadge, Badge, EmptyState } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { reportAPI } from '@/services/report';
import { masterdataAPI } from '@/services/masterdata';
import { AssetInventoryReportRow, AssetAssignmentReportRow } from '@/types/report';
import { AssetCategory, AssetLocation, Department } from '@/types/masterdata';
import { getAssignmentStatusMeta } from '@/utils/assignmentStatus';
import { ROUTES } from '@/config/constants';

interface ReportsProps {
  onNavigate: (id: string) => void;
}

type InventoryRow = AssetInventoryReportRow & { id: string };
type AssignmentRow = AssetAssignmentReportRow & { id: string };

// FR-57..FR-59 (Reduced Reporting) — real data source (reportAPI/masterdataAPI) replacing
// Bolt's @/data/mockData import. Bolt's original had 4 report types (Asset Summary/
// Depreciation/Maintenance/Financial) + portfolio charts (acquisition trend, value trend,
// department/type distribution) — per Reduced Reporting scope only Asset Inventory + Asset
// Assignment reports exist; Depreciation/Maintenance/Financial and all chart widgets are
// dropped entirely (no service backs them, and they are out of MVP per PROJECT_CONTEXT).
export function Reports({ onNavigate }: ReportsProps) {
  const location = useLocation();
  const isAssignmentTab = location.pathname === ROUTES.REPORTS_ASSET_ASSIGNMENT;

  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [locationId, setLocationId] = useState('all');
  const [assetStatus, setAssetStatus] = useState('all');

  const [departmentId, setDepartmentId] = useState('all');
  const [assignmentStatus, setAssignmentStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      reportAPI.getAssetInventory(),
      masterdataAPI.listCategories(),
      masterdataAPI.listLocations(),
      reportAPI.getAssetAssignment(),
      masterdataAPI.listDepartments(),
    ])
      .then(([inventory, categoryResult, locationResult, assignment, departmentResult]) => {
        if (cancelled) return;
        setInventoryRows(inventory.map((r) => ({ ...r, id: r.assetId })));
        setCategories(categoryResult);
        setLocations(locationResult);
        setAssignmentRows(assignment.map((r) => ({ ...r, id: r.assignmentId })));
        setDepartments(departmentResult);
      })
      .catch(() => {
        if (!cancelled) setError('ไม่สามารถโหลดรายงานได้ กรุณาลองใหม่อีกครั้ง');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    return inventoryRows.filter((row) => {
      const matchCategory = categoryId === 'all' || categories.find((c) => c.id === categoryId)?.name === row.categoryName;
      const matchLocation = locationId === 'all' || locations.find((l) => l.id === locationId)?.name === row.locationName;
      const matchStatus = assetStatus === 'all' || row.status === assetStatus;
      const matchSearch = !term || `${row.assetTag} ${row.name}`.toLowerCase().includes(term);
      return matchCategory && matchLocation && matchStatus && matchSearch;
    });
  }, [inventoryRows, categories, locations, categoryId, locationId, assetStatus, search]);

  const filteredAssignment = useMemo(() => {
    return assignmentRows.filter((row) => {
      const matchDepartment = departmentId === 'all' || departments.find((d) => d.id === departmentId)?.name === row.department;
      const matchStatus = assignmentStatus === 'all' || row.status === assignmentStatus;
      const matchFrom = !dateFrom || (row.assignedDate ?? '') >= dateFrom;
      const matchTo = !dateTo || (row.assignedDate ?? '') <= dateTo;
      return matchDepartment && matchStatus && matchFrom && matchTo;
    });
  }, [assignmentRows, departments, departmentId, assignmentStatus, dateFrom, dateTo]);

  const inventoryColumns: Column<InventoryRow>[] = [
    {
      key: 'name', header: 'Asset', sortable: true, sortValue: (r) => r.name,
      render: (r) => {
        const CategoryIcon = getAssetCategoryIcon(r.categoryName);
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
    { key: 'categoryName', header: 'Category', render: (r) => <span className="text-surface-600">{r.categoryName}</span> },
    { key: 'locationName', header: 'Location', render: (r) => <span className="text-surface-600">{r.locationName}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'vendorName', header: 'Vendor', render: (r) => <span className="text-surface-600">{r.vendorName ?? '—'}</span> },
    { key: 'currentAssigneeName', header: 'Current Holder', render: (r) => <span className="text-surface-600">{r.currentAssigneeName ?? '—'}</span> },
  ];

  const assignmentColumns: Column<AssignmentRow>[] = [
    {
      key: 'assetName', header: 'Asset', sortable: true, sortValue: (r) => r.assetName,
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-surface-500" /></div>
          <div className="min-w-0">
            <p className="font-medium text-surface-900 truncate">{r.assetName}</p>
            <p className="text-caption text-surface-500">{r.assetTag}</p>
          </div>
        </div>
      ),
    },
    { key: 'employeeName', header: 'Employee', render: (r) => <span className="text-surface-600">{r.employeeName}</span> },
    { key: 'department', header: 'Department', render: (r) => <span className="text-surface-600">{r.department}</span> },
    { key: 'type', header: 'Type', render: (r) => <span className="text-surface-600 capitalize">{r.type}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => {
        const meta = getAssignmentStatusMeta(r.status);
        return <Badge variant={meta.variant} dot>{meta.label}</Badge>;
      },
    },
    { key: 'assignedDate', header: 'Assigned', render: (r) => <span className="text-surface-600">{r.assignedDate ?? '—'}</span> },
    { key: 'expectedReturnDate', header: 'Expected Return', render: (r) => <span className="text-surface-600">{r.expectedReturnDate ?? '—'}</span> },
  ];

  const handleExportInventory = () => {
    reportAPI.exportCsv(
      filteredInventory,
      inventoryColumns.map((c) => ({ key: c.key, label: c.header, render: (row: InventoryRow) => String((row as unknown as Record<string, unknown>)[c.key] ?? '') })),
      'asset-inventory-report.csv',
    );
  };

  const handleExportAssignment = () => {
    reportAPI.exportCsv(
      filteredAssignment,
      assignmentColumns.map((c) => ({ key: c.key, label: c.header, render: (row: AssignmentRow) => String((row as unknown as Record<string, unknown>)[c.key] ?? '') })),
      'asset-assignment-report.csv',
    );
  };

  const tabs = [
    { id: 'inventory', label: 'Asset Inventory', icon: <FileBarChart className="h-4 w-4" /> },
    { id: 'assignment', label: 'Asset Assignment', icon: <UserCheck className="h-4 w-4" /> },
  ];

  if (error) {
    return (
      <EmptyState
        icon={<FileBarChart className="h-6 w-6" />}
        title="เกิดข้อผิดพลาด"
        description={error}
        action={<Button size="sm" onClick={() => window.location.reload()}>ลองใหม่</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-2">
        <Tabs
          items={tabs}
          active={isAssignmentTab ? 'assignment' : 'inventory'}
          onChange={(id) => onNavigate(id === 'assignment' ? 'reports-assignment' : 'reports')}
        />
      </Card>

      {!isAssignmentTab ? (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand">{loading ? '…' : `${filteredInventory.length} of ${inventoryRows.length} assets`}</Badge>
            <Badge variant="success" dot>{loading ? '…' : `${filteredInventory.filter((r) => r.status === 'active').length} active`}</Badge>
            <Badge variant="neutral" dot>{loading ? '…' : `${filteredInventory.filter((r) => r.status === 'idle').length} idle`}</Badge>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                options={[{ value: 'all', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
              <Select label="Location" value={locationId} onChange={(e) => setLocationId(e.target.value)}
                options={[{ value: 'all', label: 'All Locations' }, ...locations.map((l) => ({ value: l.id, label: l.name }))]} />
              <Select label="Status" value={assetStatus} onChange={(e) => setAssetStatus(e.target.value)}
                options={[{ value: 'all', label: 'All Statuses' }, { value: 'active', label: 'Active' }, { value: 'idle', label: 'Idle' }]} />
              <Input label="Search" placeholder="Asset name or tag..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} disabled={filteredInventory.length === 0} onClick={handleExportInventory}>
              Export CSV
            </Button>
          </div>

          <DataTable
            columns={inventoryColumns}
            data={filteredInventory}
            loading={loading}
            emptyTitle="No records found"
            emptyDescription="Try adjusting your filters or search query."
          />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand">{loading ? '…' : `${filteredAssignment.length} of ${assignmentRows.length} assignments`}</Badge>
            <Badge variant="success" dot>{loading ? '…' : `${filteredAssignment.filter((r) => r.status === 'active').length} active`}</Badge>
            <Badge variant="warning" dot>{loading ? '…' : `${filteredAssignment.filter((r) => r.status === 'pending_manager_approval').length} pending approval`}</Badge>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
                options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} />
              <Select label="Status" value={assignmentStatus} onChange={(e) => setAssignmentStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending_manager_approval', label: 'Pending Approval' },
                  { value: 'pending_acknowledgement', label: 'Pending Acknowledgement' },
                  { value: 'checked_out', label: 'Checked Out' },
                  { value: 'returned', label: 'Returned' },
                  { value: 'rejected', label: 'Rejected' },
                ]} />
              <Input label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} disabled={filteredAssignment.length === 0} onClick={handleExportAssignment}>
              Export CSV
            </Button>
          </div>

          <DataTable
            columns={assignmentColumns}
            data={filteredAssignment}
            loading={loading}
            emptyTitle="No records found"
            emptyDescription="Try adjusting your filters."
          />
        </>
      )}
    </div>
  );
}
