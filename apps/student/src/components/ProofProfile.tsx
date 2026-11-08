import { Link } from 'react-router';
import type { ProfileHistoryItem, StudentProfile } from '@shared/types';
import { CompanyLogo, Placements, RankBadge, StatTile } from './brand';
import { SkillsRadar } from './SkillsRadar';
import { Avatar, Badge, Card, EmptyState, SectionTitle, Skeleton } from './ui';

function HistoryRow({ h, linkable }: { h: ProfileHistoryItem; linkable: boolean }) {
  const published = h.totalScore !== null;
  const title = linkable ? (
    <Link to={`/challenges/${h.challengeId}`} className="block truncate text-body font-semibold text-fg1 hover:text-brand-fg2">
      {h.challengeTitle}
    </Link>
  ) : (
    <span className="block truncate text-body font-semibold text-fg1">{h.challengeTitle}</span>
  );
  return (
    <li className="flex items-center gap-3 py-3">
      <CompanyLogo company={h.company} size={32} />
      <div className="min-w-0 flex-1">
        {title}
        <div className="flex min-w-0 gap-1 text-caption text-fg3">
          <span className="shrink-0">{h.company?.name ?? 'Practice'}</span>
          {h.feedbackExcerpt ? <span className="truncate">· {h.feedbackExcerpt}</span> : null}
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-2">
        {!published ? <Badge color="brand">Under review</Badge> : null}
        <RankBadge rank={h.rank} />
        {published ? <span className="w-8 text-right text-subtitle2 font-semibold tabular-nums">{h.totalScore}</span> : null}
      </span>
    </li>
  );
}

export function ProofProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[84px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}

export function ProofProfile({ profile: p, publicView }: { profile: StudentProfile; publicView?: boolean }) {
  const s = p.stats;
  const history = [...p.history].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Avatar name={p.name} size={64} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-title2 font-semibold text-fg1">{p.name}</h1>
            {p.openToWork ? <Badge color="success">Open to work</Badge> : null}
          </div>
          <p className="text-body text-fg2">
            {p.university} · {p.major} · {p.gradYear}
          </p>
          {p.bio ? <p className="mt-1 line-clamp-1 text-body text-fg3">{p.bio}</p> : null}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Verified hours" value={s.verifiedHours} />
        <StatTile label="Tasks" value={s.tasksCompleted} />
        <StatTile label="Avg score" value={s.avgScore ?? '–'} />
        <StatTile label="Placements" value={<Placements {...s.placements} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="min-w-0 p-5">
          <SectionTitle>Skills</SectionTitle>
          {s.typeScores.length > 0 ? <SkillsRadar stats={s} /> : <p className="py-8 text-center text-body text-fg3">No scored work yet</p>}
        </Card>

        <Card className="min-w-0 px-5 pt-5">
          <SectionTitle className="mb-0">History</SectionTitle>
          {history.length === 0 ? (
            <EmptyState title="No work yet" className="my-5" />
          ) : (
            <ul className="divide-y divide-stroke2">
              {history.map((h) => (
                <HistoryRow key={h.submissionId} h={h} linkable={!publicView} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
