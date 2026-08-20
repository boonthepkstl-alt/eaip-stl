import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
      <input type="checkbox" id={id} className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500" {...props} />
      {label && <span className="text-body text-surface-700">{label}</span>}
    </label>
  );
}

/* indeterminate-capable checkbox for table headers */
export interface Checkbox2Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked'> {
  label?: string;
  checked?: boolean | 'indeterminate';
}

export function Checkbox2({ label, className, id, checked, ...props }: Checkbox2Props) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = checked === 'indeterminate';
  }, [checked]);
  return (
    <label htmlFor={id} className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
      <input ref={ref} type="checkbox" id={id} checked={checked === true} className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500" {...props} />
      {label && <span className="text-body text-surface-700">{label}</span>}
    </label>
  );
}
