import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Users,
  Building,
  Mail,
  MapPin,
  Laptop,
  Wrench,
  History,
  ClipboardList,
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  Edit,
  ChevronRight,
  Shield,
  Briefcase,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, StatusBadge, Avatar, Tabs, EmptyState, useToast, SectionCard, Modal, Input, Select, Textarea } from '@/components/ui';
import { AppShell } from '@/components/AppShell';
import { DataTable, type Column } from '@/components/DataTable';
import { getAssetIcon } from '@/data/asset-icons';
import { departments, locations, employeeHistoryEvents as fixtureHistory, employeeAuditLogs as fixtureAudit, type EmployeeHistoryEvent, type EmployeeAuditLog } from '@/data/fixtures/mockData';
import type { PriorityLevel } from '@/data/fixtures/requisitionData';
import { useEmployee } from '@/hooks/useEmployee';
import { useEmployeeAssignments } from '@/hooks/useEmployeeAssignments';
import { useTickets } from '@/hooks/useTickets';
import { useLicenses } from '@/hooks/useLicenses';
import { assetService } from '@/services/asset-service';
import { employeeService } from '@/services/employee-service';
import { ticketService } from '@/services/ticket-service';
import type { Asset } from '@/types/asset';
import type { EmployeeStatus } from '@/types/employee';
import { cn } from '@/lib/cn';

// Ported from src/pages/EmployeeDetail.tsx (1600+ lines). Core Employee domain data — identity,
// department/org hierarchy, edit profile — goes through employeeService; assigned assets go
// through employeeService.getEmployeeAssignments (which itself reads assetService — the one
// documented Employee→Asset dependency, never the reverse). The IT Tickets tab goes through
// ticketService/useTickets as of Phase 5B (closing the coupling documented in
// EMPLOYEE-MANAGEMENT-MIGRATION.md). The License tab goes through licenseService/useLicenses as
// of Phase 5C, closing the same deferred coupling. History/Audit tabs are employee-scoped but
// not yet exposed via employeeService either — same deferred treatment.

const priorityConfig: Record<PriorityLevel, { variant: 'error' | 'warning' | 'accent' | 'default'; sla: string }> = {
  Critical: { variant: 'error', sla: '2 Hours SLA' },
  High: { variant: 'warning', sla: '8 Hours SLA' },
  Medium: { variant: 'accent', sla: '24 Hours SLA' },
  Low: { variant: 'default', sla: '48 Hours SLA' },
};

export function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const { employee, loading, error, notFound, refetch } = useEmployee(employeeId);
  const { assets: assignedAssets, loading: assetsLoading, refetch: refetchAssignments } = useEmployeeAssignments(employee);
  const { licenses: allLicenses } = useLicenses({});

  const [tab, setTab] = useState('overview');

  const { tickets, refetch: refetchTickets } = useTickets({});
  const [historyEvents, setHistoryEvents] = useState<EmployeeHistoryEvent[]>(fixtureHistory);
  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLog[]>(fixtureAudit);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const [selectedAssetToAssign, setSelectedAssetToAssign] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<PriorityLevel>('High');

  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDesk, setEditDesk] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editStatus, setEditStatus] = useState<EmployeeStatus>('Active');

  const employeeTickets = useMemo(() => {
    if (!employee) return [];
    return tickets.filter(
      (t) =>
        t.requester.id === employee.id ||
        t.requester.name.toLowerCase() === employee.name.toLowerCase() ||
        assignedAssets.some((a) => a.id === t.asset?.id || a.code === t.asset?.code)
    );
  }, [tickets, employee, assignedAssets]);

  const employeeHistory = useMemo(() => (employee ? historyEvents.filter((h) => h.employeeId === employee.id) : []), [historyEvents, employee]);
  const employeeAudit = useMemo(() => (employee ? auditLogs.filter((a) => a.employeeId === employee.id) : []), [auditLogs, employee]);
  const employeeLicenses = useMemo(() => {
    if (!employee) return [];
    return allLicenses
      .map((lic) => {
        const seat = lic.allocatedSeats.find(
          (s) => s.employeeId === employee.id || (s.employeeName && s.employeeName.toLowerCase() === employee.name.toLowerCase())
        );
        return seat ? { license: lic, seat } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [employee, allLicenses]);

  const totalAssetValue = useMemo(() => assignedAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0), [assignedAssets]);
  const openTicketsCount = useMemo(() => employeeTickets.filter((t) => t.status !== 'DONE' && t.status !== 'REJECTED_BY_DEPT').length, [employeeTickets]);

  if (loading) {
    return (
      <AppShell current="employees" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Employee Details' }]}>
        <div className="flex items-center justify-center py-24 text-body text-surface-400">Loading employee...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell current="employees" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Employee Details' }]}>
        <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Unable to load employee" description={error} action={<Button onClick={refetch}>Retry</Button>} />
      </AppShell>
    );
  }

  if (notFound || !employee) {
    return (
      <AppShell current="employees" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Employee Details' }]}>
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="Employee not found"
          description="This employee may have left the company or the link is out of date."
          action={<Button onClick={() => navigate('/employees')}>Back to Employee Management</Button>}
        />
      </AppShell>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
    { id: 'assets', label: 'Assigned Assets', icon: <Laptop className="h-4 w-4" />, count: assignedAssets.length },
    { id: 'licenses', label: 'Software & SaaS', icon: <KeyRound className="h-4 w-4" />, count: employeeLicenses.length },
    { id: 'tickets', label: 'IT Tickets', icon: <Wrench className="h-4 w-4" />, count: employeeTickets.length },
    { id: 'history', label: 'History', icon: <History className="h-4 w-4" />, count: employeeHistory.length },
    { id: 'audit', label: 'Audit', icon: <ClipboardList className="h-4 w-4" />, count: employeeAudit.length },
  ];

  const openEditModal = () => {
    setEditJobTitle(employee.jobTitle);
    setEditDepartment(employee.department);
    setEditLocation(employee.location);
    setEditDesk(employee.deskLocation || '');
    setEditPhone(employee.phone || '');
    setEditManager(employee.manager || '');
    setEditStatus(employee.status);
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = async () => {
    const changes: EmployeeAuditLog[] = [];
    if (editJobTitle !== employee.jobTitle) {
      changes.push({ id: `aud-${Date.now()}-title`, employeeId: employee.id, action: 'Position Change', actor: 'Current Admin', timestamp: new Date().toLocaleString(), field: 'Job Title', oldValue: employee.jobTitle, newValue: editJobTitle });
    }
    if (editDepartment !== employee.department) {
      changes.push({ id: `aud-${Date.now()}-dept`, employeeId: employee.id, action: 'Department Change', actor: 'Current Admin', timestamp: new Date().toLocaleString(), field: 'Department', oldValue: employee.department, newValue: editDepartment });
    }
    if (editDesk !== employee.deskLocation) {
      changes.push({ id: `aud-${Date.now()}-desk`, employeeId: employee.id, action: 'Location Update', actor: 'Current Admin', timestamp: new Date().toLocaleString(), field: 'Physical Desk Workspace', oldValue: employee.deskLocation || 'None', newValue: editDesk });
    }
    if (changes.length > 0) {
      setAuditLogs([...changes, ...auditLogs]);
    }

    await employeeService.updateEmployee(employee.id, {
      jobTitle: editJobTitle,
      department: editDepartment,
      location: editLocation,
      deskLocation: editDesk,
      phone: editPhone,
      manager: editManager,
      status: editStatus,
    });
    refetch();
    setIsEditProfileModalOpen(false);
    push({ variant: 'success', title: 'Profile Updated', message: `${employee.name}'s profile has been updated.` });
  };

  const handleAssignAsset = async () => {
    if (!selectedAssetToAssign) {
      push({ variant: 'warning', title: 'Asset Required', message: 'Please choose an available asset to assign.' });
      return;
    }
    const assigned = await assetService.assignAsset({ assetId: selectedAssetToAssign, employeeId: employee.id, employeeName: employee.name, notes: assignNotes });
    refetchAssignments();

    const newHist: EmployeeHistoryEvent = {
      id: `eh-${Date.now()}`,
      employeeId: employee.id,
      date: new Date().toISOString().split('T')[0],
      type: 'Asset Assignment',
      title: `${assigned.name} Assigned`,
      description: `${assigned.name} (${assigned.code}) assigned to ${employee.name}. ${assignNotes}`,
      actor: 'Current IT Admin',
      badge: assigned.category,
    };
    setHistoryEvents([newHist, ...historyEvents]);

    setIsAssignModalOpen(false);
    setSelectedAssetToAssign('');
    setAssignNotes('');
    push({ variant: 'success', title: 'Asset Assigned', message: `${assigned.name} is now assigned to ${employee.name}.` });
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim()) {
      push({ variant: 'warning', title: 'Title Required', message: 'Please provide an issue summary.' });
      return;
    }
    const targetAsset = assignedAssets[0];
    if (!targetAsset) {
      push({ variant: 'warning', title: 'No Assigned Asset', message: `${employee.name} has no assigned asset to file a ticket against.` });
      return;
    }
    const created = await ticketService.createTicket({
      requesterId: employee.id,
      assetId: targetAsset.id,
      category: 'Hardware Fault & Repair',
      priority: ticketPriority,
      title: ticketTitle,
      description: ticketDescription || 'Reported by employee via IT management portal.',
      location: employee.location,
    });
    refetchTickets();
    setHistoryEvents([{ id: `eh-${Date.now()}`, employeeId: employee.id, date: new Date().toISOString().split('T')[0], type: 'Ticket Creation', title: `IT Requisition ${created.ticketCode} Created`, description: ticketTitle, actor: employee.name, badge: 'IT Service' }, ...historyEvents]);
    setIsNewTicketModalOpen(false);
    setTicketTitle('');
    setTicketDescription('');
    push({ variant: 'success', title: 'Ticket Created', message: `Requisition ticket ${created.ticketCode} created for ${employee.name}.` });
  };

  const assetColumns: Column<Asset>[] = [
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
              <Icon className="h-4.5 w-4.5 text-surface-600" style={{ width: 18, height: 18 }} />
            </div>
            <div className="min-w-0">
              <button onClick={() => navigate(`/assets/${r.id}`)} className="font-medium text-surface-900 hover:text-brand-600 transition-colors text-left truncate block max-w-[220px]">
                {r.name}
              </button>
              <p className="text-caption text-surface-500 font-mono">{r.code}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'category', header: 'Category / Type', render: (r) => <div><span className="text-surface-700 font-medium block">{r.category}</span><span className="text-caption text-surface-500">{r.type}</span></div> },
    { key: 'serialNumber', header: 'Serial No.', render: (r) => <span className="font-mono text-caption text-surface-600">{r.serialNumber}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'value', header: 'Current Value', align: 'right', render: (r) => <span className="font-semibold text-surface-900">${r.currentValue.toLocaleString()}</span> },
    { key: 'action', header: 'Actions', align: 'right', render: (r) => <Button variant="outline" size="sm" onClick={() => navigate(`/assets/${r.id}`)} rightIcon={<ChevronRight className="h-3 w-3" />}>Details</Button> },
  ];

  return (
    <AppShell current="employees" onNavigate={(id) => navigate(`/${id}`)} breadcrumb={[{ label: 'RAISE' }, { label: 'Employee Management', href: '/employees' }, { label: employee.name }]}>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <button onClick={() => navigate('/employees')} className="mt-1 h-9 w-9 rounded-lg border border-surface-200 hover:bg-surface-100 flex items-center justify-center text-surface-600 transition-colors shrink-0" title="Back to Employee Management">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="relative">
                <Avatar initials={employee.initials} size="lg" color={employee.avatarColor || 'bg-brand-500'} />
                <span className={cn('absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-white', employee.status === 'Active' ? 'bg-success-500' : employee.status === 'On Leave' ? 'bg-amber-500' : 'bg-surface-400')} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl md:text-2xl font-bold text-surface-900">{employee.name}</h1>
                  <Badge variant="neutral" className="font-mono text-caption px-2 py-0.5">{employee.employeeCode}</Badge>
                  <StatusBadge status={employee.status === 'Active' ? 'Active' : employee.status === 'On Leave' ? 'In Maintenance' : 'Retired'} />
                  <Badge variant="accent" className="bg-brand-50 text-brand-700 border-brand-200">{employee.department}</Badge>
                </div>
                <p className="text-body-sm text-surface-600 mt-1 flex flex-wrap items-center gap-3">
                  <span className="font-medium text-surface-800">{employee.jobTitle}</span>
                  <span className="text-surface-300">•</span>
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-surface-400" />{employee.email}</span>
                  <span className="text-surface-300">•</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-surface-400" />{employee.location}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="outline" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />} onClick={openEditModal}>Edit Identity</Button>
              <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setIsAssignModalOpen(true)}>Assign Asset</Button>
              <Button variant="primary" size="sm" leftIcon={<Wrench className="h-3.5 w-3.5" />} onClick={() => { setTicketTitle(`Hardware repair for ${employee.name}`); setIsNewTicketModalOpen(true); }}>New IT Ticket</Button>
            </div>
          </div>
          <div className="mt-6 pt-2 border-t border-surface-100">
            <Tabs items={tabs} active={tab} onChange={setTab} />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-4 bg-surface-50/50 border-surface-200"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Laptop className="h-5 w-5" /></div><div><p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Assigned Equipment</p><p className="text-xl font-bold text-surface-900">{assignedAssets.length} Devices</p></div></div></Card>
                  <Card className="p-4 bg-surface-50/50 border-surface-200"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Total Asset Valuation</p><p className="text-xl font-bold text-surface-900">${totalAssetValue.toLocaleString()}</p></div></div></Card>
                  <Card className="p-4 bg-surface-50/50 border-surface-200"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Wrench className="h-5 w-5" /></div><div><p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Active Service Tickets</p><p className="text-xl font-bold text-surface-900">{openTicketsCount} In-Flight</p></div></div></Card>
                </div>

                <Card className="p-6">
                  <CardHeader title="IT Workstation & Environment Profile" description="Configured IT workplace tier and primary operating systems" action={<Button variant="ghost" size="sm" onClick={openEditModal}>Modify Specs</Button>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3"><div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5"><Briefcase className="h-4 w-4" /></div><div><p className="text-caption font-medium text-surface-500">Workstation Archetype</p><p className="text-body-sm font-semibold text-surface-900">{employee.workstationType}</p></div></div>
                      <div className="flex items-start gap-3"><div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5"><Shield className="h-4 w-4" /></div><div><p className="text-caption font-medium text-surface-500">Primary Operating System</p><p className="text-body-sm font-semibold text-surface-900">{employee.primaryOs}</p></div></div>
                      <div className="flex items-start gap-3"><div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5"><Calendar className="h-4 w-4" /></div><div><p className="text-caption font-medium text-surface-500">Onboarding & IT Provision Date</p><p className="text-body-sm font-semibold text-surface-900">{employee.startDate}</p></div></div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3"><div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5"><Building className="h-4 w-4" /></div><div><p className="text-caption font-medium text-surface-500">Department & Cost Center</p><p className="text-body-sm font-semibold text-surface-900">{employee.department} ({employee.departmentId})</p></div></div>
                      <div className="flex items-start gap-3"><div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5"><MapPin className="h-4 w-4" /></div><div><p className="text-caption font-medium text-surface-500">Desk / Workspace Unit</p><p className="text-body-sm font-semibold text-surface-900">{employee.deskLocation}</p></div></div>
                      <div className="flex items-start gap-3"><div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5"><Users className="h-4 w-4" /></div><div><p className="text-caption font-medium text-surface-500">Reporting Line / Manager</p><p className="text-body-sm font-semibold text-surface-900">{employee.manager || '—'}</p></div></div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <CardHeader title="Current Assigned Hardware" description={`${assignedAssets.length} assets registered to this profile`} action={<Button variant="outline" size="sm" onClick={() => setTab('assets')} rightIcon={<ChevronRight className="h-3 w-3" />}>View All Assets</Button>} />
                  {assetsLoading ? (
                    <p className="text-body text-surface-400 py-6 text-center">Loading assigned assets...</p>
                  ) : assignedAssets.length === 0 ? (
                    <EmptyState icon={<Laptop className="h-8 w-8" />} title="No Assets Assigned" description="This employee currently has no IT equipment assigned." action={<Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(true)}>Assign First Asset</Button>} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {assignedAssets.map((ast) => {
                        const AssetIcon = getAssetIcon(ast.type);
                        return (
                          <div key={ast.id} onClick={() => navigate(`/assets/${ast.id}`)} className="p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-xs bg-white transition-all cursor-pointer flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-700"><AssetIcon className="h-5 w-5" /></div>
                              <div><p className="font-semibold text-surface-900 text-body-sm">{ast.name}</p><p className="text-caption text-surface-500 font-mono">{ast.code} • {ast.type}</p></div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-surface-400" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {tab === 'assets' && (
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div><h2 className="text-lg font-bold text-surface-900">Assigned IT Hardware</h2><p className="text-body-sm text-surface-500">All physical computers, peripherals, and network devices registered to {employee.name}</p></div>
                  <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsAssignModalOpen(true)}>Assign New Equipment</Button>
                </div>
                {assignedAssets.length === 0 ? (
                  <EmptyState icon={<Laptop className="h-10 w-10 text-surface-400" />} title="No IT Assets Assigned" description={`${employee.name} does not have any active hardware assigned at this time.`} action={<Button variant="primary" size="sm" onClick={() => setIsAssignModalOpen(true)}>Assign First Asset</Button>} />
                ) : (
                  <DataTable columns={assetColumns} data={assignedAssets} loading={assetsLoading} searchPlaceholder="Filter assigned hardware..." pageSize={5} />
                )}
              </Card>
            )}

            {tab === 'licenses' && (
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div><h2 className="text-lg font-bold text-surface-900">Software & SaaS Entitlements</h2><p className="text-body-sm text-surface-500">Active cloud subscriptions and software seats licensed to {employee.name}</p></div>
                  <Button variant="outline" size="sm" leftIcon={<KeyRound className="h-4 w-4" />} onClick={() => navigate('/licenses')}>Manage All Licenses</Button>
                </div>
                {employeeLicenses.length === 0 ? (
                  <EmptyState icon={<KeyRound className="h-10 w-10 text-surface-400" />} title="No Software Licenses Assigned" description="This employee currently has no dedicated software seats or SaaS subscriptions allocated." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-body-sm">
                      <thead><tr className="border-b border-surface-200 text-caption font-semibold text-surface-500 uppercase tracking-wider"><th className="py-3 px-4">Product</th><th className="py-3 px-4">Role</th><th className="py-3 px-4">Cost / Seat</th><th className="py-3 px-4">Usage</th></tr></thead>
                      <tbody className="divide-y divide-surface-100">
                        {employeeLicenses.map(({ license, seat }) => (
                          <tr key={license.id} onClick={() => navigate(`/licenses/${license.id}`)} className="hover:bg-surface-50/60 transition-colors cursor-pointer">
                            <td className="py-3 px-4 font-bold text-surface-900">{license.product}</td>
                            <td className="py-3 px-4"><Badge variant="neutral">{seat.allocationRole || 'Standard User'}</Badge></td>
                            <td className="py-3 px-4 font-semibold text-surface-900">${license.costPerSeat}<span className="text-caption font-normal text-surface-500"> / yr</span></td>
                            <td className="py-3 px-4"><Badge variant={seat.usageStatus === 'Daily Active' ? 'success' : 'warning'}>{seat.usageStatus}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {tab === 'tickets' && (
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div><h2 className="text-lg font-bold text-surface-900">IT Requisitions & Tickets</h2><p className="text-body-sm text-surface-500">Support tickets and hardware requests associated with this employee</p></div>
                  <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setTicketTitle(`Hardware repair for ${employee.name}`); setIsNewTicketModalOpen(true); }}>Create IT Request</Button>
                </div>
                {employeeTickets.length === 0 ? (
                  <EmptyState icon={<Wrench className="h-10 w-10 text-surface-400" />} title="No IT Tickets Found" description="There are currently no support or maintenance tickets recorded for this employee." />
                ) : (
                  <div className="space-y-4">
                    {employeeTickets.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-xs bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-caption text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{t.ticketCode}</span>
                            <Badge variant={priorityConfig[t.priority]?.variant || 'default'}>{t.priority} • {t.slaTargetHours}h SLA</Badge>
                            <StatusBadge status={t.status === 'DONE' ? 'Active' : t.status === 'REJECTED_BY_DEPT' ? 'Retired' : 'In Maintenance'} />
                          </div>
                          <h3 className="font-semibold text-surface-900 text-body">{t.title}</h3>
                          <p className="text-body-sm text-surface-600 line-clamp-2">{t.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {tab === 'history' && (
              <Card className="p-6">
                <div className="mb-5"><h2 className="text-lg font-bold text-surface-900">Employee IT History</h2><p className="text-body-sm text-surface-500">Chronological lifecycle events including asset assignments and ticket milestones</p></div>
                {employeeHistory.length === 0 ? (
                  <EmptyState icon={<History className="h-10 w-10 text-surface-400" />} title="No History Events" description="No historical timeline records have been registered yet." />
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200">
                    {employeeHistory.map((event) => (
                      <div key={event.id} className="relative group">
                        <div className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white bg-brand-500 text-white flex items-center justify-center ring-4 ring-brand-50" />
                        <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/50 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2"><span className="font-semibold text-surface-900 text-body-sm">{event.title}</span>{event.badge && <Badge variant="neutral">{event.badge}</Badge>}</div>
                            <span className="text-caption font-mono text-surface-500 flex items-center gap-1"><Clock className="h-3 w-3 text-surface-400" />{event.date}</span>
                          </div>
                          <p className="text-body-sm text-surface-600">{event.description}</p>
                          <p className="text-caption text-surface-500 font-medium">Performed by: <span className="text-surface-700">{event.actor}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {tab === 'audit' && (
              <Card className="p-6">
                <div className="mb-5"><h2 className="text-lg font-bold text-surface-900">Audit & Governance Trail</h2><p className="text-body-sm text-surface-500">Immutable record of field modifications and actor accountability</p></div>
                {employeeAudit.length === 0 ? (
                  <EmptyState icon={<ClipboardList className="h-10 w-10 text-surface-400" />} title="No Audit Logs" description="No audit modifications have been recorded for this profile." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-body-sm">
                      <thead><tr className="border-b border-surface-200 text-caption font-semibold text-surface-500 uppercase tracking-wider"><th className="py-3 px-4">Action</th><th className="py-3 px-4">Field</th><th className="py-3 px-4">Previous</th><th className="py-3 px-4">Updated</th><th className="py-3 px-4">Actor</th><th className="py-3 px-4">Timestamp</th></tr></thead>
                      <tbody className="divide-y divide-surface-100">
                        {employeeAudit.map((log) => (
                          <tr key={log.id} className="hover:bg-surface-50/60 transition-colors">
                            <td className="py-3 px-4 font-semibold text-surface-900">{log.action}</td>
                            <td className="py-3 px-4 font-medium text-surface-700">{log.field}</td>
                            <td className="py-3 px-4 text-surface-500 font-mono text-caption line-through decoration-surface-300">{log.oldValue}</td>
                            <td className="py-3 px-4 text-brand-700 font-mono text-caption font-semibold">{log.newValue}</td>
                            <td className="py-3 px-4 text-surface-700">{log.actor}</td>
                            <td className="py-3 px-4 text-caption text-surface-500 font-mono">{log.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <SectionCard title="Employee Identity" description="Basic personnel profile">
              <div className="space-y-3.5 text-body-sm">
                <div className="flex justify-between py-1.5 border-b border-surface-100"><span className="text-surface-500">Employee Code</span><span className="font-mono font-semibold text-surface-900">{employee.employeeCode}</span></div>
                <div className="flex justify-between py-1.5 border-b border-surface-100"><span className="text-surface-500">Status</span><StatusBadge status={employee.status === 'Active' ? 'Active' : employee.status === 'On Leave' ? 'In Maintenance' : 'Retired'} /></div>
                <div className="flex justify-between py-1.5 border-b border-surface-100"><span className="text-surface-500">Designation</span><span className="font-medium text-surface-800 text-right">{employee.jobTitle}</span></div>
                <div className="flex justify-between py-1.5 border-b border-surface-100"><span className="text-surface-500">Phone</span><span className="font-mono text-surface-700">{employee.phone}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-surface-500">Start Date</span><span className="text-surface-700">{employee.startDate}</span></div>
              </div>
            </SectionCard>

            <SectionCard title="Organization & Hierarchy" description="Reporting line and location">
              <div className="space-y-3.5 text-body-sm">
                <div className="flex justify-between py-1.5 border-b border-surface-100"><span className="text-surface-500">Department</span><span className="font-semibold text-surface-900">{employee.department}</span></div>
                <div className="flex justify-between py-1.5 border-b border-surface-100"><span className="text-surface-500">Cost Center ID</span><span className="font-mono text-caption text-surface-600">{employee.departmentId}</span></div>
                <div className="flex justify-between py-1.5 border-b border-surface-100"><span className="text-surface-500">Direct Manager</span><span className="font-medium text-brand-600">{employee.manager || '—'}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-surface-500">Location Desk</span><span className="text-surface-700 text-right">{employee.deskLocation}</span></div>
              </div>
            </SectionCard>

            <SectionCard title="Hardware Assets" description="Hardware inventory allotment">
              <div className="space-y-3">
                <div className="p-3 bg-surface-50 rounded-lg flex items-center justify-between"><span className="text-surface-600 text-body-sm">Active Assets</span><span className="font-bold text-surface-900">{assignedAssets.length}</span></div>
                <div className="p-3 bg-surface-50 rounded-lg flex items-center justify-between"><span className="text-surface-600 text-body-sm">Total Value</span><span className="font-bold text-surface-900">${totalAssetValue.toLocaleString()}</span></div>
                <Button variant="outline" size="sm" className="w-full mt-2" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setIsAssignModalOpen(true)}>Assign Asset</Button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <Modal open={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign Equipment to ${employee.name}`} size="md">
        <AssignAssetModalBody
          selectedAssetToAssign={selectedAssetToAssign}
          setSelectedAssetToAssign={setSelectedAssetToAssign}
          assignNotes={assignNotes}
          setAssignNotes={setAssignNotes}
          onCancel={() => setIsAssignModalOpen(false)}
          onConfirm={handleAssignAsset}
        />
      </Modal>

      <Modal open={isNewTicketModalOpen} onClose={() => setIsNewTicketModalOpen(false)} title={`Create IT Requisition for ${employee.name}`} size="lg">
        <div className="space-y-4">
          <Input label="Issue Subject / Summary *" value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} />
          <Select
            label="Priority & SLA"
            value={ticketPriority}
            onChange={(e) => setTicketPriority(e.target.value as PriorityLevel)}
            options={[
              { label: 'Critical (2 Hours SLA)', value: 'Critical' },
              { label: 'High (8 Hours SLA)', value: 'High' },
              { label: 'Medium (24 Hours SLA)', value: 'Medium' },
              { label: 'Low (48 Hours SLA)', value: 'Low' },
            ]}
          />
          <Textarea label="Detailed Diagnostic / Problem Description" value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)} rows={3} />
          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setIsNewTicketModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTicket}>Submit IT Request</Button>
          </div>
        </div>
      </Modal>

      <Modal open={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} title={`Edit Identity & Organization: ${employee.name}`} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Job Title / Position" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} />
            <Select label="Department" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} options={departments.map((d) => ({ label: d, value: d }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Location Campus" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} options={locations.map((l) => ({ label: l, value: l }))} />
            <Input label="Physical Desk / Unit" value={editDesk} onChange={(e) => setEditDesk(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            <Select label="Status" value={editStatus} onChange={(e) => setEditStatus(e.target.value as EmployeeStatus)} options={[{ label: 'Active', value: 'Active' }, { label: 'On Leave', value: 'On Leave' }, { label: 'Inactive', value: 'Inactive' }]} />
          </div>
          <Input label="Reporting Manager" value={editManager} onChange={(e) => setEditManager(e.target.value)} />
          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setIsEditProfileModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

interface AssignAssetModalBodyProps {
  selectedAssetToAssign: string;
  setSelectedAssetToAssign: (v: string) => void;
  assignNotes: string;
  setAssignNotes: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Loads the unassigned-asset dropdown lazily so this modal — not the whole page — pays for it. */
function AssignAssetModalBody({ selectedAssetToAssign, setSelectedAssetToAssign, assignNotes, setAssignNotes, onCancel, onConfirm }: AssignAssetModalBodyProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    assetService.listAssets({ status: 'Available' }).then((r) => {
      if (!cancelled) {
        setAssets(r.data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-surface-600">Select an available item from the company inventory to assign directly to this employee.</p>
      <div>
        <label className="block text-caption font-semibold text-surface-700 mb-1.5">Available Inventory Assets *</label>
        {loading ? (
          <p className="text-caption text-surface-400">Loading available assets...</p>
        ) : assets.length === 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-body-sm">No unassigned assets currently available in stock.</div>
        ) : (
          <Select
            value={selectedAssetToAssign}
            onChange={(e) => setSelectedAssetToAssign(e.target.value)}
            options={[{ label: '— Select an available asset —', value: '' }, ...assets.map((a) => ({ label: `${a.code} • ${a.name} (${a.category} - $${a.currentValue})`, value: a.id }))]}
          />
        )}
      </div>
      <Textarea label="Assignment Notes (Optional)" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} rows={3} />
      <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" disabled={!selectedAssetToAssign} onClick={onConfirm}>Confirm Assignment</Button>
      </div>
    </div>
  );
}
