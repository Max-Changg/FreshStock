import { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'fresh' | 'expiring' | 'expired';
}

export function Badge({ className, variant = 'fresh', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'fresh' && 'bg-green-100 text-green-800',
        variant === 'expiring' && 'bg-amber-100 text-amber-800',
        variant === 'expired' && 'bg-red-100 text-red-800',
        className
      )}
      {...props}
    />
  );
}
