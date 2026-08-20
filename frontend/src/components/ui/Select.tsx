import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, helpText, options, className, id, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-caption font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn('input-base appearance-none pr-9', error && 'error', className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
      </div>
      {error ? (
        <p className="text-caption text-error-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      ) : helpText ? (
        <p className="text-caption text-surface-500 mt-1">{helpText}</p>
      ) : null}
    </div>
  );
}
