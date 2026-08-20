import {
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
  type LucideIcon,
} from 'lucide-react';

export type LicenseCategory =
  | 'Productivity & Office'
  | 'Developer Tools & IDE'
  | 'Design & Creative'
  | 'Collaboration & Communication'
  | 'Cloud & Infrastructure'
  | 'Database & Analytics'
  | 'Security & Compliance';

export type LicenseType =
  | 'Subscription (Named User)'
  | 'Subscription (Floating / Concurrent)'
  | 'Perpetual License'
  | 'Volume Enterprise Agreement'
  | 'Usage / Consumption Based';

export type LicenseStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Over-Allocated' | 'Under-Utilized';

export type ComplianceStatus = 'Compliant' | 'Audit Warning' | 'True-Up Required' | 'Optimized';

export interface AllocatedSeat {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail: string;
  department: string;
  jobTitle: string;
  assetId?: string;
  assetCode?: string;
  assetName?: string;
  allocatedDate: string;
  lastActiveDate: string;
  usageStatus: 'Daily Active' | 'Regular Active' | 'Low Usage' | 'Inactive (>30d)';
  allocationRole: 'Admin' | 'Standard User' | 'Read Only' | 'Developer';
}

export interface InstalledAssetBinding {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  location: string;
  assignedEmployeeName: string;
  assignedEmployeeId: string;
  installedDate: string;
  activationKeyUsed: string;
  status: 'Activated' | 'Pending Verification' | 'Deactivated';
}

export interface LicenseHistoryEvent {
  id: string;
  licenseId: string;
  date: string;
  type: 'Seat Allocation' | 'Seat Revocation' | 'Contract Renewal' | 'Tier Upgrade' | 'Audit Scan' | 'Key Rotation';
  title: string;
  description: string;
  actor: string;
  badge?: string;
}

export interface LicenseAuditLog {
  id: string;
  licenseId: string;
  action: string;
  actor: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface SoftwareLicenseDetail {
  id: string;
  licenseCode: string;
  product: string;
  edition: string;
  vendor: string;
  vendorWebsite: string;
  vendorSupportEmail: string;
  vendorSupportPhone: string;
  category: LicenseCategory;
  type: LicenseType;
  status: LicenseStatus;
  complianceStatus: ComplianceStatus;
  
  // Seat metrics
  seatsPurchased: number;
  seatsUsed: number;
  seatsReserved: number;
  
  // Financials
  annualCost: number;
  costPerSeat: number;
  billingFrequency: 'Monthly' | 'Annual' | 'Multi-Year' | 'One-Time';
  currency: string;
  poNumber: string;
  contractNumber: string;
  costCenter: string;
  
  // Dates & Lifecycle
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  renewalNoticeDays: number;
  supportTier: string;
  
  // Keys & Credentials
  licenseKey: string;
  isKeyMasked: boolean;
  activationMethod: 'SSO / SAML 2.0' | 'License Key' | 'License Server / Daemon' | 'Cloud Portal';
  
  // Notes & Meta
  description: string;
  departmentAllocations: { department: string; percentage: number; seatCount: number }[];
  allocatedSeats: AllocatedSeat[];
  installedAssets: InstalledAssetBinding[];
  history: LicenseHistoryEvent[];
  auditLogs: LicenseAuditLog[];
  linkedTicketCodes: string[];
}

export const initialSoftwareLicenses: SoftwareLicenseDetail[] = [
  {
    id: 'l1',
    licenseCode: 'LIC-MSFT-365',
    product: 'Microsoft 365 Enterprise',
    edition: 'E5 Suite (Full Cloud Security + Teams)',
    vendor: 'Microsoft Corporation',
    vendorWebsite: 'https://admin.microsoft.com',
    vendorSupportEmail: 'enterprise-support@microsoft.com',
    vendorSupportPhone: '+1 (800) 642-7676',
    category: 'Productivity & Office',
    type: 'Subscription (Named User)',
    status: 'Active',
    complianceStatus: 'Compliant',
    seatsPurchased: 500,
    seatsUsed: 412,
    seatsReserved: 20,
    annualCost: 285000,
    costPerSeat: 570,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2025-MSFT-091',
    contractNumber: 'MS-EA-2025-7892',
    costCenter: 'CC-IT-GLOBAL (Core Infrastructure)',
    startDate: '2025-01-01',
    expiryDate: '2027-01-01',
    autoRenew: true,
    renewalNoticeDays: 60,
    supportTier: 'Premier Enterprise 24/7 SLA',
    licenseKey: 'MS365-E5-ENT-8849-XKLA-9921-PROD',
    isKeyMasked: true,
    activationMethod: 'SSO / SAML 2.0',
    description: 'Enterprise productivity suite with advanced threat protection, eDiscovery, cloud voice, and PowerBI Pro.',
    departmentAllocations: [
      { department: 'Engineering', percentage: 35, seatCount: 144 },
      { department: 'Sales', percentage: 25, seatCount: 103 },
      { department: 'Design', percentage: 10, seatCount: 41 },
      { department: 'IT Operations', percentage: 15, seatCount: 62 },
      { department: 'Finance', percentage: 15, seatCount: 62 },
    ],
    allocatedSeats: [
      {
        id: 'seat-1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        employeeCode: 'EMP-0001',
        employeeEmail: 'sarah.c@raise.co',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        assetId: 'a1',
        assetCode: 'AST-0001',
        assetName: 'MacBook Pro 16" M3',
        allocatedDate: '2024-01-16',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Standard User',
      },
      {
        id: 'seat-2',
        employeeId: 'e2',
        employeeName: 'Marcus Johnson',
        employeeCode: 'EMP-0002',
        employeeEmail: 'marcus.j@raise.co',
        department: 'Sales',
        jobTitle: 'Account Executive',
        assetId: 'a3',
        assetCode: 'AST-0003',
        assetName: 'iPhone 15 Pro',
        allocatedDate: '2024-03-23',
        lastActiveDate: '2026-08-15',
        usageStatus: 'Daily Active',
        allocationRole: 'Standard User',
      },
      {
        id: 'seat-3',
        employeeId: 'e3',
        employeeName: 'Priya Patel',
        employeeCode: 'EMP-0003',
        employeeEmail: 'priya.p@raise.co',
        department: 'Design',
        jobTitle: 'Product Designer',
        assetId: 'a6',
        assetCode: 'AST-0006',
        assetName: 'iPad Pro 12.9"',
        allocatedDate: '2024-05-20',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Standard User',
      },
      {
        id: 'seat-4',
        employeeId: 'e4',
        employeeName: 'David Kim',
        employeeCode: 'EMP-0004',
        employeeEmail: 'david.kim@raise.co',
        department: 'IT Operations',
        jobTitle: 'Network Engineer',
        allocatedDate: '2023-03-01',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Admin',
      },
      {
        id: 'seat-5',
        employeeId: 'e5',
        employeeName: 'Elena Rodriguez',
        employeeCode: 'EMP-0005',
        employeeEmail: 'elena.r@raise.co',
        department: 'Engineering',
        jobTitle: 'DevOps Engineer',
        allocatedDate: '2023-10-15',
        lastActiveDate: '2026-08-14',
        usageStatus: 'Daily Active',
        allocationRole: 'Standard User',
      },
      {
        id: 'seat-6',
        employeeId: 'e6',
        employeeName: 'James Wilson',
        employeeCode: 'EMP-0006',
        employeeEmail: 'james.w@raise.co',
        department: 'Finance',
        jobTitle: 'Financial Analyst',
        allocatedDate: '2022-11-01',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Standard User',
      },
    ],
    installedAssets: [
      {
        id: 'inst-1',
        assetId: 'a1',
        assetCode: 'AST-0001',
        assetName: 'MacBook Pro 16" M3',
        assetCategory: 'IT Hardware',
        location: 'HQ - Floor 4',
        assignedEmployeeName: 'Sarah Chen',
        assignedEmployeeId: 'e1',
        installedDate: '2024-01-16',
        activationKeyUsed: 'SSO Federated (sarah.c@raise.co)',
        status: 'Activated',
      },
      {
        id: 'inst-2',
        assetId: 'a3',
        assetCode: 'AST-0003',
        assetName: 'iPhone 15 Pro',
        assetCategory: 'Mobile',
        location: 'HQ - Floor 2',
        assignedEmployeeName: 'Marcus Johnson',
        assignedEmployeeId: 'e2',
        installedDate: '2024-03-23',
        activationKeyUsed: 'Intune MDM Profile',
        status: 'Activated',
      },
    ],
    history: [
      {
        id: 'lh-1',
        licenseId: 'l1',
        date: '2025-01-01',
        type: 'Contract Renewal',
        title: '3-Year Enterprise Agreement Renewed',
        description: 'Renewed Microsoft 365 E5 for 500 seats with discounted tier rates.',
        actor: 'Procurement Department',
        badge: 'Contract',
      },
      {
        id: 'lh-2',
        licenseId: 'l1',
        date: '2026-04-10',
        type: 'Seat Allocation',
        title: 'Batch 25 Seats Provisioned',
        description: 'Allocated to incoming engineering & product hires.',
        actor: 'IT Operations (David Kim)',
        badge: 'Provisioning',
      },
    ],
    auditLogs: [
      {
        id: 'la-1',
        licenseId: 'l1',
        action: 'Seat Allocation',
        actor: 'David Kim',
        timestamp: '2026-04-10 10:15 AM',
        field: 'Allocated Seats',
        oldValue: '387 Seats',
        newValue: '412 Seats',
      },
    ],
    linkedTicketCodes: ['REQ-2026-0042', 'REQ-2026-0038'],
  },
  {
    id: 'l2',
    licenseCode: 'LIC-JETB-ALL',
    product: 'JetBrains All Products Pack',
    edition: 'Enterprise Commercial Subscription',
    vendor: 'JetBrains s.r.o.',
    vendorWebsite: 'https://account.jetbrains.com',
    vendorSupportEmail: 'sales@jetbrains.com',
    vendorSupportPhone: '+420 241 722 501',
    category: 'Developer Tools & IDE',
    type: 'Subscription (Named User)',
    status: 'Expiring Soon',
    complianceStatus: 'Compliant',
    seatsPurchased: 80,
    seatsUsed: 74,
    seatsReserved: 4,
    annualCost: 19200,
    costPerSeat: 240,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2025-JB-004',
    contractNumber: 'JB-CORP-91023',
    costCenter: 'DEPT-ENG (Engineering R&D)',
    startDate: '2025-09-01',
    expiryDate: '2026-09-01',
    autoRenew: false,
    renewalNoticeDays: 30,
    supportTier: 'Standard Commercial Business Support',
    licenseKey: 'JB-APP-ENT-2025-9941-KKL8-DEV',
    isKeyMasked: true,
    activationMethod: 'License Server / Daemon',
    description: 'Complete suite of IDEs including IntelliJ IDEA Ultimate, WebStorm, PyCharm, CLion, GoLand, and DataGrip.',
    departmentAllocations: [
      { department: 'Engineering', percentage: 90, seatCount: 67 },
      { department: 'IT Operations', percentage: 10, seatCount: 7 },
    ],
    allocatedSeats: [
      {
        id: 'seat-jb-1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        employeeCode: 'EMP-0001',
        employeeEmail: 'sarah.c@raise.co',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        assetId: 'a1',
        assetCode: 'AST-0001',
        assetName: 'MacBook Pro 16" M3',
        allocatedDate: '2024-01-16',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Developer',
      },
      {
        id: 'seat-jb-2',
        employeeId: 'e5',
        employeeName: 'Elena Rodriguez',
        employeeCode: 'EMP-0005',
        employeeEmail: 'elena.r@raise.co',
        department: 'Engineering',
        jobTitle: 'DevOps Engineer',
        allocatedDate: '2023-10-15',
        lastActiveDate: '2026-08-14',
        usageStatus: 'Daily Active',
        allocationRole: 'Developer',
      },
    ],
    installedAssets: [
      {
        id: 'inst-jb-1',
        assetId: 'a1',
        assetCode: 'AST-0001',
        assetName: 'MacBook Pro 16" M3',
        assetCategory: 'IT Hardware',
        location: 'HQ - Floor 4',
        assignedEmployeeName: 'Sarah Chen',
        assignedEmployeeId: 'e1',
        installedDate: '2024-01-16',
        activationKeyUsed: 'Floating License Server (jb.raise.internal:8080)',
        status: 'Activated',
      },
    ],
    history: [
      {
        id: 'lh-jb-1',
        licenseId: 'l2',
        date: '2026-08-01',
        type: 'Audit Scan',
        title: 'Renewal Notice Triggered',
        description: 'License expires in 16 days on Sep 01, 2026. Renewal PO draft pending approval.',
        actor: 'Automated Lifecycle Service',
        badge: 'Warning',
      },
    ],
    auditLogs: [
      {
        id: 'la-jb-1',
        licenseId: 'l2',
        action: 'Status Change',
        actor: 'System Watchdog',
        timestamp: '2026-08-01 00:00 AM',
        field: 'Status',
        oldValue: 'Active',
        newValue: 'Expiring Soon',
      },
    ],
    linkedTicketCodes: ['REQ-2026-0042'],
  },
  {
    id: 'l3',
    licenseCode: 'LIC-ADBE-CC',
    product: 'Adobe Creative Cloud',
    edition: 'All Apps for Enterprise (With Substance 3D & Stock)',
    vendor: 'Adobe Systems Inc.',
    vendorWebsite: 'https://adminconsole.adobe.com',
    vendorSupportEmail: 'ent-support@adobe.com',
    vendorSupportPhone: '+1 (800) 833-6687',
    category: 'Design & Creative',
    type: 'Subscription (Named User)',
    status: 'Active',
    complianceStatus: 'Compliant',
    seatsPurchased: 40,
    seatsUsed: 38,
    seatsReserved: 2,
    annualCost: 14400,
    costPerSeat: 360,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2025-ADBE-022',
    contractNumber: 'AD-ENT-2024-5510',
    costCenter: 'DEPT-DSN (Creative & Brand)',
    startDate: '2024-11-15',
    expiryDate: '2026-11-15',
    autoRenew: true,
    renewalNoticeDays: 45,
    supportTier: 'Enterprise VIP Dedicated Support',
    licenseKey: 'ADOBE-CC-ENT-9941-K782-DES',
    isKeyMasked: true,
    activationMethod: 'SSO / SAML 2.0',
    description: 'Complete creative suite: Photoshop, Illustrator, After Effects, Premiere Pro, InDesign, and Substance 3D.',
    departmentAllocations: [
      { department: 'Design', percentage: 75, seatCount: 29 },
      { department: 'Marketing', percentage: 25, seatCount: 9 },
    ],
    allocatedSeats: [
      {
        id: 'seat-ad-1',
        employeeId: 'e3',
        employeeName: 'Priya Patel',
        employeeCode: 'EMP-0003',
        employeeEmail: 'priya.p@raise.co',
        department: 'Design',
        jobTitle: 'Product Designer',
        assetId: 'a6',
        assetCode: 'AST-0006',
        assetName: 'iPad Pro 12.9"',
        allocatedDate: '2024-05-20',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Standard User',
      },
    ],
    installedAssets: [
      {
        id: 'inst-ad-1',
        assetId: 'a6',
        assetCode: 'AST-0006',
        assetName: 'iPad Pro 12.9"',
        assetCategory: 'Mobile',
        location: 'HQ - Floor 3',
        assignedEmployeeName: 'Priya Patel',
        assignedEmployeeId: 'e3',
        installedDate: '2024-05-20',
        activationKeyUsed: 'Adobe Federated ID (priya.p@raise.co)',
        status: 'Activated',
      },
    ],
    history: [],
    auditLogs: [],
    linkedTicketCodes: [],
  },
  {
    id: 'l4',
    licenseCode: 'LIC-FIGMA-ORG',
    product: 'Figma Organization',
    edition: 'Enterprise Workspace Tier',
    vendor: 'Figma Inc.',
    vendorWebsite: 'https://figma.com/settings',
    vendorSupportEmail: 'support@figma.com',
    vendorSupportPhone: '+1 (888) 344-6201',
    category: 'Design & Creative',
    type: 'Subscription (Named User)',
    status: 'Active',
    complianceStatus: 'Optimized',
    seatsPurchased: 60,
    seatsUsed: 55,
    seatsReserved: 5,
    annualCost: 36000,
    costPerSeat: 600,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2025-FIGMA-081',
    contractNumber: 'FIG-ORG-2025-1109',
    costCenter: 'DEPT-DSN (Product Design & R&D)',
    startDate: '2025-02-01',
    expiryDate: '2027-02-01',
    autoRenew: true,
    renewalNoticeDays: 30,
    supportTier: 'Priority CSM & Enterprise SLA',
    licenseKey: 'FIGMA-ORG-TOKEN-9921-KLAS',
    isKeyMasked: true,
    activationMethod: 'SSO / SAML 2.0',
    description: 'Collaborative interface design platform with enterprise design systems, branching, FigJam, and Dev Mode.',
    departmentAllocations: [
      { department: 'Design', percentage: 55, seatCount: 30 },
      { department: 'Engineering', percentage: 45, seatCount: 25 },
    ],
    allocatedSeats: [
      {
        id: 'seat-fig-1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        employeeCode: 'EMP-0001',
        employeeEmail: 'sarah.c@raise.co',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        allocatedDate: '2024-01-16',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Developer',
      },
      {
        id: 'seat-fig-2',
        employeeId: 'e3',
        employeeName: 'Priya Patel',
        employeeCode: 'EMP-0003',
        employeeEmail: 'priya.p@raise.co',
        department: 'Design',
        jobTitle: 'Product Designer',
        allocatedDate: '2024-05-20',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Admin',
      },
    ],
    installedAssets: [],
    history: [],
    auditLogs: [],
    linkedTicketCodes: [],
  },
  {
    id: 'l5',
    licenseCode: 'LIC-SLACK-PLUS',
    product: 'Slack Business+',
    edition: 'Business Plus Enterprise Grid Ready',
    vendor: 'Salesforce / Slack Technologies',
    vendorWebsite: 'https://my.slack.com/admin',
    vendorSupportEmail: 'feedback@slack.com',
    vendorSupportPhone: '+1 (800) 682-1698',
    category: 'Collaboration & Communication',
    type: 'Subscription (Named User)',
    status: 'Active',
    complianceStatus: 'Compliant',
    seatsPurchased: 500,
    seatsUsed: 487,
    seatsReserved: 10,
    annualCost: 180000,
    costPerSeat: 360,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2024-SLACK-112',
    contractNumber: 'SLK-BUS-2024-0992',
    costCenter: 'CC-IT-GLOBAL',
    startDate: '2024-12-01',
    expiryDate: '2026-12-01',
    autoRenew: true,
    renewalNoticeDays: 60,
    supportTier: '24/7 Support with 4hr response SLA',
    licenseKey: 'SLACK-ENT-WORKSPACE-CORP-RAISE',
    isKeyMasked: true,
    activationMethod: 'SSO / SAML 2.0',
    description: 'Core organizational communication channel with unlimited message history, workflow builder, and Slack Connect.',
    departmentAllocations: [
      { department: 'Engineering', percentage: 40, seatCount: 195 },
      { department: 'Sales', percentage: 30, seatCount: 146 },
      { department: 'IT Operations', percentage: 15, seatCount: 73 },
      { department: 'Finance', percentage: 15, seatCount: 73 },
    ],
    allocatedSeats: [],
    installedAssets: [],
    history: [],
    auditLogs: [],
    linkedTicketCodes: [],
  },
  {
    id: 'l6',
    licenseCode: 'LIC-GH-ENT',
    product: 'GitHub Enterprise Cloud',
    edition: 'Enterprise Cloud + Advanced Security (GHAS) + Copilot',
    vendor: 'GitHub / Microsoft',
    vendorWebsite: 'https://github.com/enterprises/raise-co',
    vendorSupportEmail: 'enterprise-support@github.com',
    vendorSupportPhone: '+1 (877) 448-4820',
    category: 'Developer Tools & IDE',
    type: 'Subscription (Named User)',
    status: 'Expiring Soon',
    complianceStatus: 'Audit Warning',
    seatsPurchased: 120,
    seatsUsed: 118,
    seatsReserved: 2,
    annualCost: 43200,
    costPerSeat: 360,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2024-GH-088',
    contractNumber: 'GH-ENT-2024-8831',
    costCenter: 'DEPT-ENG (Core Engineering)',
    startDate: '2024-08-01',
    expiryDate: '2026-08-30',
    autoRenew: false,
    renewalNoticeDays: 30,
    supportTier: 'GitHub Premium Support 24/7',
    licenseKey: 'GH-ENT-CLOUD-8891-KLAK-2026',
    isKeyMasked: true,
    activationMethod: 'SSO / SAML 2.0',
    description: 'Enterprise source code repository management, CI/CD actions, Dependabot security scanning, and Copilot AI.',
    departmentAllocations: [
      { department: 'Engineering', percentage: 85, seatCount: 100 },
      { department: 'IT Operations', percentage: 15, seatCount: 18 },
    ],
    allocatedSeats: [
      {
        id: 'seat-gh-1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        employeeCode: 'EMP-0001',
        employeeEmail: 'sarah.c@raise.co',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        allocatedDate: '2024-01-16',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Admin',
      },
      {
        id: 'seat-gh-2',
        employeeId: 'e5',
        employeeName: 'Elena Rodriguez',
        employeeCode: 'EMP-0005',
        employeeEmail: 'elena.r@raise.co',
        department: 'Engineering',
        jobTitle: 'DevOps Engineer',
        allocatedDate: '2023-10-15',
        lastActiveDate: '2026-08-15',
        usageStatus: 'Daily Active',
        allocationRole: 'Admin',
      },
    ],
    installedAssets: [],
    history: [],
    auditLogs: [],
    linkedTicketCodes: [],
  },
  {
    id: 'l7',
    licenseCode: 'LIC-ZOOM-PRO',
    product: 'Zoom Phone & Meetings Pro',
    edition: 'Enterprise Unlimited Package',
    vendor: 'Zoom Video Communications',
    vendorWebsite: 'https://zoom.us/account',
    vendorSupportEmail: 'support@zoom.us',
    vendorSupportPhone: '+1 (888) 799-9666',
    category: 'Collaboration & Communication',
    type: 'Subscription (Named User)',
    status: 'Active',
    complianceStatus: 'Compliant',
    seatsPurchased: 200,
    seatsUsed: 156,
    seatsReserved: 10,
    annualCost: 36000,
    costPerSeat: 180,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2025-ZM-031',
    contractNumber: 'ZM-PRO-2025-4491',
    costCenter: 'CC-IT-GLOBAL',
    startDate: '2025-03-01',
    expiryDate: '2027-03-01',
    autoRenew: true,
    renewalNoticeDays: 30,
    supportTier: 'Enterprise Premier Support',
    licenseKey: 'ZOOM-PRO-ENT-9941-KEY',
    isKeyMasked: true,
    activationMethod: 'SSO / SAML 2.0',
    description: 'Enterprise video conferencing, cloud PBX VoIP phone system, webinar 500, and AI meeting summary.',
    departmentAllocations: [
      { department: 'Sales', percentage: 50, seatCount: 78 },
      { department: 'Engineering', percentage: 30, seatCount: 47 },
      { department: 'Design', percentage: 20, seatCount: 31 },
    ],
    allocatedSeats: [],
    installedAssets: [],
    history: [],
    auditLogs: [],
    linkedTicketCodes: [],
  },
  {
    id: 'l8',
    licenseCode: 'LIC-ORCL-19C',
    product: 'Oracle Database 19c Enterprise Edition',
    edition: 'Processor Core Licensing + Real Application Clusters (RAC)',
    vendor: 'Oracle Corporation',
    vendorWebsite: 'https://support.oracle.com',
    vendorSupportEmail: 'support@oracle.com',
    vendorSupportPhone: '+1 (800) 223-1711',
    category: 'Database & Analytics',
    type: 'Perpetual License',
    status: 'Expired',
    complianceStatus: 'True-Up Required',
    seatsPurchased: 8,
    seatsUsed: 8,
    seatsReserved: 0,
    annualCost: 96000,
    costPerSeat: 12000,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2021-ORCL-001',
    contractNumber: 'ORCL-PERP-88102-TH',
    costCenter: 'DEPT-ITO (Data Infrastructure)',
    startDate: '2021-06-01',
    expiryDate: '2025-06-01',
    autoRenew: false,
    renewalNoticeDays: 90,
    supportTier: 'Software Update License & Support (SULS)',
    licenseKey: 'ORCL-DB19C-RAC-8821-CORE-8P',
    isKeyMasked: true,
    activationMethod: 'License Key',
    description: 'High-availability relational database server for core ERP and fixed assets ledger reconciliation.',
    departmentAllocations: [
      { department: 'IT Operations', percentage: 100, seatCount: 8 },
    ],
    allocatedSeats: [
      {
        id: 'seat-orcl-1',
        employeeId: 'e4',
        employeeName: 'David Kim',
        employeeCode: 'EMP-0004',
        employeeEmail: 'david.kim@raise.co',
        department: 'IT Operations',
        jobTitle: 'Network Engineer / Systems Admin',
        assetId: 'a5',
        assetCode: 'AST-0005',
        assetName: 'Dell PowerEdge R750',
        allocatedDate: '2022-11-05',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Admin',
      },
    ],
    installedAssets: [
      {
        id: 'inst-orcl-1',
        assetId: 'a5',
        assetCode: 'AST-0005',
        assetName: 'Dell PowerEdge R750',
        assetCategory: 'Infrastructure',
        location: 'Data Center East',
        assignedEmployeeName: 'Unassigned (Server Node)',
        assignedEmployeeId: '',
        installedDate: '2022-11-05',
        activationKeyUsed: 'ORCL-DB19C-RAC-8821-CORE-8P',
        status: 'Activated',
      },
    ],
    history: [],
    auditLogs: [],
    linkedTicketCodes: ['REQ-2026-0041'],
  },
  {
    id: 'l9',
    licenseCode: 'LIC-AWS-ENT',
    product: 'AWS Enterprise Support & Savings Plan',
    edition: 'Compute Savings Plan + Developer Enterprise SLA',
    vendor: 'Amazon Web Services',
    vendorWebsite: 'https://console.aws.amazon.com',
    vendorSupportEmail: 'aws-support-concierge@amazon.com',
    vendorSupportPhone: '+1 (866) 280-4357',
    category: 'Cloud & Infrastructure',
    type: 'Usage / Consumption Based',
    status: 'Active',
    complianceStatus: 'Optimized',
    seatsPurchased: 50,
    seatsUsed: 42,
    seatsReserved: 5,
    annualCost: 120000,
    costPerSeat: 2400,
    billingFrequency: 'Monthly',
    currency: 'USD',
    poNumber: 'PO-2025-AWS-009',
    contractNumber: 'AWS-EDP-2025-001',
    costCenter: 'DEPT-ENG (Cloud Infrastructure)',
    startDate: '2025-01-01',
    expiryDate: '2028-01-01',
    autoRenew: true,
    renewalNoticeDays: 90,
    supportTier: 'AWS Enterprise Support 15min SLA',
    licenseKey: 'AWS-ACCOUNT-ID-994182910291',
    isKeyMasked: true,
    activationMethod: 'SSO / SAML 2.0',
    description: 'Enterprise cloud infrastructure, Kubernetes EKS cluster instances, S3 object storage, and RDS Aurora.',
    departmentAllocations: [
      { department: 'Engineering', percentage: 70, seatCount: 29 },
      { department: 'IT Operations', percentage: 30, seatCount: 13 },
    ],
    allocatedSeats: [
      {
        id: 'seat-aws-1',
        employeeId: 'e5',
        employeeName: 'Elena Rodriguez',
        employeeCode: 'EMP-0005',
        employeeEmail: 'elena.r@raise.co',
        department: 'Engineering',
        jobTitle: 'DevOps Engineer',
        allocatedDate: '2023-10-15',
        lastActiveDate: '2026-08-16',
        usageStatus: 'Daily Active',
        allocationRole: 'Admin',
      },
    ],
    installedAssets: [],
    history: [],
    auditLogs: [],
    linkedTicketCodes: [],
  },
  {
    id: 'l10',
    licenseCode: 'LIC-CRWD-STK',
    product: 'CrowdStrike Falcon Enterprise',
    edition: 'Endpoint Protection + EDR + Threat Intel',
    vendor: 'CrowdStrike Inc.',
    vendorWebsite: 'https://falcon.crowdstrike.com',
    vendorSupportEmail: 'support@crowdstrike.com',
    vendorSupportPhone: '+1 (855) 276-9378',
    category: 'Security & Compliance',
    type: 'Subscription (Named User)',
    status: 'Active',
    complianceStatus: 'Compliant',
    seatsPurchased: 450,
    seatsUsed: 420,
    seatsReserved: 15,
    annualCost: 42000,
    costPerSeat: 93,
    billingFrequency: 'Annual',
    currency: 'USD',
    poNumber: 'PO-2025-CRWD-102',
    contractNumber: 'CRWD-CORP-2025-99',
    costCenter: 'DEPT-ITO (Cybersecurity)',
    startDate: '2025-04-01',
    expiryDate: '2027-04-01',
    autoRenew: true,
    renewalNoticeDays: 45,
    supportTier: 'Falcon Complete Managed Threat Hunting',
    licenseKey: 'CRWD-CID-CC9182910-KKL819-CORP',
    isKeyMasked: true,
    activationMethod: 'Cloud Portal',
    description: 'Next-gen antivirus, endpoint detection and response (EDR), and real-time IT cyber defense sensor.',
    departmentAllocations: [
      { department: 'Engineering', percentage: 40, seatCount: 168 },
      { department: 'Sales', percentage: 25, seatCount: 105 },
      { department: 'Design', percentage: 15, seatCount: 63 },
      { department: 'IT Operations', percentage: 20, seatCount: 84 },
    ],
    allocatedSeats: [],
    installedAssets: [
      {
        id: 'inst-cs-1',
        assetId: 'a1',
        assetCode: 'AST-0001',
        assetName: 'MacBook Pro 16" M3',
        assetCategory: 'IT Hardware',
        location: 'HQ - Floor 4',
        assignedEmployeeName: 'Sarah Chen',
        assignedEmployeeId: 'e1',
        installedDate: '2024-01-16',
        activationKeyUsed: 'Falcon Agent v7.12 macOS',
        status: 'Activated',
      },
      {
        id: 'inst-cs-2',
        assetId: 'a5',
        assetCode: 'AST-0005',
        assetName: 'Dell PowerEdge R750',
        assetCategory: 'Infrastructure',
        location: 'Data Center East',
        assignedEmployeeName: 'Unassigned (Server Node)',
        assignedEmployeeId: '',
        installedDate: '2022-11-05',
        activationKeyUsed: 'Falcon Agent v7.12 Linux',
        status: 'Activated',
      },
    ],
    history: [],
    auditLogs: [],
    linkedTicketCodes: [],
  },
];
