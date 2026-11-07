import { Search20Regular } from '@fluentui/react-icons';
import { useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { CHALLENGE_TYPES, TYPE_META, type ChallengeKind, type ChallengeType } from '@shared/types';
import { typeIcon } from '@/components/brand';
import { ChallengeCard, ChallengeCardSkeleton } from '@/components/ChallengeCard';
import { EmptyState, ErrorState, Input, PageHeader, TabList } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useLive } from '@/lib/events';
import { sortChallenges } from '@/lib/derive';
import { useChallenges } from '@/lib/queries';

function isType(v: string | null): v is ChallengeType {
  return Boolean(v && (CHALLENGE_TYPES as readonly string[]).includes(v));
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-body transition-colors',
        active ? 'border-brand bg-brand-bg2 font-semibold text-brand-fg2' : 'border-stroke1 bg-bg1 text-fg2 hover:bg-bg1-hover hover:text-fg1',
      )}
    >
      {children}
    </button>
  );
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const challenges = useChallenges();
  const { freshIds } = useLive();

  const mode: ChallengeKind = params.get('mode') === 'practice' ? 'practice' : 'live';
  const type = isType(params.get('type')) ? (params.get('type') as ChallengeType) : null;
  const q = params.get('q') ?? '';

  const update = (patch: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null || v === '') next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  const all = challenges.data;
  const inMode = useMemo(() => (all ?? []).filter((c) => c.kind === mode && c.status === 'open'), [all, mode]);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of inMode) m[c.type] = (m[c.type] ?? 0) + 1;
    return m;
  }, [inMode]);
  const liveCount = (all ?? []).filter((c) => c.kind === 'live' && c.status === 'open').length;
  const practiceCount = (all ?? []).filter((c) => c.kind === 'practice' && c.status === 'open').length;

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = inMode.filter((c) => {
      if (type && c.type !== type) return false;
      if (needle) {
        const hay = [c.title, c.summary, c.company?.name ?? 'tryout practice', c.type, ...c.skills, ...c.classroomConcepts.map((x) => x.concept)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    // New challenges that arrive live go first, then live = soonest deadline, practice = newest.
    const sorted = sortChallenges(filtered, mode === 'live' ? 'deadline' : 'newest');
    return [...sorted.filter((c) => freshIds.has(c.id)), ...sorted.filter((c) => !freshIds.has(c.id))];
  }, [inMode, type, mode, q, freshIds]);

  return (
    <div className="space-y-4">
      <PageHeader title="Explore" />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stroke2">
        <TabList<ChallengeKind>
          ariaLabel="Challenge kind"
          value={mode}
          onChange={(k) => update({ mode: k === 'live' ? null : 'practice', type: null })}
          items={[
            { value: 'live', label: 'Live', count: challenges.isLoading ? undefined : liveCount },
            { value: 'practice', label: 'Practice', count: challenges.isLoading ? undefined : practiceCount },
          ]}
          className="-mb-px"
        />
        <div className="relative mb-2 w-full sm:w-64">
          <Search20Regular className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-fg3" aria-hidden />
          <Input type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search" aria-label="Search challenges" className="pl-8" />
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Field">
        <Pill active={!type} onClick={() => update({ type: null })}>
          All <span className="tabular-nums text-fg3">{inMode.length}</span>
        </Pill>
        {CHALLENGE_TYPES.filter((t) => counts[t]).map((t) => {
          const Icon = typeIcon(t);
          return (
            <Pill key={t} active={type === t} onClick={() => update({ type: type === t ? null : t })}>
              <Icon aria-hidden />
              {TYPE_META[t].label} <span className="tabular-nums text-fg3">{counts[t]}</span>
            </Pill>
          );
        })}
      </div>

      {challenges.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ChallengeCardSkeleton key={i} />
          ))}
        </div>
      ) : challenges.isError ? (
        <ErrorState message={errorMessage(challenges.error)} onRetry={() => void challenges.refetch()} />
      ) : results.length === 0 ? (
        <EmptyState title="No matches" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <ChallengeCard key={c.id} challenge={c} fresh={freshIds.has(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
