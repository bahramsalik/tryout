import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ServerCrash } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { LiveEventsProvider } from '@/lib/events';
import { usePersona } from '@/lib/persona';
import { queryClient, qk, useHealth } from '@/lib/queries';
import { applySeedId } from '@/lib/stores';
import { EmployerPill, LogoMark, Wordmark } from '../brand';
import { Button, Skeleton } from '../ui';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const { loading, error, employer, personaId } = usePersona();
  const location = useLocation();
  const health = useHealth();
  const seedId = health.data?.seedId;
  // Before paint, so the first frame already uses clean, seed-scoped local state.
  useLayoutEffect(() => applySeedId(seedId), [seedId]);

  // New page → start at the top (keep scroll when only the query string changes, e.g. tabs).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading || (health.isPending && !error)) return <Splash />;
  if (error || !employer) return <ApiDown error={error} />;

  return (
    <LiveEventsProvider>
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-white px-3 py-2 text-sm font-semibold text-primary shadow-pop focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div key={personaId} className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main id="main" className="@container min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <Outlet />
          </main>
        </div>
      </div>
    </LiveEventsProvider>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh" aria-busy aria-label="Loading Tryout for Employers">
      <div className="flex w-16 shrink-0 flex-col items-center gap-4 bg-sidebar pt-3.5 lg:w-60 lg:items-start lg:px-4">
        <span className="flex items-center gap-2">
          <LogoMark />
          <span className="hidden items-center gap-2 lg:flex">
            <Wordmark dark />
            <EmployerPill />
          </span>
        </span>
        <div className="mt-2 h-10 w-10 rounded-lg bg-white/5 lg:w-full" />
      </div>
      <div className="flex-1">
        <div className="h-14 border-b border-slate-200 bg-white" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-7 w-64" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ApiDown({ error }: { error: unknown }) {
  // Poll until the API comes back, then everything loads by itself.
  useEffect(() => {
    const id = window.setInterval(() => {
      void queryClient.refetchQueries({ queryKey: qk.personas });
      void queryClient.refetchQueries({ queryKey: qk.health });
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-sidebar p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-pop">
        <div className="flex items-center gap-2">
          <LogoMark />
          <Wordmark />
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">for employers</span>
        </div>
        <div className="mt-6 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <ServerCrash className="size-5" aria-hidden />
        </div>
        <h1 className="mt-3 text-lg font-bold text-slate-900">Can’t reach the Tryout API</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {error ? 'The API at ' : 'No employer personas came back from '}
          <code className="rounded bg-slate-100 px-1 text-[13px]">{API_URL}</code>
          {error ? ' isn’t answering.' : '.'} Start it with <code className="rounded bg-slate-100 px-1 text-[13px]">npm --prefix server run dev</code> — this
          page reconnects automatically.
        </p>
        <Button className="mt-5" variant="primary" onClick={() => void queryClient.refetchQueries({ queryKey: qk.personas })}>
          Retry now
        </Button>
      </div>
    </div>
  );
}
