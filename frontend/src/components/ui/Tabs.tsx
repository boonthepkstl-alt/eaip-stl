import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-surface-200 overflow-x-auto no-scrollbar', className)}>
      <div className="flex gap-1 px-1">
        {items.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2.5 text-body font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              active === tab.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-surface-500 hover:text-surface-800 hover:border-surface-300',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-caption font-medium', active === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500')}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
