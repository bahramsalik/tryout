import { Briefcase, Check, ChevronDown, Copy, ExternalLink, Sparkles, UserRound } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { toast } from 'sonner';
import { DEFAULT_PERSONA, isApiError } from '@/lib/api';
import { useCoach } from '@/lib/coach';
import { cn } from '@/lib/cn';
import { useLive } from '@/lib/events';
import { usePersona } from '@/lib/persona';
import { useMe, usePersonas } from '@/lib/queries';
import { useDismiss } from '@/lib/useDismiss';
import { Avatar, Logo } from './brand';
import { CoachPanel } from './CoachPanel';
import { NotificationBell } from './NotificationBell';
import { Skeleton } from './ui';

const EMPLOYER_SITE = 'http://localhost:5174';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore', end: false },
  { to: '/work', label: 'My work', end: false },
  { to: '/profile', label: 'Profile', end: false },
];

function LiveDot() {
  const { status } = useLive();
  const label = status === 'live' ? 'Live' : status === 'connecting' ? 'Connecting' : 'Reconnecting';
  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold lg:inline-flex',
        status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      )}
      title={status === 'live' ? 'Real-time updates are on' : 'Trying to reach the live event stream…'}
    >
      <span className="relative flex size-2">
        {status === 'live' ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /> : null}
        <span className={cn('relative inline-flex size-2 rounded-full', status === 'live' ? 'bg-emerald-500' : 'bg-amber-500')} />
      </span>
      {label}
    </span>
  );
}

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

  const copyLink = async () => {
    if (!student) return;
    const url = `${window.location.origin}/p/${student.handle}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public profile link copied', { description: url });
    } catch {
      toast(url, { description: 'Copy this link to share your Proof Profile.' });
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('flex items-center gap-1.5 rounded-xl p-1 pr-1.5 transition hover:bg-slate-100', open && 'bg-slate-100')}
        aria-label="Account and persona menu"
        aria-expanded={open}
      >
        {student ? <Avatar name={student.name} color={student.avatarColor} size={32} /> : <Skeleton className="size-8 rounded-full" />}
        <ChevronDown className={cn('size-4 text-slate-400 transition', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-24px))] animate-pop-in overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          {student ? (
            <div className="flex items-center gap-3 border-b border-line bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3.5">
              <Avatar name={student.name} color={student.avatarColor} size={40} />
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">{student.name}</div>
                <div className="truncate text-xs text-slate-500">{student.university}</div>
              </div>
            </div>
          ) : null}
          <div className="p-1.5">
            <Link to="/profile" onClick={close} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <UserRound className="size-4 text-slate-400" aria-hidden /> My Proof Profile
            </Link>
            <button onClick={copyLink} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Copy className="size-4 text-slate-400" aria-hidden /> Copy public profile link
            </button>
          </div>
          <div className="border-t border-line p-1.5">
            <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Demo persona</div>
            <div className="max-h-64 overflow-y-auto">
              {personas.isLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setPersonaId(s.id);
                      setOpen(false);
                      if (s.id !== personaId) toast(`Now viewing as ${s.name}`, { icon: '👤' });
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50',
                      s.id === personaId && 'bg-indigo-50/70',
                    )}
                  >
                    <Avatar name={s.name} color={s.avatarColor} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">{s.major}</span>
                    </span>
                    {s.id === personaId ? <Check className="size-4 text-indigo-600" aria-label="Current" /> : null}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="border-t border-line p-1.5">
            <a
              href={EMPLOYER_SITE}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Briefcase className="size-4 text-slate-400" aria-hidden /> Tryout for Employers
              <ExternalLink className="ml-auto size-3.5 text-slate-400" aria-hidden />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TopNav() {
  const coach = useCoach();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3">
        <Link to="/" className="mr-1 shrink-0 rounded-lg" aria-label="Tryout home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-2.5 py-2 text-sm font-semibold transition md:px-3',
                  isActive ? 'text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? <span className="absolute inset-x-2.5 -bottom-[13px] h-[3px] rounded-full brand-gradient md:inset-x-3" /> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <LiveDot />
          <button
            onClick={() => coach.open()}
            className="group inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100 transition hover:from-indigo-100 hover:to-violet-100 hover:ring-indigo-200"
          >
            <Sparkles className="size-4 transition group-hover:rotate-12" aria-hidden />
            <span className="hidden md:inline">Ask Coach</span>
            <span className="md:hidden">Coach</span>
          </button>
          <NotificationBell />
          <PersonaMenu />
        </div>
      </div>
      {/* Phones: nav links get their own row. */}
      <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-3 py-1.5 sm:hidden no-scrollbar" aria-label="Main">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold',
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <main key={pathname.split('/')[1] ?? ''} className="mx-auto w-full max-w-6xl flex-1 animate-fade-up px-4 pb-16 pt-6 sm:pt-8">
        <Outlet />
      </main>
      <footer className="border-t border-line/70 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500">
          <span>
            <span className="font-bold text-ink">tryout</span> · Real work. Real pay. Real proof.
          </span>
          <span>Bounties escrowed · Feedback guaranteed · You keep your IP unless paid</span>
        </div>
      </footer>
      <CoachPanel />
      <ScrollRestoration />
    </div>
  );
}
