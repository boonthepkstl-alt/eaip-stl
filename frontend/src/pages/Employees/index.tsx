import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  UserCheck,
  Package,
  MapPin,
  Eye,
  Plus,
  ArrowRightLeft,
  ChevronRight,
  Laptop,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Card, Button, StatusBadge, Avatar, Modal, Select, Input, useToast, Textarea, Alert } from '@/components/ui';
import { AppShell } from '@/components/AppShell';
import { DataTable, type Column } from '@/components/DataTable';
import { departments, locations } from '@/data/fixtures/mockData';
import { getAssetIcon } from '@/data/asset-icons';
import { useAssets } from '@/hooks/useAssets';
import { useEmployees } from '@/hooks/useEmployees';
import { assetService } from '@/services/asset-service';
import { employeeService } from '@/services/employee-service';
import type { Employee, EmployeeStatus } from '@/types/employee';

// Ported from src/pages/Assignment.tsx (the "Employee Management" module in
// config/navigation.ts — id `assignment`, route `/employees`). As of Phase 5A, employee reads
// go through employeeService/useEmployees (formalized — Phase 4 still used local component
// state seeded from the fixture directly) and every asset read/write goes through
// assetService, same as pages/Assets and pages/AssetDetail. See
// EMPLOYEE-MANAGEMENT-MIGRATION.md.
export function EmployeesPage() {
  const navigate = useNavigate();
  const { push } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDept, setNewEmpDept] = useState(departments[0] || 'Engineering');
  const [newEmpLoc, setNewEmpLoc] = useState(locations[0] || 'HQ - Floor 4');
  const [newEmpDesk, setNewEmpDesk] = useState('');
  const [newEmpManager, setNewEmpManager] = useState('David Kim');
  const [newEmpStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');

  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignAssetId, setAssignAssetId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [transferAssetId, setTransferAssetId] = useState('');
  const [transferToEmpId, setTransferToEmpId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const {
    employees: filteredEmployees,
    loading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useEmployees({ search: searchQuery, department: departmentFilter, location: locationFilter, status: statusFilter });
  const { assets: assetList, refetch: refetchAssets } = useAssets({});

  // KPI cards and the assign/transfer modals show company-wide totals, not the filtered list
  // above — a second unfiltered read, same as the legacy page always computing KPIs off the
  // full roster regardless of the table's own search/filter state.
  const { employees: allEmployeesUnfiltered } = useEmployees({});
  const employeeList = allEmployeesUnfiltered;

  const getEmployeeAssets = (employeeId: string, employeeName: string) =>
    assetList.filter((a) => (a.assignedEmployeeId && a.assignedEmployeeId === employeeId) || (a.assignedTo && a.assignedTo.toLowerCase() === employeeName.toLowerCase()));

  const totalEmployees = allEmployeesUnfiltered.length;
  const activeEmployees = allEmployeesUnfiltered.filter((e) => e.status === 'Active').length;
  const employeesWithAssets = allEmployeesUnfiltered.filter((e) => getEmployeeAssets(e.id, e.name).length > 0).length;
  const unassignedAssets = assetList.filter((a) => !a.assignedEmployeeId && a.status === 'Available').length;

  const handleOpenAssignModal = (emp?: Employee) => {
    if (emp) setAssignEmpId(emp.id);
    else if (employeeList.length > 0) setAssignEmpId(employeeList[0].id);
    const avail = assetList.find((a) => !a.assignedEmployeeId && a.status === 'Available');
    if (avail) setAssignAssetId(avail.id);
    setAssignOpen(true);
  };

  const handleOpenTransferModal = (emp?: Employee) => {
    if (emp) {
      const empAssets = getEmployeeAssets(emp.id, emp.name);
      if (empAssets.length > 0) setTransferAssetId(empAssets[0].id);
    }
    setTransferOpen(true);
  };

  const handleCreateEmployee = async () => {
    if (!newEmpName.trim() || !newEmpEmail.trim()) {
      push({ variant: 'warning', title: 'Required Fields', message: 'Name and Email are required.' });
      return;
    }
    const created = await employeeService.createEmployee({
      name: newEmpName,
      email: newEmpEmail,
      jobTitle: newEmpTitle || undefined,
      phone: newEmpPhone || undefined,
      department: newEmpDept,
      location: newEmpLoc,
      deskLocation: newEmpDesk || undefined,
      manager: newEmpManager || undefined,
      status: newEmpStatus,
    });
    refetchEmployees();
    setAddEmployeeOpen(false);
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPhone('');
    setNewEmpTitle('');
    setNewEmpDesk('');
    push({ variant: 'success', title: 'Employee Profile Created', message: `${created.name} (${created.employeeCode}) added to system.` });
  };

  const handleConfirmAssign = async () => {
    if (!assignEmpId || !assignAssetId) {
      push({ variant: 'warning', title: 'Selection Missing', message: 'Select both an employee and an available asset.' });
      return;
    }
    const targetEmp = employeeList.find((e) => e.id === assignEmpId);
    const targetAsset = assetList.find((a) => a.id === assignAssetId);
    if (!targetEmp || !targetAsset) return;

    const updated = await assetService.assignAsset({ assetId: assignAssetId, employeeId: targetEmp.id, employeeName: targetEmp.name, notes: assignNotes });
    refetchAssets();

    setAssignOpen(false);
    setAssignNotes('');
    push({ variant: 'success', title: 'Asset Assigned', message: `${updated.name} assigned to ${targetEmp.name}.` });
  };

  const handleConfirmTransfer = async () => {
    if (!transferAssetId || !transferToEmpId) {
      push({ variant: 'warning', title: 'Selection Missing', message: 'Select an asset and the recipient employee.' });
      return;
    }
    const targetAsset = assetList.find((a) => a.id === transferAssetId);
    const toEmp = employeeList.find((e) => e.id === transferToEmpId);
    if (!targetAsset || !toEmp) return;
    const fromName = targetAsset.assignedTo || 'Previous Owner';

    const updated = await assetService.assignAsset({ assetId: transferAssetId, employeeId: toEmp.id, employeeName: toEmp.name, notes: transferNotes });
    refetchAssets();

    setTransferOpen(false);
    setTransferNotes('');
    push({ variant: 'success', title: 'Asset Transferred', message: `${updated.name} successfully transferred from ${fromName} to ${toEmp.name}.` });
  };

  const employeeColumns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar initials={r.initials} size="sm" color={r.avatarColor} />
          <div className="min-w-0">
            <button onClick={() => navigate(`/employees/${r.id}`)} className="font-semibold text-surface-900 hover:text-brand-600 transition-colors text-left truncate block max-w-[200px]">
              {r.name}
            </button>
            <p className="text-caption text-surface-500 font-mono">{r.employeeCode || 'EMP-0001'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Designation & Department',
      sortable: true,
      sortValue: (r) => r.jobTitle,
      render: (r) => (
        <div>
          <p className="font-medium text-surface-800">{r.jobTitle}</p>
          <p className="text-caption text-surface-500">{r.department}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location & Desk',
      sortable: true,
      sortValue: (r) => r.location,
      render: (r) => (
        <div>
          <p className="text-surface-700 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-surface-400 shrink-0" />{r.location}</p>
          <p className="text-caption text-surface-400 pl-4">{r.deskLocation || 'Standard Desk'}</p>
        </div>
      ),
    },
    {
      key: 'assignedAssets',
      header: 'Assigned Equipment',
      render: (r) => {
        const empAssets = getEmployeeAssets(r.id, r.name);
        if (empAssets.length === 0) return <span className="text-surface-400 text-caption italic">No assets</span>;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {empAssets.map((ast) => {
              const AssetIcon = getAssetIcon(ast.type);
              return (
                <span
                  key={ast.id}
                  onClick={(e) => { e.stopPropagation(); navigate(`/assets/${ast.id}`); }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-100 hover:bg-brand-50 hover:text-brand-700 text-surface-700 text-[11px] font-mono transition-colors cursor-pointer border border-surface-200"
                  title={`${ast.name} (${ast.code})`}
                >
                  <AssetIcon className="h-3 w-3 text-surface-500" />
                  {ast.code}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => <StatusBadge status={r.status === 'Active' ? 'Active' : r.status === 'On Leave' ? 'In Maintenance' : 'Retired'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => navigate(`/employees/${r.id}`)} rightIcon={<ChevronRight className="h-3 w-3" />}>Details</Button>
          <Button variant="ghost" size="sm" title="Assign Asset" onClick={() => handleOpenAssignModal(r)}>
            <Plus className="h-3.5 w-3.5 text-surface-600" />
          </Button>
        </div>
      ),
    },
  ];

  const rowActions = (row: Employee) => [
    { label: 'View Employee Details', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/employees/${row.id}`) },
    { label: 'Assign Equipment', icon: <Plus className="h-4 w-4" />, onClick: () => handleOpenAssignModal(row) },
    { label: 'Transfer Equipment', icon: <ArrowRightLeft className="h-4 w-4" />, onClick: () => handleOpenTransferModal(row) },
  ];

  return (
    <AppShell current="employees" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Employee Management' }]}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-heading font-bold text-surface-900">Employee Management</h1>
            <p className="text-body text-surface-500">Manage company personnel, IT hardware assignments, workstation profiles, and support tickets</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" leftIcon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => setTransferOpen(true)}>Transfer Asset</Button>
            <Button variant="outline" size="sm" leftIcon={<Laptop className="h-4 w-4" />} onClick={() => handleOpenAssignModal()}>Assign Asset</Button>
            <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAddEmployeeOpen(true)}>Add Employee</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Total Personnel</p><p className="text-2xl font-bold text-surface-900 mt-1">{totalEmployees}</p></div>
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Users className="h-5 w-5" /></div>
          </div></Card>
          <Card className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Active Staff</p><p className="text-2xl font-bold text-surface-900 mt-1">{activeEmployees}</p></div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><UserCheck className="h-5 w-5" /></div>
          </div></Card>
          <Card className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-caption font-medium text-surface-500 uppercase tracking-wider">With IT Hardware</p><p className="text-2xl font-bold text-surface-900 mt-1">{employeesWithAssets}</p></div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Laptop className="h-5 w-5" /></div>
          </div></Card>
          <Card className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Available Stock</p><p className="text-2xl font-bold text-surface-900 mt-1">{unassignedAssets}</p></div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Package className="h-5 w-5" /></div>
          </div></Card>
        </div>

        <Card className="p-4 bg-surface-50/70 border-surface-200">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500" />
              <input
                type="text"
                placeholder="Search employees by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-surface-200 rounded-lg text-body text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            <Button variant={showFilters ? 'primary' : 'outline'} size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />} onClick={() => setShowFilters(!showFilters)}>
              Filters {(departmentFilter !== 'ALL' || locationFilter !== 'ALL' || statusFilter !== 'ALL') && '•'}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-200">
              <Select label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} options={[{ label: 'All Departments', value: 'ALL' }, ...departments.map((d) => ({ label: d, value: d }))]} />
              <Select label="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} options={[{ label: 'All Locations', value: 'ALL' }, ...locations.map((l) => ({ label: l, value: l }))]} />
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | 'ALL')} options={[{ label: 'All Statuses', value: 'ALL' }, { label: 'Active', value: 'Active' }, { label: 'On Leave', value: 'On Leave' }, { label: 'Inactive', value: 'Inactive' }]} />
            </div>
          )}
        </Card>

        {employeesError ? (
          <Alert variant="error" title="Unable to load employees">
            {employeesError}{' '}
            <button onClick={refetchEmployees} className="underline font-medium">
              Retry
            </button>
          </Alert>
        ) : (
          <Card className="p-6">
            <DataTable
              columns={employeeColumns}
              data={filteredEmployees}
              loading={employeesLoading}
              searchable={false}
              rowActions={rowActions}
              onRowClick={(row) => navigate(`/employees/${row.id}`)}
              pageSize={8}
              emptyTitle="No employees found"
              emptyDescription="Try adjusting your search or filters."
            />
          </Card>
        )}

        <Modal open={addEmployeeOpen} onClose={() => setAddEmployeeOpen(false)} title="Add New Employee Profile" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name *" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} />
              <Input label="Work Email *" value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Job Title / Position" value={newEmpTitle} onChange={(e) => setNewEmpTitle(e.target.value)} />
              <Input label="Phone Number" value={newEmpPhone} onChange={(e) => setNewEmpPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Department" value={newEmpDept} onChange={(e) => setNewEmpDept(e.target.value)} options={departments.map((d) => ({ label: d, value: d }))} />
              <Select label="Location Campus" value={newEmpLoc} onChange={(e) => setNewEmpLoc(e.target.value)} options={locations.map((l) => ({ label: l, value: l }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Physical Desk" value={newEmpDesk} onChange={(e) => setNewEmpDesk(e.target.value)} />
              <Select label="Reporting Manager" value={newEmpManager} onChange={(e) => setNewEmpManager(e.target.value)} options={employeeList.map((e) => ({ label: e.name, value: e.name }))} />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
              <Button variant="outline" onClick={() => setAddEmployeeOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateEmployee}>Save Profile</Button>
            </div>
          </div>
        </Modal>

        <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign IT Equipment" size="md">
          <div className="space-y-4">
            <Select label="Select Employee *" value={assignEmpId} onChange={(e) => setAssignEmpId(e.target.value)} options={employeeList.map((e) => ({ label: `${e.name} (${e.jobTitle} - ${e.department})`, value: e.id }))} />
            {assetList.filter((a) => !a.assignedEmployeeId && a.status === 'Available').length === 0 ? (
              <p className="p-3 bg-amber-50 text-amber-800 rounded-lg text-body">No unassigned hardware currently available in inventory.</p>
            ) : (
              <Select
                label="Select Available Hardware Asset *"
                value={assignAssetId}
                onChange={(e) => setAssignAssetId(e.target.value)}
                options={[{ label: '— Select Asset —', value: '' }, ...assetList.filter((a) => !a.assignedEmployeeId && a.status === 'Available').map((a) => ({ label: `${a.code} • ${a.name} ($${a.currentValue})`, value: a.id }))]}
              />
            )}
            <Textarea label="Provisioning Notes (Optional)" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} rows={2} />
            <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={!assignEmpId || !assignAssetId} onClick={handleConfirmAssign}>Confirm Assignment</Button>
            </div>
          </div>
        </Modal>

        <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Equipment Between Employees" size="md">
          <div className="space-y-4">
            <Select
              label="Select Currently Assigned Asset *"
              value={transferAssetId}
              onChange={(e) => setTransferAssetId(e.target.value)}
              options={[{ label: '— Select Assigned Asset —', value: '' }, ...assetList.filter((a) => a.status === 'Assigned' && a.assignedTo).map((a) => ({ label: `${a.code} • ${a.name} (Assigned to: ${a.assignedTo})`, value: a.id }))]}
            />
            <Select
              label="Transfer To Employee *"
              value={transferToEmpId}
              onChange={(e) => setTransferToEmpId(e.target.value)}
              options={[{ label: '— Select Recipient Employee —', value: '' }, ...employeeList.map((e) => ({ label: `${e.name} (${e.department})`, value: e.id }))]}
            />
            <Textarea label="Transfer Reason / Note" value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} rows={2} />
            <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
              <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={!transferAssetId || !transferToEmpId} onClick={handleConfirmTransfer}>Complete Transfer</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
