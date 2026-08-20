import { cn } from '@/lib/cn';

export interface AvatarProps {
  initials: string;
  name?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  xs: 'h-6 w-6 text-caption',
  sm: 'h-8 w-8 text-caption',
  md: 'h-10 w-10 text-body',
  lg: 'h-12 w-12 text-title',
};

export function Avatar({ initials, name, color = 'bg-brand-500', size = 'sm', className }: AvatarProps) {
  return (
    <span
      title={name}
      className={cn('inline-flex items-center justify-center rounded-full text-white font-medium shrink-0', color, avatarSizes[size], className)}
    >
      {initials}
    </span>
  );
}
