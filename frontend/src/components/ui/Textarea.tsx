import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Textarea({ label, error, helpText, className, id, ...props }: TextareaProps) {
  const taId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={taId} className="block text-caption font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea id={taId} className={cn('input-base resize-y min-h-20', error && 'error', className)} {...props} />
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
