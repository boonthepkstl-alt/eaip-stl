import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserPlus, ArrowRightLeft, Package, Users, UserCheck, Clock, Wrench,
  Sparkles, Send, Filter,
} from 'lucide-react';
import { Card, Button, Badge, Avatar, Drawer, Modal, Select, Input, useToast, EmptyState } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { assetAPI } from '@/services/asset';
import { assignmentAPI } from '@/services/assignment';
import { organizationAPI } from '@/services/organization';
import { masterdataAPI } from '@/services/masterdata';
import { Asset } from '@/types/asset';
import type { Assignment as AssignmentEntity } from '@/types/assignment';
import { Employee } from '@/types/organization';
import { Department } from '@/types/masterdata';
import { assignAssetSchema, transferAssetSchema, type AssignAssetFormValues, type TransferAssetFormValues } from '@/schemas/assignment.schema';
import { createEmployeeSchema, type CreateEmployeeFormValues } from '@/schemas/organization.schema';

interface AssignmentProps {
  onNavigate: (id: string, assetId?: string) => void;
}

function initialsOf(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

// FR-30..FR-33 (Assignment & Lifecycle) + FR-38..FR-44 (Workflow & Approval) — real data source
// (assignmentAPI/organizationAPI/assetAPI/masterdataAPI). Rewired 2026-08-18 into an
// employee-centric "Employee Management" layout matching esaps_ai_gemini's page of the same
// name, per explicit user request ("เปลี่ยนทั้งหมด"). Decisions confirmed with the user at that
// time:
// - The old "By Asset" tab (workflow status per asset: pending/active/acknowledged) is dropped
//   entirely — Gemini has no equivalent (no approval workflow concept at all); that status view
//   still exists for real in the Approval Inbox page, nothing is lost.
// - The AI Smart Filter Bar and the "Create IT Support Ticket" row action are **UI mockup
//   only** (see MOCKUP ONLY comments below) — no AI backend, no IT Request service exists.
// - "Add Employee" is REAL, not mockup — organizationAPI.create() already existed with 0 call
//   sites; this page is now the first real caller.
// Assign/Transfer still route through the workflow engine (assignmentAPI.assign/transfer submit
// for manager approval automatically) exactly as before — Gemini's version mutates local state
// directly with no approval step, which is not what this system does.
export function Assignment({ onNavigate }: AssignmentProps) {
  const { push } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<AssignmentEntity[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // MOCKUP ONLY — no AI backend behind this; "Ask AI" never actually changes the filters below.
  const [aiQuery, setAiQuery] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [presetEmployeeId, setPresetEmployeeId] = useState<string | undefined>(undefined);
  const [presetAssetId, setPresetAssetId] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetResult, employeeResult, assignmentResult, departmentResult] = await Promise.all([
        assetAPI.list(),
        organizationAPI.listEmployees(),
        assignmentAPI.list(),
        masterdataAPI.listDepartments(),
      ]);
      setAssets(assetResult.data);
      setEmployees(employeeResult);
      setAssignments(assignmentResult);
      setDepartments(departmentResult);
    } catch (err) {
      push({ variant: 'error', title: 'Could not load assignment data', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // None of the values below are wrapped in useMemo — see the comment on `filteredEmployees`:
  // the mock services return their internal array by reference and mutate it in place on
  // create/update, so a dependency array keyed on that reference can look "unchanged" to React
  // even after a real mutation, silently serving stale cached results. Plain recomputation on
  // every render sidesteps that; these are small mock-backed lists, so there's no real perf
  // cost to not memoizing them.
  const activeAssignmentByAsset = (() => {
    const map = new Map<string, AssignmentEntity>();
    assignments.filter((a) => a.isActive || a.status === 'pending_manager_approval' || a.status === 'pending_acknowledgement').forEach((a) => map.set(a.assetId, a));
    return map;
  })();

  const availableAssets = assets.filter((a) => !activeAssignmentByAsset.has(a.id));

  const employeesWithAssetsCount = new Set(Array.from(activeAssignmentByAsset.values()).filter((a) => a.status === 'active').map((a) => a.employeeId)).size;

  const pendingApprovalCount = assignments.filter((a) => a.status === 'pending_manager_approval').length;

  const activeStaffCount = employees.filter((e) => e.isActive).length;

  const getEmployeeAssets = (employeeId: string) =>
    assignments
      .filter((a) => a.employeeId === employeeId && a.status === 'active')
      .map((a) => assets.find((asset) => asset.id === a.assetId))
      .filter((a): a is Asset => Boolean(a));

  const filteredEmployees = (() => {
    const term = search.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchSearch = !term
        || emp.name.toLowerCase().includes(term)
        || (emp.positionTitle ?? '').toLowerCase().includes(term)
        || emp.department.toLowerCase().includes(term);
      const matchDept = departmentFilter === 'all' || emp.departmentId === departmentFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? emp.isActive : !emp.isActive);
      return matchSearch && matchDept && matchStatus;
    });
  })();

  const openAssign = (employeeId?: string, assetId?: string) => {
    setPresetEmployeeId(employeeId);
    setPresetAssetId(assetId);
    setAssignOpen(true);
  };

  const openTransfer = (employeeId: string) => {
    setPresetEmployeeId(employeeId);
    setTransferOpen(true);
  };

  // MOCKUP ONLY — see file header comment.
  const mockupAction = (title: string) => () => push({ variant: 'info', title, message: 'UI mockup only, not a real action yet' });

  // --- Assign form ---
  const assignForm = useForm<AssignAssetFormValues>({
    resolver: zodResolver(assignAssetSchema),
    defaultValues: { assetId: '', employeeId: '', assignedDate: '', expectedReturnDate: '' },
  });

  // --- Transfer form ---
  const heldAssetsByEmployee = presetEmployeeId ? getEmployeeAssets(presetEmployeeId) : [];

  const transferForm = useForm<TransferAssetFormValues>({
    resolver: zodResolver(transferAssetSchema),
    defaultValues: { assetId: '', fromEmployeeId: '', toEmployeeId: '', transferDate: '', reason: '' },
  });

  // When opened without a specific employee (the header "Transfer Asset" button), list every
  // currently-assigned asset across all employees instead of just one employee's — the
  // per-employee row action still scopes to `heldAssetsByEmployee` via presetEmployeeId.
  const transferableAssetOptions = presetEmployeeId
    ? heldAssetsByEmployee.map((a) => ({ value: a.id, label: `${a.name} (${a.assetTag})` }))
    : Array.from(activeAssignmentByAsset.entries())
        .filter(([, a]) => a.status === 'active')
        .map(([assetId, a]) => {
          const asset = assets.find((x) => x.id === assetId);
          const emp = employees.find((e) => e.id === a.employeeId);
          return asset ? { value: asset.id, label: `${asset.name} (${asset.assetTag}) — held by ${emp?.name ?? a.employeeId}` } : null;
        })
        .filter((o): o is { value: string; label: string } => Boolean(o));

  // --- Add Employee form (real — organizationAPI.create) ---
  const employeeForm = useForm<CreateEmployeeFormValues>({ resolver: zodResolver(createEmployeeSchema) });

  useEffect(() => {
    if (assignOpen) {
      assignForm.reset({ assetId: presetAssetId ?? '', employeeId: presetEmployeeId ?? '', assignedDate: '', expectedReturnDate: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignOpen]);

  useEffect(() => {
    if (transferOpen) {
      transferForm.reset({
        assetId: heldAssetsByEmployee[0]?.id ?? '',
        fromEmployeeId: presetEmployeeId ?? '',
        toEmployeeId: '',
        transferDate: '',
        reason: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferOpen]);

  const onAssignSubmit = async (values: AssignAssetFormValues) => {
    try {
      const employee = employees.find((e) => e.id === values.employeeId);
      await assignmentAPI.assign({
        assetId: values.assetId,
        employeeId: values.employeeId,
        department: employee?.department ?? '',
        assignedDate: values.assignedDate,
        expectedReturnDate: values.expectedReturnDate,
      });
      push({ variant: 'success', title: 'Assignment submitted', message: 'Waiting for manager approval.' });
      setAssignOpen(false);
      await fetchData();
    } catch (err) {
      push({ variant: 'error', title: 'Could not assign', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const onTransferSubmit = async (values: TransferAssetFormValues) => {
    try {
      const existing = assignments.find((a) => a.assetId === values.assetId && a.status === 'active');
      if (!existing) {
        push({ variant: 'error', title: 'Could not transfer', message: 'No active assignment found for this asset/employee.' });
        return;
      }
      const toEmployee = employees.find((e) => e.id === values.toEmployeeId);
      await assignmentAPI.transfer(existing.id, { toEmployeeId: values.toEmployeeId, department: toEmployee?.department ?? existing.department });
      push({ variant: 'success', title: 'Transfer submitted', message: 'Waiting for manager approval.' });
      setTransferOpen(false);
      await fetchData();
    } catch (err) {
      push({ variant: 'error', title: 'Could not transfer', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const onCreateEmployee = async (values: CreateEmployeeFormValues) => {
    try {
      const departmentName = departments.find((d) => d.id === values.departmentId)?.name ?? '';
      const created = await organizationAPI.create({
        name: values.name,
        department: departmentName,
        departmentId: values.departmentId,
        positionTitle: values.positionTitle || undefined,
        costCenter: values.costCenter || undefined,
        directManagerId: values.directManagerId || null,
        isActive: true,
      });
      push({ variant: 'success', title: 'Employee added', message: created.name });
      setAddEmployeeOpen(false);
      employeeForm.reset();
      await fetchData();
    } catch (err) {
      push({ variant: 'error', title: 'Could not add employee', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(r.name)} size="sm" color={r.isActive ? 'bg-brand-500' : 'bg-surface-400'} />
          <div className="min-w-0">
            <p className="font-medium text-surface-900 truncate">{r.name}</p>
            <p className="text-caption text-surface-500 font-mono">{r.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'positionTitle',
      header: 'Designation & Department',
      render: (r) => (
        <div>
          <p className="text-surface-800">{r.positionTitle ?? '—'}</p>
          <p className="text-caption text-surface-500">{r.department}</p>
        </div>
      ),
    },
    {
      key: 'assignedAssets',
      header: 'Assigned Equipment',
      render: (r) => {
        const empAssets = getEmployeeAssets(r.id);
        if (empAssets.length === 0) return <span className="text-caption text-surface-400 italic">No assets</span>;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {empAssets.map((a) => (
              <button
                key={a.id}
                onClick={(e) => { e.stopPropagation(); onNavigate('asset-detail', a.id); }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-100 hover:bg-brand-50 hover:text-brand-700 text-surface-700 text-[11px] font-mono transition-colors border border-surface-200"
                title={`${a.name} (${a.assetTag})`}
              >
                <Package className="h-3 w-3 text-surface-500" />
                {a.assetTag}
              </button>
            ))}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      sortValue: (r) => (r.isActive ? 1 : 0),
      render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'} dot>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  const rowActions = (row: Employee) => {
    const hasAssets = getEmployeeAssets(row.id).length > 0;
    const actions: { label: string; icon?: React.ReactNode; onClick?: () => void; danger?: boolean; divider?: boolean }[] = [
      { label: 'Assign Equipment', icon: <UserPlus className="h-4 w-4" />, onClick: () => openAssign(row.id) },
    ];
    if (hasAssets) {
      actions.push({ label: 'Transfer Equipment', icon: <ArrowRightLeft className="h-4 w-4" />, onClick: () => openTransfer(row.id) });
    }
    // MOCKUP ONLY — no IT Request service exists yet (deferred to Phase F).
    actions.push({ label: 'Create IT Support Ticket', icon: <Wrench className="h-4 w-4" />, onClick: mockupAction('Create IT support ticket') });
    return actions;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-body text-surface-500">{loading ? 'Loading…' : `${filteredEmployees.length} of ${employees.length} employees`}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Wrench className="h-4 w-4" />} onClick={() => onNavigate('checkin-checkout')}>IT Requisition & Maintenance</Button>
          <Button variant="outline" size="sm" leftIcon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => openTransfer('')}>Transfer Asset</Button>
          <Button variant="outline" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => openAssign()}>Assign Asset</Button>
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAddEmployeeOpen(true)}>Add Employee</Button>
        </div>
      </div>

      {/* KPI summary — real figures from assets/employees/assignments already loaded above */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Total Personnel</p>
              <p className="text-heading font-bold text-surface-900 mt-1">{loading ? '…' : employees.length}</p>
              <p className="text-[11px] text-surface-500 mt-0.5">{loading ? ' ' : `Across ${departments.length} department${departments.length === 1 ? '' : 's'}`}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Users className="h-5 w-5" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Active Staff</p>
              <p className="text-heading font-bold text-surface-900 mt-1">{loading ? '…' : activeStaffCount}</p>
              <p className="text-[11px] text-success-700 mt-0.5 font-medium">{loading || employees.length === 0 ? ' ' : `${Math.round((activeStaffCount / employees.length) * 100)}% of total`}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-success-50 text-success-600 flex items-center justify-center"><UserCheck className="h-5 w-5" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">With IT Hardware</p>
              <p className="text-heading font-bold text-surface-900 mt-1">{loading ? '…' : employeesWithAssetsCount}</p>
              <p className="text-[11px] text-accent-700 mt-0.5 font-medium">{loading || employees.length === 0 ? ' ' : `${Math.round((employeesWithAssetsCount / employees.length) * 100)}% coverage`}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center"><Package className="h-5 w-5" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Pending Approval</p>
              <p className="text-heading font-bold text-surface-900 mt-1">{loading ? '…' : pendingApprovalCount}</p>
              <p className="text-[11px] text-warning-700 mt-0.5 font-medium">{loading ? ' ' : pendingApprovalCount > 0 ? 'Awaiting manager sign-off' : 'All caught up'}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center"><Clock className="h-5 w-5" /></div>
          </div>
        </Card>
      </div>

      {/* MOCKUP ONLY — AI Smart Filter Bar, no AI backend behind this */}
      <Card className="p-4 bg-surface-50/70">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500" />
            <input
              type="text"
              placeholder='Try AI Query: "show engineering employees", "active staff"...'
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-surface-200 rounded-lg text-body text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />} disabled={!aiQuery.trim()} onClick={mockupAction('AI search')}>Ask AI</Button>
          <Button variant={showFilters ? 'primary' : 'outline'} size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />} onClick={() => setShowFilters((s) => !s)}>Filters</Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-200">
            <Input label="Search" placeholder="Name, title, or department..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} options={[
              { value: 'all', label: 'All Departments' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]} />
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]} />
          </div>
        )}
      </Card>

      {loading ? (
        <DataTable columns={columns} data={[]} loading emptyTitle="" emptyDescription="" />
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-6 w-6" />} title="No employees found" description="Try adjusting your search or filters." />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredEmployees}
          rowActions={rowActions}
        />
      )}

      {/* Assign Drawer */}
      <Drawer open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Asset" description="Select an asset and employee to create an assignment — this submits for manager approval" footer={
        <>
          <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button loading={assignForm.formState.isSubmitting} onClick={assignForm.handleSubmit(onAssignSubmit)}>Confirm Assignment</Button>
        </>
      }>
        <div className="flex flex-col gap-4">
          <Controller control={assignForm.control} name="assetId" render={({ field }) => (
            <Select label="Asset" error={assignForm.formState.errors.assetId?.message} value={field.value} onChange={field.onChange}
              options={[{ value: '', label: 'Select asset' }, ...availableAssets.map((a) => ({ value: a.id, label: `${a.name} (${a.assetTag})` }))]} />
          )} />
          <Controller control={assignForm.control} name="employeeId" render={({ field }) => (
            <Select label="Employee" error={assignForm.formState.errors.employeeId?.message} value={field.value} onChange={field.onChange}
              options={[{ value: '', label: 'Select employee' }, ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))]} />
          )} />
          <Input label="Assignment Date" type="date" error={assignForm.formState.errors.assignedDate?.message} {...assignForm.register('assignedDate')} />
          <Input label="Expected Return Date" type="date" helpText="Optional" {...assignForm.register('expectedReturnDate')} />
        </div>
      </Drawer>

      {/* Transfer Drawer */}
      <Drawer open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Asset" description="Transfer to a new employee — this submits for manager approval" footer={
        <>
          <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button loading={transferForm.formState.isSubmitting} onClick={transferForm.handleSubmit(onTransferSubmit)}>Confirm Transfer</Button>
        </>
      }>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 border border-surface-200">
            <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Package className="h-5 w-5" /></div>
            <div><p className="text-body font-medium text-surface-900">Currently held asset</p><p className="text-caption text-surface-500">Select which asset to transfer below</p></div>
          </div>
          <Controller control={transferForm.control} name="assetId" render={({ field }) => (
            <Select label="Asset to Transfer" error={transferForm.formState.errors.assetId?.message} value={field.value} onChange={field.onChange}
              options={[{ value: '', label: 'Select asset' }, ...transferableAssetOptions]} />
          )} />
          <div className="flex items-center justify-center text-surface-400"><ArrowRightLeft className="h-5 w-5" /></div>
          <Controller control={transferForm.control} name="toEmployeeId" render={({ field }) => (
            <Select label="Transfer To" error={transferForm.formState.errors.toEmployeeId?.message} value={field.value} onChange={field.onChange}
              options={[{ value: '', label: 'Select new holder' }, ...employees.filter((e) => !presetEmployeeId || e.id !== presetEmployeeId).map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))]} />
          )} />
          <Input label="Transfer Date" type="date" error={transferForm.formState.errors.transferDate?.message} {...transferForm.register('transferDate')} />
          <Input label="Reason" placeholder="e.g. Department reorganization" helpText="Optional" {...transferForm.register('reason')} />
        </div>
      </Drawer>

      {/* Add Employee Modal — real, via organizationAPI.create */}
      <Modal
        open={addEmployeeOpen}
        onClose={() => { setAddEmployeeOpen(false); employeeForm.reset(); }}
        title="Add New Employee"
        description="Create a new employee profile in the organization directory"
        footer={
          <>
            <Button variant="outline" onClick={() => { setAddEmployeeOpen(false); employeeForm.reset(); }}>Cancel</Button>
            <Button loading={employeeForm.formState.isSubmitting} onClick={employeeForm.handleSubmit(onCreateEmployee)}>Save Profile</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Full Name" placeholder="e.g. Johnathan Doe" error={employeeForm.formState.errors.name?.message} {...employeeForm.register('name')} />
          <Controller control={employeeForm.control} name="departmentId" render={({ field }) => (
            <Select
              label="Department"
              error={employeeForm.formState.errors.departmentId?.message}
              value={field.value ?? ''}
              onChange={field.onChange}
              options={[{ value: '', label: 'Select a department...' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
            />
          )} />
          <Input label="Job Title / Position" placeholder="e.g. Senior Security Architect" helpText="Optional" {...employeeForm.register('positionTitle')} />
          <Input label="Cost Center" placeholder="e.g. CC-1002" helpText="Optional" {...employeeForm.register('costCenter')} />
          <Controller control={employeeForm.control} name="directManagerId" render={({ field }) => (
            <Select
              label="Reporting Manager"
              value={field.value ?? ''}
              onChange={field.onChange}
              options={[{ value: '', label: 'No manager' }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
            />
          )} />
        </div>
      </Modal>
    </div>
  );
}
