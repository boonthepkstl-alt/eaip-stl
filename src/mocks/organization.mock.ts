// MINIMAL SEED — Wave 4 introduced this (see src/types/organization.ts) only to resolve
// direct-manager approval routing for Assignment workflows. Wave 6 (Epic: User/Role/Permission +
// Baseline Administration) replaces this with real Organization Structure CRUD. Departments
// intentionally reuse the same set as asset/assignment mocks (IT/Finance/Sales/HR).
//
// departmentId is synced from the legacy `department` string (IT->DEPT-001, Finance->DEPT-002,
// Sales->DEPT-003, HR->DEPT-004). isActive/audit fields added for all 8 original rows — do NOT
// change id/name/directManagerId of the existing rows. positionTitle/costCenter are left
// undefined for these seed rows intentionally (FR-13 Could, informational only).
import { Employee } from '@/types/organization';

const now = '2026-08-01T09:00:00.000Z';
const seedUser = 'system.seed';

export const mockEmployees: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Somchai Prasert',
    department: 'IT',
    departmentId: 'DEPT-001',
    directManagerId: null,
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'EMP-002',
    name: 'Nattaya Wongsiri',
    department: 'Finance',
    departmentId: 'DEPT-002',
    directManagerId: null,
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'EMP-003',
    name: 'Piyawat Chaiyo',
    department: 'Sales',
    departmentId: 'DEPT-003',
    directManagerId: null,
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'EMP-004',
    name: 'Kanokwan Suksawat',
    department: 'HR',
    departmentId: 'DEPT-004',
    directManagerId: null,
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'EMP-005',
    name: 'Anong Thanakit',
    department: 'IT',
    departmentId: 'DEPT-001',
    directManagerId: 'EMP-001',
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'EMP-006',
    name: 'Suriya Boonmee',
    department: 'Finance',
    departmentId: 'DEPT-002',
    directManagerId: 'EMP-002',
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'EMP-007',
    name: 'Wanida Rattanakorn',
    department: 'Sales',
    departmentId: 'DEPT-003',
    directManagerId: 'EMP-003',
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
  {
    id: 'EMP-008',
    name: 'Chatchai Iamsuk',
    department: 'HR',
    departmentId: 'DEPT-004',
    directManagerId: 'EMP-004',
    isActive: true,
    createdAt: now,
    createdBy: seedUser,
    updatedAt: now,
    updatedBy: seedUser,
  },
];
