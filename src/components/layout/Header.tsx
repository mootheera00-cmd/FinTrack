import React from 'react';
import { clsx } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export default function Header({ title, subtitle, right, className }: HeaderProps) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80',
        'flex items-center justify-between px-5 h-14',
        className
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 leading-none mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
