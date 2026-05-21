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
      className={clsx('min-h-[100dvh] bg-surface text-slate-900', className)}
    >
      <main
        style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
