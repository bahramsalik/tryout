import { Link } from 'react-router';
import type { ChallengeView } from '@shared/types';
import { cn } from '@/lib/cn';
import { ChallengeMeta, CompanyLogo, rewardLabel } from './brand';
import { Badge, Skeleton } from './ui';

export function ViewerBadge({ challenge }: { challenge: ChallengeView }) {
  const v = challenge.viewer;
  if (!v) return null;
  if (v.submissionId) {
    const done = v.submissionStatus === 'awarded' || v.submissionStatus === 'not_selected';
    return <Badge color={done ? 'success' : 'brand'}>{done ? 'Result' : 'Submitted'}</Badge>;
  }
  if (v.joined) return <Badge color="brand">Joined</Badge>;
  return null;
}

export function ChallengeCard({ challenge: c, fresh, className }: { challenge: ChallengeView; fresh?: boolean; className?: string }) {
  return (
    <Link
      to={`/challenges/${c.id}`}
      className={cn(
        'group flex flex-col gap-3 rounded-lg bg-bg1 p-4 shadow-4 transition-shadow hover:shadow-8',
        fresh && 'outline-2 outline-brand',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <CompanyLogo company={c.company} size={24} />
        <span className="min-w-0 flex-1 truncate text-caption text-fg2">{c.company?.name ?? 'Tryout Practice'}</span>
        {fresh ? <Badge color="brand" appearance="filled">New</Badge> : <ViewerBadge challenge={c} />}
      </div>
      <h3 className="line-clamp-2 text-subtitle2 font-semibold text-fg1 group-hover:text-brand-fg2">{c.title}</h3>
      <ChallengeMeta c={c} className="mt-auto" />
    </Link>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-bg1 p-4 shadow-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-6" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

/** Compact card used in the Coach panel. */
export function MiniChallengeCard({ challenge: c, onNavigate }: { challenge: ChallengeView; onNavigate?: () => void }) {
  return (
    <Link
      to={`/challenges/${c.id}`}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-md border border-stroke2 bg-bg1 p-3 transition-colors hover:bg-bg1-hover"
    >
      <CompanyLogo company={c.company} size={32} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-body font-semibold text-fg1">{c.title}</div>
        <div className="truncate text-caption text-fg3">
          {c.company?.name ?? 'Tryout Practice'} · {rewardLabel(c)} · ~{c.estHours} h
        </div>
      </div>
      <ViewerBadge challenge={c} />
    </Link>
  );
}
