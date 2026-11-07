import { ArrowRight, Dumbbell, LayoutGrid, Search, SearchX, Sparkles, Trophy, X } from 'lucide-react';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { CHALLENGE_TYPES, DIFFICULTY_LABEL, TYPE_META, type ChallengeKind, type ChallengeType, type Difficulty } from '@shared/types';
import { typeIcon } from '@/components/brand';
import { ChallengeCard, ChallengeCardSkeleton } from '@/components/ChallengeCard';
import { Button, EmptyState, ErrorState } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useCoach } from '@/lib/coach';
import { cn } from '@/lib/cn';
import { useLive } from '@/lib/events';
import { SORT_LABEL, sortChallenges, type SortKey } from '@/lib/derive';
import { useChallenges } from '@/lib/queries';

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

function isType(v: string | null): v is ChallengeType {
  return Boolean(v && (CHALLENGE_TYPES as readonly string[]).includes(v));
}

function FieldTile({
  type,
  count,
  active,
  onClick,
}: {
  type: ChallengeType;
  count: number | null;
  active: boolean;
  onClick: () => void;
}) {
  const meta = TYPE_META[type];
  const Icon = typeIcon(type);
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group relative flex flex-col items-start rounded-2xl border bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        active ? 'border-transparent shadow-lift ring-2' : 'border-line/80 shadow-soft',
      )}
      style={active ? ({ '--tw-ring-color': meta.color, backgroundColor: meta.softBg } as CSSProperties) : undefined}
    >
      <span
        className="grid size-10 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: active ? '#fff' : meta.softBg, color: meta.color }}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="mt-2.5 text-sm font-bold text-ink">{meta.label}</span>
      <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">{meta.blurb}</span>
      <span className="mt-2 text-xs font-semibold tabular-nums" style={{ color: meta.color }}>
        {count === null ? <span className="inline-block h-3.5 w-12 animate-pulse rounded bg-slate-200/70" /> : `${count} open`}
      </span>
    </button>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-xl bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-xs font-semibold transition',
            value === o.value ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const challenges = useChallenges();
  const coach = useCoach();
  const { freshIds } = useLive();

  const mode: ChallengeKind = params.get('mode') === 'practice' ? 'practice' : 'live';
  const type = isType(params.get('type')) ? (params.get('type') as ChallengeType) : null;
  const difficulty = (DIFFICULTIES as string[]).includes(params.get('difficulty') ?? '') ? (params.get('difficulty') as Difficulty) : null;
  const time = params.get('time') === '3' ? 3 : params.get('time') === '5' ? 5 : null;
  const bountyOnly = params.get('bounty') === '1';
  const q = params.get('q') ?? '';
  const sort: SortKey = (Object.keys(SORT_LABEL) as SortKey[]).includes(params.get('sort') as SortKey) ? (params.get('sort') as SortKey) : 'newest';

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
      if (difficulty && c.difficulty !== difficulty) return false;
      if (time && c.estHours > time) return false;
      if (bountyOnly && mode === 'live' && c.rewardTotal <= 0) return false;
      if (needle) {
        const hay = [c.title, c.summary, c.company?.name ?? 'tryout practice', c.type, ...c.skills, ...c.classroomConcepts.map((x) => x.concept)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    return sortChallenges(filtered, sort);
  }, [inMode, type, difficulty, time, bountyOnly, mode, q, sort]);

  const anyFilter = Boolean(type || difficulty || time || bountyOnly || q);
  const clearFilters = () => update({ type: null, difficulty: null, time: null, bounty: null, q: null });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Explore</h1>
          <p className="mt-1 text-[15px] text-slate-500">Real tasks from real teams. 3–5 hours each, and every submission gets feedback.</p>
        </div>
      </header>

      <section aria-labelledby="fields-h">
        <h2 id="fields-h" className="mb-3 text-[13px] font-bold uppercase tracking-wider text-slate-400">
          Browse by field
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {CHALLENGE_TYPES.map((t) => (
            <FieldTile
              key={t}
              type={t}
              count={challenges.isLoading ? null : (counts[t] ?? 0)}
              active={type === t}
              onClick={() => update({ type: type === t ? null : t })}
            />
          ))}
          <button
            onClick={() => update({ type: null })}
            aria-pressed={!type}
            className={cn(
              'flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
              !type ? 'border-transparent bg-ink text-white shadow-lift' : 'border-line/80 bg-white shadow-soft',
            )}
          >
            <span className={cn('grid size-10 place-items-center rounded-xl', !type ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600')}>
              <LayoutGrid className="size-5" aria-hidden />
            </span>
            <span className={cn('mt-2.5 text-sm font-bold', !type ? 'text-white' : 'text-ink')}>All fields</span>
            <span className={cn('mt-0.5 line-clamp-2 text-xs leading-snug', !type ? 'text-slate-300' : 'text-slate-500')}>Every open task, across all 7 fields.</span>
            <span className={cn('mt-2 text-xs font-semibold tabular-nums', !type ? 'text-white' : 'text-slate-600')}>{challenges.isLoading ? '…' : `${inMode.length} open`}</span>
          </button>
        </div>
      </section>

      <button
        onClick={() => coach.open({ challengeId: null })}
        className="group flex w-full items-center gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 p-4 text-left transition hover:border-indigo-200 hover:shadow-soft"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl brand-gradient text-white shadow-md">
          <Sparkles className="size-5 transition group-hover:rotate-12" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-ink">Not sure where to start? Ask Coach.</span>
          <span className="block text-sm text-slate-500">Tell Coach the role you want and get a learning path plus 3 matching tasks.</span>
        </span>
        <span className="hidden items-center gap-1 text-sm font-semibold text-indigo-700 sm:inline-flex">
          Ask Coach <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </button>

      <section aria-label="Challenges" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Challenge kind" className="inline-flex rounded-2xl bg-slate-100 p-1">
            {(
              [
                { k: 'live', label: 'Live challenges', icon: Trophy, n: liveCount },
                { k: 'practice', label: 'Practice arena', icon: Dumbbell, n: practiceCount },
              ] as const
            ).map((o) => {
              const active = mode === o.k;
              return (
                <button
                  key={o.k}
                  role="tab"
                  aria-selected={active}
                  onClick={() => update({ mode: o.k === 'live' ? null : 'practice', bounty: null })}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
                    active ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink',
                  )}
                >
                  <o.icon className={cn('size-4', active && (o.k === 'live' ? 'text-amber-500' : 'text-emerald-500'))} aria-hidden />
                  {o.label}
                  <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600')}>
                    {challenges.isLoading ? '–' : o.n}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search tasks, skills, companies…"
              aria-label="Search challenges"
              className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:shadow-glow"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value === 'newest' ? null : e.target.value })}
              className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink shadow-sm outline-none focus:border-indigo-300 focus:shadow-glow"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            onClick={() => update({ type: null })}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              !type ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            All fields
          </button>
          {CHALLENGE_TYPES.map((t) => {
            const meta = TYPE_META[t];
            const Icon = typeIcon(t);
            const active = type === t;
            return (
              <button
                key={t}
                onClick={() => update({ type: active ? null : t })}
                aria-pressed={active}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  active ? 'border-transparent text-white' : 'border-line bg-white text-slate-600 hover:border-slate-300',
                )}
                style={active ? { backgroundColor: meta.color } : undefined}
              >
                <Icon className="size-3.5" style={active ? undefined : { color: meta.color }} aria-hidden />
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Difficulty"
            value={difficulty ?? 'any'}
            onChange={(v) => update({ difficulty: v === 'any' ? null : v })}
            options={[{ value: 'any', label: 'Any level' }, ...DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))]}
          />
          <Segmented
            ariaLabel="Time"
            value={time ? String(time) : 'any'}
            onChange={(v) => update({ time: v === 'any' ? null : v })}
            options={[
              { value: 'any', label: 'Any length' },
              { value: '3', label: '≤ 3 h' },
              { value: '5', label: '≤ 5 h' },
            ]}
          />
          {mode === 'live' ? (
            <button
              onClick={() => update({ bounty: bountyOnly ? null : '1' })}
              aria-pressed={bountyOnly}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition',
                bountyOnly ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-line bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              <span aria-hidden>💰</span> Bounty only
            </button>
          ) : null}
          {anyFilter ? (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
              <X className="size-3.5" aria-hidden /> Clear filters
            </button>
          ) : null}
          <span className="ml-auto text-xs font-medium text-slate-500" aria-live="polite">
            {challenges.isLoading ? 'Loading…' : `${results.length} ${mode === 'live' ? 'live challenge' : 'practice task'}${results.length === 1 ? '' : 's'}`}
          </span>
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
          <EmptyState
            icon={SearchX}
            title={anyFilter ? 'No challenges match those filters' : mode === 'live' ? 'No live challenges right now' : 'No practice tasks yet'}
            action={
              anyFilter ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : mode === 'live' ? (
                <Button variant="soft" size="sm" onClick={() => update({ mode: 'practice' })}>
                  Try the Practice arena
                </Button>
              ) : null
            }
          >
            {anyFilter ? 'Try another field or loosen a filter.' : 'New challenges appear here the moment employers post them.'}
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <ChallengeCard key={c.id} challenge={c} fresh={freshIds.has(c.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
