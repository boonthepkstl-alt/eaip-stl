import React, { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return <div className={cn('card-base', className)} {...props}>{children}</div>;
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 py-4 border-b border-surface-200', className)}>
      <div className="min-w-0">
        <h3 className="text-title font-semibold text-surface-900 truncate">{title}</h3>
        {description && <p className="text-caption text-surface-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-surface-200">
        <div className="min-w-0">
          <h3 className="text-title font-semibold text-surface-900 truncate">{title}</h3>
          {description && <p className="text-caption text-surface-500 mt-0.5">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
