import { NavLink, Link, useLocation, useNavigate } from 'react-router';
import { Check, ChevronsUpDown, ExternalLink, LayoutDashboard, Users } from 'lucide-react';
import { STUDENT_SITE_URL } from '@/lib/api';
import { useLiveStatus } from '@/lib/events';
import { useMediaQuery } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { useDashboard } from '@/lib/queries';
import { CompanyLogo, EmployerPill, LogoMark, TypeIcon, Wordmark } from '../brand';
import { Popover } from '../overlay';
import { cn } from '../ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/talent', label: 'Talent', icon: Users, end: false },
];

/** Dark "pro tool" sidebar: full at ≥1024 px, an icon rail below (the side-by-side demo runs at ~720 px). */
export function Sidebar() {
  const wide = useMediaQuery('(min-width: 1024px)');
  return (
    <aside
      className="sticky top-0 z-30 flex h-dvh w-16 shrink-0 flex-col bg-sidebar text-slate-300 lg:w-60"
      aria-label="Primary"
    >
      <Link
        to="/"
        className="flex h-14 shrink-0 items-center justify-center gap-2 border-b border-white/5 px-3 lg:justify-start lg:px-4"
        aria-label="Tryout for Employers — dashboard"
      >
        <LogoMark />
        <span className="hidden items-center gap-2 lg:flex">
          <Wordmark dark />
          <EmployerPill />
        </span>
      </Link>

      <div className="px-2 pt-3 lg:px-3">
        <CompanySwitcher wide={wide} />
      </div>

      <nav className="mt-4 flex flex-col gap-0.5 px-2 lg:px-3" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center justify-center gap-3 rounded-lg text-[13px] font-medium transition-colors lg:h-9 lg:justify-start lg:px-3',
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Icon className="size-[18px] shrink-0 lg:size-4" aria-hidden />
            <span className="hidden lg:inline">{label}</span>
            <RailTooltip>{label}</RailTooltip>
          </NavLink>
        ))}
      </nav>

      {wide && <SidebarChallenges />}

      <div className="mt-auto border-t border-white/5 p-2 lg:p-3">
        <LiveIndicator />
        <a
          href={STUDENT_SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="group relative mt-1 flex h-9 items-center justify-center gap-2 rounded-lg text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:justify-start lg:px-3"
        >
          <ExternalLink className="size-4 shrink-0 lg:size-3.5" aria-hidden />
          <span className="hidden lg:inline">Student site</span>
          <RailTooltip>Open the student site</RailTooltip>
        </a>
      </div>
    </aside>
  );
}

function RailTooltip({ children }: { children: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full z-50 ml-3 hidden rounded-md bg-slate-800 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-lg:block"
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
      placement={wide ? 'bottom-start' : 'right-start'}
      panelClassName="w-72"
      trigger={({ toggle, ...aria }) => (
        <button
          type="button"
          onClick={toggle}
          {...aria}
          className="group relative flex w-full items-center justify-center gap-2.5 rounded-lg p-1.5 text-left ring-1 ring-white/10 transition-colors ring-inset hover:bg-white/5 lg:justify-start lg:bg-white/[0.03] lg:p-2"
          aria-label={`Switch company — currently ${company.name}`}
        >
          <CompanyLogo company={company} size={wide ? 32 : 34} />
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-[13px] font-semibold text-white">{company.name}</span>
            <span className="block truncate text-[11px] text-slate-400">
              {employer.name} · {employer.title}
            </span>
          </span>
          <ChevronsUpDown className="hidden size-4 shrink-0 text-slate-500 lg:block" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <div>
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Demo persona · company
          </p>
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
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-100',
                    active && 'bg-indigo-50/60',
                  )}
                >
                  <CompanyLogo company={e.company} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">{e.company.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {e.name} · {e.title}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Popover>
  );
}

function SidebarChallenges() {
  const { data } = useDashboard();
  const active = (data?.challenges ?? []).filter((c) => c.status !== 'awarded').slice(0, 7);
  if (active.length === 0) return null;
  return (
    <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3 scrollbar-dark">
      <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Active challenges</p>
      <div className="flex flex-col gap-0.5">
        {active.map((c) => {
          const awaiting = Math.max(0, c.submissionCount - c.scoredCount);
          return (
            <NavLink
              key={c.id}
              to={`/challenges/${c.id}`}
              className={({ isActive }) =>
                cn(
                  'flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )
              }
              title={c.title}
            >
              <TypeIcon type={c.type} className="size-3.5 shrink-0 opacity-80" />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              {awaiting > 0 && (
                <span className="rounded-full bg-amber-400/15 px-1.5 text-[11px] font-semibold text-amber-300 tabular-nums">
                  {awaiting}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

function LiveIndicator() {
  const status = useLiveStatus();
  const label = status === 'live' ? 'Live' : status === 'connecting' ? 'Connecting…' : 'Offline';
  const detail =
    status === 'live'
      ? 'Real-time updates on'
      : status === 'connecting'
        ? 'Reconnecting to the API'
        : 'Real-time updates paused';
  return (
    <div
      className="group relative flex h-9 items-center justify-center gap-2 rounded-lg text-xs lg:justify-start lg:px-3"
      aria-live="polite"
      title={detail}
    >
      <span className="relative flex size-2.5 shrink-0">
        {status === 'live' && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span
          className={cn(
            'relative inline-flex size-2.5 rounded-full',
            status === 'live' ? 'bg-emerald-400' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-400',
          )}
        />
      </span>
      <span className="hidden lg:inline">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className="text-slate-500"> · {detail}</span>
      </span>
      <RailTooltip>{`${label} · ${detail}`}</RailTooltip>
    </div>
  );
}
