import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  width?: string;
}

export function Drawer({ open, onClose, title, description, children, footer, side = 'right', width = 'max-w-md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('absolute top-0 bottom-0 bg-white shadow-xl border-surface-200 flex flex-col animate-slide-in-right w-full', width, side === 'right' ? 'right-0 border-l' : 'left-0 border-r')}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-surface-200">
          <div>
            {title && <h2 className="text-title font-semibold text-surface-900">{title}</h2>}
            {description && <p className="text-caption text-surface-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-md p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
