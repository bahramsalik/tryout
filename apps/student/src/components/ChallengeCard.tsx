import { CircleCheck, Clock, Sparkles, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router';
import type { ChallengeView } from '@shared/types';
import { cn } from '@/lib/cn';
import { Countdown, CompanyLogo, DifficultyBadge, HiringTag, RewardBadge, SpotsBar, TypeChip } from './brand';
import { Skeleton } from './ui';

export function ViewerPill({ challenge, className }: { challenge: ChallengeView; className?: string }) {
  const v = challenge.viewer;
  if (!v) return null;
  if (v.submissionId) {
    const done = v.submissionStatus === 'awarded' || v.submissionStatus === 'not_selected';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
          done ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
          className,
        )}
      >
        <CircleCheck className="size-3" aria-hidden />
        {done ? 'Results in' : 'Submitted'}
      </span>
    );
  }
  if (v.joined) {
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700', className)}>
        <UserRoundCheck className="size-3" aria-hidden />
        Joined
      </span>
    );
  }
  return null;
}

export function ChallengeCard({ challenge: c, fresh, className }: { challenge: ChallengeView; fresh?: boolean; className?: string }) {
  const practice = c.kind === 'practice';
  return (
    <Link
      to={`/challenges/${c.id}`}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-line/80 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lift',
        fresh && 'animate-fresh border-violet-300',
        className,
      )}
    >
      {fresh ? (
        <span className="absolute -top-2.5 right-4 inline-flex animate-pop-in items-center gap-1 rounded-full brand-gradient px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md">
          <Sparkles className="size-3" aria-hidden /> Just posted
        </span>
      ) : null}
      <div className="flex items-center gap-2.5">
        <CompanyLogo company={c.company} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{c.company?.name ?? 'Tryout Practice'}</div>
          <div className="truncate text-xs text-slate-500">{practice ? 'Practice arena · Coach review' : c.company?.industry}</div>
        </div>
        <TypeChip type={c.type} size="sm" />
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-indigo-700">
        {c.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{c.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
          <Clock className="size-3.5 text-slate-400" aria-hidden />~{c.estHours} h
        </span>
        <DifficultyBadge difficulty={c.difficulty} />
        {c.hiringFor ? <HiringTag role={c.hiringFor} short /> : null}
        <ViewerPill challenge={c} />
      </div>

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RewardBadge challenge={c} size="sm" />
          {practice ? (
            <span className="text-xs text-slate-500">
              <span className="font-semibold tabular-nums text-slate-700">{c.participantCount}</span> practiced
            </span>
          ) : (
            <Countdown deadline={c.deadline} />
          )}
        </div>
        {!practice ? <SpotsBar className="mt-3" participantCount={c.participantCount} applicantCap={c.applicantCap} /> : null}
      </div>
    </Link>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-line/80 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-11/12" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-5/6" />
      <div className="mt-5 flex justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
    </div>
  );
}

/** Compact card used inside the Coach panel and on narrow rows. */
export function MiniChallengeCard({ challenge: c, onNavigate }: { challenge: ChallengeView; onNavigate?: () => void }) {
  return (
    <Link
      to={`/challenges/${c.id}`}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-xl border border-line bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-soft"
    >
      <CompanyLogo company={c.company} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <span className="truncate">{c.company?.name ?? 'Tryout Practice'}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">~{c.estHours} h</span>
        </div>
        <div className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink group-hover:text-indigo-700">{c.title}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <TypeChip type={c.type} size="sm" />
          <RewardBadge challenge={c} size="sm" />
        </div>
      </div>
    </Link>
  );
}
