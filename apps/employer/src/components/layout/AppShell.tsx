import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { API_URL } from '@/lib/api';
import { LiveEventsProvider } from '@/lib/events';
import { usePersona } from '@/lib/persona';
import { queryClient, qk, useHealth } from '@/lib/queries';
import { applySeedId } from '@/lib/stores';
import { EmployerPill, LogoMark, Wordmark } from '../brand';
import { Button, Card, Spinner } from '../ui';
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
        className="sr-only z-[100] rounded-[var(--borderRadiusMedium)] bg-white px-3 py-2 text-sm font-semibold shadow-[var(--shadow16)] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div key={personaId} className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main id="main" className="@container min-w-0 flex-1 p-4 min-[760px]:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </LiveEventsProvider>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy aria-label="Loading">
      <Spinner className="size-8" />
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
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-2">
          <LogoMark />
          <Wordmark />
          <EmployerPill />
        </div>
        <h1 className="mt-6 text-xl font-semibold">Can’t reach the API</h1>
        <p className="mt-1 text-sm text-slate-700">
          {error ? 'No answer from ' : 'No employers at '}
          <code className="font-mono">{API_URL}</code>. Retrying…
        </p>
        <Button className="mt-5" variant="primary" onClick={() => void queryClient.refetchQueries({ queryKey: qk.personas })}>
          Retry now
        </Button>
      </Card>
    </div>
  );
}
