import React from 'react';
import { clsx } from '@/lib/utils';

type BadgeVariant = 'income' | 'expense' | 'info' | 'warning' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  income:  'bg-green-50   text-green-700  border-green-200',
  expense: 'bg-rose-50    text-rose-600   border-rose-200',
  info:    'bg-blue-50    text-blue-600   border-blue-200',
  warning: 'bg-amber-50   text-amber-600  border-amber-200',
  neutral: 'bg-slate-100  text-slate-600  border-slate-200',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
