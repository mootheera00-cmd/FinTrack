import { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/',             emoji: '🏠', label: 'รายรับ-รายจ่าย'      },
  { to: '/income',       emoji: '💰', label: 'รายรับ'    },
  { to: '/expenses',     emoji: '💸', label: 'รายจ่าย'   },
  { to: '/installments', emoji: '📋', label: 'ผ่อน'       },
  { to: '/shared',       emoji: '🤝', label: 'ซื้อร่วม'  },
  { to: '/forecast',     emoji: '🔮', label: 'พยากรณ์'   },
  { to: '/chart',        emoji: '📜', label: 'ประวัติ'   },
] as const;

export default function BottomNav() {
  const listRef = useRef<HTMLUListElement>(null);
  const location = useLocation();

  // Auto-scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeLink = listRef.current.querySelector('[aria-current="page"]') as HTMLElement | null;
    if (!activeLink) return;
    activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [location.pathname]);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-1px_20px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
      aria-label="Main navigation"
    >
      <ul
        ref={listRef}
        className="flex items-center h-16 overflow-x-auto overflow-y-hidden scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {NAV_ITEMS.map(({ to, emoji, label }) => (
          <li key={to} className="snap-center shrink-0">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-0.5 py-2 w-[72px] min-h-[48px] transition-all duration-200',
                  isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-700'
                )
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'text-xl leading-none transition-transform duration-200',
                      isActive ? 'scale-110' : 'scale-100'
                    )}
                  >
                    {emoji}
                  </span>
                  <span className={clsx(
                    'text-[10px] font-medium tracking-wide transition-colors',
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  )}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
