import React, { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: string;
}

const modalSizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, description, children, footer, size = 'md', width }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-lg shadow-xl border border-surface-200 animate-scale-in', width || modalSizes[size])}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-surface-200">
            <div>
              {title && <h2 className="text-heading font-semibold text-surface-900">{title}</h2>}
              {description && <p className="text-body text-surface-500 mt-1">{description}</p>}
            </div>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-md p-1 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children && <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>}
        {footer && <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-lg">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'primary' }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex gap-4">
        <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', variant === 'danger' ? 'bg-error-100' : 'bg-brand-100')}>
          <AlertTriangle className={cn('h-5 w-5', variant === 'danger' ? 'text-error-600' : 'text-brand-600')} />
        </div>
        <div className="flex-1">
          <h2 className="text-title font-semibold text-surface-900">{title}</h2>
          <p className="text-body text-surface-600 mt-1">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
