import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { BadgeCheck, Clock, Search, SearchX, Users } from 'lucide-react';
import { CHALLENGE_TYPES, TYPE_META, type ChallengeType, type StudentListItem } from '@shared/types';
import { money, plural } from '@/lib/format';
import { useDocumentTitle } from '@/lib/hooks';
import { useStudents, type StudentQuery } from '@/lib/queries';
import { Avatar, ScorePill, TypeIcon } from '@/components/brand';
import { Card, EmptyState, ErrorState, Skeleton, Switch, cn } from '@/components/ui';

const SORTS: { value: NonNullable<StudentQuery['sort']>; label: string }[] = [
  { value: 'hours', label: 'Verified hours' },
  { value: 'score', label: 'Average score' },
  { value: 'placements', label: 'Placements' },
];

export function TalentPage() {
  useDocumentTitle('Talent');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const type = (params.get('type') ?? '') as ChallengeType | '';
  const minScore = Number(params.get('minScore') ?? 0) || 0;
  const openToWork = params.get('open') === '1';
  const sort = (params.get('sort') ?? 'hours') as NonNullable<StudentQuery['sort']>;
  const [text, setText] = useState(q);

  useEffect(() => setText(q), [q]);
  // Debounce typing into the URL (which drives the query).
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (text.trim() !== q) update({ q: text.trim() || null });
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function update(patch: Record<string, string | null>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v == null || v === '') next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );
  }

  const students = useStudents({ q, type, minScore, openToWork, sort });
  const list = students.data ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Talent</h1>
        <p className="mt-1 text-sm text-slate-500">Students with employer-verified work. Hire on proof, not résumés.</p>
      </header>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Name, school, major or skill"
              aria-label="Search students"
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-8 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
            />
          </div>
          <select
            value={String(minScore)}
            onChange={(e) => update({ minScore: e.target.value === '0' ? null : e.target.value })}
            aria-label="Minimum average score"
            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          >
            <option value="0">Any score</option>
            {[60, 70, 80, 90].map((n) => (
              <option key={n} value={n}>
                Avg. {n}+
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value === 'hours' ? null : e.target.value })}
            aria-label="Sort by"
            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <label className="flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] font-medium text-slate-700">
            <Switch size="sm" checked={openToWork} onChange={(v) => update({ open: v ? '1' : null })} label="Open to work only" />
            Open to work
          </label>
        </div>
        <div className="scrollbar-thin mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          <TypeFilterChip active={!type} onClick={() => update({ type: null })} label="All fields" />
          {CHALLENGE_TYPES.map((t) => (
            <TypeFilterChip key={t} type={t} active={type === t} onClick={() => update({ type: type === t ? null : t })} label={TYPE_META[t].label} />
          ))}
        </div>
      </Card>

      <p className="mt-4 mb-3 text-xs text-slate-500" aria-live="polite">
        {students.isPending ? 'Searching…' : students.isError ? '' : plural(list.length, 'student')}
        {students.isFetching && !students.isPending ? ' · updating…' : ''}
      </p>

      {students.isPending ? (
        <div className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : students.isError ? (
        <Card>
          <ErrorState error={students.error} onRetry={() => students.refetch()} title="Couldn’t load talent" />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchX className="size-5" aria-hidden />}
            title="No students match"
            body="Try a broader search, another field or a lower minimum score."
          />
        </Card>
      ) : (
        <div className={cn('grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3', students.isFetching && 'opacity-70 transition-opacity')}>
          {list.map((s) => (
            <TalentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeFilterChip({ type, active, onClick, label }: { type?: ChallengeType; active: boolean; onClick: () => void; label: string }) {
  const meta = type ? TYPE_META[type] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ring-1 transition-colors ring-inset',
        active ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {type && <TypeIcon type={type} className="size-3.5" style={active ? undefined : { color: meta?.color }} />}
      {label}
    </button>
  );
}

function TalentCard({ student: s }: { student: StudentListItem }) {
  const p = s.stats.placements;
  return (
    <Link
      to={`/candidates/${s.handle || s.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={s.name} color={s.avatarColor} size={42} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900 group-hover:text-primary">
            <span className="truncate">{s.name}</span>
            {s.openToWork && <span className="size-2 shrink-0 rounded-full bg-emerald-500" title="Open to work" aria-label="Open to work" />}
          </p>
          <p className="truncate text-xs text-slate-500">{s.major}</p>
          <p className="truncate text-xs text-slate-500">
            {s.university} · ’{String(s.gradYear).slice(-2)}
          </p>
        </div>
        {s.stats.avgScore != null && <ScorePill score={s.stats.avgScore} />}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-2 py-2 text-center ring-1 ring-slate-100">
        <div>
          <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
            <Clock className="mr-0.5 inline size-3 align-[-2px]" aria-hidden />
            Hours
          </dt>
          <dd className="text-sm font-bold text-slate-900 tabular-nums">{s.stats.verifiedHours}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
            <BadgeCheck className="mr-0.5 inline size-3 align-[-2px]" aria-hidden />
            Tasks
          </dt>
          <dd className="text-sm font-bold text-slate-900 tabular-nums">{s.stats.tasksCompleted}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Earned</dt>
          <dd className={cn('text-sm font-bold tabular-nums', s.stats.bountiesEarned > 0 ? 'text-emerald-700' : 'text-slate-400')}>
            {s.stats.bountiesEarned > 0 ? money(s.stats.bountiesEarned) : '—'}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5">
        {p.first + p.second + p.third > 0 && (
          <span className="mr-1 text-xs font-semibold text-slate-700 tabular-nums" aria-label="Placements">
            {p.first > 0 && `🥇${p.first} `}
            {p.second > 0 && `🥈${p.second} `}
            {p.third > 0 && `🥉${p.third}`}
          </span>
        )}
        {(s.stats.topSkills.length ? s.stats.topSkills : s.skills).slice(0, 3).map((k) => (
          <span key={k} className="inline-flex h-5 items-center rounded bg-slate-100 px-1.5 text-[11px] font-medium text-slate-600">
            {k}
          </span>
        ))}
        {s.stats.tasksCompleted === 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Users className="size-3" aria-hidden /> No employer-scored work yet
          </span>
        )}
      </div>
    </Link>
  );
}
