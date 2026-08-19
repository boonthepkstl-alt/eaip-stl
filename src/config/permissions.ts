import { Permission } from '@/types/role';

// Full RBAC permission catalog (FR-09, FR-11) — used by the Role Management > Permission Matrix.
export const ALL_PERMISSIONS: Permission[] = [
  { key: 'admin:access', label: 'เข้าถึงหน้า Administration', category: 'Administration' },
  { key: 'user:manage', label: 'จัดการ User', category: 'Administration' },
  { key: 'role:manage', label: 'จัดการ Role', category: 'Administration' },
  { key: 'org:manage', label: 'จัดการโครงสร้างองค์กร', category: 'Administration' },
  { key: 'masterdata:manage', label: 'จัดการ Master Data', category: 'Administration' },
  { key: 'asset:read', label: 'ดูข้อมูล Asset', category: 'Asset' },
  { key: 'asset:create', label: 'สร้าง Asset', category: 'Asset' },
  { key: 'asset:update', label: 'แก้ไข Asset', category: 'Asset' },
  { key: 'assignment:read', label: 'ดูข้อมูลการมอบหมาย', category: 'Assignment/Approval' },
  { key: 'assignment:checkinout', label: 'Check-in/Check-out', category: 'Assignment/Approval' },
  { key: 'approval:action', label: 'อนุมัติ/ปฏิเสธ', category: 'Assignment/Approval' },
  { key: 'workflow:configure', label: 'ตั้งค่า Workflow', category: 'Assignment/Approval' },
  { key: 'itrequest:read', label: 'ดู IT Request', category: 'IT Request' },
  { key: 'itrequest:create', label: 'สร้าง IT Request', category: 'IT Request' },
  { key: 'itrequest:assign', label: 'รับมอบหมาย IT Request', category: 'IT Request' },
  { key: 'report:read', label: 'ดูรายงาน', category: 'Reporting' },
];
