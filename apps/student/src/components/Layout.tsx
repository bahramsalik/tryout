import { Checkmark16Regular, ChevronDown16Regular, Sparkle20Regular } from '@fluentui/react-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { DEFAULT_PERSONA, isApiError } from '@/lib/api';
import { useCoach } from '@/lib/coach';
import { cn } from '@/lib/cn';
import { usePersona } from '@/lib/persona';
import { useMe, usePersonas } from '@/lib/queries';
import { useDismiss } from '@/lib/useDismiss';
import { Logo } from './brand';
import { CoachPanel } from './CoachPanel';
import { NotificationBell } from './NotificationBell';
import { Avatar, Button, Skeleton } from './ui';

const NAV = [
  { to: '/explore', label: 'Explore' },
  { to: '/work', label: 'My work' },
  { to: '/profile', label: 'Profile' },
];

function PersonaMenu() {
  const me = useMe();
  const personas = usePersonas();
  const { personaId, setPersonaId } = usePersona();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  // A stale persona in localStorage (e.g. after a reseed) falls back to Maya.
  useEffect(() => {
    if (me.isError && isApiError(me.error) && [401, 403, 404].includes(me.error.status) && personaId !== DEFAULT_PERSONA) {
      setPersonaId(DEFAULT_PERSONA);
    }
  }, [me.isError, me.error, personaId, setPersonaId]);

  const student = me.data?.kind === 'student' ? me.data.student : undefined;
  const students = personas.data?.students ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('flex h-8 items-center gap-1 rounded-md pl-0.5 pr-1 transition-colors hover:bg-bg1-hover', open && 'bg-bg1-selected')}
        aria-label="Switch persona"
        aria-expanded={open}
      >
        {student ? <Avatar name={student.name} size={28} /> : <Skeleton className="size-7 rounded-full" />}
        <ChevronDown16Regular className="text-fg3" aria-hidden />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-10 z-50 w-[min(280px,calc(100vw-24px))] rounded-lg bg-bg1 p-1 shadow-16">
          {personas.isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            students.map((s) => (
              <button
                key={s.id}
                role="menuitemradio"
                aria-checked={s.id === personaId}
                onClick={() => {
                  setPersonaId(s.id);
                  setOpen(false);
                }}
                className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-bg1-hover"
              >
                <Avatar name={s.name} size={24} />
                <span className="min-w-0 flex-1 truncate text-body text-fg1">{s.name}</span>
                {s.id === personaId ? <Checkmark16Regular className="text-brand-fg1" aria-hidden /> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function TopBar() {
  const coach = useCoach();
  return (
    <header className="sticky top-0 z-30 border-b border-stroke2 bg-bg1">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-4 sm:gap-4 sm:px-6">
        <Link to="/" className="mr-2 shrink-0" aria-label="Tryout home">
          <Logo />
        </Link>
        <nav className="flex h-full items-stretch gap-1 overflow-x-auto no-scrollbar" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex shrink-0 items-center px-2 text-body transition-colors sm:px-3',
                  isActive ? 'font-semibold text-fg1' : 'text-fg2 hover:text-fg1',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-brand sm:inset-x-3" aria-hidden /> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button appearance="subtle" icon={Sparkle20Regular} onClick={() => coach.open()} className="min-w-0 max-sm:w-8 max-sm:px-0" aria-label="Coach">
            <span className="max-sm:hidden">Coach</span>
          </Button>
          <NotificationBell />
          <PersonaMenu />
        </div>
      </div>
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 min-[760px]:px-6">
        <Outlet />
      </main>
      <CoachPanel />
      <ScrollRestoration />
    </div>
  );
}
