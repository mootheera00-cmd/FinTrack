import React from 'react';
import { clsx } from '@/lib/utils';

type BadgeVariant = 'income' | 'expense' | 'info' | 'warning' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  income:  'bg-neutral-100  text-neutral-700  border-neutral-300',
  expense: 'bg-neutral-100  text-neutral-600  border-neutral-300',
  info:    'bg-neutral-50   text-neutral-600  border-neutral-200',
  warning: 'bg-neutral-100  text-neutral-600  border-neutral-300',
  neutral: 'bg-neutral-100  text-neutral-600  border-neutral-200',
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
