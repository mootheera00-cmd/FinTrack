import React from 'react';
import BottomNav from './BottomNav';
import { clsx } from '@/lib/utils';
import { useData } from '@/hooks/useData';
import { Download, Wallet } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Root layout wrapper: provides a global sticky top bar with CSV export,
 * top safe-area padding, and reserves space for the fixed BottomNav.
 */
export default function Layout({ children, className }: LayoutProps) {
  const ctx = useData();

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
          <span className="font-bold text-slate-900 text-sm tracking-tight">FinTrack</span>
        </div>

        <button
          onClick={() => ctx.exportCSV()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border active:scale-95 shadow-sm bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
          title="ส่งออกข้อมูลเป็น CSV"
        >
          <Download size={14} className="text-emerald-500" />
          <span>ส่งออก CSV</span>
        </button>
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
