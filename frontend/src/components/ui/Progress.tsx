import { cn } from '@/lib/cn';

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClass?: string;
}

export function Progress({ value, max = 100, className, barClass }: ProgressProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={cn('h-2 w-full rounded-full bg-surface-200 overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all duration-300', barClass ?? 'bg-brand-500')} style={{ width: `${pct}%` }} />
    </div>
  );
}
