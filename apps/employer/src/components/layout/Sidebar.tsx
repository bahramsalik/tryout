import { NavLink, Link, useLocation, useNavigate } from 'react-router';
import { Check, ChevronsUpDown, LayoutDashboard, LayoutDashboardFilled, PanelLeft, Trophy, TrophyFilled, Users, UsersFilled } from '@/components/icons';
import { useMediaQuery } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { useSidebar } from '@/lib/stores';
import { CompanyLogo, EmployerPill, LogoMark, Wordmark } from '../brand';
import { Popover } from '../overlay';
import { IconButton, cn } from '../ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, iconActive: LayoutDashboardFilled, end: true },
  { to: '/challenges', label: 'Challenges', icon: Trophy, iconActive: TrophyFilled, end: false },
  { to: '/talent', label: 'Talent', icon: Users, iconActive: UsersFilled, end: false },
];

/** Fluent nav: full at ≥1024 px, an icon rail below (the side-by-side demo runs at ~720 px). */
export function Sidebar() {
  const wide = useMediaQuery('(min-width: 1024px)');
  return (
    <aside
      className="sticky top-0 z-30 flex h-dvh w-14 shrink-0 flex-col border-r border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground3)] lg:w-60"
      aria-label="Primary"
    >
      <div className="flex h-12 shrink-0 items-center gap-1 pr-2 lg:pr-3">
        <Link
          to="/"
          className="flex h-full min-w-0 flex-1 items-center justify-center gap-2 px-3 lg:justify-start lg:px-4"
          aria-label="Tryout Employers, dashboard"
        >
          <LogoMark />
          <span className="hidden items-baseline gap-1.5 lg:flex">
            <Wordmark />
            <EmployerPill />
          </span>
        </Link>
        <SidebarToggle className="max-lg:hidden" />
      </div>

      <nav className="mt-3 flex flex-col gap-0.5 px-2 lg:px-3" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, iconActive: IconActive, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center justify-center gap-2.5 rounded-[var(--borderRadiusMedium)] text-sm transition-colors lg:justify-start lg:px-3',
                isActive
                  ? 'bg-[var(--colorNeutralBackground1)] font-semibold text-[var(--colorNeutralForeground1)]'
                  : 'text-[var(--colorNeutralForeground2)] hover:bg-[var(--colorNeutralBackground3Hover)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[var(--colorBrandBackground)]" aria-hidden />
                )}
                {isActive ? (
                  <IconActive className="size-5 shrink-0 text-[var(--colorBrandForeground1)]" aria-hidden />
                ) : (
                  <Icon className="size-5 shrink-0" aria-hidden />
                )}
                <span className="hidden lg:inline">{label}</span>
                <RailTooltip>{label}</RailTooltip>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--colorNeutralStroke2)] px-2 py-3 lg:px-3">
        <CompanySwitcher wide={wide} />
      </div>
    </aside>
  );
}

/** Shows or hides the whole sidebar. Lives next to the logo, and in the top bar while the sidebar is hidden. */
export function SidebarToggle({ className }: { className?: string }) {
  const [open, toggle] = useSidebar();
  return (
    <IconButton label={open ? 'Hide sidebar' : 'Show sidebar'} aria-pressed={open} onClick={toggle} className={className}>
      <PanelLeft className="size-5" aria-hidden />
    </IconButton>
  );
}

function RailTooltip({ children }: { children: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full z-50 ml-2 hidden rounded-[var(--borderRadiusMedium)] bg-[var(--colorNeutralBackground1)] px-2 py-1 text-xs whitespace-nowrap text-[var(--colorNeutralForeground1)] opacity-0 shadow-[var(--shadow16)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-lg:block"
    >
      {children}
    </span>
  );
}

function CompanySwitcher({ wide }: { wide: boolean }) {
  const { employer, employers, switchPersona } = usePersona();
  const location = useLocation();
  const navigate = useNavigate();
  if (!employer) return null;
  const company = employer.company;

  return (
    <Popover
      placement={wide ? 'top-start' : 'right-end'}
      panelClassName="w-72"
      trigger={({ toggle, ...aria }) => (
        <button
          type="button"
          onClick={toggle}
          {...aria}
          className="group relative flex w-full items-center justify-center gap-2 rounded-[var(--borderRadiusMedium)] p-1 text-left transition-colors hover:bg-[var(--colorNeutralBackground3Hover)] lg:justify-start lg:p-1.5"
          aria-label={`Switch company, currently ${company.name}`}
        >
          <CompanyLogo company={company} size={32} />
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-sm font-semibold">{company.name}</span>
            <span className="block truncate text-xs text-[var(--colorNeutralForeground3)]">{employer.name}</span>
          </span>
          <ChevronsUpDown className="hidden size-4 shrink-0 text-[var(--colorNeutralForeground3)] lg:block" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="scrollbar-thin max-h-80 overflow-y-auto">
            {employers.map((e) => {
              const active = e.id === employer.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    close();
                    if (!active) {
                      switchPersona(e.id);
                      // Stay on the same kind of page when it makes sense; challenge pages are company-specific.
                      if (location.pathname.startsWith('/challenges/') && location.pathname !== '/challenges/new') {
                        navigate('/');
                      }
                    }
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[var(--borderRadiusMedium)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--colorNeutralBackground1Hover)]',
                    active && 'bg-[var(--colorNeutralBackground1Selected)]',
                  )}
                >
                  <CompanyLogo company={e.company} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{e.company.name}</span>
                    <span className="block truncate text-xs text-[var(--colorNeutralForeground3)]">{e.name}</span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-[var(--colorBrandForeground1)]" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Popover>
  );
}
