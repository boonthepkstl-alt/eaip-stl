import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  User,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Server,
  Router,
  Package,
  Wrench,
  History,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  ArrowRightLeft,
  UserPlus,
  Edit,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileText,
  Tag,
  Sparkles,
  Info,
  ChevronRight,
  Shield,
  Briefcase,
  KeyRound
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Button,
  Badge,
  StatusBadge,
  Avatar,
  Tabs,
  EmptyState,
  useToast,
  SectionCard,
  Modal,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import {
  assets as mockAssets,
  employees as mockEmployees,
  employeeHistoryEvents as mockHistoryEvents,
  employeeAuditLogs as mockAuditLogs,
  departments,
  locations,
  type Asset,
  type Employee,
  type EmployeeHistoryEvent,
  type EmployeeAuditLog
} from '@/data/mockData';
import {
  initialRequisitions,
  type ITRequisitionTicket,
  type TicketCategory,
  type PriorityLevel
} from '@/data/requisitionData';
import {
  initialSoftwareLicenses,
  type SoftwareLicenseDetail
} from '@/data/licenseData';
import { cn } from '@/lib/cn';

interface EmployeeDetailProps {
  employeeId: string;
  onNavigate: (id: string, aid?: string) => void;
}

const priorityConfig: Record<PriorityLevel, { variant: 'error' | 'warning' | 'accent' | 'default'; sla: string; color: string }> = {
  Critical: { variant: 'error', sla: '2 Hours SLA', color: 'text-error-600 bg-error-50 border-error-200' },
  High: { variant: 'warning', sla: '8 Hours SLA', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  Medium: { variant: 'accent', sla: '24 Hours SLA', color: 'text-brand-700 bg-brand-50 border-brand-200' },
  Low: { variant: 'default', sla: '48 Hours SLA', color: 'text-surface-600 bg-surface-100 border-surface-200' },
};

const categoryOptions: { label: string; value: TicketCategory }[] = [
  { label: 'Hardware Fault & Repair', value: 'Hardware Fault & Repair' },
  { label: 'Equipment Replacement / Upgrade', value: 'Equipment Replacement' },
  { label: 'Software & OS Issue', value: 'Software & OS Issue' },
  { label: 'Network & Wi-Fi', value: 'Network & Wi-Fi' },
  { label: 'Peripherals & Accessories', value: 'Peripherals & Accessories' },
  { label: 'Account & Access', value: 'Account & Access' },
  { label: 'Preventive Maintenance', value: 'Preventive Maintenance' },
];

export function EmployeeDetail({ employeeId, onNavigate }: EmployeeDetailProps) {
  const { push } = useToast();
  const [tab, setTab] = useState('overview');

  // Employee data source
  const [allEmployees, setAllEmployees] = useState<Employee[]>(mockEmployees);
  const employee = useMemo(() => {
    return allEmployees.find((e) => e.id === employeeId || e.employeeCode === employeeId) ?? allEmployees[0];
  }, [allEmployees, employeeId]);

  // Assets data source & linked assets
  const [allAssets, setAllAssets] = useState<Asset[]>(mockAssets);
  const assignedAssets = useMemo(() => {
    return allAssets.filter(
      (a) => a.assignedEmployeeId === employee.id || (a.assignedTo && a.assignedTo.toLowerCase() === employee.name.toLowerCase())
    );
  }, [allAssets, employee]);

  // Tickets data source & linked tickets
  const [allTickets, setAllTickets] = useState<ITRequisitionTicket[]>(initialRequisitions);
  const employeeTickets = useMemo(() => {
    return allTickets.filter(
      (t) =>
        t.requester.id === employee.id ||
        (t.requester.name && t.requester.name.toLowerCase() === employee.name.toLowerCase()) ||
        (t.requester.email && t.requester.email.toLowerCase() === employee.email.toLowerCase()) ||
        assignedAssets.some((a) => a.id === t.asset?.id || a.code === t.asset?.code)
    );
  }, [allTickets, employee, assignedAssets]);

  // History & Audit Logs
  const [historyEvents, setHistoryEvents] = useState<EmployeeHistoryEvent[]>(mockHistoryEvents);
  const employeeHistory = useMemo(() => {
    return historyEvents.filter((h) => h.employeeId === employee.id || h.employeeId === 'e1');
  }, [historyEvents, employee]);

  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLog[]>(mockAuditLogs);
  const employeeAudit = useMemo(() => {
    return auditLogs.filter((a) => a.employeeId === employee.id || a.employeeId === 'e1');
  }, [auditLogs, employee]);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Form states: Assign Asset
  const [selectedAssetToAssign, setSelectedAssetToAssign] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Form states: New IT Ticket
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('Hardware Fault & Repair');
  const [ticketPriority, setTicketPriority] = useState<PriorityLevel>('High');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketAssetId, setTicketAssetId] = useState(assignedAssets[0]?.id || '');

  // Form states: Edit Employee Profile
  const [editJobTitle, setEditJobTitle] = useState(employee.jobTitle);
  const [editDepartment, setEditDepartment] = useState(employee.department);
  const [editLocation, setEditLocation] = useState(employee.location);
  const [editDesk, setEditDesk] = useState(employee.deskLocation || '');
  const [editPhone, setEditPhone] = useState(employee.phone || '');
  const [editManager, setEditManager] = useState(employee.manager || '');
  const [editStatus, setEditStatus] = useState<'Active' | 'On Leave' | 'Inactive'>(employee.status);

  // Available unassigned assets
  const unassignedAssets = useMemo(() => {
    return allAssets.filter((a) => !a.assignedEmployeeId && a.status === 'Available');
  }, [allAssets]);

  // Available managers / peers
  const managerOptions = useMemo(() => {
    return allEmployees.filter((e) => e.id !== employee.id);
  }, [allEmployees, employee]);

  // Total current asset value for this employee
  const totalAssetValue = useMemo(() => {
    return assignedAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  }, [assignedAssets]);

  // Open tickets count
  const openTicketsCount = useMemo(() => {
    return employeeTickets.filter((t) => t.status !== 'DONE' && t.status !== 'REJECTED_BY_DEPT').length;
  }, [employeeTickets]);

  // Software Licenses & SaaS assigned to this employee
  const employeeLicenses = useMemo(() => {
    return initialSoftwareLicenses
      .map((lic) => {
        const seat = lic.allocatedSeats.find(
          (s) =>
            s.employeeId === employee.id ||
            s.employeeCode === employee.employeeCode ||
            (s.employeeName && s.employeeName.toLowerCase() === employee.name.toLowerCase()) ||
            (s.employeeEmail && s.employeeEmail.toLowerCase() === employee.email.toLowerCase())
        );
        return seat ? { license: lic, seat } : null;
      })
      .filter(Boolean) as { license: SoftwareLicenseDetail; seat: any }[];
  }, [employee]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
    { id: 'assets', label: 'Assigned Assets', icon: <Laptop className="h-4 w-4" />, count: assignedAssets.length },
    { id: 'licenses', label: 'Software & SaaS', icon: <KeyRound className="h-4 w-4" />, count: employeeLicenses.length },
    { id: 'tickets', label: 'IT Tickets', icon: <Wrench className="h-4 w-4" />, count: employeeTickets.length },
    { id: 'history', label: 'History', icon: <History className="h-4 w-4" />, count: employeeHistory.length },
    { id: 'audit', label: 'Audit', icon: <ClipboardList className="h-4 w-4" />, count: employeeAudit.length },
  ];

  // Handler: Assign Asset
  const handleAssignAsset = () => {
    if (!selectedAssetToAssign) {
      push({ variant: 'warning', title: 'Asset Required', message: 'Please choose an available asset to assign.' });
      return;
    }

    const assetToUpdate = allAssets.find((a) => a.id === selectedAssetToAssign);
    if (!assetToUpdate) return;

    // Update asset
    const updatedAssets = allAssets.map((a) => {
      if (a.id === selectedAssetToAssign) {
        return {
          ...a,
          status: 'Assigned' as const,
          assignedTo: employee.name,
          assignedEmployeeId: employee.id,
          assignedDate: new Date().toISOString().split('T')[0],
        };
      }
      return a;
    });
    setAllAssets(updatedAssets);

    // Add History record
    const newHist: EmployeeHistoryEvent = {
      id: `eh-${Date.now()}`,
      employeeId: employee.id,
      date: new Date().toISOString().split('T')[0],
      type: 'Asset Assignment',
      title: `${assetToUpdate.name} Assigned`,
      description: `${assetToUpdate.name} (${assetToUpdate.code}) assigned to ${employee.name}. ${assignNotes}`,
      actor: 'Current IT Admin',
      badge: assetToUpdate.category,
    };
    setHistoryEvents([newHist, ...historyEvents]);

    // Add Audit Log
    const newAud: EmployeeAuditLog = {
      id: `aud-${Date.now()}`,
      employeeId: employee.id,
      action: 'Asset Assignment',
      actor: 'Current IT Admin',
      timestamp: new Date().toLocaleString(),
      field: `${assetToUpdate.code} (${assetToUpdate.name})`,
      oldValue: 'Available / Unassigned',
      newValue: `${employee.name} (${employee.employeeCode})`,
    };
    setAuditLogs([newAud, ...auditLogs]);

    setIsAssignModalOpen(false);
    setSelectedAssetToAssign('');
    setAssignNotes('');
    push({
      variant: 'success',
      title: 'Asset Assigned',
      message: `${assetToUpdate.name} is now assigned to ${employee.name}.`,
    });
  };

  // Handler: Create Ticket for Employee
  const handleCreateTicket = () => {
    if (!ticketTitle.trim()) {
      push({ variant: 'warning', title: 'Title Required', message: 'Please provide an issue summary.' });
      return;
    }

    const targetAsset = allAssets.find((a) => a.id === ticketAssetId) || assignedAssets[0];
    const newCode = `REQ-2026-${(allTickets.length + 1).toString().padStart(4, '0')}`;
    const slaHours = ticketPriority === 'Critical' ? 2 : ticketPriority === 'High' ? 8 : ticketPriority === 'Medium' ? 24 : 48;

    const newTicket: ITRequisitionTicket = {
      id: `req-${Date.now()}`,
      ticketCode: newCode,
      title: ticketTitle,
      category: ticketCategory,
      priority: ticketPriority,
      slaTargetHours: slaHours,
      description: ticketDescription || 'Reported by employee via IT management portal.',
      location: employee.location,
      createdAt: new Date().toLocaleString(),
      status: 'PENDING_DEPT_APPROVAL',
      requester: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        jobTitle: employee.jobTitle,
        department: employee.department,
        initials: employee.initials,
        avatarColor: employee.avatarColor,
      },
      asset: targetAsset
        ? {
            id: targetAsset.id,
            code: targetAsset.code,
            name: targetAsset.name,
            type: targetAsset.type,
            serialNumber: targetAsset.serialNumber,
            location: targetAsset.location,
            isMyAssignedAsset: true,
            purchaseCost: targetAsset.purchaseCost,
            currentValue: targetAsset.currentValue,
          }
        : {
            id: 'temp',
            code: 'GENERAL',
            name: 'General IT Hardware',
            type: 'General',
            serialNumber: 'N/A',
            location: employee.location,
            isMyAssignedAsset: false,
            purchaseCost: 0,
            currentValue: 0,
          },
      departmentApproval: {
        status: 'Pending',
        approverName: employee.manager ? `${employee.manager} (Manager)` : 'Department Lead',
        approverTitle: 'Department Head',
        isDelegated: false,
      },
      itAssignment: {},
      itExecution: {
        currentStatus: 'Pending Dispatch',
      },
      timeline: [
        {
          id: `tl-${Date.now()}`,
          stage: 'Creation',
          actorName: employee.name,
          actorRole: `Requester (${employee.department})`,
          timestamp: new Date().toLocaleString(),
          action: 'Created IT Requisition Ticket',
          notes: targetAsset ? `Linked Asset: ${targetAsset.code}` : undefined,
        },
      ],
    };

    setAllTickets([newTicket, ...allTickets]);

    // History event
    const newHist: EmployeeHistoryEvent = {
      id: `eh-${Date.now()}`,
      employeeId: employee.id,
      date: new Date().toISOString().split('T')[0],
      type: 'Ticket Creation',
      title: `IT Requisition ${newCode} Created`,
      description: ticketTitle,
      actor: employee.name,
      badge: 'IT Service',
    };
    setHistoryEvents([newHist, ...historyEvents]);

    setIsNewTicketModalOpen(false);
    setTicketTitle('');
    setTicketDescription('');
    push({
      variant: 'success',
      title: 'Ticket Created',
      message: `Requisition ticket ${newCode} created for ${employee.name}.`,
    });
  };

  // Handler: Save Profile Changes
  const handleSaveProfile = () => {
    const updated = allEmployees.map((e) => {
      if (e.id === employee.id) {
        return {
          ...e,
          jobTitle: editJobTitle,
          title: editJobTitle,
          department: editDepartment,
          location: editLocation,
          deskLocation: editDesk,
          phone: editPhone,
          manager: editManager,
          status: editStatus,
        };
      }
      return e;
    });
    setAllEmployees(updated);

    // Audit logs for changed values
    const logs: EmployeeAuditLog[] = [];
    if (editJobTitle !== employee.jobTitle) {
      logs.push({
        id: `aud-${Date.now()}-1`,
        employeeId: employee.id,
        action: 'Position Change',
        actor: 'Current Admin',
        timestamp: new Date().toLocaleString(),
        field: 'Job Title',
        oldValue: employee.jobTitle,
        newValue: editJobTitle,
      });
    }
    if (editDepartment !== employee.department) {
      logs.push({
        id: `aud-${Date.now()}-2`,
        employeeId: employee.id,
        action: 'Department Change',
        actor: 'Current Admin',
        timestamp: new Date().toLocaleString(),
        field: 'Department',
        oldValue: employee.department,
        newValue: editDepartment,
      });
    }
    if (editDesk !== employee.deskLocation) {
      logs.push({
        id: `aud-${Date.now()}-3`,
        employeeId: employee.id,
        action: 'Location Update',
        actor: 'Current Admin',
        timestamp: new Date().toLocaleString(),
        field: 'Physical Desk Workspace',
        oldValue: employee.deskLocation || 'None',
        newValue: editDesk,
      });
    }
    if (logs.length > 0) {
      setAuditLogs([...logs, ...auditLogs]);
    }

    setIsEditProfileModalOpen(false);
    push({
      variant: 'success',
      title: 'Profile Updated',
      message: `${employee.name}'s profile has been updated.`,
    });
  };

  // Asset Table Columns
  const assetColumns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
            <r.icon className="h-4.5 w-4.5 text-surface-600" style={{ width: 18, height: 18 }} />
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onNavigate('asset-detail', r.id)}
              className="font-medium text-surface-900 hover:text-brand-600 transition-colors text-left truncate block max-w-[220px]"
            >
              {r.name}
            </button>
            <p className="text-caption text-surface-500 font-mono">{r.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category / Type',
      render: (r) => (
        <div>
          <span className="text-surface-700 font-medium block">{r.category}</span>
          <span className="text-caption text-surface-500">{r.type}</span>
        </div>
      ),
    },
    {
      key: 'serialNumber',
      header: 'Serial No.',
      render: (r) => <span className="font-mono text-caption text-surface-600">{r.serialNumber}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'assignedDate',
      header: 'Assigned Date',
      render: (r) => (
        <span className="text-surface-600 text-body-sm flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-surface-400" />
          {r.assignedDate || '2024-01-16'}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Current Value',
      align: 'right',
      render: (r) => <span className="font-semibold text-surface-900">${r.currentValue.toLocaleString()}</span>,
    },
    {
      key: 'action',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('asset-detail', r.id)}
          rightIcon={<ChevronRight className="h-3 w-3" />}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="employee-detail-page">
      {/* 1. Header Card with Identity & Action Buttons */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <button
              onClick={() => onNavigate('assignment')}
              className="mt-1 h-9 w-9 rounded-lg border border-surface-200 hover:bg-surface-100 flex items-center justify-center text-surface-600 transition-colors shrink-0"
              title="Back to Employee Management"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <Avatar
                initials={employee.initials}
                size="lg"
                color={employee.avatarColor || 'bg-brand-500'}
              />
              <span
                className={cn(
                  'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-white',
                  employee.status === 'Active'
                    ? 'bg-success-500'
                    : employee.status === 'On Leave'
                    ? 'bg-amber-500'
                    : 'bg-surface-400'
                )}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-surface-900">{employee.name}</h1>
                <Badge variant="neutral" className="font-mono text-caption px-2 py-0.5">
                  {employee.employeeCode || 'EMP-0001'}
                </Badge>
                <StatusBadge status={employee.status === 'Active' ? 'Active' : employee.status === 'On Leave' ? 'In Maintenance' : 'Retired'} />
                <Badge variant="accent" className="bg-brand-50 text-brand-700 border-brand-200">
                  {employee.department}
                </Badge>
              </div>
              <p className="text-body-sm text-surface-600 mt-1 flex flex-wrap items-center gap-3">
                <span className="font-medium text-surface-800">{employee.jobTitle}</span>
                <span className="text-surface-300">•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-surface-400" />
                  {employee.email}
                </span>
                <span className="text-surface-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-surface-400" />
                  {employee.location}
                </span>
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditJobTitle(employee.jobTitle);
                setEditDepartment(employee.department);
                setEditLocation(employee.location);
                setEditDesk(employee.deskLocation || '');
                setEditPhone(employee.phone || '');
                setEditManager(employee.manager || '');
                setEditStatus(employee.status);
                setIsEditProfileModalOpen(true);
              }}
            >
              Edit Identity
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              Assign Asset
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Wrench className="h-3.5 w-3.5" />}
              onClick={() => {
                setTicketTitle(`Hardware repair for ${employee.name}`);
                setIsNewTicketModalOpen(true);
              }}
            >
              New IT Ticket
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-2 border-t border-surface-100">
          <Tabs items={tabs} active={tab} onChange={setTab} />
        </div>
      </Card>

      {/* Main Grid: Content (Left) & Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (3/4 on large screens) */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Top Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-surface-50/50 border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Assigned Equipment</p>
                      <p className="text-xl font-bold text-surface-900">{assignedAssets.length} Devices</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-surface-50/50 border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Total Asset Valuation</p>
                      <p className="text-xl font-bold text-surface-900">${totalAssetValue.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-surface-50/50 border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Active Service Tickets</p>
                      <p className="text-xl font-bold text-surface-900">{openTicketsCount} In-Flight</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* IT Workstation Profile & Environment */}
              <Card className="p-6">
                <CardHeader
                  title="IT Workstation & Environment Profile"
                  description="Configured IT workplace tier and primary operating systems"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setIsEditProfileModalOpen(true)}>
                      Modify Specs
                    </Button>
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-caption font-medium text-surface-500">Workstation Archetype</p>
                        <p className="text-body-sm font-semibold text-surface-900">
                          {employee.workstationType || 'Standard Engineering Workstation'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-caption font-medium text-surface-500">Primary Operating System</p>
                        <p className="text-body-sm font-semibold text-surface-900">
                          {employee.primaryOs || 'macOS Sonoma & Linux'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-caption font-medium text-surface-500">Onboarding & IT Provision Date</p>
                        <p className="text-body-sm font-semibold text-surface-900">
                          {employee.startDate || '2022-03-15'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-caption font-medium text-surface-500">Department & Cost Center</p>
                        <p className="text-body-sm font-semibold text-surface-900">
                          {employee.department} ({employee.departmentId || 'DEPT-ENG'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-caption font-medium text-surface-500">Desk / Workspace Unit</p>
                        <p className="text-body-sm font-semibold text-surface-900">
                          {employee.deskLocation || 'Desk E-412 (HQ Floor 4)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-surface-100 flex items-center justify-center text-surface-600 shrink-0 mt-0.5">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-caption font-medium text-surface-500">Reporting Line / Manager</p>
                        <p className="text-body-sm font-semibold text-surface-900">
                          {employee.manager || 'Alex Morgan'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Assigned Hardware Snippet */}
              <Card className="p-6">
                <CardHeader
                  title="Current Assigned Hardware"
                  description={`${assignedAssets.length} assets registered to this profile`}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTab('assets')}
                      rightIcon={<ChevronRight className="h-3 w-3" />}
                    >
                      View All Assets
                    </Button>
                  }
                />
                {assignedAssets.length === 0 ? (
                  <EmptyState
                    icon={<Laptop className="h-8 w-8" />}
                    title="No Assets Assigned"
                    description="This employee currently has no IT equipment assigned."
                    action={
                      <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                        Assign First Asset
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {assignedAssets.map((ast) => (
                      <div
                        key={ast.id}
                        onClick={() => onNavigate('asset-detail', ast.id)}
                        className="p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-xs bg-white transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-700">
                            <ast.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900 text-body-sm">{ast.name}</p>
                            <p className="text-caption text-surface-500 font-mono">{ast.code} • {ast.type}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-surface-400" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent IT Requisition Tickets */}
              <Card className="p-6">
                <CardHeader
                  title="Recent IT Requisitions & Support"
                  description="Latest tickets created by or associated with this employee"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTab('tickets')}
                      rightIcon={<ChevronRight className="h-3 w-3" />}
                    >
                      View All Tickets
                    </Button>
                  }
                />
                {employeeTickets.length === 0 ? (
                  <EmptyState
                    icon={<Wrench className="h-8 w-8" />}
                    title="No Active Support Tickets"
                    description="This employee currently has no open or past IT service requests."
                  />
                ) : (
                  <div className="space-y-3 mt-4">
                    {employeeTickets.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onNavigate('ticket-detail', t.ticketCode)}
                        className="p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-xs bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-caption text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                              {t.ticketCode}
                            </span>
                            <Badge
                              variant={priorityConfig[t.priority]?.variant || 'default'}
                              className="text-[11px] px-1.5 py-0"
                            >
                              {t.priority}
                            </Badge>
                            <StatusBadge status={t.status === 'DONE' ? 'Active' : t.status === 'REJECTED_BY_DEPT' ? 'Retired' : 'In Maintenance'} />
                          </div>
                          <p className="font-semibold text-surface-900 text-body-sm">{t.title}</p>
                          <p className="text-caption text-surface-500 flex items-center gap-2">
                            <span>Asset: {t.asset.code} ({t.asset.name})</span>
                            <span>•</span>
                            <span>Created: {t.createdAt}</span>
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                          View Ticket
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 2: ASSIGNED ASSETS */}
          {tab === 'assets' && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Assigned IT Hardware</h2>
                  <p className="text-body-sm text-surface-500">
                    All physical computers, peripherals, and network devices registered to {employee.name}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  Assign New Equipment
                </Button>
              </div>

              {assignedAssets.length === 0 ? (
                <EmptyState
                  icon={<Laptop className="h-10 w-10 text-surface-400" />}
                  title="No IT Assets Assigned"
                  description={`${employee.name} does not have any active hardware assigned at this time.`}
                  action={
                    <Button variant="primary" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                      Assign First Asset
                    </Button>
                  }
                />
              ) : (
                <DataTable
                  columns={assetColumns}
                  data={assignedAssets}
                  searchPlaceholder="Filter assigned hardware..."
                  pageSize={5}
                />
              )}
            </Card>
          )}

          {/* TAB: SOFTWARE & SAAS LICENSES */}
          {tab === 'licenses' && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Software & SaaS Entitlements</h2>
                  <p className="text-body-sm text-surface-500">
                    Active cloud subscriptions, software seats, and desktop applications licensed to {employee.name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  onClick={() => onNavigate('licenses')}
                >
                  Manage All Licenses
                </Button>
              </div>

              {employeeLicenses.length === 0 ? (
                <EmptyState
                  icon={<KeyRound className="h-10 w-10 text-surface-400" />}
                  title="No Software Licenses Assigned"
                  description="This employee currently has no dedicated software seats or SaaS subscriptions allocated."
                  action={
                    <Button variant="primary" size="sm" onClick={() => onNavigate('licenses')}>
                      Allocate Software License
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-body-sm">
                      <thead>
                        <tr className="border-b border-surface-200 text-caption font-semibold text-surface-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Product / Application</th>
                          <th className="py-3 px-4">Role / Permission</th>
                          <th className="py-3 px-4">Cost / Seat</th>
                          <th className="py-3 px-4">Usage Health</th>
                          <th className="py-3 px-4">Assigned Hardware</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {employeeLicenses.map(({ license, seat }) => (
                          <tr key={license.id} className="hover:bg-surface-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                                  <KeyRound className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <button
                                    onClick={() => onNavigate('license-detail', license.id)}
                                    className="font-bold text-surface-900 hover:text-brand-600 transition-colors text-left block"
                                  >
                                    {license.product}
                                  </button>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-caption text-brand-600 bg-brand-50 px-1 py-0.2 rounded font-semibold">
                                      {license.licenseCode}
                                    </span>
                                    <span className="text-caption text-surface-500">{license.vendor}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="neutral" className="text-caption">
                                {seat.allocationRole || 'Standard User'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-semibold text-surface-900">
                              ${license.costPerSeat} <span className="text-caption font-normal text-surface-500">/ yr</span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  seat.usageStatus === 'Daily Active'
                                    ? 'success'
                                    : seat.usageStatus === 'Weekly Active'
                                    ? 'accent'
                                    : 'warning'
                                }
                                className="text-caption"
                              >
                                {seat.usageStatus}
                              </Badge>
                              <div className="text-caption text-surface-400 mt-0.5">
                                Last: {seat.lastActiveDate}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-surface-700">
                              {seat.assetCode ? (
                                <span className="font-mono text-caption bg-surface-100 px-1.5 py-0.5 rounded text-surface-800">
                                  {seat.assetCode}
                                </span>
                              ) : (
                                <span className="text-caption text-surface-400">Cloud / SSO Only</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigate('license-detail', license.id)}
                                rightIcon={<ChevronRight className="h-3 w-3" />}
                              >
                                License Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: IT TICKETS */}
          {tab === 'tickets' && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">IT Requisitions & Tickets</h2>
                  <p className="text-body-sm text-surface-500">
                    Support tickets, repair requests, and hardware upgrades associated with this employee
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setTicketTitle(`Hardware repair for ${employee.name}`);
                    setIsNewTicketModalOpen(true);
                  }}
                >
                  Create IT Request
                </Button>
              </div>

              {employeeTickets.length === 0 ? (
                <EmptyState
                  icon={<Wrench className="h-10 w-10 text-surface-400" />}
                  title="No IT Tickets Found"
                  description="There are currently no support or maintenance tickets recorded for this employee."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setTicketTitle(`IT Service for ${employee.name}`);
                        setIsNewTicketModalOpen(true);
                      }}
                    >
                      Raise First Request
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {employeeTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onNavigate('ticket-detail', t.ticketCode)}
                      className="p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:shadow-xs bg-white transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-caption text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {t.ticketCode}
                          </span>
                          <Badge variant={priorityConfig[t.priority]?.variant || 'default'}>
                            {t.priority} • {t.slaTargetHours}h SLA
                          </Badge>
                          <StatusBadge status={t.status === 'DONE' ? 'Active' : t.status === 'REJECTED_BY_DEPT' ? 'Retired' : 'In Maintenance'} />
                          <span className="text-caption text-surface-400 font-mono">
                            {t.createdAt}
                          </span>
                        </div>
                        <h3 className="font-semibold text-surface-900 text-body">{t.title}</h3>
                        <p className="text-body-sm text-surface-600 line-clamp-2">{t.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-caption text-surface-500 pt-1">
                          <span className="flex items-center gap-1 font-medium text-surface-700">
                            <Laptop className="h-3.5 w-3.5 text-surface-400" />
                            {t.asset?.code} ({t.asset?.name})
                          </span>
                          {t.itAssignment?.technicianName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-surface-400" />
                              Tech: {t.itAssignment.technicianName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('ticket-detail', t.ticketCode);
                          }}
                          rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* TAB 4: HISTORY */}
          {tab === 'history' && (
            <Card className="p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-surface-900">Employee IT History</h2>
                <p className="text-body-sm text-surface-500">
                  Chronological lifecycle events including asset assignments, department changes, and ticket milestones
                </p>
              </div>

              {employeeHistory.length === 0 ? (
                <EmptyState
                  icon={<History className="h-10 w-10 text-surface-400" />}
                  title="No History Events"
                  description="No historical timeline records have been registered yet."
                />
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200">
                  {employeeHistory.map((event) => (
                    <div key={event.id} className="relative group">
                      {/* Timeline Node Icon */}
                      <div className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white bg-brand-500 text-white flex items-center justify-center ring-4 ring-brand-50 group-hover:scale-110 transition-transform shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>

                      <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/50 hover:bg-white hover:shadow-xs transition-all space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-surface-900 text-body-sm">{event.title}</span>
                            {event.badge && (
                              <Badge variant="neutral" className="text-[11px] px-1.5 py-0">
                                {event.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-caption font-mono text-surface-500 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-surface-400" />
                            {event.date}
                          </span>
                        </div>
                        <p className="text-body-sm text-surface-600">{event.description}</p>
                        <p className="text-caption text-surface-500 font-medium">
                          Authorized / Performed by: <span className="text-surface-700">{event.actor}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* TAB 5: AUDIT LOG */}
          {tab === 'audit' && (
            <Card className="p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-surface-900">Audit & Governance Trail</h2>
                <p className="text-body-sm text-surface-500">
                  Immutable record of entity modifications, field transitions, and actor accountability
                </p>
              </div>

              {employeeAudit.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-10 w-10 text-surface-400" />}
                  title="No Audit Logs"
                  description="No audit modifications have been recorded for this profile."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-body-sm">
                    <thead>
                      <tr className="border-b border-surface-200 text-caption font-semibold text-surface-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Target Field / Resource</th>
                        <th className="py-3 px-4">Previous Value</th>
                        <th className="py-3 px-4">Updated Value</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {employeeAudit.map((log) => (
                        <tr key={log.id} className="hover:bg-surface-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-surface-900">{log.action}</td>
                          <td className="py-3 px-4 font-medium text-surface-700">{log.field}</td>
                          <td className="py-3 px-4 text-surface-500 font-mono text-caption line-through decoration-surface-300">
                            {log.oldValue}
                          </td>
                          <td className="py-3 px-4 text-brand-700 font-mono text-caption font-semibold">
                            {log.newValue}
                          </td>
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

        {/* Right Sidebar (1/4 on large screens) */}
        <div className="space-y-6">
          {/* Identity & Status Sidebar Card */}
          <SectionCard title="Employee Identity" description="Basic personnel profile">
            <div className="space-y-3.5 text-body-sm">
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Employee Code</span>
                <span className="font-mono font-semibold text-surface-900">{employee.employeeCode || 'EMP-0001'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Status</span>
                <StatusBadge status={employee.status === 'Active' ? 'Active' : employee.status === 'On Leave' ? 'In Maintenance' : 'Retired'} />
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Designation</span>
                <span className="font-medium text-surface-800 text-right">{employee.jobTitle}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Phone</span>
                <span className="font-mono text-surface-700">{employee.phone || '+1 (555) 234-5678'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Email</span>
                <span className="text-surface-700 truncate max-w-[140px] text-right" title={employee.email}>
                  {employee.email}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-500">Start Date</span>
                <span className="text-surface-700">{employee.startDate || '2022-03-15'}</span>
              </div>
            </div>
          </SectionCard>

          {/* Department & Reporting Hierarchy */}
          <SectionCard title="Organization & Hierarchy" description="Reporting line and location">
            <div className="space-y-3.5 text-body-sm">
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Department</span>
                <span className="font-semibold text-surface-900">{employee.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Cost Center ID</span>
                <span className="font-mono text-caption text-surface-600">{employee.departmentId || 'DEPT-ENG'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Direct Manager</span>
                <span className="font-medium text-brand-600">{employee.manager || 'Alex Morgan'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-500">Location Desk</span>
                <span className="text-surface-700 text-right">{employee.deskLocation || 'Desk E-412'}</span>
              </div>
            </div>
          </SectionCard>

          {/* IT Assets Summary */}
          <SectionCard title="Hardware Assets" description="Hardware inventory allotment">
            <div className="space-y-3">
              <div className="p-3 bg-surface-50 rounded-lg flex items-center justify-between">
                <span className="text-surface-600 text-body-sm">Active Assets</span>
                <span className="font-bold text-surface-900">{assignedAssets.length}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-lg flex items-center justify-between">
                <span className="text-surface-600 text-body-sm">Total Value</span>
                <span className="font-bold text-surface-900">${totalAssetValue.toLocaleString()}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsAssignModalOpen(true)}
              >
                Assign Asset
              </Button>
            </div>
          </SectionCard>

          {/* Quick Support Actions */}
          <Card className="p-4 bg-brand-50/50 border-brand-200">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-brand-900 text-body-sm">IT Support Hub</p>
                <p className="text-caption text-brand-700 mt-0.5">
                  Raise repairs, replace broken components, or transfer assets seamlessly.
                </p>
                <div className="mt-3 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setTicketTitle(`Hardware replacement for ${employee.name}`);
                      setIsNewTicketModalOpen(true);
                    }}
                  >
                    Create Service Ticket
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      push({
                        variant: 'info',
                        title: 'Profile Exported',
                        message: `IT Asset profile for ${employee.name} exported as PDF.`,
                      });
                    }}
                  >
                    Export IT Profile
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL 1: Assign Asset */}
      <Modal
        open={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Equipment to ${employee.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-surface-600">
            Select an available item from the company inventory to assign directly to this employee.
          </p>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Available Inventory Assets *
            </label>
            {unassignedAssets.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-body-sm">
                No unassigned assets currently available in stock.
              </div>
            ) : (
              <Select
                value={selectedAssetToAssign}
                onChange={(e) => setSelectedAssetToAssign(e.target.value)}
                options={[
                  { label: '— Select an available asset —', value: '' },
                  ...unassignedAssets.map((a) => ({
                    label: `${a.code} • ${a.name} (${a.category} - $${a.currentValue})`,
                    value: a.id,
                  })),
                ]}
              />
            )}
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Assignment Notes (Optional)
            </label>
            <Textarea
              placeholder="e.g. Standard engineering kit provision, floor 4 desk setup..."
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selectedAssetToAssign}
              onClick={handleAssignAsset}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: New IT Ticket */}
      <Modal
        open={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title={`Create IT Requisition for ${employee.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-surface-600">
            Submit a repair or service request on behalf of this employee. The ticket will route to the department head for initial approval.
          </p>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Issue Subject / Summary *
            </label>
            <Input
              placeholder="e.g. MacBook Pro display flickering & battery overheating"
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Category
              </label>
              <Select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                options={categoryOptions}
              />
            </div>

            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Priority & SLA
              </label>
              <Select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value as PriorityLevel)}
                options={[
                  { label: 'Critical (2 Hours SLA)', value: 'Critical' },
                  { label: 'High (8 Hours SLA)', value: 'High' },
                  { label: 'Medium (24 Hours SLA)', value: 'Medium' },
                  { label: 'Low (48 Hours SLA)', value: 'Low' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Affected Equipment / Asset
            </label>
            <Select
              value={ticketAssetId}
              onChange={(e) => setTicketAssetId(e.target.value)}
              options={[
                { label: 'General / No specific asset', value: '' },
                ...assignedAssets.map((a) => ({
                  label: `${a.code} • ${a.name} (${a.type})`,
                  value: a.id,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Detailed Diagnostic / Problem Description
            </label>
            <Textarea
              placeholder="Describe symptoms, steps to reproduce, when it started..."
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setIsNewTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTicket}>
              Submit IT Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Edit Profile */}
      <Modal
        open={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        title={`Edit Identity & Organization: ${employee.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Job Title / Position
              </label>
              <Input value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} />
            </div>

            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Department
              </label>
              <Select
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                options={departments.map((d) => ({ label: d, value: d }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Location Campus
              </label>
              <Select
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                options={locations.map((l) => ({ label: l, value: l }))}
              />
            </div>

            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Physical Desk / Unit
              </label>
              <Input
                placeholder="e.g. Desk E-412"
                value={editDesk}
                onChange={(e) => setEditDesk(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Phone Number
              </label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>

            <div>
              <label className="block text-caption font-semibold text-surface-700 mb-1.5">
                Status
              </label>
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'On Leave', value: 'On Leave' },
                  { label: 'Inactive', value: 'Inactive' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 mb-1.5">
              Reporting Manager
            </label>
            <Select
              value={editManager}
              onChange={(e) => setEditManager(e.target.value)}
              options={[
                { label: '— Select Manager —', value: '' },
                ...managerOptions.map((m) => ({ label: `${m.name} (${m.jobTitle})`, value: m.name })),
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="outline" onClick={() => setIsEditProfileModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
