import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search } from '@/components/icons';
import { CHALLENGE_TYPES, TYPE_META, type ChallengeType, type StudentListItem } from '@shared/types';
import { useDocumentTitle } from '@/lib/hooks';
import { useStudents } from '@/lib/queries';
import { Avatar } from '@/components/brand';
import { Card, EmptyState, ErrorState, Input, PageHeader, Skeleton, cn, selectClass } from '@/components/ui';

export function TalentPage() {
  useDocumentTitle('Talent');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const type = (params.get('type') ?? '') as ChallengeType | '';
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

  const students = useStudents({ q, type, minScore: 0, openToWork: false, sort: 'hours' });
  const list = students.data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Talent" meta={students.data ? `${list.length} students` : undefined} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <Input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Name, school or skill"
            aria-label="Search students"
            className="pl-8"
          />
        </div>
        <select
          value={type}
          onChange={(e) => update({ type: e.target.value || null })}
          aria-label="Field"
          className={cn(selectClass, 'w-40')}
        >
          <option value="">All fields</option>
          {CHALLENGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_META[t].label}
            </option>
          ))}
        </select>
      </div>

      {students.isPending ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </Card>
      ) : students.isError ? (
        <ErrorState error={students.error} onRetry={() => students.refetch()} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState title="No students match" />
        </Card>
      ) : (
        <Card className={cn('@container overflow-hidden', students.isFetching && 'opacity-70')}>
          <ul>
            {list.map((s) => (
              <TalentRow key={s.id} student={s} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function TalentRow({ student: s }: { student: StudentListItem }) {
  return (
    <li className="border-b border-slate-200 last:border-0">
      <Link
        to={`/candidates/${s.handle || s.id}`}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--colorNeutralBackground1Hover)]"
      >
        <Avatar name={s.name} color={s.avatarColor} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{s.name}</span>
          <span className="block truncate text-xs text-slate-500">
            {s.university} · {s.major}
          </span>
        </span>
        <span className="w-16 text-right text-sm tabular-nums">{s.stats.verifiedHours} h</span>
        <span className="hidden w-16 text-right text-sm tabular-nums @md:inline">
          {s.stats.avgScore != null ? `avg ${s.stats.avgScore}` : '–'}
        </span>
      </Link>
    </li>
  );
}
