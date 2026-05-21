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
        'sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80',
        'flex items-end justify-between pb-3',
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'calc(1.25rem + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(1.25rem + env(safe-area-inset-right, 0px))',
        minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="flex flex-col justify-center">
        <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[10px] text-slate-500 leading-none mt-1">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-2 mb-0.5">{right}</div>}
    </header>
  );
}
