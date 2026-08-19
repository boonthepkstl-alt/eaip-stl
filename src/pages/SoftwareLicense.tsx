import { useEffect, useState } from 'react';
import {
  Plus, KeyRound, Calendar, Users, DollarSign, AlertTriangle, RefreshCw,
  Filter, Sparkles, Shield, Briefcase, Code, Palette, Globe,
  Database, Cpu, ChevronRight, UserPlus, Download, List, LayoutGrid, Zap, X,
} from 'lucide-react';
import {
  Card, CardHeader, Button, Badge, Progress, useToast, EmptyState, Modal, Input,
  Select, Drawer, Avatar,
} from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { organizationAPI } from '@/services/organization';
import { reportAPI } from '@/services/report';
import type { ReportColumn } from '@/types/report';
import type { Employee } from '@/types/organization';
import { cn } from '@/lib/cn';

interface SoftwareLicenseProps {
  onNavigate: (id: string) => void;
}

// ============================================================================================
// MOCKUP ONLY — 2026-08-18
//
// Software License management is out of MVP scope (docs/01-requirements/PROJECT_CONTEXT.md),
// and this page's core content — annual spend, cost-per-seat, "High Spend" filtering, a savings
// scanner — is also Financial data, itself separately excluded from MVP (see types/asset.ts
// header comment on the same exclusion for assets). The user explicitly asked to port
// esaps_ai_gemini-main/src/pages/SoftwareLicense.tsx's UI "ให้เหมือนต้นฉบับ" and, after being
// shown that conflict, chose to include the $ figures in full rather than strip them.
//
// There is no license service/data model behind any of this — everything below is local
// component state seeded once on mount (using real employee names for seat rosters, same
// pattern as pages/CheckInCheckOut.tsx), never persisted. Every action handler shows an honest
// toast instead of pretending to call a real API. Gemini's separate "license-detail" page/route
// was intentionally folded into an in-page Drawer here instead of a new route, to avoid standing
// up more URL surface for a feature that isn't real; its "Change Asset"-style hardware-binding
// section was dropped for the same low-value-nested-flow reason "Change Asset"/"Change Requester"
// were dropped from pages/TicketDetail.tsx.
// ============================================================================================

type LicenseCategory =
  | 'Productivity & Office'
  | 'Developer Tools & IDE'
  | 'Design & Creative'
  | 'Collaboration & Communication'
  | 'Cloud & Infrastructure'
  | 'Database & Analytics'
  | 'Security & Compliance';

type LicenseModel =
  | 'Subscription (Named User)'
  | 'Subscription (Floating / Concurrent)'
  | 'Perpetual License'
  | 'Volume Enterprise Agreement'
  | 'Usage / Consumption Based';

type LicenseStatus = 'Active' | 'Expiring Soon' | 'Expired';
type ComplianceStatus = 'Compliant' | 'Audit Warning' | 'True-Up Required' | 'Optimized';
type UsageStatus = 'Daily Active' | 'Regular Active' | 'Low Usage' | 'Inactive (>30d)';
type SeatRole = 'Admin' | 'Standard User' | 'Read Only' | 'Developer';

interface AllocatedSeat {
  id: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  allocatedDate: string;
  usageStatus: UsageStatus;
  role: SeatRole;
}

interface LicenseHistoryEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  actor: string;
  badge?: string;
}

interface SoftwareLicense {
  id: string;
  licenseCode: string;
  product: string;
  edition: string;
  vendor: string;
  category: LicenseCategory;
  type: LicenseModel;
  status: LicenseStatus;
  complianceStatus: ComplianceStatus;
  seatsPurchased: number;
  seatsUsed: number;
  annualCost: number;
  costPerSeat: number;
  billingFrequency: 'Monthly' | 'Annual' | 'Multi-Year';
  poNumber: string;
  contractNumber: string;
  costCenter: string;
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  supportTier: string;
  licenseKey: string;
  activationMethod: 'SSO / SAML 2.0' | 'License Key' | 'License Server / Daemon' | 'Cloud Portal';
  description: string;
  allocatedSeats: AllocatedSeat[];
  history: LicenseHistoryEvent[];
}

const CATEGORY_ICONS: Record<LicenseCategory, typeof Briefcase> = {
  'Productivity & Office': Briefcase,
  'Developer Tools & IDE': Code,
  'Design & Creative': Palette,
  'Collaboration & Communication': Globe,
  'Cloud & Infrastructure': Cpu,
  'Database & Analytics': Database,
  'Security & Compliance': Shield,
};

const STATUS_VARIANT: Record<LicenseStatus, 'success' | 'warning' | 'error'> = {
  Active: 'success',
  'Expiring Soon': 'warning',
  Expired: 'error',
};

const COMPLIANCE_VARIANT: Record<ComplianceStatus, 'success' | 'warning' | 'error' | 'accent'> = {
  Compliant: 'success',
  'Audit Warning': 'warning',
  'True-Up Required': 'error',
  Optimized: 'accent',
};

const TODAY = new Date('2026-08-18');

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

// MOCKUP ONLY — seeds a fixed license ledger referencing real employee names for seat rosters
// (unlike Gemini, which fakes employees too); nothing here is persisted or backed by a service.
function buildSeedLicenses(employees: Employee[]): SoftwareLicense[] {
  const e = (i: number) => employees[i % employees.length];
  const seat = (id: string, idx: number, role: SeatRole, usage: UsageStatus, allocatedDate: string): AllocatedSeat => {
    const emp = e(idx);
    return { id, employeeName: emp?.name ?? `Employee ${idx}`, department: emp?.department ?? '—', jobTitle: emp?.positionTitle ?? '—', allocatedDate, usageStatus: usage, role };
  };

  return [
    {
      id: 'l1', licenseCode: 'LIC-MSFT-365', product: 'Microsoft 365 Enterprise', edition: 'E5 Suite (Full Cloud Security + Teams)', vendor: 'Microsoft Corporation',
      category: 'Productivity & Office', type: 'Subscription (Named User)', status: 'Active', complianceStatus: 'Compliant',
      seatsPurchased: 20, seatsUsed: 16, annualCost: 11400, costPerSeat: 570, billingFrequency: 'Annual',
      poNumber: 'PO-2025-MSFT-091', contractNumber: 'MS-EA-2025-7892', costCenter: 'CC-IT-GLOBAL',
      startDate: '2025-01-01', expiryDate: '2027-01-01', autoRenew: true, supportTier: 'Premier Enterprise 24/7 SLA',
      licenseKey: 'MS365-E5-ENT-8849-XKLA-9921-PROD', activationMethod: 'SSO / SAML 2.0',
      description: 'Enterprise productivity suite with advanced threat protection, eDiscovery, cloud voice, and Copilot.',
      allocatedSeats: [seat('s1', 0, 'Standard User', 'Daily Active', '2024-01-16'), seat('s2', 1, 'Standard User', 'Daily Active', '2024-03-23'), seat('s3', 2, 'Admin', 'Daily Active', '2023-03-01'), seat('s4', 3, 'Standard User', 'Inactive (>30d)', '2023-10-15')],
      history: [{ id: 'h1', date: '2025-01-01', title: '2-Year Enterprise Agreement Renewed', description: 'Renewed Microsoft 365 E5 with discounted tier rates.', actor: 'Procurement Department', badge: 'Contract' }],
    },
    {
      id: 'l2', licenseCode: 'LIC-JETB-ALL', product: 'JetBrains All Products Pack', edition: 'Enterprise Commercial Subscription', vendor: 'JetBrains s.r.o.',
      category: 'Developer Tools & IDE', type: 'Subscription (Named User)', status: 'Expiring Soon', complianceStatus: 'Compliant',
      seatsPurchased: 10, seatsUsed: 9, annualCost: 2400, costPerSeat: 240, billingFrequency: 'Annual',
      poNumber: 'PO-2025-JB-004', contractNumber: 'JB-CORP-91023', costCenter: 'DEPT-ENG',
      startDate: '2025-09-01', expiryDate: '2026-09-01', autoRenew: false, supportTier: 'Standard Commercial Business Support',
      licenseKey: 'JB-APP-ENT-2025-9941-KKL8-DEV', activationMethod: 'License Server / Daemon',
      description: 'Complete suite of IDEs including IntelliJ IDEA Ultimate, WebStorm, PyCharm, and DataGrip.',
      allocatedSeats: [seat('s5', 0, 'Developer', 'Daily Active', '2024-01-16'), seat('s6', 4, 'Developer', 'Daily Active', '2023-10-15'), seat('s7', 5, 'Developer', 'Inactive (>30d)', '2024-06-01')],
      history: [{ id: 'h2', date: '2026-08-03', title: 'Renewal Notice Triggered', description: 'License expires in 29 days. Renewal PO draft pending approval.', actor: 'Automated Lifecycle Service', badge: 'Warning' }],
    },
    {
      id: 'l3', licenseCode: 'LIC-ADBE-CC', product: 'Adobe Creative Cloud', edition: 'All Apps for Enterprise', vendor: 'Adobe Systems Inc.',
      category: 'Design & Creative', type: 'Subscription (Named User)', status: 'Active', complianceStatus: 'Compliant',
      seatsPurchased: 6, seatsUsed: 5, annualCost: 2160, costPerSeat: 360, billingFrequency: 'Annual',
      poNumber: 'PO-2025-ADBE-022', contractNumber: 'AD-ENT-2024-5510', costCenter: 'DEPT-DSN',
      startDate: '2024-11-15', expiryDate: '2026-11-15', autoRenew: true, supportTier: 'Enterprise VIP Dedicated Support',
      licenseKey: 'ADOBE-CC-ENT-9941-K782-DES', activationMethod: 'SSO / SAML 2.0',
      description: 'Complete creative suite: Photoshop, Illustrator, After Effects, Premiere Pro, and InDesign.',
      allocatedSeats: [seat('s8', 2, 'Standard User', 'Regular Active', '2024-05-20')],
      history: [],
    },
    {
      id: 'l4', licenseCode: 'LIC-FIGMA-ORG', product: 'Figma Organization', edition: 'Enterprise Workspace Tier', vendor: 'Figma Inc.',
      category: 'Design & Creative', type: 'Subscription (Named User)', status: 'Active', complianceStatus: 'Optimized',
      seatsPurchased: 8, seatsUsed: 6, annualCost: 4800, costPerSeat: 600, billingFrequency: 'Annual',
      poNumber: 'PO-2025-FIGMA-081', contractNumber: 'FIG-ORG-2025-1109', costCenter: 'DEPT-DSN',
      startDate: '2025-02-01', expiryDate: '2027-02-01', autoRenew: true, supportTier: 'Priority CSM & Enterprise SLA',
      licenseKey: 'FIGMA-ORG-TOKEN-9921-KLAS', activationMethod: 'SSO / SAML 2.0',
      description: 'Collaborative interface design platform with design systems, branching, and Dev Mode.',
      allocatedSeats: [seat('s9', 0, 'Developer', 'Daily Active', '2024-01-16'), seat('s10', 2, 'Admin', 'Daily Active', '2024-05-20'), seat('s11', 6, 'Standard User', 'Inactive (>30d)', '2024-02-10')],
      history: [],
    },
    {
      id: 'l5', licenseCode: 'LIC-SLACK-PLUS', product: 'Slack Business+', edition: 'Business Plus Enterprise Grid Ready', vendor: 'Salesforce / Slack Technologies',
      category: 'Collaboration & Communication', type: 'Subscription (Named User)', status: 'Active', complianceStatus: 'Compliant',
      seatsPurchased: 20, seatsUsed: 19, annualCost: 7200, costPerSeat: 360, billingFrequency: 'Annual',
      poNumber: 'PO-2024-SLACK-112', contractNumber: 'SLK-BUS-2024-0992', costCenter: 'CC-IT-GLOBAL',
      startDate: '2024-12-01', expiryDate: '2026-12-01', autoRenew: true, supportTier: '24/7 Support with 4hr response SLA',
      licenseKey: 'SLACK-ENT-WORKSPACE-CORP-RAISE', activationMethod: 'SSO / SAML 2.0',
      description: 'Core organizational communication channel with workflow builder and Slack Connect.',
      allocatedSeats: [],
      history: [],
    },
    {
      id: 'l6', licenseCode: 'LIC-GH-ENT', product: 'GitHub Enterprise Cloud', edition: 'Enterprise Cloud + Advanced Security + Copilot', vendor: 'GitHub / Microsoft',
      category: 'Developer Tools & IDE', type: 'Subscription (Named User)', status: 'Expiring Soon', complianceStatus: 'Audit Warning',
      seatsPurchased: 12, seatsUsed: 12, annualCost: 4320, costPerSeat: 360, billingFrequency: 'Annual',
      poNumber: 'PO-2024-GH-088', contractNumber: 'GH-ENT-2024-8831', costCenter: 'DEPT-ENG',
      startDate: '2024-08-01', expiryDate: '2026-08-30', autoRenew: false, supportTier: 'GitHub Premium Support 24/7',
      licenseKey: 'GH-ENT-CLOUD-8891-KLAK-2026', activationMethod: 'SSO / SAML 2.0',
      description: 'Enterprise source repository management, CI/CD actions, and Dependabot security scanning.',
      allocatedSeats: [seat('s12', 0, 'Admin', 'Daily Active', '2024-01-16'), seat('s13', 4, 'Admin', 'Daily Active', '2023-10-15')],
      history: [],
    },
    {
      id: 'l7', licenseCode: 'LIC-ZOOM-PRO', product: 'Zoom Phone & Meetings Pro', edition: 'Enterprise Unlimited Package', vendor: 'Zoom Video Communications',
      category: 'Collaboration & Communication', type: 'Subscription (Named User)', status: 'Active', complianceStatus: 'Compliant',
      seatsPurchased: 20, seatsUsed: 15, annualCost: 3600, costPerSeat: 180, billingFrequency: 'Annual',
      poNumber: 'PO-2025-ZM-031', contractNumber: 'ZM-PRO-2025-4491', costCenter: 'CC-IT-GLOBAL',
      startDate: '2025-03-01', expiryDate: '2027-03-01', autoRenew: true, supportTier: 'Enterprise Premier Support',
      licenseKey: 'ZOOM-PRO-ENT-9941-KEY', activationMethod: 'SSO / SAML 2.0',
      description: 'Enterprise video conferencing, cloud PBX VoIP phone system, and AI meeting summary.',
      allocatedSeats: [],
      history: [],
    },
    {
      id: 'l8', licenseCode: 'LIC-ORCL-19C', product: 'Oracle Database 19c Enterprise Edition', edition: 'Processor Core Licensing + RAC', vendor: 'Oracle Corporation',
      category: 'Database & Analytics', type: 'Perpetual License', status: 'Expired', complianceStatus: 'True-Up Required',
      seatsPurchased: 4, seatsUsed: 4, annualCost: 48000, costPerSeat: 12000, billingFrequency: 'Annual',
      poNumber: 'PO-2021-ORCL-001', contractNumber: 'ORCL-PERP-88102-TH', costCenter: 'DEPT-ITO',
      startDate: '2021-06-01', expiryDate: '2025-06-01', autoRenew: false, supportTier: 'Software Update License & Support (SULS)',
      licenseKey: 'ORCL-DB19C-RAC-8821-CORE-8P', activationMethod: 'License Key',
      description: 'High-availability relational database server for core ERP and fixed-asset ledger reconciliation.',
      allocatedSeats: [seat('s14', 3, 'Admin', 'Daily Active', '2022-11-05')],
      history: [],
    },
    {
      id: 'l9', licenseCode: 'LIC-CRWD-STK', product: 'CrowdStrike Falcon Enterprise', edition: 'Endpoint Protection + EDR + Threat Intel', vendor: 'CrowdStrike Inc.',
      category: 'Security & Compliance', type: 'Subscription (Named User)', status: 'Active', complianceStatus: 'Compliant',
      seatsPurchased: 20, seatsUsed: 18, annualCost: 1860, costPerSeat: 93, billingFrequency: 'Annual',
      poNumber: 'PO-2025-CRWD-102', contractNumber: 'CRWD-CORP-2025-99', costCenter: 'DEPT-ITO',
      startDate: '2025-04-01', expiryDate: '2027-04-01', autoRenew: true, supportTier: 'Falcon Complete Managed Threat Hunting',
      licenseKey: 'CRWD-CID-CC9182910-KKL819-CORP', activationMethod: 'Cloud Portal',
      description: 'Next-gen antivirus, endpoint detection and response (EDR), and real-time cyber defense sensor.',
      allocatedSeats: [],
      history: [],
    },
  ];
}

export function SoftwareLicensePage({ onNavigate }: SoftwareLicenseProps) {
  void onNavigate;
  const { push } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    organizationAPI.listEmployees()
      .then((employeeResult) => {
        if (cancelled) return;
        setEmployees(employeeResult);
        setLicenses(buildSeedLicenses(employeeResult));
      })
      .catch((err) => push({ variant: 'error', title: 'Could not load reference data', message: err instanceof Error ? err.message : String(err) }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'optimization'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeChip, setActiveChip] = useState('all');

  const [selectedLicense, setSelectedLicense] = useState<SoftwareLicense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

  const [newProduct, setNewProduct] = useState('');
  const [newEdition, setNewEdition] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newCategory, setNewCategory] = useState<LicenseCategory>('Productivity & Office');
  const [newType, setNewType] = useState<LicenseModel>('Subscription (Named User)');
  const [newSeatsPurchased, setNewSeatsPurchased] = useState('10');
  const [newAnnualCost, setNewAnnualCost] = useState('5000');
  const [newExpiryDate, setNewExpiryDate] = useState('2027-08-30');

  const [allocateLicenseId, setAllocateLicenseId] = useState('');
  const [allocateEmployeeId, setAllocateEmployeeId] = useState('');
  const [allocateRole, setAllocateRole] = useState<SeatRole>('Standard User');

  const [renewYears, setRenewYears] = useState('1');
  const [renewSeats, setRenewSeats] = useState('');
  const [renewCost, setRenewCost] = useState('');

  const totalSpend = licenses.reduce((sum, l) => sum + l.annualCost, 0);
  const expiringCount = licenses.filter((l) => l.status === 'Expiring Soon').length;
  const totalSeatsPurchased = licenses.reduce((sum, l) => sum + l.seatsPurchased, 0);
  const totalSeatsUsed = licenses.reduce((sum, l) => sum + l.seatsUsed, 0);
  const overallUtilizationPct = totalSeatsPurchased > 0 ? Math.round((totalSeatsUsed / totalSeatsPurchased) * 100) : 0;

  const dormantSeatsByLicense = licenses.map((l) => ({ license: l, dormant: l.allocatedSeats.filter((s) => s.usageStatus === 'Inactive (>30d)') })).filter((x) => x.dormant.length > 0);
  const totalDormantSeats = dormantSeatsByLicense.reduce((sum, x) => sum + x.dormant.length, 0);
  const totalPotentialSavings = dormantSeatsByLicense.reduce((sum, x) => sum + x.dormant.length * x.license.costPerSeat, 0);
  const compliantCount = licenses.filter((l) => l.complianceStatus === 'Compliant' || l.complianceStatus === 'Optimized').length;
  const healthIndexPct = licenses.length > 0 ? Math.round((compliantCount / licenses.length) * 100) : 100;

  const uniqueCategories = Array.from(new Set(licenses.map((l) => l.category)));

  const filteredLicenses = licenses.filter((l) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || l.product.toLowerCase().includes(q) || l.vendor.toLowerCase().includes(q) || l.licenseCode.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (activeChip === 'expiring') return l.status === 'Expiring Soon' || l.status === 'Expired';
    if (activeChip === 'high-spend') return l.annualCost >= 5000;
    if (activeChip === 'dev-tools') return l.category === 'Developer Tools & IDE';
    if (activeChip === 'office') return l.category === 'Productivity & Office' || l.category === 'Collaboration & Communication';
    if (activeChip === 'creative') return l.category === 'Design & Creative';
    if (activeChip === 'risk') return l.complianceStatus === 'Audit Warning' || l.complianceStatus === 'True-Up Required';
    return true;
  });

  const resetFilters = () => {
    setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); setActiveChip('all');
  };

  const openAddModal = () => {
    setNewProduct(''); setNewEdition(''); setNewVendor('');
    setNewCategory('Productivity & Office'); setNewType('Subscription (Named User)');
    setNewSeatsPurchased('10'); setNewAnnualCost('5000'); setNewExpiryDate('2027-08-30');
    setIsAddModalOpen(true);
  };

  const handleAddLicense = () => {
    if (!newProduct.trim() || !newVendor.trim()) {
      push({ variant: 'warning', title: 'Missing required fields', message: 'Please provide at least a Product Name and Vendor.' });
      return;
    }
    const purchased = parseInt(newSeatsPurchased, 10) || 10;
    const cost = parseFloat(newAnnualCost) || 5000;
    const code = `LIC-${newVendor.slice(0, 4).toUpperCase()}-${(licenses.length + 1).toString().padStart(3, '0')}`;
    const newLicense: SoftwareLicense = {
      id: `lic-${Date.now()}`, licenseCode: code, product: newProduct, edition: newEdition || 'Standard Enterprise', vendor: newVendor,
      category: newCategory, type: newType, status: 'Active', complianceStatus: 'Compliant',
      seatsPurchased: purchased, seatsUsed: 0, annualCost: cost, costPerSeat: Math.round(cost / purchased), billingFrequency: 'Annual',
      poNumber: `PO-2026-${Date.now().toString().slice(-4)}`, contractNumber: `CT-${Date.now().toString().slice(-6)}`, costCenter: 'CC-IT-GLOBAL',
      startDate: new Date().toISOString().split('T')[0], expiryDate: newExpiryDate, autoRenew: true, supportTier: 'Standard Business Support',
      licenseKey: `${code}-KEY-AUTO-GENERATED`, activationMethod: 'SSO / SAML 2.0',
      description: `${newProduct} subscription registered in the software asset ledger.`,
      allocatedSeats: [], history: [{ id: `h-${Date.now()}`, date: new Date().toISOString().split('T')[0], title: 'License Registered in System', description: `Registered ${newProduct} (${code}) with ${purchased} seats.`, actor: 'Current Admin', badge: 'New' }],
    };
    setLicenses((prev) => [newLicense, ...prev]);
    setIsAddModalOpen(false);
    push({ variant: 'success', title: 'License registered (mockup)', message: `${newLicense.product} (${code}) added — UI mockup only, not a real ledger entry.` });
  };

  const openAllocateModal = (lic?: SoftwareLicense) => {
    setAllocateLicenseId((lic ?? licenses[0])?.id ?? '');
    setAllocateEmployeeId(employees[0]?.id ?? '');
    setAllocateRole('Standard User');
    setIsAllocateModalOpen(true);
  };

  const handleSubmitAllocate = () => {
    const target = licenses.find((l) => l.id === allocateLicenseId);
    const employee = employees.find((e) => e.id === allocateEmployeeId);
    if (!target || !employee) return;
    if (target.seatsUsed >= target.seatsPurchased) {
      push({ variant: 'warning', title: 'Seat limit reached', message: `${target.product} has no remaining seats.` });
      return;
    }
    const newSeat: AllocatedSeat = { id: `seat-${Date.now()}`, employeeName: employee.name, department: employee.department, jobTitle: employee.positionTitle ?? '—', allocatedDate: new Date().toISOString().split('T')[0], usageStatus: 'Daily Active', role: allocateRole };
    setLicenses((prev) => prev.map((l) => l.id === target.id ? {
      ...l, seatsUsed: l.seatsUsed + 1, allocatedSeats: [newSeat, ...l.allocatedSeats],
      history: [{ id: `h-${Date.now()}`, date: new Date().toISOString().split('T')[0], title: `Seat Allocated to ${employee.name}`, description: `Assigned seat for ${l.product} to ${employee.name}.`, actor: 'Current Admin', badge: 'Seat +1' }, ...l.history],
    } : l));
    setIsAllocateModalOpen(false);
    push({ variant: 'success', title: 'Seat allocated (mockup)', message: `Allocated ${target.product} to ${employee.name} — UI mockup only.` });
  };

  const openRenewModal = (lic: SoftwareLicense) => {
    setSelectedLicense(lic);
    setRenewYears('1');
    setRenewSeats(lic.seatsPurchased.toString());
    setRenewCost(lic.annualCost.toString());
    setIsRenewModalOpen(true);
  };

  const handleSubmitRenew = () => {
    if (!selectedLicense) return;
    const addedYears = parseInt(renewYears, 10) || 1;
    const nextExpiry = new Date(selectedLicense.expiryDate);
    nextExpiry.setFullYear(nextExpiry.getFullYear() + addedYears);
    const nextExpiryStr = nextExpiry.toISOString().split('T')[0];
    const seats = parseInt(renewSeats, 10) || selectedLicense.seatsPurchased;
    const cost = parseFloat(renewCost) || selectedLicense.annualCost;
    setLicenses((prev) => prev.map((l) => l.id === selectedLicense.id ? {
      ...l, expiryDate: nextExpiryStr, seatsPurchased: seats, annualCost: cost, costPerSeat: Math.round(cost / seats), status: 'Active',
      history: [{ id: `h-${Date.now()}`, date: new Date().toISOString().split('T')[0], title: `${addedYears}-Year Subscription Renewed`, description: `Renewed through ${nextExpiryStr}. Capacity: ${seats} seats, Cost: $${cost.toLocaleString()}.`, actor: 'Current Admin', badge: 'Renewed' }, ...l.history],
    } : l));
    setIsRenewModalOpen(false);
    push({ variant: 'success', title: 'Contract renewed (mockup)', message: `${selectedLicense.product} renewed through ${nextExpiryStr} — UI mockup only.` });
  };

  const openDetail = (lic: SoftwareLicense) => { setSelectedLicense(lic); setIsDetailOpen(true); };

  const columns: Column<SoftwareLicense>[] = [
    {
      key: 'product', header: 'Product & Package', sortable: true, sortValue: (r) => r.product,
      render: (r) => {
        const Icon = CATEGORY_ICONS[r.category] ?? KeyRound;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-surface-200 flex items-center justify-center text-brand-600 shrink-0 shadow-xs"><Icon className="h-5 w-5" /></div>
            <div className="min-w-0">
              <button onClick={() => openDetail(r)} className="font-bold text-surface-900 hover:text-brand-600 transition-colors text-left block truncate max-w-[220px]">{r.product}</button>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-caption font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded">{r.licenseCode}</span>
                <span className="text-caption text-surface-500 truncate max-w-[140px]">{r.vendor}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    { key: 'category', header: 'Category & Model', render: (r) => (
      <div><span className="text-surface-800 font-medium block">{r.category}</span><span className="text-caption text-surface-500 font-mono">{r.type}</span></div>
    ) },
    { key: 'seatsUsed', header: 'Seat Utilization', sortable: true, sortValue: (r) => r.seatsUsed / r.seatsPurchased, render: (r) => {
      const pct = Math.round((r.seatsUsed / r.seatsPurchased) * 100);
      return (
        <div className="w-40 space-y-1">
          <div className="flex justify-between text-caption font-medium">
            <span className="text-surface-900 font-bold">{r.seatsUsed} / {r.seatsPurchased}</span>
            <span className={pct > 95 ? 'text-error-600 font-bold' : pct > 80 ? 'text-amber-600 font-bold' : 'text-surface-600'}>{pct}%</span>
          </div>
          <Progress value={r.seatsUsed} max={r.seatsPurchased} barClass={pct > 95 ? 'bg-error-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'} />
        </div>
      );
    } },
    { key: 'annualCost', header: 'Financials', sortable: true, sortValue: (r) => r.annualCost, render: (r) => (
      <div><span className="font-bold text-surface-900 block">${r.annualCost.toLocaleString()}/yr</span><span className="text-caption text-surface-500">${r.costPerSeat} / seat</span></div>
    ) },
    { key: 'expiryDate', header: 'Renewal Date', sortable: true, sortValue: (r) => r.expiryDate, render: (r) => {
      const days = daysUntil(r.expiryDate);
      return (
        <div>
          <span className="text-surface-900 font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-surface-400" />{r.expiryDate}</span>
          <span className={cn('text-[11px] font-medium block', days <= 0 ? 'text-error-600 font-bold' : days <= 30 ? 'text-amber-600 font-semibold' : 'text-surface-500')}>{days <= 0 ? 'Expired' : `${days} days left`}</span>
        </div>
      );
    } },
    { key: 'status', header: 'Status & Compliance', render: (r) => (
      <div className="space-y-1">
        <Badge variant={STATUS_VARIANT[r.status]} dot>{r.status}</Badge>
        <div className="text-[11px] text-surface-500 font-medium">{r.complianceStatus}</div>
      </div>
    ) },
  ];

  const rowActions = (row: SoftwareLicense) => [
    { label: 'View Details', icon: <ChevronRight className="h-4 w-4" />, onClick: () => openDetail(row) },
    { label: 'Allocate Seat', icon: <UserPlus className="h-4 w-4" />, onClick: () => openAllocateModal(row) },
    { label: 'Renew Contract', icon: <RefreshCw className="h-4 w-4" />, onClick: () => openRenewModal(row) },
  ];

  // Reuses reportAPI.exportCsv (services/report.ts) instead of hand-rolling CSV construction —
  // that helper already escapes embedded commas/quotes/newlines correctly (doubling any `"`),
  // which a manual `"${value}"` wrap does not.
  const licenseCsvColumns: ReportColumn<SoftwareLicense>[] = [
    { key: 'licenseCode', label: 'License Code', render: (l) => l.licenseCode },
    { key: 'product', label: 'Product', render: (l) => l.product },
    { key: 'vendor', label: 'Vendor', render: (l) => l.vendor },
    { key: 'category', label: 'Category', render: (l) => l.category },
    { key: 'seatsUsed', label: 'Seats Used', render: (l) => String(l.seatsUsed) },
    { key: 'seatsPurchased', label: 'Seats Total', render: (l) => String(l.seatsPurchased) },
    { key: 'annualCost', label: 'Annual Cost', render: (l) => String(l.annualCost) },
    { key: 'expiryDate', label: 'Expiry Date', render: (l) => l.expiryDate },
    { key: 'status', label: 'Status', render: (l) => l.status },
  ];

  const handleExportCsv = () => {
    reportAPI.exportCsv(filteredLicenses, licenseCsvColumns, `RAISE_Software_Licenses_${new Date().toISOString().split('T')[0]}.csv`);
    push({ variant: 'success', title: 'License ledger exported (mockup)', message: 'CSV file has been generated and downloaded.' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-body text-surface-500">{loading ? 'Loading…' : `${filteredLicenses.length} of ${licenses.length} software licenses`}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Sparkles className="h-4 w-4 text-accent-600" />} onClick={() => setIsOptimizeModalOpen(true)}>AI SaaS Optimization</Button>
          <Button variant="outline" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => openAllocateModal()}>Allocate Seat</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportCsv}>Export CSV</Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openAddModal}>Add License</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center shrink-0"><DollarSign className="h-6 w-6" /></div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Total Annual Spend</p>
              <p className="text-title font-bold text-surface-900">{loading ? '…' : `$${(totalSpend / 1000).toFixed(1)}K / yr`}</p>
              <p className="text-caption text-surface-500">{licenses.length} active enterprise contracts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Seat Utilization</p>
              <p className="text-title font-bold text-surface-900">{loading ? '…' : <>{totalSeatsUsed} <span className="text-body font-normal text-surface-500">/ {totalSeatsPurchased}</span></>}</p>
              <p className="text-caption text-brand-600 font-medium">{overallUtilizationPct}% organization-wide</p>
            </div>
          </div>
        </Card>
        <div className={cn('card-base p-4 cursor-pointer transition-shadow hover:shadow-xs', expiringCount > 0 ? 'bg-amber-50/40 border-amber-200' : '')} onClick={() => setActiveChip(activeChip === 'expiring' ? 'all' : 'expiring')}>
          <div className="flex items-center gap-3">
            <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', expiringCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-surface-100 text-surface-600')}><AlertTriangle className="h-6 w-6" /></div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Upcoming Renewals</p>
              <p className="text-title font-bold text-surface-900">{expiringCount} Contracts</p>
              <p className="text-caption text-amber-700 font-medium">Expiring soon</p>
            </div>
          </div>
        </div>
        <div className="card-base p-4 cursor-pointer hover:shadow-xs" onClick={() => setIsOptimizeModalOpen(true)}>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Sparkles className="h-6 w-6" /></div>
            <div>
              <p className="text-caption font-semibold text-surface-500 uppercase tracking-wider">Potential SaaS Savings</p>
              <p className="text-title font-bold text-emerald-900">${(totalPotentialSavings / 1000).toFixed(1)}K / yr</p>
              <p className="text-caption text-emerald-700 font-medium">From dormant seats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + view toggle + filter chips */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <Input placeholder="Search by product, vendor, or license code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
            <div className="flex items-center gap-1.5 p-1 bg-surface-100 rounded-lg shrink-0">
              <button onClick={() => setViewMode('table')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium transition-colors', viewMode === 'table' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900')}><List className="h-4 w-4" />Table Ledger</button>
              <button onClick={() => setViewMode('grid')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium transition-colors', viewMode === 'grid' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900')}><LayoutGrid className="h-4 w-4" />Card Grid</button>
              <button onClick={() => setViewMode('optimization')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium transition-colors', viewMode === 'optimization' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-surface-600 hover:text-surface-900')}><Zap className="h-4 w-4 text-emerald-600" />Waste Scanner</button>
            </div>
            <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>Filters</Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-surface-100">
              <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[{ value: 'all', label: 'All Categories' }, ...uniqueCategories.map((c) => ({ value: c, label: c }))]} />
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Expiring Soon', label: 'Expiring Soon' },
                { value: 'Expired', label: 'Expired' },
              ]} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100">
            <span className="text-caption font-semibold text-surface-500 flex items-center gap-1 mr-1"><Filter className="h-3.5 w-3.5" /> Filter:</span>
            {([
              ['all', `All Licenses (${licenses.length})`, 'bg-surface-900 text-white', 'bg-surface-100 text-surface-600 hover:bg-surface-200'],
              ['expiring', `Expiring Soon (${expiringCount})`, 'bg-amber-600 text-white', 'bg-amber-50 text-amber-800 hover:bg-amber-100'],
              ['high-spend', 'High Spend ($5K+)', 'bg-accent-600 text-white', 'bg-surface-100 text-surface-600 hover:bg-surface-200'],
              ['dev-tools', 'Developer Tools', 'bg-brand-600 text-white', 'bg-surface-100 text-surface-600 hover:bg-surface-200'],
              ['office', 'Office & Collab', 'bg-brand-600 text-white', 'bg-surface-100 text-surface-600 hover:bg-surface-200'],
              ['creative', 'Creative & Design', 'bg-brand-600 text-white', 'bg-surface-100 text-surface-600 hover:bg-surface-200'],
              ['risk', 'Audit / True-up Risk', 'bg-error-600 text-white', 'bg-error-50 text-error-800 hover:bg-error-100'],
            ] as [string, string, string, string][]).map(([key, label, activeClass, inactiveClass]) => (
              <button key={key} onClick={() => setActiveChip(key)} className={cn('px-2.5 py-1 rounded-md text-caption font-medium transition-colors', activeChip === key ? activeClass : inactiveClass)}>{label}</button>
            ))}
            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || activeChip !== 'all') && (
              <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={resetFilters}>Clear</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main views */}
      {viewMode === 'table' && (
        <DataTable
          columns={columns}
          data={filteredLicenses}
          loading={loading}
          rowActions={rowActions}
          onRowClick={openDetail}
          emptyTitle="No software licenses found"
          emptyDescription="No licenses match your current filter parameters."
          emptyAction={<Button variant="outline" size="sm" onClick={resetFilters}>Clear Filters</Button>}
        />
      )}

      {viewMode === 'grid' && (
        filteredLicenses.length === 0 ? (
          <Card className="p-12"><EmptyState icon={<KeyRound className="h-10 w-10 text-surface-400" />} title="No software licenses found" description="No licenses match your current filter parameters." /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLicenses.map((lic) => {
              const Icon = CATEGORY_ICONS[lic.category] ?? KeyRound;
              const pct = Math.round((lic.seatsUsed / lic.seatsPurchased) * 100);
              const days = daysUntil(lic.expiryDate);
              return (
                <Card key={lic.id} className="p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-surface-200 flex items-center justify-center text-brand-600 shrink-0"><Icon className="h-6 w-6" /></div>
                        <div className="min-w-0">
                          <button onClick={() => openDetail(lic)} className="font-bold text-surface-900 hover:text-brand-600 transition-colors text-left block truncate">{lic.product}</button>
                          <p className="text-caption text-surface-500 truncate">{lic.vendor}</p>
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[lic.status]} dot>{lic.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3.5">
                      <span className="font-mono text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{lic.licenseCode}</span>
                      <Badge variant="neutral">{lic.category}</Badge>
                    </div>
                    <div className="mt-4 pt-3 border-t border-surface-100">
                      <div className="flex items-center justify-between mb-1.5 text-caption">
                        <span className="flex items-center gap-1.5 text-surface-600 font-medium"><Users className="h-3.5 w-3.5 text-surface-400" /> Seats Utilized</span>
                        <span className="font-bold text-surface-900">{lic.seatsUsed} / {lic.seatsPurchased} ({pct}%)</span>
                      </div>
                      <Progress value={lic.seatsUsed} max={lic.seatsPurchased} barClass={pct > 95 ? 'bg-error-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-100 text-caption">
                      <div>
                        <p className="text-surface-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Expiry Date</p>
                        <p className="font-semibold text-surface-800 mt-0.5">{lic.expiryDate}</p>
                        <p className={days <= 30 ? 'text-amber-600 font-medium' : 'text-surface-500'}>{days <= 0 ? 'Expired' : `${days} days left`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-surface-400 flex items-center justify-end gap-1"><DollarSign className="h-3 w-3" /> Annual Cost</p>
                        <p className="font-bold text-surface-900 mt-0.5">${lic.annualCost.toLocaleString()}</p>
                        <p className="text-surface-500">${lic.costPerSeat}/seat</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-surface-100">
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => openDetail(lic)}>View Details</Button>
                    <Button variant="outline" size="sm" onClick={() => openAllocateModal(lic)} title="Allocate Seat"><UserPlus className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => openRenewModal(lic)} title="Renew Subscription"><RefreshCw className="h-4 w-4" /></Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {viewMode === 'optimization' && (
        <Card className="p-6">
          <CardHeader
            title="Enterprise SaaS Waste & Cost Optimization Scan"
            description="Scans allocated-seat activity for dormant seats, duplicate coverage, and contract true-up risk"
            action={<Button variant="primary" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => push({ variant: 'success', title: 'Scan complete (mockup)', message: `Re-scanned ${licenses.length} license contracts.` })}>Run Deep Scan</Button>}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-caption font-bold text-amber-800 uppercase tracking-wider">Dormant / Inactive Seats</span>
              <p className="text-title font-bold text-amber-900">{totalDormantSeats} Seats Detected</p>
              <p className="text-caption text-amber-700">Allocated seats marked Inactive (&gt;30d)</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-caption font-bold text-emerald-800 uppercase tracking-wider">Annual Recoup Potential</span>
              <p className="text-title font-bold text-emerald-900">${(totalPotentialSavings / 1000).toFixed(1)}K / yr</p>
              <p className="text-caption text-emerald-700">By releasing unused licenses prior to renewal</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-1">
              <span className="text-caption font-bold text-brand-800 uppercase tracking-wider">License Health Index</span>
              <p className="text-title font-bold text-brand-900">{healthIndexPct}% Compliant</p>
              <p className="text-caption text-brand-700">{licenses.length - compliantCount} contract(s) need attention</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-body font-bold text-surface-900">Recommended Cost Reduction Workflows</h3>
            {dormantSeatsByLicense.length === 0 ? (
              <p className="text-caption text-surface-500">No dormant seats detected — nothing to reclaim right now.</p>
            ) : dormantSeatsByLicense.map(({ license, dormant }) => (
              <div key={license.id} className="p-4 rounded-xl border border-surface-200 bg-surface-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-surface-900">{license.product}</span>
                    <Badge variant="warning">{dormant.length} Dormant Seat{dormant.length > 1 ? 's' : ''}</Badge>
                  </div>
                  <p className="text-caption text-surface-600">Reclaiming {dormant.length} inactive seat{dormant.length > 1 ? 's' : ''} from {license.vendor} saves <strong>${(dormant.length * license.costPerSeat).toLocaleString()}/yr</strong>.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openDetail(license)}>Review Users</Button>
                  <Button variant="primary" size="sm" onClick={() => push({ variant: 'success', title: 'Reclamation triggered (mockup)', message: `Sent seat release prompt for ${license.product}.` })}>Reclaim Seats</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detail Drawer */}
      <Drawer open={isDetailOpen && !!selectedLicense} onClose={() => setIsDetailOpen(false)} title={selectedLicense?.product} description={selectedLicense ? `${selectedLicense.licenseCode} · ${selectedLicense.vendor}` : ''} width="max-w-xl">
        {selectedLicense && (
          <div className="flex flex-col gap-5 py-2">
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={STATUS_VARIANT[selectedLicense.status]} dot>{selectedLicense.status}</Badge>
                <Badge variant={COMPLIANCE_VARIANT[selectedLicense.complianceStatus]}>{selectedLicense.complianceStatus}</Badge>
                <Badge variant="neutral">{selectedLicense.category}</Badge>
              </div>
              <p className="text-body text-surface-600 mt-2">{selectedLicense.description}</p>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-surface-200 text-caption">
                <InfoRow label="Edition" value={selectedLicense.edition} />
                <InfoRow label="License Model" value={selectedLicense.type} />
                <InfoRow label="Activation Method" value={selectedLicense.activationMethod} />
                <InfoRow label="Support Tier" value={selectedLicense.supportTier} />
              </div>
            </div>

            <div className="border border-surface-200 rounded-xl p-4 bg-white">
              <h4 className="text-caption font-bold text-surface-900 mb-3">Financials & Contract</h4>
              <div className="grid grid-cols-2 gap-3 text-caption">
                <InfoRow label="Annual Cost" value={`$${selectedLicense.annualCost.toLocaleString()}`} />
                <InfoRow label="Cost / Seat" value={`$${selectedLicense.costPerSeat}`} />
                <InfoRow label="PO Number" value={selectedLicense.poNumber} isMono />
                <InfoRow label="Contract Number" value={selectedLicense.contractNumber} isMono />
                <InfoRow label="Cost Center" value={selectedLicense.costCenter} />
                <InfoRow label="Auto-Renew" value={selectedLicense.autoRenew ? 'Enabled' : 'Disabled'} />
                <InfoRow label="Start Date" value={selectedLicense.startDate} />
                <InfoRow label="Expiry Date" value={selectedLicense.expiryDate} />
              </div>
            </div>

            <div className="border border-surface-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-caption font-bold text-surface-900">Allocated Seats ({selectedLicense.allocatedSeats.length})</h4>
                <Button size="sm" variant="ghost" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => openAllocateModal(selectedLicense)}>Allocate</Button>
              </div>
              {selectedLicense.allocatedSeats.length === 0 ? (
                <p className="text-caption text-surface-400 italic">No seats allocated yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedLicense.allocatedSeats.map((s) => (
                    <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-50 border border-surface-200">
                      <Avatar initials={s.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-caption font-medium text-surface-800 truncate">{s.employeeName} <span className="text-surface-400">· {s.department}</span></p>
                        <p className="text-[11px] text-surface-400">{s.role} · allocated {s.allocatedDate}</p>
                      </div>
                      <Badge variant={s.usageStatus === 'Inactive (>30d)' ? 'warning' : 'success'}>{s.usageStatus}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedLicense.history.length > 0 && (
              <div className="border border-surface-200 rounded-xl p-4 bg-white">
                <h4 className="text-caption font-bold text-surface-900 mb-3">History</h4>
                <div className="space-y-2">
                  {selectedLicense.history.map((h) => (
                    <div key={h.id} className="text-caption">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-surface-800">{h.title}</span>
                        {h.badge && <Badge variant="neutral">{h.badge}</Badge>}
                        <span className="text-[11px] text-surface-400 font-mono ml-auto">{h.date}</span>
                      </div>
                      <p className="text-surface-500 mt-0.5">{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button className="w-full" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => openRenewModal(selectedLicense)}>Renew Contract</Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add License Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Software License" size="lg">
        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Product Name *" placeholder="e.g. Datadog APM Pro" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} />
            <Input label="Edition / Package Tier" placeholder="e.g. Enterprise Pro" value={newEdition} onChange={(e) => setNewEdition(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Vendor / Publisher *" placeholder="e.g. Datadog Inc." value={newVendor} onChange={(e) => setNewVendor(e.target.value)} />
            <Select label="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value as LicenseCategory)} options={Object.keys(CATEGORY_ICONS).map((c) => ({ value: c, label: c }))} />
            <Select label="License Model" value={newType} onChange={(e) => setNewType(e.target.value as LicenseModel)} options={[
              { value: 'Subscription (Named User)', label: 'Subscription (Named User)' },
              { value: 'Subscription (Floating / Concurrent)', label: 'Subscription (Floating)' },
              { value: 'Perpetual License', label: 'Perpetual License' },
              { value: 'Volume Enterprise Agreement', label: 'Volume Enterprise Agreement' },
              { value: 'Usage / Consumption Based', label: 'Usage / Consumption Based' },
            ]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Total Purchased Seats" type="number" value={newSeatsPurchased} onChange={(e) => setNewSeatsPurchased(e.target.value)} />
            <Input label="Annual Commitment Cost ($)" type="number" value={newAnnualCost} onChange={(e) => setNewAnnualCost(e.target.value)} />
            <Input label="Expiration / Renewal Date" type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLicense}>Register License</Button>
        </div>
      </Modal>

      {/* Allocate Seat Modal */}
      <Modal open={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate Software License Seat" size="md">
        <div className="flex flex-col gap-4 py-2">
          <Select label="Software License *" value={allocateLicenseId} onChange={(e) => setAllocateLicenseId(e.target.value)} options={licenses.map((l) => ({ value: l.id, label: `${l.product} (${l.seatsPurchased - l.seatsUsed} seats available)` }))} />
          <Select label="Employee Recipient *" value={allocateEmployeeId} onChange={(e) => setAllocateEmployeeId(e.target.value)} options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))} />
          <Select label="Role / Permission" value={allocateRole} onChange={(e) => setAllocateRole(e.target.value as SeatRole)} options={[
            { value: 'Standard User', label: 'Standard User' },
            { value: 'Admin', label: 'Administrator' },
            { value: 'Developer', label: 'Developer / Power User' },
            { value: 'Read Only', label: 'Read Only / Viewer' },
          ]} />
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsAllocateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitAllocate}>Confirm Allocation</Button>
        </div>
      </Modal>

      {/* Renew Contract Modal */}
      <Modal open={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Software Subscription" size="md">
        <div className="flex flex-col gap-4 py-2">
          {selectedLicense && <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-caption text-brand-800">Contract renewal workflow for <strong>{selectedLicense.product}</strong> ({selectedLicense.vendor}).</div>}
          <Select label="Renewal Term Extension" value={renewYears} onChange={(e) => setRenewYears(e.target.value)} options={[
            { value: '1', label: '+1 Year' },
            { value: '2', label: '+2 Years (Multi-Year Discount)' },
            { value: '3', label: '+3 Years Enterprise Lock-in' },
          ]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Seat Capacity" type="number" value={renewSeats} onChange={(e) => setRenewSeats(e.target.value)} />
            <Input label="Total Annual Cost ($)" type="number" value={renewCost} onChange={(e) => setRenewCost(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-surface-200">
          <Button variant="outline" onClick={() => setIsRenewModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitRenew}>Submit Renewal</Button>
        </div>
      </Modal>

      {/* AI SaaS Optimization Modal */}
      <Modal open={isOptimizeModalOpen} onClose={() => setIsOptimizeModalOpen(false)} title="AI SaaS Cost & Seat Optimization Scan" size="lg">
        <div className="flex flex-col gap-4 py-2">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <h4 className="font-bold text-emerald-900">Total Optimization Potential: ${totalPotentialSavings.toLocaleString()} / Year</h4>
            <p className="text-body text-emerald-800">Scan identified {totalDormantSeats} inactive user seats across {dormantSeatsByLicense.length} license contract{dormantSeatsByLicense.length === 1 ? '' : 's'}.</p>
          </div>
          <div className="space-y-2.5">
            {dormantSeatsByLicense.length === 0 ? (
              <p className="text-caption text-surface-500">No optimization opportunities detected right now.</p>
            ) : dormantSeatsByLicense.map(({ license, dormant }) => (
              <div key={license.id} className="p-3.5 rounded-lg border border-surface-200 bg-surface-50 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-surface-900">{license.product}</p>
                  <p className="text-caption text-surface-500">{dormant.length} inactive seat{dormant.length > 1 ? 's' : ''} detected (${(dormant.length * license.costPerSeat).toLocaleString()}/yr savings if reclaimed)</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setIsOptimizeModalOpen(false); openDetail(license); }}>Inspect</Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-3 border-t border-surface-100">
            <Button onClick={() => setIsOptimizeModalOpen(false)}>Close Optimizer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div>
      <p className="text-surface-400 text-[11px]">{label}</p>
      <p className={cn('font-medium text-surface-800 mt-0.5', isMono && 'font-mono')}>{value}</p>
    </div>
  );
}
