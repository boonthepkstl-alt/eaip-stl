import { useState, useMemo } from 'react';
import {
  UserPlus,
  Users,
  UserCheck,
  Package,
  Mail,
  MapPin,
  Briefcase,
  Shield,
  Eye,
  Plus,
  ArrowRightLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Laptop,
  AlertCircle,
  Wrench,
  Sparkles,
  Filter,
  X,
  Phone,
  Building
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Button,
  Badge,
  StatusBadge,
  Avatar,
  Modal,
  Select,
  Input,
  useToast,
  EmptyState,
  Textarea
} from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import {
  assets as initialAssets,
  employees as initialEmployees,
  departments,
  locations,
  type Asset,
  type Employee,
} from '@/data/mockData';
import { cn } from '@/lib/cn';

interface AssignmentProps {
  onNavigate: (id: string, assetId?: string) => void;
}

export function Assignment({ onNavigate }: AssignmentProps) {
  const { push } = useToast();

  // Primary State
  const [employeeList, setEmployeeList] = useState<Employee[]>(initialEmployees);
  const [assetList, setAssetList] = useState<Asset[]>(initialAssets);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // AI Filter State
  const [aiQuery, setAiQuery] = useState('');
  const [aiActive, setAiActive] = useState(false);

  // Modal States
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // Form State: Add Employee
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDept, setNewEmpDept] = useState(departments[0] || 'Engineering');
  const [newEmpLoc, setNewEmpLoc] = useState(locations[0] || 'HQ - Floor 4');
  const [newEmpDesk, setNewEmpDesk] = useState('');
  const [newEmpManager, setNewEmpManager] = useState('David Kim');
  const [newEmpStatus, setNewEmpStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');

  // Form State: Assign Asset
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignAssetId, setAssignAssetId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Form State: Transfer Asset
  const [transferAssetId, setTransferAssetId] = useState('');
  const [transferToEmpId, setTransferToEmpId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Helper: Get assigned assets for an employee
  const getEmployeeAssets = (employeeId: string, employeeName: string): Asset[] => {
    return assetList.filter(
      (a) =>
        (a.assignedEmployeeId && a.assignedEmployeeId === employeeId) ||
        (a.assignedTo && a.assignedTo.toLowerCase() === employeeName.toLowerCase())
    );
  };

  // KPI Calculations
  const totalEmployees = employeeList.length;
  const activeEmployees = employeeList.filter((e) => e.status === 'Active').length;
  const employeesWithAssets = employeeList.filter(
    (e) => getEmployeeAssets(e.id, e.name).length > 0
  ).length;
  const unassignedAssets = assetList.filter(
    (a) => !a.assignedEmployeeId && a.status === 'Available'
  ).length;

  // AI Search Handler
  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    const lower = aiQuery.toLowerCase();

    if (lower.includes('engineering')) setDepartmentFilter('Engineering');
    else if (lower.includes('sales')) setDepartmentFilter('Sales');
    else if (lower.includes('design')) setDepartmentFilter('Design');
    else if (lower.includes('finance')) setDepartmentFilter('Finance');
    else if (lower.includes('operations') || lower.includes('it ops')) setDepartmentFilter('IT Operations');

    if (lower.includes('remote')) setLocationFilter('Remote');
    else if (lower.includes('boston')) setLocationFilter('Branch - Boston');
    else if (lower.includes('austin')) setLocationFilter('Branch - Austin');

    if (lower.includes('active')) setStatusFilter('Active');
    else if (lower.includes('leave')) setStatusFilter('On Leave');

    setAiActive(true);
  };

  const clearAISearch = () => {
    setAiQuery('');
    setAiActive(false);
    setDepartmentFilter('ALL');
    setLocationFilter('ALL');
    setStatusFilter('ALL');
  };

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employeeList.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q));

      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesLoc = locationFilter === 'ALL' || emp.location === locationFilter;
      const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

      return matchesSearch && matchesDept && matchesLoc && matchesStatus;
    });
  }, [employeeList, searchQuery, departmentFilter, locationFilter, statusFilter]);

  // Handlers
  const handleOpenAssignModal = (emp?: Employee) => {
    if (emp) {
      setAssignEmpId(emp.id);
    } else if (employeeList.length > 0) {
      setAssignEmpId(employeeList[0].id);
    }
    const avail = assetList.find((a) => !a.assignedEmployeeId && a.status === 'Available');
    if (avail) setAssignAssetId(avail.id);
    setAssignOpen(true);
  };

  const handleOpenTransferModal = (emp?: Employee) => {
    if (emp) {
      const empAssets = getEmployeeAssets(emp.id, emp.name);
      if (empAssets.length > 0) {
        setTransferAssetId(empAssets[0].id);
      }
    }
    setTransferOpen(true);
  };

  const handleCreateEmployee = () => {
    if (!newEmpName.trim() || !newEmpEmail.trim()) {
      push({ variant: 'warning', title: 'Required Fields', message: 'Name and Email are required.' });
      return;
    }

    const newId = `e${employeeList.length + 1}`;
    const newCode = `EMP-${(employeeList.length + 1).toString().padStart(4, '0')}`;
    const initials = newEmpName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const colors = ['bg-brand-500', 'bg-accent-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-violet-500'];
    const randomColor = colors[employeeList.length % colors.length];

    const newEmployee: Employee = {
      id: newId,
      employeeCode: newCode,
      name: newEmpName,
      email: newEmpEmail,
      phone: newEmpPhone || '+1 (555) 000-0000',
      jobTitle: newEmpTitle || 'Staff Specialist',
      title: newEmpTitle || 'Staff Specialist',
      department: newEmpDept,
      departmentId: `DEPT-${newEmpDept.slice(0, 3).toUpperCase()}`,
      location: newEmpLoc,
      deskLocation: newEmpDesk || 'Open Desk',
      manager: newEmpManager,
      managerId: 'u1',
      status: newEmpStatus,
      avatarColor: randomColor,
      initials: initials || 'EM',
      startDate: new Date().toISOString().split('T')[0],
      workstationType: 'Standard Corporate Workstation',
      primaryOs: 'macOS & Windows 11',
      assignedCount: 0,
    };

    setEmployeeList([newEmployee, ...employeeList]);
    setAddEmployeeOpen(false);

    // Reset
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPhone('');
    setNewEmpTitle('');
    setNewEmpDesk('');

    push({
      variant: 'success',
      title: 'Employee Profile Created',
      message: `${newEmployee.name} (${newCode}) added to system.`,
    });
  };

  const handleConfirmAssign = () => {
    if (!assignEmpId || !assignAssetId) {
      push({ variant: 'warning', title: 'Selection Missing', message: 'Select both an employee and an available asset.' });
      return;
    }

    const targetEmp = employeeList.find((e) => e.id === assignEmpId);
    const targetAsset = assetList.find((a) => a.id === assignAssetId);

    if (!targetEmp || !targetAsset) return;

    // Update asset
    const updatedAssets = assetList.map((a) => {
      if (a.id === assignAssetId) {
        return {
          ...a,
          status: 'Assigned' as const,
          assignedTo: targetEmp.name,
          assignedEmployeeId: targetEmp.id,
          assignedDate: new Date().toISOString().split('T')[0],
        };
      }
      return a;
    });
    setAssetList(updatedAssets);

    // Update employee count
    const updatedEmployees = employeeList.map((e) => {
      if (e.id === assignEmpId) {
        return { ...e, assignedCount: (e.assignedCount || 0) + 1 };
      }
      return e;
    });
    setEmployeeList(updatedEmployees);

    setAssignOpen(false);
    push({
      variant: 'success',
      title: 'Asset Assigned',
      message: `${targetAsset.name} assigned to ${targetEmp.name}.`,
    });
  };

  const handleConfirmTransfer = () => {
    if (!transferAssetId || !transferToEmpId) {
      push({ variant: 'warning', title: 'Selection Missing', message: 'Select an asset and the recipient employee.' });
      return;
    }

    const targetAsset = assetList.find((a) => a.id === transferAssetId);
    const toEmp = employeeList.find((e) => e.id === transferToEmpId);

    if (!targetAsset || !toEmp) return;

    const fromName = targetAsset.assignedTo || 'Previous Owner';

    // Update asset
    const updatedAssets = assetList.map((a) => {
      if (a.id === transferAssetId) {
        return {
          ...a,
          status: 'Assigned' as const,
          assignedTo: toEmp.name,
          assignedEmployeeId: toEmp.id,
          assignedDate: new Date().toISOString().split('T')[0],
        };
      }
      return a;
    });
    setAssetList(updatedAssets);

    setTransferOpen(false);
    push({
      variant: 'success',
      title: 'Asset Transferred',
      message: `${targetAsset.name} successfully transferred from ${fromName} to ${toEmp.name}.`,
    });
  };

  // Table Columns
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
            <button
              onClick={() => onNavigate('employee-detail', r.id)}
              className="font-semibold text-surface-900 hover:text-brand-600 transition-colors text-left truncate block max-w-[200px]"
            >
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
          <p className="font-medium text-surface-800 text-body-sm">{r.jobTitle}</p>
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
          <p className="text-surface-700 text-body-sm flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-surface-400 shrink-0" />
            {r.location}
          </p>
          <p className="text-caption text-surface-400 pl-4">{r.deskLocation || 'Standard Desk'}</p>
        </div>
      ),
    },
    {
      key: 'assignedAssets',
      header: 'Assigned Equipment',
      render: (r) => {
        const empAssets = getEmployeeAssets(r.id, r.name);
        if (empAssets.length === 0) {
          return <span className="text-surface-400 text-caption italic">No assets</span>;
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {empAssets.map((ast) => (
              <span
                key={ast.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('asset-detail', ast.id);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-100 hover:bg-brand-50 hover:text-brand-700 text-surface-700 text-[11px] font-mono transition-colors cursor-pointer border border-surface-200"
                title={`${ast.name} (${ast.code})`}
              >
                <ast.icon className="h-3 w-3 text-surface-500" />
                {ast.code}
              </span>
            ))}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('employee-detail', r.id)}
            rightIcon={<ChevronRight className="h-3 w-3" />}
          >
            Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Assign Asset"
            onClick={() => handleOpenAssignModal(r)}
          >
            <Plus className="h-3.5 w-3.5 text-surface-600" />
          </Button>
        </div>
      ),
    },
  ];

  const rowActions = (row: Employee) => [
    {
      label: 'View Employee Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => onNavigate('employee-detail', row.id),
    },
    {
      label: 'Assign Equipment',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => handleOpenAssignModal(row),
    },
    {
      label: 'Transfer Equipment',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      onClick: () => handleOpenTransferModal(row),
    },
    {
      label: 'Create IT Support Ticket',
      icon: <Wrench className="h-4 w-4" />,
      onClick: () => onNavigate('employee-detail', row.id),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="employee-management-page">
      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Employee Management</h1>
          <p className="text-body-sm text-surface-500">
            Manage company personnel, IT hardware assignments, workstation profiles, and support tickets
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowRightLeft className="h-4 w-4" />}
            onClick={() => setTransferOpen(true)}
          >
            Transfer Asset
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Laptop className="h-4 w-4" />}
            onClick={() => handleOpenAssignModal()}
          >
            Assign Asset
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setAddEmployeeOpen(true)}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Total Personnel</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{totalEmployees}</p>
              <p className="text-caption text-emerald-600 font-medium mt-0.5">100% ID Verified</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Active Staff</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{activeEmployees}</p>
              <p className="text-caption text-surface-500 mt-0.5">{totalEmployees - activeEmployees} on leave/inactive</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">With IT Hardware</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{employeesWithAssets}</p>
              <p className="text-caption text-surface-500 mt-0.5">
                {Math.round((employeesWithAssets / totalEmployees) * 100)}% coverage
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Laptop className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Available Stock</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{unassignedAssets}</p>
              <p className="text-caption text-amber-600 font-medium mt-0.5">Ready for assignment</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. AI Smart Filter Bar */}
      <Card className="p-4 bg-surface-50/70 border-surface-200">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500" />
            <input
              type="text"
              placeholder='Try AI Query: "show engineering employees", "remote staff", "active on leave"...'
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              className="w-full pl-9 pr-24 py-2 bg-white border border-surface-200 rounded-lg text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            {aiActive ? (
              <button
                onClick={clearAISearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-surface-500 hover:text-surface-900 px-2 py-1 bg-surface-100 rounded"
              >
                Clear
              </button>
            ) : (
              <button
                onClick={handleAISearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-brand-600 font-medium hover:text-brand-700 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 rounded transition-colors"
              >
                Ask AI
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Filter className="h-3.5 w-3.5" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters {(departmentFilter !== 'ALL' || locationFilter !== 'ALL' || statusFilter !== 'ALL') && '•'}
            </Button>
          </div>
        </div>

        {/* Expandable Manual Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-200">
            <div>
              <label className="block text-caption font-semibold text-surface-600 mb-1">Department</label>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                options={[
                  { label: 'All Departments', value: 'ALL' },
                  ...departments.map((d) => ({ label: d, value: d })),
                ]}
              />
            </div>
            <div>
              <label className="block text-caption font-semibold text-surface-600 mb-1">Location</label>
              <Select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                options={[
                  { label: 'All Locations', value: 'ALL' },
                  ...locations.map((l) => ({ label: l, value: l })),
                ]}
              />
            </div>
            <div>
              <label className="block text-caption font-semibold text-surface-600 mb-1">Status</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Active', value: 'Active' },
                  { label: 'On Leave', value: 'On Leave' },
                  { label: 'Inactive', value: 'Inactive' },
                ]}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 4. Employee DataTable */}
      <Card className="p-6">
        <DataTable
          columns={employeeColumns}
          data={filteredEmployees}
          searchPlaceholder="Search employees by name, email, role, code..."
          rowActions={rowActions}
          onRowClick={(row) => onNavigate('employee-detail', row.id)}
          pageSize={8}
        />
      </Card>

      {/* MODAL 1: Add Employee */}
      <Modal
        open={addEmployeeOpen}
        onClose={() => setAddEmployeeOpen(false)}
        title="Add New Employee Profile"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Johnathan Doe"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Work Email *
              </label>
              <Input
                placeholder="e.g. john.doe@company.com"
                value={newEmpEmail}
                onChange={(e) => setNewEmpEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Job Title / Position
              </label>
              <Input
                placeholder="e.g. Senior Security Architect"
                value={newEmpTitle}
                onChange={(e) => setNewEmpTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Phone Number
              </label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={newEmpPhone}
                onChange={(e) => setNewEmpPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Department
              </label>
              <Select
                value={newEmpDept}
                onChange={(e) => setNewEmpDept(e.target.value)}
                options={departments.map((d) => ({ label: d, value: d }))}
              />
            </div>
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Location Campus
              </label>
              <Select
                value={newEmpLoc}
                onChange={(e) => setNewEmpLoc(e.target.value)}
                options={locations.map((l) => ({ label: l, value: l }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Physical Desk
              </label>
              <Input
                placeholder="e.g. Desk E-302"
                value={newEmpDesk}
                onChange={(e) => setNewEmpDesk(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Reporting Manager
              </label>
              <Select
                value={newEmpManager}
                onChange={(e) => setNewEmpManager(e.target.value)}
                options={employeeList.map((e) => ({ label: e.name, value: e.name }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setAddEmployeeOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateEmployee}>
              Save Profile
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Assign Asset */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign IT Equipment"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Select Employee *
            </label>
            <Select
              value={assignEmpId}
              onChange={(e) => setAssignEmpId(e.target.value)}
              options={employeeList.map((e) => ({
                label: `${e.name} (${e.jobTitle} - ${e.department})`,
                value: e.id,
              }))}
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Select Available Hardware Asset *
            </label>
            {assetList.filter((a) => !a.assignedEmployeeId && a.status === 'Available').length === 0 ? (
              <p className="p-3 bg-amber-50 text-amber-800 rounded-lg text-body-sm">
                No unassigned hardware currently available in inventory.
              </p>
            ) : (
              <Select
                value={assignAssetId}
                onChange={(e) => setAssignAssetId(e.target.value)}
                options={[
                  { label: '— Select Asset —', value: '' },
                  ...assetList
                    .filter((a) => !a.assignedEmployeeId && a.status === 'Available')
                    .map((a) => ({
                      label: `${a.code} • ${a.name} ($${a.currentValue})`,
                      value: a.id,
                    })),
                ]}
              />
            )}
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Provisioning Notes (Optional)
            </label>
            <Textarea
              placeholder="e.g. Standard engineering laptop kit issued..."
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!assignEmpId || !assignAssetId}
              onClick={handleConfirmAssign}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Transfer Asset */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer Equipment Between Employees"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Select Currently Assigned Asset *
            </label>
            <Select
              value={transferAssetId}
              onChange={(e) => setTransferAssetId(e.target.value)}
              options={[
                { label: '— Select Assigned Asset —', value: '' },
                ...assetList
                  .filter((a) => a.status === 'Assigned' && a.assignedTo)
                  .map((a) => ({
                    label: `${a.code} • ${a.name} (Assigned to: ${a.assignedTo})`,
                    value: a.id,
                  })),
              ]}
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Transfer To Employee *
            </label>
            <Select
              value={transferToEmpId}
              onChange={(e) => setTransferToEmpId(e.target.value)}
              options={[
                { label: '— Select Recipient Employee —', value: '' },
                ...employeeList.map((e) => ({
                  label: `${e.name} (${e.department})`,
                  value: e.id,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Transfer Reason / Note
            </label>
            <Textarea
              placeholder="e.g. Department handover, team change..."
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!transferAssetId || !transferToEmpId}
              onClick={handleConfirmTransfer}
            >
              Complete Transfer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
