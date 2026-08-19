// MINIMAL SEED — Wave 4 introduced this only to resolve direct-manager approval routing for
// Assignment workflows (see RESOLVED NEEDS_DECISION #5 — approverType 'direct_manager' only,
// no roleId-based routing for Assignment in this wave). Wave 6 (Epic: User/Role/Permission +
// Baseline Administration) replaces this with a full Organization Structure CRUD module backed
// by a real employee directory.
//
// `department` (string) is kept as-is intentionally — dual-field with `departmentId` below.
// Do NOT migrate `department` into a full FK-only relationship: pages/Assignment/CheckInCheckOut,
// AssignTransferDrawer, ByEmployeeView all still read the plain string.
export interface Employee {
  id: string;
  name: string;
  department: string; // legacy label string — kept in sync with departmentId when edited via UI
  departmentId?: string; // FK -> masterdata.ts Department
  positionTitle?: string; // FR-13 Could, informational only
  costCenter?: string; // FR-13 Could, informational only
  directManagerId: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
