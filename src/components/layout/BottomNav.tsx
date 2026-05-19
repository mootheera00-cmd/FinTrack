import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, CreditCard, Settings } from 'lucide-react';
import { clsx } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard, label: 'Home'      },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/cards',       icon: CreditCard,      label: 'Cards'     },
  { to: '/settings',   icon: Settings,        label: 'Settings'  },
] as const;

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-1px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <ul className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-0.5 py-2 w-full min-h-[48px] transition-all duration-200',
                  isActive
                    ? 'text-brand-400'
                    : 'text-slate-400 hover:text-slate-700'
                )
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'p-1.5 rounded-xl transition-all duration-200',
                      isActive ? 'bg-brand-400/10' : ''
                    )}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
