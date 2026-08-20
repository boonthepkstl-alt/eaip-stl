import React, { type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: ReactNode;
}

export function Input({ label, error, helpText, leftIcon, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-caption font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">{leftIcon}</span>}
        <input
          id={inputId}
          className={cn('input-base', leftIcon ? 'pl-9' : '', error && 'error', className)}
          {...props}
        />
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
