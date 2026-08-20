import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return (
    <div className="relative inline-flex" ref={ref}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="inline-flex cursor-pointer select-none"
      >
        {trigger}
      </div>
      {open && (
        <div className={cn('absolute mt-1 w-48 bg-white rounded-lg border border-surface-200 shadow-lg py-1 z-50 animate-fade-in-up', align === 'right' ? 'right-0' : 'left-0')}>
          {items.map((item, i) => item.divider ? (
            <div key={i} className="h-px bg-surface-200 my-1" />
          ) : (
            <button
              key={i}
              onClick={() => { item.onClick?.(); setOpen(false); }}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-body transition-colors', item.danger ? 'text-error-600 hover:bg-error-50' : 'text-surface-700 hover:bg-surface-100')}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MenuButton({ items, align = 'right' }: { items: DropdownItem[]; align?: 'left' | 'right' }) {
  return (
    <Dropdown
      align={align}
      trigger={<span className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"><MoreHorizontal className="h-4 w-4" /></span>}
      items={items}
    />
  );
}
