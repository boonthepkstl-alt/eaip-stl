import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {icon && <div className="h-14 w-14 rounded-full bg-surface-100 flex items-center justify-center text-surface-400 mb-4">{icon}</div>}
      <h3 className="text-title font-semibold text-surface-900">{title}</h3>
      {description && <p className="text-body text-surface-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
