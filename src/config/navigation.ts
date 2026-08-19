import {
  LayoutDashboard,
  Boxes,
  UserCheck,
  KeyRound,
  Warehouse,
  Ticket,
  ShoppingCart,
  ClipboardCheck,
  FileText,
  GitPullRequestArrow,
  GitBranch,
  FileBarChart,
  BarChart3,
  Bell,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  group: string;
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
    ],
  },
  {
    label: 'Assets',
    items: [
      { id: 'assets', label: 'Asset Management', icon: Boxes, group: 'Assets', permission: 'asset:read' },
      { id: 'assignment', label: 'Employee Management', icon: UserCheck, group: 'Assets', permission: 'assignment:read' },
      // MOCKUP ONLY (2026-08-18) — this used to be the real Check-In/Check-Out feature; converted
      // to an IT Requisition & Maintenance UI mockup per explicit user request (see
      // pages/CheckInCheckOut.tsx header comment). Nav id/route kept unchanged on purpose.
      { id: 'checkin-checkout', label: 'IT Requisition & Maintenance', icon: Ticket, group: 'Assets', permission: 'itrequest:read' },
      { id: 'licenses', label: 'Software License', icon: KeyRound, group: 'Assets' },
      { id: 'inventory', label: 'Inventory', icon: Warehouse, group: 'Assets' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart, group: 'Operations' },
      { id: 'audit', label: 'Audit', icon: ClipboardCheck, group: 'Operations' },
      { id: 'documents', label: 'Document Management', icon: FileText, group: 'Operations' },
      { id: 'approvals', label: 'Approval Workflow', icon: GitPullRequestArrow, group: 'Operations', permission: 'approval:action' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', icon: FileBarChart, group: 'Insights', permission: 'report:read' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Insights' },
      { id: 'notifications', label: 'Notification Center', icon: Bell, group: 'Insights' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'administration', label: 'Administration', icon: Users, group: 'System', permission: 'admin:access' },
      { id: 'workflow-admin', label: 'Workflow Configuration', icon: GitBranch, group: 'System', permission: 'workflow:configure' },
      { id: 'settings', label: 'System Settings', icon: Settings, group: 'System' },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

export const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Dashboard', subtitle: 'Real-time overview of your asset portfolio' },
  assets: { title: 'Asset Management', subtitle: 'Track and manage all organizational assets' },
  'asset-detail': { title: 'Asset Details', subtitle: 'Comprehensive asset information' },
  'create-asset': { title: 'Create Asset', subtitle: 'Register a new asset in the system' },
  assignment: { title: 'Employee Management', subtitle: 'Manage personnel, IT hardware assignments, and workstation profiles' },
  'checkin-checkout': { title: 'IT Requisition & Maintenance', subtitle: 'Report issues, request repairs, and track IT service tickets (UI mockup)' },
  'ticket-detail': { title: 'Ticket Details', subtitle: 'Full governance detail for a single IT requisition ticket (UI mockup)' },
  licenses: { title: 'Software Licenses', subtitle: 'Monitor license usage and renewals' },
  inventory: { title: 'Inventory', subtitle: 'Warehouse stock and supplies' },
  procurement: { title: 'Procurement', subtitle: 'Purchase orders and vendor management' },
  audit: { title: 'Audit', subtitle: 'Asset audits and compliance' },
  documents: { title: 'Document Management', subtitle: 'Centralized document repository' },
  approvals: { title: 'Approval Inbox', subtitle: 'Review and decide on requests waiting for your approval' },
  reports: { title: 'Reports', subtitle: 'Generate and export asset reports' },
  'reports-assignment': { title: 'Reports', subtitle: 'Generate and export asset reports' },
  analytics: { title: 'Analytics', subtitle: 'Deep insights into asset performance' },
  notifications: { title: 'Notification Center', subtitle: 'All your alerts in one place' },
  administration: { title: 'Administration', subtitle: 'Manage users, roles, and departments' },
  'workflow-admin': { title: 'Workflow Configuration', subtitle: 'Approval workflows configured in the system' },
  'user-management': { title: 'User Management', subtitle: 'Manage user accounts and access' },
  'role-management': { title: 'Role Management', subtitle: 'Configure roles and permissions' },
  departments: { title: 'Departments', subtitle: 'Organizational departments' },
  locations: { title: 'Locations', subtitle: 'Physical locations and sites' },
  'master-data': { title: 'Master Data', subtitle: 'Categories, vendors, and types' },
  settings: { title: 'System Settings', subtitle: 'Configure platform preferences' },
  profile: { title: 'Profile', subtitle: 'Manage your account and preferences' },
};
