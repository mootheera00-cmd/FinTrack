import React from 'react';
import { clsx } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  /** Use 'elevated' for nested depth, 'glass' for frosted look */
  variant?: 'default' | 'elevated' | 'glass';
}

export function Card({ children, className, onClick, variant = 'default' }: CardProps) {
  const base = 'rounded-2xl p-4 transition-all duration-200';

  const variants = {
    default:  'bg-white border border-slate-200 shadow-sm',
    elevated: 'bg-slate-50 border border-slate-200 shadow-sm',
    glass:    'bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm',
  };

  const interactive = onClick ? 'cursor-pointer active:scale-[0.98] hover:brightness-110' : '';

  return (
    <div
      className={clsx(base, variants[variant], interactive, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}

/** Stat card for large numeric values */
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: 'green' | 'red' | 'blue' | 'amber' | 'default';
  className?: string;
  animate?: boolean;
}

const ACCENT_MAP = {
  green:   'text-brand-400',
  red:     'text-rose-500',
  blue:    'text-blue-600',
  amber:   'text-amber-500',
  default: 'text-slate-900',
};

export function StatCard({ label, value, sub, icon, accent = 'default', className, animate }: StatCardProps) {
  return (
    <Card className={clsx(animate && 'animate-fade-up', className)}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <p className={clsx('text-2xl font-bold tabular-nums tracking-tight', ACCENT_MAP[accent])}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </Card>
  );
}
