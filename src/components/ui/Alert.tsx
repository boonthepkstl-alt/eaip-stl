import { type ReactNode } from 'react';
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  className?: string;
  children?: ReactNode;
  onClose?: () => void;
}

export const alertStyles: Record<AlertVariant, { container: string; icon: ReactNode }> = {
  info: { container: 'bg-brand-50 border-brand-200 text-brand-800', icon: <Info className="h-5 w-5 text-brand-600" /> },
  success: { container: 'bg-success-50 border-success-200 text-success-800', icon: <CheckCircle2 className="h-5 w-5 text-success-600" /> },
  warning: { container: 'bg-warning-50 border-warning-200 text-warning-800', icon: <AlertTriangle className="h-5 w-5 text-warning-600" /> },
  error: { container: 'bg-error-50 border-error-200 text-error-800', icon: <AlertCircle className="h-5 w-5 text-error-600" /> },
};

export function Alert({ variant = 'info', title, className, children, onClose }: AlertProps) {
  const s = alertStyles[variant];
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', s.container, className)}>
      <span className="shrink-0">{s.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="text-body font-semibold">{title}</p>}
        {children && <div className="text-body mt-0.5 opacity-90">{children}</div>}
      </div>
      {onClose && <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>}
    </div>
  );
}
