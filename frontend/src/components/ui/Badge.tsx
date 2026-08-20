import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'accent' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-600 border-surface-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  error: 'bg-error-50 text-error-700 border-error-200',
  accent: 'bg-accent-50 text-accent-700 border-accent-200',
  neutral: 'bg-surface-200 text-surface-700 border-surface-300',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-surface-400',
  brand: 'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  accent: 'bg-accent-500',
  neutral: 'bg-surface-500',
};

export function Badge({ variant = 'default', className, children, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium', badgeVariants[variant], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

/* status helpers */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    'Available': 'success',
    'Assigned': 'brand',
    'In Maintenance': 'warning',
    'Retired': 'neutral',
    'Active': 'success',
    'Expiring Soon': 'warning',
    'Expired': 'error',
    'In Stock': 'success',
    'Low Stock': 'warning',
    'Out of Stock': 'error',
    'Scheduled': 'accent',
    'In Progress': 'warning',
    'Completed': 'success',
    'Overdue': 'error',
    'Inactive': 'neutral',
    'Suspended': 'error',
  };
  return <Badge variant={map[status] ?? 'default'} dot>{status}</Badge>;
}
