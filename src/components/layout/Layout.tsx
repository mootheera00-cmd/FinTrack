import React from 'react';
import BottomNav from './BottomNav';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { clsx, advanceMonthKey, formatMonthKeyThai, currentMonthKey } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  /** If provided, a compact month-picker is rendered in the top bar */
  monthKey?: string;
  onMonthChange?: (key: string) => void;
}

/**
 * Root layout wrapper: provides a global sticky top bar with CSV export,
 * top safe-area padding, and reserves space for the fixed BottomNav.
 */
export default function Layout({ children, className, monthKey, onMonthChange }: LayoutProps) {
  return (
    <div className={clsx('min-h-[100dvh] bg-surface text-slate-900 flex flex-col', className)}>
      {/* Top bar with CSV export */}
      <header
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 px-4 py-2.5 flex items-center justify-between flex-shrink-0"
        style={{
          paddingTop: 'calc(0.625rem + env(safe-area-inset-top, 0px))',
          paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))',
        }}
      >
        <div className="flex items-center gap-1.5 cursor-pointer active:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-brand-400 rounded-lg flex items-center justify-center shadow-sm">
            <Wallet size={15} className="text-slate-900" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">บันทึกรายรับ-รายจ่าย</span>
        </div>

        {/* Month picker in header */}
        {monthKey && onMonthChange && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onMonthChange(advanceMonthKey(monthKey, -1))}
              className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
              {formatMonthKeyThai(monthKey)}
              {monthKey === currentMonthKey() && (
                <span className="ml-1 text-[8px] text-brand-600 bg-brand-100 px-1 py-0.5 rounded-full font-medium">
                  เดือนนี้
                </span>
              )}
            </span>
            <button
              onClick={() => onMonthChange(advanceMonthKey(monthKey, 1))}
              className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </header>

      {/* Main content area */}
      <main
        className="flex-1 w-full"
        style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
}
