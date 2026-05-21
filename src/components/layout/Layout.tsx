import React from 'react';
import BottomNav from './BottomNav';
import { clsx } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Root layout wrapper: provides top safe-area padding and reserves
 * space for the fixed BottomNav (h-16 + safe-area-inset-bottom).
 */
export default function Layout({ children, className }: LayoutProps) {
  return (
    <div
      className={clsx('min-h-screen bg-surface text-slate-900', className)}
    >
      <main
        className="pb-24"
        style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
