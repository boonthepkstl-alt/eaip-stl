import { useState, useMemo } from 'react';
import {
  Plus,
  KeyRound,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  Laptop,
  CheckCircle2,
  Clock,
  Briefcase,
  Code,
  Palette,
  Globe,
  Database,
  Cpu,
  ChevronRight,
  UserPlus,
  ArrowRightLeft,
  FileSpreadsheet,
  Download,
  List,
  LayoutGrid,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Button,
  Badge,
  StatusBadge,
  Progress,
  Dropdown,
  useToast,
  EmptyState,
  Modal,
  Input,
  Select,
  Textarea,
  Tabs,
} from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import {
  initialSoftwareLicenses,
  type SoftwareLicenseDetail,
  type LicenseCategory,
  type LicenseType,
  type LicenseStatus,
  type ComplianceStatus,
} from '@/data/licenseData';
import { employees as mockEmployees, assets as mockAssets, type Employee, type Asset } from '@/data/mockData';
import { cn } from '@/lib/cn';

interface SoftwareLicenseProps {
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

const statusStyles: Record<LicenseStatus, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  Active: { variant: 'success', label: 'Active' },
  'Expiring Soon': { variant: 'warning', label: 'Expiring Soon' },
  Expired: { variant: 'error', label: 'Expired' },
  'Over-Allocated': { variant: 'error', label: 'Over-Allocated' },
  'Under-Utilized': { variant: 'default', label: 'Under-Utilized' },
};

const complianceStyles: Record<ComplianceStatus, { variant: 'success' | 'warning' | 'error' | 'accent'; label: string }> = {
  Compliant: { variant: 'success', label: '100% Compliant' },
  'Audit Warning': { variant: 'warning', label: 'Audit Warning' },
  'True-Up Required': { variant: 'error', label: 'True-Up Needed' },
  Optimized: { variant: 'accent', label: 'Cost Optimized' },
};

export function SoftwareLicensePage({ onNavigate }: SoftwareLicenseProps) {
  const { push } = useToast();

  // Primary data state
  const [licenses, setLicenses] = useState<SoftwareLicenseDetail[]>(initialSoftwareLicenses);
  const [employees] = useState<Employee[]>(mockEmployees);
  const [assets] = useState<Asset[]>(mockAssets);

  // View Mode: 'table' | 'grid' | 'optimization'
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'optimization'>('table');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [activeChip, setActiveChip] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [selectedLicenseForModal, setSelectedLicenseForModal] = useState<SoftwareLicenseDetail | null>(null);

  // Form states: Add License
  const [newProduct, setNewProduct] = useState('');
  const [newEdition, setNewEdition] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newCategory, setNewCategory] = useState<LicenseCategory>('Productivity & Office');
  const [newType, setNewType] = useState<LicenseType>('Subscription (Named User)');
  const [newSeatsPurchased, setNewSeatsPurchased] = useState('50');
  const [newAnnualCost, setNewAnnualCost] = useState('12000');
  const [newExpiryDate, setNewExpiryDate] = useState('2027-08-30');
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [newPoNumber, setNewPoNumber] = useState(`PO-2026-${Date.now().toString().slice(-4)}`);
  const [newAutoRenew, setNewAutoRenew] = useState(true);

  // Form states: Allocate Seat
  const [allocateLicenseId, setAllocateLicenseId] = useState(licenses[0]?.id || '');
  const [allocateEmployeeId, setAllocateEmployeeId] = useState(employees[0]?.id || '');
  const [allocateAssetId, setAllocateAssetId] = useState('');
  const [allocateRole, setAllocateRole] = useState<'Standard User' | 'Admin' | 'Developer' | 'Read Only'>('Standard User');

  // Form states: Renew License
  const [renewYears, setRenewYears] = useState('1');
  const [renewSeats, setRenewSeats] = useState('100');
  const [renewCost, setRenewCost] = useState('24000');

  // KPI Calculations
  const totalSpend = useMemo(() => licenses.reduce((sum, l) => sum + l.annualCost, 0), [licenses]);
  const activeCount = useMemo(() => licenses.filter((l) => l.status === 'Active').length, [licenses]);
  const expiringCount = useMemo(() => licenses.filter((l) => l.status === 'Expiring Soon').length, [licenses]);
  const totalSeatsPurchased = useMemo(() => licenses.reduce((sum, l) => sum + l.seatsPurchased, 0), [licenses]);
  const totalSeatsUsed = useMemo(() => licenses.reduce((sum, l) => sum + l.seatsUsed, 0), [licenses]);
  const overallUtilizationPct = totalSeatsPurchased > 0 ? Math.round((totalSeatsUsed / totalSeatsPurchased) * 100) : 0;

  // Potential waste calculation
  const totalPotentialSavings = useMemo(() => {
    return licenses.reduce((sum, l) => {
      const inactiveSeats = l.allocatedSeats.filter((s) => s.usageStatus === 'Inactive (>30d)').length;
      return sum + inactiveSeats * l.costPerSeat;
    }, 0);
  }, [licenses]);

  // Unique vendors for filter dropdown
  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(licenses.map((l) => l.vendor)));
  }, [licenses]);

  // Filtered dataset
  const filteredLicenses = useMemo(() => {
    return licenses.filter((l) => {
      // Search
      const matchesSearch =
        l.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.licenseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.licenseKey.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Dropdown filters
      if (selectedCategory !== 'all' && l.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && l.status !== selectedStatus) return false;
      if (selectedVendor !== 'all' && l.vendor !== selectedVendor) return false;

      // Preset chips
      if (activeChip === 'expiring') return l.status === 'Expiring Soon' || l.status === 'Expired';
      if (activeChip === 'high-spend') return l.annualCost >= 40000;
      if (activeChip === 'dev-tools') return l.category === 'Developer Tools & IDE';
      if (activeChip === 'office') return l.category === 'Productivity & Office' || l.category === 'Collaboration & Communication';
      if (activeChip === 'creative') return l.category === 'Design & Creative';
      if (activeChip === 'risk') return l.complianceStatus === 'Audit Warning' || l.complianceStatus === 'True-Up Required';
      if (activeChip === 'optimized') return l.complianceStatus === 'Optimized';

      return true;
    });
  }, [licenses, searchQuery, selectedCategory, selectedStatus, selectedVendor, activeChip]);

  // Handler: Add License
  const handleAddLicense = () => {
    if (!newProduct.trim() || !newVendor.trim()) {
      push({
        variant: 'warning',
        title: 'Missing Required Fields',
        message: 'Please provide at least a Product Name and Vendor.',
      });
      return;
    }

    const purchased = parseInt(newSeatsPurchased, 10) || 10;
    const cost = parseFloat(newAnnualCost) || 5000;
    const newCode = `LIC-${newVendor.slice(0, 4).toUpperCase()}-${(licenses.length + 1).toString().padStart(3, '0')}`;

    const newLic: SoftwareLicenseDetail = {
      id: `lic-${Date.now()}`,
      licenseCode: newCode,
      product: newProduct,
      edition: newEdition || 'Standard Enterprise',
      vendor: newVendor,
      vendorWebsite: 'https://admin.portal.com',
      vendorSupportEmail: `support@${newVendor.toLowerCase().replace(/\s+/g, '')}.com`,
      vendorSupportPhone: '+1 (800) 555-0199',
      category: newCategory,
      type: newType,
      status: 'Active',
      complianceStatus: 'Compliant',
      seatsPurchased: purchased,
      seatsUsed: 0,
      seatsReserved: 0,
      annualCost: cost,
      costPerSeat: Math.round(cost / purchased),
      billingFrequency: 'Annual',
      currency: 'USD',
      poNumber: newPoNumber,
      contractNumber: `CT-${Date.now().toString().slice(-6)}`,
      costCenter: 'CC-IT-GLOBAL',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: newExpiryDate,
      autoRenew: newAutoRenew,
      renewalNoticeDays: 45,
      supportTier: 'Enterprise Business Support',
      licenseKey: newLicenseKey || `${newCode}-KEY-AUTO-GENERATED`,
      isKeyMasked: true,
      activationMethod: 'SSO / SAML 2.0',
      description: `${newProduct} subscription managed via ESAPS Software Asset Management.`,
      departmentAllocations: [{ department: 'Engineering', percentage: 100, seatCount: 0 }],
      allocatedSeats: [],
      installedAssets: [],
      history: [
        {
          id: `lh-${Date.now()}`,
          licenseId: `lic-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Contract Renewal',
          title: 'License Registered in System',
          description: `Registered ${newProduct} (${newCode}) with ${purchased} seats.`,
          actor: 'Current Admin',
          badge: 'New',
        },
      ],
      auditLogs: [],
      linkedTicketCodes: [],
    };

    setLicenses([newLic, ...licenses]);
    setIsAddModalOpen(false);
    setNewProduct('');
    setNewEdition('');
    setNewVendor('');
    setNewLicenseKey('');
    push({
      variant: 'success',
      title: 'Software License Registered',
      message: `${newLic.product} (${newLic.licenseCode}) added to the ledger.`,
    });
  };

  // Handler: Open Quick Allocate Modal
  const handleOpenAllocateModal = (lic?: SoftwareLicenseDetail) => {
    if (lic) setAllocateLicenseId(lic.id);
    else if (licenses[0]) setAllocateLicenseId(licenses[0].id);
    setIsAllocateModalOpen(true);
  };

  // Handler: Submit Quick Allocate
  const handleSubmitAllocate = () => {
    const targetLicense = licenses.find((l) => l.id === allocateLicenseId);
    const targetEmployee = employees.find((e) => e.id === allocateEmployeeId);

    if (!targetLicense || !targetEmployee) return;

    if (targetLicense.seatsUsed >= targetLicense.seatsPurchased) {
      push({
        variant: 'warning',
        title: 'Seat Limit Reached',
        message: `${targetLicense.product} has no remaining seats. Please expand capacity.`,
      });
      return;
    }

    const matchedAsset = assets.find((a) => a.id === allocateAssetId);

    const updatedLicense: SoftwareLicenseDetail = {
      ...targetLicense,
      seatsUsed: targetLicense.seatsUsed + 1,
      allocatedSeats: [
        {
          id: `seat-${Date.now()}`,
          employeeId: targetEmployee.id,
          employeeName: targetEmployee.name,
          employeeCode: targetEmployee.employeeCode,
          employeeEmail: targetEmployee.email,
          department: targetEmployee.department,
          jobTitle: targetEmployee.jobTitle,
          assetId: matchedAsset?.id,
          assetCode: matchedAsset?.code,
          assetName: matchedAsset?.name,
          allocatedDate: new Date().toISOString().split('T')[0],
          lastActiveDate: new Date().toISOString().split('T')[0],
          usageStatus: 'Daily Active',
          allocationRole: allocateRole,
        },
        ...targetLicense.allocatedSeats,
      ],
      history: [
        {
          id: `lh-${Date.now()}`,
          licenseId: targetLicense.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Seat Allocation',
          title: `Seat Allocated to ${targetEmployee.name}`,
          description: `Assigned seat for ${targetLicense.product} to ${targetEmployee.name} (${targetEmployee.employeeCode}).`,
          actor: 'Current Admin',
          badge: 'Seat +1',
        },
        ...targetLicense.history,
      ],
    };

    setLicenses(licenses.map((l) => (l.id === targetLicense.id ? updatedLicense : l)));
    setIsAllocateModalOpen(false);
    push({
      variant: 'success',
      title: 'Seat Allocated',
      message: `Allocated ${targetLicense.product} to ${targetEmployee.name}.`,
    });
  };

  // Handler: Open Quick Renew Modal
  const handleOpenRenewModal = (lic: SoftwareLicenseDetail) => {
    setSelectedLicenseForModal(lic);
    setRenewSeats(lic.seatsPurchased.toString());
    setRenewCost(lic.annualCost.toString());
    setIsRenewModalOpen(true);
  };

  // Handler: Submit Renew
  const handleSubmitRenew = () => {
    if (!selectedLicenseForModal) return;

    const addedYears = parseInt(renewYears, 10) || 1;
    const currentExpiry = new Date(selectedLicenseForModal.expiryDate);
    currentExpiry.setFullYear(currentExpiry.getFullYear() + addedYears);
    const newExpiryStr = currentExpiry.toISOString().split('T')[0];

    const updatedSeats = parseInt(renewSeats, 10) || selectedLicenseForModal.seatsPurchased;
    const updatedCost = parseFloat(renewCost) || selectedLicenseForModal.annualCost;

    const updatedLic: SoftwareLicenseDetail = {
      ...selectedLicenseForModal,
      expiryDate: newExpiryStr,
      seatsPurchased: updatedSeats,
      annualCost: updatedCost,
      costPerSeat: Math.round(updatedCost / updatedSeats),
      status: 'Active',
      history: [
        {
          id: `lh-${Date.now()}`,
          licenseId: selectedLicenseForModal.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Contract Renewal',
          title: `${addedYears}-Year Subscription Renewed`,
          description: `Renewed through ${newExpiryStr}. Capacity: ${updatedSeats} seats, Cost: $${updatedCost.toLocaleString()}.`,
          actor: 'Current Admin',
          badge: 'Renewed',
        },
        ...selectedLicenseForModal.history,
      ],
    };

    setLicenses(licenses.map((l) => (l.id === selectedLicenseForModal.id ? updatedLic : l)));
    setIsRenewModalOpen(false);
    push({
      variant: 'success',
      title: 'Contract Renewed',
      message: `${selectedLicenseForModal.product} renewed through ${newExpiryStr}.`,
    });
  };

  // Handler: Export CSV
  const handleExportCSV = () => {
    const headers = ['License Code', 'Product', 'Vendor', 'Category', 'Seats Used', 'Seats Total', 'Annual Cost', 'Expiry Date', 'Status'];
    const rows = filteredLicenses.map((l) => [
      l.licenseCode,
      `"${l.product}"`,
      `"${l.vendor}"`,
      `"${l.category}"`,
      l.seatsUsed,
      l.seatsPurchased,
      l.annualCost,
      l.expiryDate,
      l.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESAPS_Software_Licenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push({
      variant: 'success',
      title: 'License Ledger Exported',
      message: 'CSV file has been generated and downloaded.',
    });
  };

  // Table Columns
  const tableColumns: Column<SoftwareLicenseDetail>[] = [
    {
      key: 'product',
      header: 'Product & Package',
      sortable: true,
      render: (r) => {
        const Icon = categoryIcons[r.category] || KeyRound;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-surface-200 flex items-center justify-center text-brand-600 shrink-0 shadow-xs">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <button
                onClick={() => onNavigate('license-detail', r.id)}
                className="font-bold text-surface-900 hover:text-brand-600 transition-colors text-left block truncate max-w-[220px]"
              >
                {r.product}
              </button>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-caption font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded">
                  {r.licenseCode}
                </span>
                <span className="text-caption text-surface-500 truncate max-w-[140px]">{r.vendor}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Category & Model',
      render: (r) => (
        <div>
          <span className="text-surface-800 font-medium text-body-sm block">{r.category}</span>
          <span className="text-caption text-surface-500 font-mono">{r.type}</span>
        </div>
      ),
    },
    {
      key: 'seatsUsed',
      header: 'Seat Utilization',
      sortable: true,
      render: (r) => {
        const pct = Math.round((r.seatsUsed / r.seatsPurchased) * 100);
        return (
          <div className="w-40 space-y-1">
            <div className="flex justify-between text-caption font-medium">
              <span className="text-surface-900 font-bold">
                {r.seatsUsed} / {r.seatsPurchased}
              </span>
              <span className={pct > 95 ? 'text-error-600 font-bold' : pct > 80 ? 'text-amber-600 font-bold' : 'text-surface-600'}>
                {pct}%
              </span>
            </div>
            <Progress
              value={r.seatsUsed}
              max={r.seatsPurchased}
              barClass={pct > 95 ? 'bg-error-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'}
            />
          </div>
        );
      },
    },
    {
      key: 'annualCost',
      header: 'Financials',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-surface-900 text-body-sm block">${r.annualCost.toLocaleString()}/yr</span>
          <span className="text-caption text-surface-500">${r.costPerSeat} / seat</span>
        </div>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Renewal Date',
      sortable: true,
      render: (r) => {
        const today = new Date('2026-08-16');
        const expiry = new Date(r.expiryDate);
        const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div>
            <span className="text-surface-900 font-medium text-body-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-surface-400" />
              {r.expiryDate}
            </span>
            <span
              className={cn(
                'text-[11px] font-medium block',
                days <= 0
                  ? 'text-error-600 font-bold'
                  : days <= 30
                  ? 'text-amber-600 font-semibold'
                  : 'text-surface-500'
              )}
            >
              {days <= 0 ? 'Expired' : `${days} days left`}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Compliance',
      render: (r) => (
        <div className="space-y-1">
          <Badge variant={statusStyles[r.status]?.variant || 'default'} className="text-[11px] px-2 py-0.5">
            {statusStyles[r.status]?.label || r.status}
          </Badge>
          <div className="text-[11px] text-surface-500 font-medium">{r.complianceStatus}</div>
        </div>
      ),
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
            onClick={() => onNavigate('license-detail', r.id)}
            rightIcon={<ChevronRight className="h-3 w-3" />}
          >
            Details
          </Button>
          <Dropdown
            align="right"
            trigger={
              <span className="h-8 w-8 rounded-lg border border-surface-200 hover:bg-surface-100 flex items-center justify-center text-surface-500 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            }
            items={[
              {
                label: 'View Full Details',
                onClick: () => onNavigate('license-detail', r.id),
              },
              {
                label: 'Allocate Seat',
                icon: <UserPlus className="h-4 w-4" />,
                onClick: () => handleOpenAllocateModal(r),
              },
              {
                label: 'Renew Contract',
                icon: <RefreshCw className="h-4 w-4" />,
                onClick: () => handleOpenRenewModal(r),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="software-licenses-page">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-surface-900">Software Licenses & SaaS Management</h1>
          <p className="text-body-sm text-surface-500">
            Monitor enterprise software subscriptions, seat utilization, vendor contracts, and automated renewal workflows
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="h-4 w-4 text-accent-600" />}
            onClick={() => setIsOptimizeModalOpen(true)}
          >
            AI SaaS Optimization
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => handleOpenAllocateModal()}
          >
            Allocate Seat
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add License
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface-50/50 border-surface-200">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Total Annual Spend</p>
              <p className="text-2xl font-bold text-surface-900">${(totalSpend / 1000).toFixed(1)}K / yr</p>
              <p className="text-caption text-surface-500">{licenses.length} active enterprise contracts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface-50/50 border-surface-200">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Seat Utilization</p>
              <p className="text-2xl font-bold text-surface-900">
                {totalSeatsUsed} <span className="text-base font-normal text-surface-500">/ {totalSeatsPurchased}</span>
              </p>
              <p className="text-caption text-brand-600 font-medium">{overallUtilizationPct}% Organization-wide</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 border cursor-pointer transition-shadow hover:shadow-xs',
            expiringCount > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-surface-50/50 border-surface-200'
          )}
          onClick={() => setActiveChip(activeChip === 'expiring' ? 'all' : 'expiring')}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-11 w-11 rounded-xl flex items-center justify-center shrink-0',
                expiringCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-surface-100 text-surface-600'
              )}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Upcoming Renewals</p>
              <p className="text-2xl font-bold text-surface-900">{expiringCount} Contracts</p>
              <p className="text-caption text-amber-700 font-medium">Expiring in next 60 days</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 bg-surface-50/50 border-surface-200 cursor-pointer hover:shadow-xs"
          onClick={() => setIsOptimizeModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Potential SaaS Savings</p>
              <p className="text-2xl font-bold text-emerald-900">${(totalPotentialSavings / 1000).toFixed(1)}K / yr</p>
              <p className="text-caption text-emerald-700 font-medium">From dormant seats & true-up</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Search Bar, Quick Chips, & View Toggle */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search software by product, vendor, license code, license key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-100 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium transition-colors',
                  viewMode === 'table' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900'
                )}
              >
                <List className="h-4 w-4" />
                Table Ledger
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium transition-colors',
                  viewMode === 'grid' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Card Grid
              </button>
              <button
                onClick={() => setViewMode('optimization')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium transition-colors',
                  viewMode === 'optimization' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-surface-600 hover:text-surface-900'
                )}
              >
                <Zap className="h-4 w-4 text-emerald-600" />
                Waste Scanner
              </button>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100">
            <span className="text-caption font-semibold text-surface-500 flex items-center gap-1 mr-1">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            <button
              onClick={() => setActiveChip('all')}
              className={cn(
                'px-2.5 py-1 rounded-md text-caption font-medium transition-colors',
                activeChip === 'all' ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              All Licenses ({licenses.length})
            </button>
            <button
              onClick={() => setActiveChip('expiring')}
              className={cn(
                'px-2.5 py-1 rounded-md text-caption font-medium transition-colors',
                activeChip === 'expiring' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              )}
            >
              Expiring Soon ({expiringCount})
            </button>
            <button
              onClick={() => setActiveChip('high-spend')}
              className={cn(
                'px-2.5 py-1 rounded-md text-caption font-medium transition-colors',
                activeChip === 'high-spend' ? 'bg-accent-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              High Spend ($40K+)
            </button>
            <button
              onClick={() => setActiveChip('dev-tools')}
              className={cn(
                'px-2.5 py-1 rounded-md text-caption font-medium transition-colors',
                activeChip === 'dev-tools' ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              Developer Tools
            </button>
            <button
              onClick={() => setActiveChip('office')}
              className={cn(
                'px-2.5 py-1 rounded-md text-caption font-medium transition-colors',
                activeChip === 'office' ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              Office & Collab
            </button>
            <button
              onClick={() => setActiveChip('creative')}
              className={cn(
                'px-2.5 py-1 rounded-md text-caption font-medium transition-colors',
                activeChip === 'creative' ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              Creative & Design
            </button>
            <button
              onClick={() => setActiveChip('risk')}
              className={cn(
                'px-2.5 py-1 rounded-md text-caption font-medium transition-colors',
                activeChip === 'risk' ? 'bg-error-600 text-white' : 'bg-error-50 text-error-800 hover:bg-error-100'
              )}
            >
              Audit / True-up Risk
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Main Views */}
      {viewMode === 'table' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-body-sm text-surface-500">
              Showing <strong>{filteredLicenses.length}</strong> of <strong>{licenses.length}</strong> registered software licenses
            </p>
          </div>

          {filteredLicenses.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="h-10 w-10 text-surface-400" />}
              title="No Software Licenses Found"
              description="No licenses match your current filter parameters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveChip('all');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={tableColumns}
              data={filteredLicenses}
              searchable={false}
              pageSize={8}
            />
          )}
        </Card>
      )}

      {viewMode === 'grid' && (
        <div>
          {filteredLicenses.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={<KeyRound className="h-10 w-10 text-surface-400" />}
                title="No Software Licenses Found"
                description="No licenses match your current filter parameters."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLicenses.map((lic) => {
                const Icon = categoryIcons[lic.category] || KeyRound;
                const pct = Math.round((lic.seatsUsed / lic.seatsPurchased) * 100);
                const today = new Date('2026-08-16');
                const expiry = new Date(lic.expiryDate);
                const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <Card key={lic.id} className="p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-surface-200 flex items-center justify-center text-brand-600 shrink-0">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => onNavigate('license-detail', lic.id)}
                              className="font-bold text-surface-900 hover:text-brand-600 transition-colors text-left block truncate"
                            >
                              {lic.product}
                            </button>
                            <p className="text-caption text-surface-500 truncate">{lic.vendor}</p>
                          </div>
                        </div>

                        <Badge variant={statusStyles[lic.status]?.variant || 'default'} className="text-[11px]">
                          {lic.status}
                        </Badge>
                      </div>

                      {/* Code & Category Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-3.5">
                        <span className="font-mono text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {lic.licenseCode}
                        </span>
                        <Badge variant="neutral" className="text-[11px]">
                          {lic.category}
                        </Badge>
                        <Badge variant="neutral" className="text-[11px]">
                          {lic.type.split(' ')[0]}
                        </Badge>
                      </div>

                      {/* Seats Progress Meter */}
                      <div className="mt-4 pt-3 border-t border-surface-100">
                        <div className="flex items-center justify-between mb-1.5 text-caption">
                          <span className="flex items-center gap-1.5 text-surface-600 font-medium">
                            <Users className="h-3.5 w-3.5 text-surface-400" /> Seats Utilized
                          </span>
                          <span className="font-bold text-surface-900">
                            {lic.seatsUsed} / {lic.seatsPurchased} ({pct}%)
                          </span>
                        </div>
                        <Progress
                          value={lic.seatsUsed}
                          max={lic.seatsPurchased}
                          barClass={pct > 95 ? 'bg-error-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'}
                        />
                      </div>

                      {/* Dates & Cost */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-100 text-caption">
                        <div>
                          <p className="text-surface-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Expiry Date
                          </p>
                          <p className="font-semibold text-surface-800 mt-0.5">{lic.expiryDate}</p>
                          <p className={days <= 30 ? 'text-amber-600 font-medium' : 'text-surface-500'}>
                            {days <= 0 ? 'Expired' : `${days} days left`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-surface-400 flex items-center justify-end gap-1">
                            <DollarSign className="h-3 w-3" /> Annual Cost
                          </p>
                          <p className="font-bold text-surface-900 mt-0.5 text-body-sm">${lic.annualCost.toLocaleString()}</p>
                          <p className="text-surface-500">${lic.costPerSeat}/seat</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center gap-2 mt-5 pt-3 border-t border-surface-100">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => onNavigate('license-detail', lic.id)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAllocateModal(lic)}
                        title="Allocate Seat"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRenewModal(lic)}
                        title="Renew Subscription"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === 'optimization' && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Enterprise SaaS Waste & Cost Optimization Intelligence"
              description="Continuous telemetry scan of employee activity logs, idle seats, duplicate products, and contract true-up risks"
              action={
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => {
                    push({
                      variant: 'success',
                      title: 'Live Telemetry Scanned',
                      message: 'All 10 SaaS integrations updated with latest activity logs.',
                    });
                  }}
                >
                  Run Deep Scan
                </Button>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-caption font-bold text-amber-800 uppercase tracking-wider">
                  Dormant / Inactive Seats
                </span>
                <p className="text-2xl font-bold text-amber-900">24 Seats Detected</p>
                <p className="text-caption text-amber-700">Employees with no login in over 30 days</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-caption font-bold text-emerald-800 uppercase tracking-wider">
                  Annual Recoup Potential
                </span>
                <p className="text-2xl font-bold text-emerald-900">${(totalPotentialSavings / 1000).toFixed(1)}K / yr</p>
                <p className="text-caption text-emerald-700">By releasing unused licenses prior to renewal</p>
              </div>

              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-1">
                <span className="text-caption font-bold text-brand-800 uppercase tracking-wider">
                  License Health Index
                </span>
                <p className="text-2xl font-bold text-brand-900">96.8% Compliant</p>
                <p className="text-caption text-brand-700">0 Over-deployed true-up penalties</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-body font-bold text-surface-900">Recommended Cost Reduction Workflows</h3>

              {licenses
                .filter((l) => l.allocatedSeats.some((s) => s.usageStatus === 'Inactive (>30d)'))
                .map((l) => {
                  const dormantCount = l.allocatedSeats.filter((s) => s.usageStatus === 'Inactive (>30d)').length;
                  const savings = dormantCount * l.costPerSeat;
                  return (
                    <div
                      key={l.id}
                      className="p-4 rounded-xl border border-surface-200 bg-surface-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-surface-900">{l.product}</span>
                          <Badge variant="warning">{dormantCount} Dormant Seats</Badge>
                        </div>
                        <p className="text-caption text-surface-600">
                          Reclaiming {dormantCount} inactive seats from {l.vendor} saves <strong>${savings.toLocaleString()}/yr</strong>.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate('license-detail', l.id)}
                        >
                          Review Users
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            push({
                              variant: 'success',
                              title: 'Reclamation Triggered',
                              message: `Sent seat release prompt for ${l.product}.`,
                            });
                          }}
                        >
                          Reclaim Seats
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: Add New License */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Software License" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Name *" placeholder="e.g. Datadog APM Pro" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} />
            <Input label="Edition / Package Tier" placeholder="e.g. Enterprise Pro" value={newEdition} onChange={(e) => setNewEdition(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Vendor / Publisher *" placeholder="e.g. Datadog Inc." value={newVendor} onChange={(e) => setNewVendor(e.target.value)} />
            <div>
              <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as LicenseCategory)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Productivity & Office">Productivity & Office</option>
                <option value="Developer Tools & IDE">Developer Tools & IDE</option>
                <option value="Design & Creative">Design & Creative</option>
                <option value="Collaboration & Communication">Collaboration & Communication</option>
                <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                <option value="Database & Analytics">Database & Analytics</option>
                <option value="Security & Compliance">Security & Compliance</option>
              </select>
            </div>
            <div>
              <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
                License Model
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as LicenseType)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Subscription (Named User)">Subscription (Named User)</option>
                <option value="Subscription (Floating / Concurrent)">Subscription (Floating)</option>
                <option value="Perpetual License">Perpetual License</option>
                <option value="Volume Enterprise Agreement">Volume Enterprise Agreement</option>
                <option value="Usage / Consumption Based">Usage / Consumption Based</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Total Purchased Seats" type="number" value={newSeatsPurchased} onChange={(e) => setNewSeatsPurchased(e.target.value)} />
            <Input label="Annual Commitment Cost ($)" type="number" value={newAnnualCost} onChange={(e) => setNewAnnualCost(e.target.value)} />
            <Input label="Expiration / Renewal Date" type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Purchase Order Ref (PO)" value={newPoNumber} onChange={(e) => setNewPoNumber(e.target.value)} />
            <Input label="Master License Key / Activation String" placeholder="e.g. DD-PROD-9921-KEY" value={newLicenseKey} onChange={(e) => setNewLicenseKey(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="newAutoRenew"
              checked={newAutoRenew}
              onChange={(e) => setNewAutoRenew(e.target.checked)}
              className="h-4 w-4 text-brand-600 rounded"
            />
            <label htmlFor="newAutoRenew" className="text-body-sm font-medium text-surface-800">
              Enable Automated Renewal Notifications & Watchdog
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddLicense}>
              Register License
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Quick Allocate Seat */}
      <Modal open={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate Software License Seat" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
              Select Software License *
            </label>
            <select
              value={allocateLicenseId}
              onChange={(e) => setAllocateLicenseId(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {licenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.product} ({l.seatsPurchased - l.seatsUsed} seats available) - ${l.costPerSeat}/seat
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption font-semibold text-surface-700 uppercase tracking-wider mb-1.5">
              Select Employee Recipient *
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
              Link with Hardware Asset (Optional)
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
              Role / Permission
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

          <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
            <Button variant="outline" size="sm" onClick={() => setIsAllocateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitAllocate}>
              Confirm Allocation
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Renew Contract */}
      <Modal open={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Software Subscription" size="md">
        <div className="space-y-4">
          {selectedLicenseForModal && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-body-sm text-brand-800">
              Contract renewal workflow for <strong>{selectedLicenseForModal.product}</strong> ({selectedLicenseForModal.vendor}).
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-4">
            <Input label="Seat Capacity" type="number" value={renewSeats} onChange={(e) => setRenewSeats(e.target.value)} />
            <Input label="Total Annual Cost ($)" type="number" value={renewCost} onChange={(e) => setRenewCost(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
            <Button variant="outline" size="sm" onClick={() => setIsRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitRenew}>
              Submit Renewal
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: AI SaaS Optimization Summary */}
      <Modal open={isOptimizeModalOpen} onClose={() => setIsOptimizeModalOpen(false)} title="AI SaaS Cost & Seat Optimization Scan" size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <h4 className="font-bold text-emerald-900">Total Optimization Potential: $8,400 / Year</h4>
            <p className="text-body-sm text-emerald-800">
              AI analysis identified 24 inactive user seats across Microsoft 365, JetBrains, Figma, and Zoom.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border border-surface-200 bg-surface-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-surface-900 text-body-sm">JetBrains All Products Pack (Expiring in 16 days)</p>
                <p className="text-caption text-surface-500">6 inactive developer seats detected ($1,440/yr savings if downsized)</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOptimizeModalOpen(false);
                  onNavigate('license-detail', 'l2');
                }}
              >
                Inspect l2
              </Button>
            </div>

            <div className="p-3.5 rounded-lg border border-surface-200 bg-surface-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-surface-900 text-body-sm">Figma Organization</p>
                <p className="text-caption text-surface-500">5 viewers assigned full Editor seats ($3,000/yr savings if converted to Dev/Viewer)</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOptimizeModalOpen(false);
                  onNavigate('license-detail', 'l4');
                }}
              >
                Inspect l4
              </Button>
            </div>

            <div className="p-3.5 rounded-lg border border-surface-200 bg-surface-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-surface-900 text-body-sm">Oracle Database 19c (Expired Maintenance)</p>
                <p className="text-caption text-surface-500">Core server license expired. True-up audit required to maintain support SLA.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOptimizeModalOpen(false);
                  onNavigate('license-detail', 'l8');
                }}
              >
                Inspect l8
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-surface-100">
            <Button variant="primary" size="sm" onClick={() => setIsOptimizeModalOpen(false)}>
              Close Optimizer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
