import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  KeyRound,
  Shield,
  Laptop,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Building,
  Layers,
  Sparkles,
  ExternalLink,
  Code,
  Globe,
  Database,
  Cpu,
  Palette,
  Briefcase,
  User,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ChevronRight,
  UserMinus,
  UserCheck,
  Wrench,
  History,
  ClipboardList,
  Mail,
  Phone,
  ArrowRightLeft,
  HelpCircle,
  TrendingDown,
  TrendingUp,
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
  Textarea,
  Progress,
} from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import {
  initialSoftwareLicenses,
  type SoftwareLicenseDetail,
  type AllocatedSeat,
  type InstalledAssetBinding,
  type LicenseHistoryEvent,
  type LicenseAuditLog,
  type LicenseCategory,
  type LicenseType,
  type LicenseStatus,
  type ComplianceStatus,
} from '@/data/licenseData';
import { employees as mockEmployees, assets as mockAssets, type Employee, type Asset } from '@/data/mockData';
import {
  initialRequisitions,
  type ITRequisitionTicket,
  type TicketCategory,
  type PriorityLevel,
} from '@/data/requisitionData';
import { cn } from '@/lib/cn';

interface LicenseDetailProps {
  licenseId: string;
  onNavigate: (id: string, aid?: string) => void;
}

const categoryIcons: Record<LicenseCategory, any> = {
  'Productivity & Office': Briefcase,
  'Developer Tools & IDE': Code,
  'Design & Creative': Palette,
  'Collaboration & Communication': Globe,
  'Cloud & Infrastructure': Cpu,
  'Database & Analytics': Database,
  'Security & Compliance': Shield,
};

const statusColors: Record<LicenseStatus, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  Active: { variant: 'success', label: 'Active & Valid' },
  'Expiring Soon': { variant: 'warning', label: 'Expiring Soon' },
  Expired: { variant: 'error', label: 'Expired' },
  'Over-Allocated': { variant: 'error', label: 'Over-Allocated (Risk)' },
  'Under-Utilized': { variant: 'default', label: 'Under-Utilized' },
};

const complianceColors: Record<ComplianceStatus, { variant: 'success' | 'warning' | 'error' | 'accent'; label: string }> = {
  Compliant: { variant: 'success', label: '100% Compliant' },
  'Audit Warning': { variant: 'warning', label: 'Audit Warning' },
  'True-Up Required': { variant: 'error', label: 'True-Up Required' },
  Optimized: { variant: 'accent', label: 'Cost Optimized' },
};

export function LicenseDetail({ licenseId, onNavigate }: LicenseDetailProps) {
  const { push } = useToast();
  const [tab, setTab] = useState('overview');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // License data state
  const [allLicenses, setAllLicenses] = useState<SoftwareLicenseDetail[]>(initialSoftwareLicenses);
  const license = useMemo(() => {
    return allLicenses.find((l) => l.id === licenseId || l.licenseCode === licenseId) ?? allLicenses[0];
  }, [allLicenses, licenseId]);

  // Linked employees and assets
  const [employees] = useState<Employee[]>(mockEmployees);
  const [assets] = useState<Asset[]>(mockAssets);

  // Linked IT tickets
  const [allTickets, setAllTickets] = useState<ITRequisitionTicket[]>(initialRequisitions);
  const linkedTickets = useMemo(() => {
    return allTickets.filter(
      (t) =>
        license.linkedTicketCodes.includes(t.ticketCode) ||
        t.title.toLowerCase().includes(license.product.toLowerCase()) ||
        t.description.toLowerCase().includes(license.product.toLowerCase())
    );
  }, [allTickets, license]);

  // Modals state
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  // Form states: Allocate Seat
  const [allocateEmployeeId, setAllocateEmployeeId] = useState(employees[0]?.id || '');
  const [allocateAssetId, setAllocateAssetId] = useState('');
  const [allocateRole, setAllocateRole] = useState<'Standard User' | 'Admin' | 'Developer' | 'Read Only'>('Standard User');
  const [allocateNotes, setAllocateNotes] = useState('');

  // Form states: Renew License
  const [renewYears, setRenewYears] = useState('1');
  const [renewNewSeats, setRenewNewSeats] = useState(license.seatsPurchased.toString());
  const [renewNewCost, setRenewNewCost] = useState(license.annualCost.toString());
  const [renewPoNumber, setRenewPoNumber] = useState(`PO-2026-RNW-${Date.now().toString().slice(-4)}`);

  // Form states: Edit License
  const [editProduct, setEditProduct] = useState(license.product);
  const [editEdition, setEditEdition] = useState(license.edition);
  const [editVendor, setEditVendor] = useState(license.vendor);
  const [editAnnualCost, setEditAnnualCost] = useState(license.annualCost.toString());
  const [editLicenseKey, setEditLicenseKey] = useState(license.licenseKey);
  const [editAutoRenew, setEditAutoRenew] = useState(license.autoRenew);

  // Form states: Create Ticket
  const [ticketTitle, setTicketTitle] = useState(`License access request for ${license.product}`);
  const [ticketPriority, setTicketPriority] = useState<PriorityLevel>('Medium');
  const [ticketDesc, setTicketDesc] = useState('');

  // Derived metrics
  const utilizationPct = Math.round((license.seatsUsed / license.seatsPurchased) * 100);
  const availableSeats = Math.max(0, license.seatsPurchased - license.seatsUsed);
  const CategoryIcon = categoryIcons[license.category] || KeyRound;

  // Days until expiration calculation
  const daysUntilExpiry = useMemo(() => {
    const today = new Date('2026-08-16');
    const expiry = new Date(license.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [license.expiryDate]);

  // Inactive seats calculation for SaaS optimization
  const inactiveSeats = useMemo(() => {
    return license.allocatedSeats.filter((s) => s.usageStatus === 'Inactive (>30d)');
  }, [license.allocatedSeats]);

  const potentialWasteSavings = inactiveSeats.length * license.costPerSeat;

  // Handler: Copy License Key
  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.licenseKey);
    push({
      variant: 'success',
      title: 'License Key Copied',
      message: 'Master license key copied to clipboard.',
    });
  };

  // Handler: Allocate Seat
  const handleAllocateSeat = () => {
    const emp = employees.find((e) => e.id === allocateEmployeeId);
    if (!emp) return;

    if (license.seatsUsed >= license.seatsPurchased) {
      push({
        variant: 'warning',
        title: 'Seat Limit Reached',
        message: 'No available seats remaining. Please expand seat capacity or reclaim unused seats.',
      });
      return;
    }

    const matchedAsset = assets.find((a) => a.id === allocateAssetId);

    const newSeat: AllocatedSeat = {
      id: `seat-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode,
      employeeEmail: emp.email,
      department: emp.department,
      jobTitle: emp.jobTitle,
      assetId: matchedAsset?.id,
      assetCode: matchedAsset?.code,
      assetName: matchedAsset?.name,
      allocatedDate: new Date().toISOString().split('T')[0],
      lastActiveDate: new Date().toISOString().split('T')[0],
      usageStatus: 'Daily Active',
      allocationRole: allocateRole,
    };

    const updatedLicense: SoftwareLicenseDetail = {
      ...license,
      seatsUsed: license.seatsUsed + 1,
      allocatedSeats: [newSeat, ...license.allocatedSeats],
      history: [
        {
          id: `lh-${Date.now()}`,
          licenseId: license.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Seat Allocation',
          title: `Seat Allocated to ${emp.name}`,
          description: `Assigned ${allocateRole} seat to ${emp.name} (${emp.employeeCode}). ${allocateNotes}`,
          actor: 'Current Admin',
          badge: 'Seat +1',
        },
        ...license.history,
      ],
      auditLogs: [
        {
          id: `la-${Date.now()}`,
          licenseId: license.id,
          action: 'Seat Allocation',
          actor: 'Current Admin',
          timestamp: new Date().toLocaleString(),
          field: 'Allocated Seats',
          oldValue: `${license.seatsUsed} Seats`,
          newValue: `${license.seatsUsed + 1} Seats (${emp.name})`,
        },
        ...license.auditLogs,
      ],
    };

    setAllLicenses(allLicenses.map((l) => (l.id === license.id ? updatedLicense : l)));
    setIsAllocateModalOpen(false);
    setAllocateNotes('');
    push({
      variant: 'success',
      title: 'Seat Allocated',
      message: `License seat allocated to ${emp.name}.`,
    });
  };

  // Handler: Revoke / Deallocate Seat
  const handleRevokeSeat = (seatId: string) => {
    const seatToRemove = license.allocatedSeats.find((s) => s.id === seatId);
    if (!seatToRemove) return;

    const updatedLicense: SoftwareLicenseDetail = {
      ...license,
      seatsUsed: Math.max(0, license.seatsUsed - 1),
      allocatedSeats: license.allocatedSeats.filter((s) => s.id !== seatId),
      history: [
        {
          id: `lh-${Date.now()}`,
          licenseId: license.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Seat Revocation',
          title: `Seat Revoked from ${seatToRemove.employeeName}`,
          description: `Reclaimed ${license.product} license seat from ${seatToRemove.employeeName} (${seatToRemove.employeeCode}).`,
          actor: 'Current Admin',
          badge: 'Seat -1',
        },
        ...license.history,
      ],
      auditLogs: [
        {
          id: `la-${Date.now()}`,
          licenseId: license.id,
          action: 'Seat Revocation',
          actor: 'Current Admin',
          timestamp: new Date().toLocaleString(),
          field: 'Allocated Seats',
          oldValue: `${license.seatsUsed} Seats`,
          newValue: `${license.seatsUsed - 1} Seats (Reclaimed from ${seatToRemove.employeeName})`,
        },
        ...license.auditLogs,
      ],
    };

    setAllLicenses(allLicenses.map((l) => (l.id === license.id ? updatedLicense : l)));
    push({
      variant: 'info',
      title: 'Seat Reclaimed',
      message: `Seat reclaimed from ${seatToRemove.employeeName}. Capacity released.`,
    });
  };

  // Handler: Renew License
  const handleRenewLicense = () => {
    const addedYears = parseInt(renewYears, 10) || 1;
    const currentExpiry = new Date(license.expiryDate);
    currentExpiry.setFullYear(currentExpiry.getFullYear() + addedYears);
    const newExpiryStr = currentExpiry.toISOString().split('T')[0];

    const updatedSeats = parseInt(renewNewSeats, 10) || license.seatsPurchased;
    const updatedCost = parseFloat(renewNewCost) || license.annualCost;

    const updatedLicense: SoftwareLicenseDetail = {
      ...license,
      expiryDate: newExpiryStr,
      seatsPurchased: updatedSeats,
      annualCost: updatedCost,
      costPerSeat: Math.round(updatedCost / updatedSeats),
      poNumber: renewPoNumber,
      status: 'Active',
      history: [
        {
          id: `lh-${Date.now()}`,
          licenseId: license.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Contract Renewal',
          title: `${addedYears}-Year Subscription Renewed`,
          description: `Renewed until ${newExpiryStr}. Capacity: ${updatedSeats} seats, Annual Commitment: $${updatedCost.toLocaleString()} (PO: ${renewPoNumber}).`,
          actor: 'Procurement / IT Operations',
          badge: 'Renewed',
        },
        ...license.history,
      ],
      auditLogs: [
        {
          id: `la-${Date.now()}`,
          licenseId: license.id,
          action: 'Contract Renewal',
          actor: 'Current Admin',
          timestamp: new Date().toLocaleString(),
          field: 'Expiry Date',
          oldValue: license.expiryDate,
          newValue: newExpiryStr,
        },
        ...license.auditLogs,
      ],
    };

    setAllLicenses(allLicenses.map((l) => (l.id === license.id ? updatedLicense : l)));
    setIsRenewModalOpen(false);
    push({
      variant: 'success',
      title: 'License Renewed Successfully',
      message: `${license.product} is now renewed through ${newExpiryStr}.`,
    });
  };

  // Handler: Edit License
  const handleSaveEdit = () => {
    const updatedCost = parseFloat(editAnnualCost) || license.annualCost;

    const updatedLicense: SoftwareLicenseDetail = {
      ...license,
      product: editProduct,
      edition: editEdition,
      vendor: editVendor,
      annualCost: updatedCost,
      costPerSeat: Math.round(updatedCost / license.seatsPurchased),
      licenseKey: editLicenseKey,
      autoRenew: editAutoRenew,
    };

    setAllLicenses(allLicenses.map((l) => (l.id === license.id ? updatedLicense : l)));
    setIsEditModalOpen(false);
    push({
      variant: 'success',
      title: 'License Details Updated',
      message: `Modifications to ${editProduct} have been saved.`,
    });
  };

  // Handler: Create Ticket for this license
  const handleCreateTicket = () => {
    const newCode = `REQ-2026-${(allTickets.length + 1).toString().padStart(4, '0')}`;
    const newTicket: ITRequisitionTicket = {
      id: `req-${Date.now()}`,
      ticketCode: newCode,
      title: ticketTitle,
      category: 'Software & OS Issue',
      priority: ticketPriority,
      slaTargetHours: ticketPriority === 'Critical' ? 2 : ticketPriority === 'High' ? 8 : 24,
      description: ticketDesc || `Service request concerning software license ${license.product} (${license.licenseCode}).`,
      location: 'HQ - Global IT',
      createdAt: new Date().toLocaleString(),
      status: 'PENDING_DEPT_APPROVAL',
      requester: {
        id: 'e1',
        name: 'Sarah Chen',
        email: 'sarah.c@raise.co',
        jobTitle: 'Senior Software Engineer',
        department: 'Engineering',
        initials: 'SC',
        avatarColor: 'bg-brand-500',
      },
      asset: {
        id: license.id,
        code: license.licenseCode,
        name: license.product,
        type: 'Software License',
        serialNumber: license.licenseKey.slice(0, 12) + '...',
        location: 'Cloud / Global',
        isMyAssignedAsset: false,
        purchaseCost: license.annualCost,
        currentValue: license.annualCost,
      },
      departmentApproval: {
        status: 'Pending',
        approverName: 'Department Lead',
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
          actorName: 'Sarah Chen',
          actorRole: 'Requester',
          timestamp: new Date().toLocaleString(),
          action: 'Created Software License Requisition Ticket',
          notes: `Linked Software License: ${license.product} (${license.licenseCode})`,
        },
      ],
    };

    setAllTickets([newTicket, ...allTickets]);
    setIsCreateTicketModalOpen(false);
    setTicketTitle('');
    setTicketDesc('');
    push({
      variant: 'success',
      title: 'IT Requisition Created',
      message: `Support work order ${newCode} has been logged for ${license.product}.`,
    });
  };

  // Table Columns: Allocated Seats
  const seatColumns: Column<AllocatedSeat>[] = [
    {
      key: 'employeeName',
      header: 'Assigned Employee',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-caption shrink-0">
            {r.employeeName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onNavigate('employee-detail', r.employeeId)}
              className="font-medium text-surface-900 hover:text-brand-600 transition-colors text-left block truncate max-w-[180px]"
            >
              {r.employeeName}
            </button>
            <p className="text-caption text-surface-500">{r.employeeEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department / Role',
      render: (r) => (
        <div>
          <span className="text-surface-800 font-medium text-body-sm block">{r.department}</span>
          <span className="text-caption text-surface-500">{r.jobTitle}</span>
        </div>
      ),
    },
    {
      key: 'assetName',
      header: 'Linked Hardware Asset',
      render: (r) =>
        r.assetCode ? (
          <button
            onClick={() => onNavigate('asset-detail', r.assetId || 'a1')}
            className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 hover:underline font-mono text-caption"
          >
            <Laptop className="h-3.5 w-3.5 text-brand-500" />
            {r.assetCode} ({r.assetName})
          </button>
        ) : (
          <span className="text-caption text-surface-400">Cloud / SSO Only</span>
        ),
    },
    {
      key: 'allocatedDate',
      header: 'Allocated Date',
      render: (r) => (
        <span className="text-surface-600 text-body-sm flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-surface-400" />
          {r.allocatedDate}
        </span>
      ),
    },
    {
      key: 'usageStatus',
      header: 'Activity Status',
      render: (r) => (
        <Badge
          variant={
            r.usageStatus === 'Daily Active'
              ? 'success'
              : r.usageStatus === 'Regular Active'
              ? 'accent'
              : r.usageStatus === 'Low Usage'
              ? 'warning'
              : 'error'
          }
          className="text-[11px] px-2 py-0.5"
        >
          {r.usageStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('employee-detail', r.employeeId)}
            title="View Employee Profile"
          >
            Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
            onClick={() => handleRevokeSeat(r.id)}
            title="Revoke Seat"
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Table Columns: Installed Hardware Assets
  const installedAssetColumns: Column<InstalledAssetBinding>[] = [
    {
      key: 'assetName',
      header: 'Hardware Device',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-surface-100 flex items-center justify-center text-surface-600 shrink-0">
            <Laptop className="h-4.5 w-4.5" />
          </div>
          <div>
            <button
              onClick={() => onNavigate('asset-detail', r.assetId)}
              className="font-medium text-surface-900 hover:text-brand-600 transition-colors text-left block"
            >
              {r.assetName}
            </button>
            <span className="font-mono text-caption text-surface-500">{r.assetCode}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location / Deployment',
      render: (r) => <span className="text-surface-700 text-body-sm">{r.location}</span>,
    },
    {
      key: 'assignedEmployeeName',
      header: 'Assigned User',
      render: (r) =>
        r.assignedEmployeeId ? (
          <button
            onClick={() => onNavigate('employee-detail', r.assignedEmployeeId)}
            className="text-brand-600 hover:underline font-medium text-body-sm flex items-center gap-1"
          >
            <User className="h-3.5 w-3.5 text-brand-500" />
            {r.assignedEmployeeName}
          </button>
        ) : (
          <span className="text-surface-500 text-body-sm">{r.assignedEmployeeName}</span>
        ),
    },
    {
      key: 'activationKeyUsed',
      header: 'Activation Binding',
      render: (r) => <span className="font-mono text-caption text-surface-600">{r.activationKeyUsed}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status === 'Activated' ? 'Active' : 'In Maintenance'} />,
    },
    {
      key: 'action',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('asset-detail', r.assetId)}
          rightIcon={<ChevronRight className="h-3 w-3" />}
        >
          Device Specs
        </Button>
      ),
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Layers className="h-4 w-4" /> },
    { id: 'seats', label: 'Allocated Seats', icon: <Users className="h-4 w-4" />, count: license.allocatedSeats.length },
    { id: 'devices', label: 'Installed Assets', icon: <Laptop className="h-4 w-4" />, count: license.installedAssets.length },
    { id: 'tickets', label: 'IT Tickets', icon: <Wrench className="h-4 w-4" />, count: linkedTickets.length },
    { id: 'optimization', label: 'SaaS Optimization', icon: <Sparkles className="h-4 w-4" />, count: inactiveSeats.length },
    { id: 'history', label: 'History & Audit', icon: <History className="h-4 w-4" />, count: license.history.length + license.auditLogs.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="software-license-detail-page">
      {/* 1. Header Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <button
              onClick={() => onNavigate('licenses')}
              className="mt-1 h-9 w-9 rounded-lg border border-surface-200 hover:bg-surface-100 flex items-center justify-center text-surface-600 transition-colors shrink-0"
              title="Back to Software Licenses"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-surface-200 flex items-center justify-center text-brand-600 shrink-0 shadow-xs">
              <CategoryIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-surface-900">{license.product}</h1>
                <Badge variant="neutral" className="font-mono text-caption px-2 py-0.5">
                  {license.licenseCode}
                </Badge>
                <Badge variant={statusColors[license.status]?.variant || 'default'}>
                  {statusColors[license.status]?.label || license.status}
                </Badge>
                <Badge variant={complianceColors[license.complianceStatus]?.variant || 'accent'}>
                  {complianceColors[license.complianceStatus]?.label || license.complianceStatus}
                </Badge>
              </div>
              <p className="text-body-sm text-surface-600 mt-1 flex flex-wrap items-center gap-3">
                <span className="font-medium text-surface-800">{license.vendor}</span>
                <span className="text-surface-300">•</span>
                <span>{license.edition}</span>
                <span className="text-surface-300">•</span>
                <span className="text-surface-500">{license.category}</span>
                <span className="text-surface-300">•</span>
                <span className="font-mono text-caption text-surface-500">{license.type}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditProduct(license.product);
                setEditEdition(license.edition);
                setEditVendor(license.vendor);
                setEditAnnualCost(license.annualCost.toString());
                setEditLicenseKey(license.licenseKey);
                setEditAutoRenew(license.autoRenew);
                setIsEditModalOpen(true);
              }}
            >
              Edit Specs
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => {
                setRenewNewSeats(license.seatsPurchased.toString());
                setRenewNewCost(license.annualCost.toString());
                setIsRenewModalOpen(true);
              }}
            >
              Renew Contract
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsAllocateModalOpen(true)}
            >
              Allocate Seat
            </Button>
          </div>
        </div>

        {/* Expiration Warning Alert Banner if within 30 days or expired */}
        {daysUntilExpiry <= 30 && (
          <div
            className={cn(
              'mt-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-body-sm',
              daysUntilExpiry <= 0
                ? 'bg-error-50 border-error-200 text-error-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            )}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <strong>
                  {daysUntilExpiry <= 0
                    ? `Contract Expired on ${license.expiryDate}!`
                    : `Contract Expiring in ${daysUntilExpiry} days (${license.expiryDate})!`}
                </strong>{' '}
                {license.autoRenew
                  ? 'Auto-renewal is active with provider, but contract terms must be reviewed.'
                  : 'Action required: Please execute license renewal to prevent service interruption.'}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRenewModalOpen(true)}
              className={daysUntilExpiry <= 0 ? 'bg-error-600 hover:bg-error-700' : 'bg-amber-600 hover:bg-amber-700'}
            >
              Renew Now
            </Button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 pt-2 border-t border-surface-100">
          <Tabs items={tabs} active={tab} onChange={setTab} />
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (3/4) */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Highlight Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4 bg-surface-50/50 border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Seats Allocated</p>
                      <p className="text-xl font-bold text-surface-900">
                        {license.seatsUsed} / {license.seatsPurchased}
                      </p>
                      <p className="text-caption text-brand-600 font-medium">{utilizationPct}% Utilized</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-surface-50/50 border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Available Capacity</p>
                      <p className="text-xl font-bold text-surface-900">{availableSeats} Seats</p>
                      <p className="text-caption text-surface-500">{license.seatsReserved} Reserved</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-surface-50/50 border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Annual Commitment</p>
                      <p className="text-xl font-bold text-surface-900">${license.annualCost.toLocaleString()}</p>
                      <p className="text-caption text-surface-500">${license.costPerSeat} / seat / yr</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-surface-50/50 border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-caption font-medium text-surface-500 uppercase tracking-wider">Renewal Date</p>
                      <p className="text-base font-bold text-surface-900">{license.expiryDate}</p>
                      <p className="text-caption text-surface-500">{daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Department Seat Allocation Breakdown */}
              <Card className="p-6">
                <CardHeader
                  title="Department Seat Allocation Breakdown"
                  description="Distribution of software seats and chargeback allocation across organizational units"
                />
                <div className="space-y-4 mt-4">
                  {license.departmentAllocations.map((dep) => (
                    <div key={dep.department} className="space-y-1.5">
                      <div className="flex justify-between text-body-sm">
                        <span className="font-semibold text-surface-900 flex items-center gap-2">
                          <Building className="h-4 w-4 text-surface-400" />
                          {dep.department}
                        </span>
                        <span className="text-surface-600 font-medium">
                          {dep.seatCount} Seats ({dep.percentage}%) • ${(dep.seatCount * license.costPerSeat).toLocaleString()}/yr
                        </span>
                      </div>
                      <Progress
                        value={dep.percentage}
                        max={100}
                        barClass={
                          dep.department === 'Engineering'
                            ? 'bg-brand-500'
                            : dep.department === 'Design'
                            ? 'bg-accent-500'
                            : dep.department === 'Sales'
                            ? 'bg-emerald-500'
                            : 'bg-surface-500'
                        }
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Master License Key & Technical Credentials */}
              <Card className="p-6">
                <CardHeader
                  title="License Key & Activation Credentials"
                  description="Cryptographic key, SAML SSO integration parameters, and authentication methods"
                />
                <div className="mt-4 p-4 rounded-xl border border-surface-200 bg-surface-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">
                        Master Activation Key / Entitlement String
                      </p>
                      <p className="font-mono text-base font-bold text-surface-900 tracking-wide">
                        {isKeyVisible ? license.licenseKey : '••••-••••-••••-••••-••••'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={isKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        onClick={() => setIsKeyVisible(!isKeyVisible)}
                      >
                        {isKeyVisible ? 'Hide Key' : 'Reveal Key'}
                      </Button>
                      <Button variant="outline" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={handleCopyKey}>
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-surface-200/80 text-caption">
                    <div>
                      <span className="text-surface-500 block">Activation Method</span>
                      <span className="font-medium text-surface-800">{license.activationMethod}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Contract Ref Number</span>
                      <span className="font-mono font-medium text-surface-800">{license.contractNumber}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Support Tier SLA</span>
                      <span className="font-medium text-surface-800">{license.supportTier}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Assigned Users Snippet */}
              <Card className="p-6">
                <CardHeader
                  title="Allocated Employee Seats"
                  description={`${license.allocatedSeats.length} named users holding active seat entitlements`}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTab('seats')}
                      rightIcon={<ChevronRight className="h-3 w-3" />}
                    >
                      View All Seats
                    </Button>
                  }
                />
                {license.allocatedSeats.length === 0 ? (
                  <EmptyState
                    icon={<Users className="h-8 w-8" />}
                    title="No Seats Allocated"
                    description="No employee accounts have been assigned to this software license yet."
                    action={
                      <Button variant="primary" size="sm" onClick={() => setIsAllocateModalOpen(true)}>
                        Allocate First Seat
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {license.allocatedSeats.slice(0, 4).map((seat) => (
                      <div
                        key={seat.id}
                        onClick={() => onNavigate('employee-detail', seat.employeeId)}
                        className="p-3.5 rounded-xl border border-surface-200 hover:border-brand-300 bg-white transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-caption shrink-0">
                            {seat.employeeName.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-surface-900 text-body-sm truncate">{seat.employeeName}</p>
                            <p className="text-caption text-surface-500 truncate">{seat.department} • {seat.jobTitle}</p>
                          </div>
                        </div>
                        <Badge variant={seat.usageStatus === 'Daily Active' ? 'success' : 'warning'} className="text-[11px]">
                          {seat.usageStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 2: ALLOCATED SEATS */}
          {tab === 'seats' && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Allocated Named User Seats</h2>
                  <p className="text-body-sm text-surface-500">
                    Employees provisioned with active login credentials and license privileges
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsAllocateModalOpen(true)}
                >
                  Allocate Seat
                </Button>
              </div>

              {license.allocatedSeats.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-10 w-10 text-surface-400" />}
                  title="No Seats Allocated"
                  description="There are currently no employees holding seats for this product."
                  action={
                    <Button variant="primary" size="sm" onClick={() => setIsAllocateModalOpen(true)}>
                      Allocate First Seat
                    </Button>
                  }
                />
              ) : (
                <DataTable
                  columns={seatColumns}
                  data={license.allocatedSeats}
                  searchPlaceholder="Filter assigned users by name, email, department..."
                  pageSize={6}
                />
              )}
            </Card>
          )}

          {/* TAB 3: INSTALLED ASSETS */}
          {tab === 'devices' && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Installed Hardware Devices & Servers</h2>
                  <p className="text-body-sm text-surface-500">
                    Physical hardware assets, laptop workstations, and server nodes where this software client is installed
                  </p>
                </div>
              </div>

              {license.installedAssets.length === 0 ? (
                <EmptyState
                  icon={<Laptop className="h-10 w-10 text-surface-400" />}
                  title="No Hardware Bindings"
                  description="This license operates purely as a Cloud SaaS or has no physical node activations."
                />
              ) : (
                <DataTable
                  columns={installedAssetColumns}
                  data={license.installedAssets}
                  searchPlaceholder="Filter installed machines by code, name, location..."
                  pageSize={5}
                />
              )}
            </Card>
          )}

          {/* TAB 4: IT TICKETS */}
          {tab === 'tickets' && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Associated IT Requisitions & Support Tickets</h2>
                  <p className="text-body-sm text-surface-500">
                    Work orders logged for license activation, key resets, seat upgrades, or troubleshooting
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setTicketTitle(`Software service for ${license.product}`);
                    setIsCreateTicketModalOpen(true);
                  }}
                >
                  Raise License Ticket
                </Button>
              </div>

              {linkedTickets.length === 0 ? (
                <EmptyState
                  icon={<Wrench className="h-10 w-10 text-surface-400" />}
                  title="No Linked Support Tickets"
                  description="No service desk tickets are currently associated with this software license."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setTicketTitle(`Issue with ${license.product}`);
                        setIsCreateTicketModalOpen(true);
                      }}
                    >
                      Log Support Request
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {linkedTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onNavigate('ticket-detail', t.ticketCode)}
                      className="p-4 rounded-xl border border-surface-200 hover:border-brand-300 bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-caption text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {t.ticketCode}
                          </span>
                          <Badge variant={t.priority === 'Critical' ? 'error' : t.priority === 'High' ? 'warning' : 'accent'}>
                            {t.priority}
                          </Badge>
                          <StatusBadge status={t.status === 'DONE' ? 'Active' : 'In Maintenance'} />
                        </div>
                        <p className="font-semibold text-surface-900 text-body-sm">{t.title}</p>
                        <p className="text-caption text-surface-500">
                          Requester: {t.requester.name} ({t.requester.department}) • Logged {t.createdAt}
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
          )}

          {/* TAB 5: SAAS OPTIMIZATION */}
          {tab === 'optimization' && (
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader
                  title="AI SaaS Waste & Optimization Scanner"
                  description="Automated telemetry scan of login frequency, unused seats, and potential annual savings"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <p className="text-caption font-semibold text-amber-800 uppercase tracking-wider">
                      Inactive Seats Detected
                    </p>
                    <p className="text-2xl font-bold text-amber-900">{inactiveSeats.length} Seats</p>
                    <p className="text-caption text-amber-700">No login activity for 30+ days</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <p className="text-caption font-semibold text-emerald-800 uppercase tracking-wider">
                      Potential Annual Savings
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">${potentialWasteSavings.toLocaleString()} / yr</p>
                    <p className="text-caption text-emerald-700">By deallocating or downsizing</p>
                  </div>

                  <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200 space-y-1">
                    <p className="text-caption font-semibold text-brand-800 uppercase tracking-wider">
                      Audit True-Up Risk
                    </p>
                    <p className="text-2xl font-bold text-brand-900">$0.00</p>
                    <p className="text-caption text-brand-700">Fully compliant with vendor entitlements</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-body font-semibold text-surface-900 mb-3">Optimization Recommendations</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="accent">Reclaim Inactive Seats</Badge>
                          <span className="text-body-sm font-semibold text-surface-900">
                            Release {inactiveSeats.length} dormant seats
                          </span>
                        </div>
                        <p className="text-caption text-surface-600">
                          Employees haven't opened {license.product} in over a month. Reassigning them will free up capacity without purchasing new seats.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          push({
                            variant: 'success',
                            title: 'Automated Seat Reclamation',
                            message: 'Reclaim notices sent to 2 inactive users.',
                          });
                        }}
                      >
                        Send Check-in
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="success">Auto-Renew Protection</Badge>
                          <span className="text-body-sm font-semibold text-surface-900">
                            Renewal Notice Active ({license.renewalNoticeDays} Days Notice)
                          </span>
                        </div>
                        <p className="text-caption text-surface-600">
                          Automated alert is configured to notify IT Procurement before provider auto-charges next term.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setIsRenewModalOpen(true)}>
                        Adjust Term
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: HISTORY & AUDIT */}
          {tab === 'history' && (
            <div className="space-y-6">
              {/* History Timeline */}
              <Card className="p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-surface-900">Lifecycle History Timeline</h2>
                  <p className="text-body-sm text-surface-500">
                    Chronological milestone events for seat allocations, contract renewals, and tier upgrades
                  </p>
                </div>

                {license.history.length === 0 ? (
                  <EmptyState
                    icon={<History className="h-10 w-10 text-surface-400" />}
                    title="No History Events"
                    description="No historical lifecycle events have been recorded yet."
                  />
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200">
                    {license.history.map((event) => (
                      <div key={event.id} className="relative group">
                        <div className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white bg-brand-500 text-white flex items-center justify-center ring-4 ring-brand-50 group-hover:scale-110 transition-transform shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/50 hover:bg-white hover:shadow-xs transition-all space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-surface-900 text-body-sm">{event.title}</span>
                            <span className="text-caption font-mono text-surface-500 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-surface-400" />
                              {event.date}
                            </span>
                          </div>
                          <p className="text-body-sm text-surface-600">{event.description}</p>
                          <p className="text-caption text-surface-500">
                            Actor: <span className="text-surface-700 font-medium">{event.actor}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Audit Logs */}
              <Card className="p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-surface-900">Audit & Governance Trail</h2>
                  <p className="text-body-sm text-surface-500">
                    Immutable field modifications and compliance validation records
                  </p>
                </div>

                {license.auditLogs.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList className="h-10 w-10 text-surface-400" />}
                    title="No Audit Logs"
                    description="No audit modifications recorded."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-body-sm">
                      <thead>
                        <tr className="border-b border-surface-200 text-caption font-semibold text-surface-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Field</th>
                          <th className="py-3 px-4">Previous Value</th>
                          <th className="py-3 px-4">New Value</th>
                          <th className="py-3 px-4">Actor</th>
                          <th className="py-3 px-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {license.auditLogs.map((log) => (
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
            </div>
          )}
        </div>

        {/* Right Sidebar (1/4) */}
        <div className="space-y-6">
          {/* Commercial & Contract Summary */}
          <SectionCard title="Commercial & Contract Specs" description="Procurement and billing terms">
            <div className="space-y-3.5 text-body-sm">
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">License Code</span>
                <span className="font-mono font-semibold text-surface-900">{license.licenseCode}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">License Model</span>
                <span className="font-medium text-surface-800 text-right">{license.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">PO Number</span>
                <span className="font-mono text-surface-700">{license.poNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Contract ID</span>
                <span className="font-mono text-surface-700">{license.contractNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Billing Cycle</span>
                <span className="text-surface-800 font-medium">{license.billingFrequency}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Auto-Renewal</span>
                <Badge variant={license.autoRenew ? 'success' : 'neutral'} className="text-[11px]">
                  {license.autoRenew ? 'Enabled' : 'Manual'}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Cost Center</span>
                <span className="text-surface-700 text-right text-caption font-medium">{license.costCenter}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-500">Effective Term</span>
                <span className="text-surface-700 text-caption font-mono">
                  {license.startDate} ➔ {license.expiryDate}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Vendor Support & Escalation */}
          <SectionCard title="Vendor Support & Portal" description="Support channels and SLAs">
            <div className="space-y-3.5 text-body-sm">
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Vendor</span>
                <span className="font-semibold text-surface-900">{license.vendor}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Support SLA</span>
                <span className="text-surface-800 font-medium text-right text-caption">{license.supportTier}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Support Email</span>
                <span className="text-brand-600 font-mono text-caption truncate max-w-[150px]" title={license.vendorSupportEmail}>
                  {license.vendorSupportEmail}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-100">
                <span className="text-surface-500">Support Hotline</span>
                <span className="font-mono text-surface-700 text-caption">{license.vendorSupportPhone}</span>
              </div>
              <div className="pt-2">
                <a
                  href={license.vendorWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-surface-200 hover:bg-surface-50 text-brand-600 font-medium text-body-sm transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Vendor Admin Portal
                </a>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* MODAL 1: Allocate Seat */}
      <Modal open={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate License Seat" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-body-sm text-brand-800">
            Assigning seat for <strong>{license.product}</strong> ({availableSeats} seats currently available).
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
              Select Employee Profile *
            </label>
            <select
              value={allocateEmployeeId}
              onChange={(e) => setAllocateEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeCode}) - {e.department} - {e.jobTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
              Link with Physical Hardware Asset (Optional)
            </label>
            <select
              value={allocateAssetId}
              onChange={(e) => setAllocateAssetId(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No Hardware Binding (Cloud / SSO Only)</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
              User Permission Role
            </label>
            <select
              value={allocateRole}
              onChange={(e) => setAllocateRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Standard User">Standard User</option>
              <option value="Admin">Administrator</option>
              <option value="Developer">Developer / Power User</option>
              <option value="Read Only">Read Only / Viewer</option>
            </select>
          </div>

          <Textarea
            label="Allocation Justification / Notes"
            placeholder="e.g. Approved project onboarding for Q3 sprint..."
            value={allocateNotes}
            onChange={(e) => setAllocateNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
            <Button variant="outline" size="sm" onClick={() => setIsAllocateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAllocateSeat}>
              Confirm Allocation
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Renew License */}
      <Modal open={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Software Subscription" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-body-sm text-brand-800">
            Contract renewal workflow for <strong>{license.product}</strong> ({license.vendor}).
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
                Renewal Term Extension
              </label>
              <select
                value={renewYears}
                onChange={(e) => setRenewYears(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="1">+1 Year</option>
                <option value="2">+2 Years (Multi-Year Discount)</option>
                <option value="3">+3 Years Enterprise Lock-in</option>
              </select>
            </div>
            <Input
              label="Purchase Order Ref (PO)"
              value={renewPoNumber}
              onChange={(e) => setRenewPoNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Seat Capacity"
              type="number"
              value={renewNewSeats}
              onChange={(e) => setRenewNewSeats(e.target.value)}
            />
            <Input
              label="Total Annual Cost ($)"
              type="number"
              value={renewNewCost}
              onChange={(e) => setRenewNewCost(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
            <Button variant="outline" size="sm" onClick={() => setIsRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRenewLicense}>
              Submit Renewal
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Edit License Specs */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit License Specifications" size="md">
        <div className="space-y-4">
          <Input label="Product Name *" value={editProduct} onChange={(e) => setEditProduct(e.target.value)} />
          <Input label="Edition / Package Tier" value={editEdition} onChange={(e) => setEditEdition(e.target.value)} />
          <Input label="Vendor *" value={editVendor} onChange={(e) => setEditVendor(e.target.value)} />
          <Input
            label="Annual Cost ($)"
            type="number"
            value={editAnnualCost}
            onChange={(e) => setEditAnnualCost(e.target.value)}
          />
          <Input label="License Key / Token" value={editLicenseKey} onChange={(e) => setEditLicenseKey(e.target.value)} />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editAutoRenew"
              checked={editAutoRenew}
              onChange={(e) => setEditAutoRenew(e.target.checked)}
              className="h-4 w-4 text-brand-600 rounded"
            />
            <label htmlFor="editAutoRenew" className="text-body-sm font-medium text-surface-800">
              Enable Automated Renewal Warning & Provider Sync
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              Save Specifications
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Create IT Ticket */}
      <Modal open={isCreateTicketModalOpen} onClose={() => setIsCreateTicketModalOpen(false)} title="Raise IT Support Ticket" size="md">
        <div className="space-y-4">
          <Input
            label="Summary / Request Subject *"
            value={ticketTitle}
            onChange={(e) => setTicketTitle(e.target.value)}
          />
          <div>
            <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
              Priority SLA Level
            </label>
            <select
              value={ticketPriority}
              onChange={(e) => setTicketPriority(e.target.value as PriorityLevel)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Critical">Critical (2 Hours SLA)</option>
              <option value="High">High (8 Hours SLA)</option>
              <option value="Medium">Medium (24 Hours SLA)</option>
              <option value="Low">Low (48 Hours SLA)</option>
            </select>
          </div>
          <Textarea
            label="Description & Details"
            placeholder="Explain the license issue, key activation error, or seat upgrade requirement..."
            value={ticketDesc}
            onChange={(e) => setTicketDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTicket}>
              Dispatch Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
