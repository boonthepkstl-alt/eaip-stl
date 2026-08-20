import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-caption">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-surface-400" />}
          {item.href && i < items.length - 1 ? (
            <span className="text-surface-500 hover:text-surface-800 cursor-pointer transition-colors">{item.label}</span>
          ) : (
            <span className={cn('font-medium', i === items.length - 1 ? 'text-surface-900' : 'text-surface-500')}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
