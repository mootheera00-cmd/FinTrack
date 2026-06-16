import { useRef, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, TrendingDown, ClipboardList, Users, Sparkles, History, Settings } from 'lucide-react';
import { clsx } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/',             Icon: LayoutDashboard, label: 'รายรับ-รายจ่าย' },
  { to: '/income',       Icon: TrendingUp,      label: 'รายรับ'    },
  { to: '/expenses',     Icon: TrendingDown,    label: 'รายจ่าย'   },
  { to: '/installments', Icon: ClipboardList,   label: 'ผ่อน'       },
  { to: '/shared',       Icon: Users,           label: 'ซื้อร่วม'  },
  { to: '/forecast',     Icon: Sparkles,        label: 'พยากรณ์'   },
  { to: '/chart',        Icon: History,         label: 'ประวัติ'   },
  { to: '/settings',     Icon: Settings,        label: 'ตั้งค่า'   },
] as const;

const ITEMS_PER_PAGE = 4;

/** Group array into chunks of size n */
function chunkItems<T>(arr: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size) as T[]
  );
}

export default function BottomNav() {
  const listRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const pages = useMemo(() => chunkItems(NAV_ITEMS, ITEMS_PER_PAGE), []);

  // Determine which page the active item is on, then scroll there
  const activeIndex = useMemo(
    () => NAV_ITEMS.findIndex(item => item.to === location.pathname),
    [location.pathname]
  );
  const activePage = activeIndex >= 0 ? Math.floor(activeIndex / ITEMS_PER_PAGE) : 0;

  // Auto-scroll to the active page
  useEffect(() => {
    if (!listRef.current) return;
    const container = listRef.current;
    const pageWidth = container.clientWidth;
    container.scrollTo({
      left: activePage * pageWidth,
      behavior: 'smooth',
    });
  }, [activePage]);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200 shadow-[0_-1px_20px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
      aria-label="Main navigation"
    >
      <div className="relative">
        {/* Scrollable container — snaps by full width (4 items at a time) */}
        <div
          ref={listRef}
          className="flex overflow-x-auto overflow-y-hidden scrollbar-none snap-x snap-mandatory h-16"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {pages.map((group, pageIdx) => (
            <div
              key={pageIdx}
              className="flex items-center justify-around flex-shrink-0 w-full snap-start px-2"
            >
              {group.map(({ to, Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center justify-center gap-0.5 py-2 w-[72px] min-h-[48px] transition-all duration-200',
                      isActive ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
                    )
                  }
                  aria-label={label}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={clsx(
                          'transition-transform duration-200',
                          isActive ? 'scale-110' : 'scale-100'
                        )}
                        size={22}
                      />
                      <span className={clsx(
                        'text-[10px] font-medium tracking-wide transition-colors',
                        isActive ? 'text-neutral-900' : 'text-neutral-400'
                      )}>
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Page dots indicator */}
        {pages.length > 1 && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {pages.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'w-1 h-1 rounded-full transition-all duration-300',
                  i === activePage ? 'bg-neutral-700 w-3' : 'bg-neutral-300'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
