import React, { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300 border border-surface-200',
  outline: 'bg-white text-surface-700 border border-surface-300 hover:bg-surface-50 hover:border-surface-400 active:bg-surface-100',
  ghost: 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200',
  danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-sm',
  success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-caption gap-1.5',
  md: 'h-9 px-4 text-body gap-2',
  lg: 'h-11 px-6 text-body gap-2',
  icon: 'h-9 w-9 p-0',
};

export function Button({ variant = 'primary', size = 'md', leftIcon, rightIcon, loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 select-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
