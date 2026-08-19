import type { BadgeVariant } from '@/components/ui';
import type { AssignmentStatus } from '@/types/assignment';

// Shared label/variant lookup for AssignmentStatus (FR-30..FR-44) — used by Assignment.tsx,
// CheckInCheckOut.tsx, and ApprovalInbox.tsx so the same status always reads the same way
// everywhere. Uses Badge (not StatusBadge) since these are snake_case values, not the
// Title-Case strings StatusBadge's built-in map expects.
const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  pending_manager_approval: { label: 'Pending Approval', variant: 'warning' },
  pending_acknowledgement: { label: 'Pending Acknowledgement', variant: 'accent' },
  active: { label: 'Active', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  checked_out: { label: 'Checked Out', variant: 'brand' },
  returned: { label: 'Returned', variant: 'neutral' },
};

export function getAssignmentStatusMeta(status: AssignmentStatus): { label: string; variant: BadgeVariant } {
  return STATUS_META[status] ?? { label: status, variant: 'default' };
}
