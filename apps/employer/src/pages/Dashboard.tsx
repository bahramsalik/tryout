import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Lock,
  Mail,
  Plus,
  Rocket,
  Trophy,
  UserPlus,
  Activity,
  Layers,
} from 'lucide-react';
import type { ActivityItem, ChallengeView, EmployerDashboard } from '@shared/types';
import { firstName, greeting, money, plural, timeAgo } from '@/lib/format';
import { useDocumentTitle, useNewIds } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { useDashboard } from '@/lib/queries';
import { Countdown, EscrowChip, SpotsBar, StatusBadge, TypeChip, useNow } from '@/components/brand';
import { StatTile } from '@/components/StatTile';
import { ButtonLink, Card, CardHeader, EmptyState, ErrorState, Skeleton, cn } from '@/components/ui';

export function DashboardPage() {
  const { employer, company } = usePersona();
  const { data, isPending, isError, error, refetch } = useDashboard();
  useDocumentTitle('Dashboard');

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {greeting()}, {employer ? firstName(employer.name) : 'there'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? <SummaryLine data={data} /> : company ? company.name : <Skeleton className="inline-block h-4 w-64" />}
          </p>
        </div>
      </header>

      {isError ? (
        <Card>
          <ErrorState error={error} onRetry={() => refetch()} title="Couldn’t load your dashboard" />
        </Card>
      ) : (
        <>
          <Kpis data={data} loading={isPending} />
          <div className="mt-5 grid gap-5 @5xl:grid-cols-[minmax(0,1fr)_20rem]">
            <ChallengesTable challenges={data?.challenges} loading={isPending} />
            <ActivityFeed items={data?.recentActivity} loading={isPending} />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryLine({ data }: { data: EmployerDashboard }) {
  const { kpis, company } = data;
  return (
    <>
      <span className="font-medium text-slate-700">{company.name}</span>
      <span className="text-slate-300"> · </span>
      {plural(kpis.activeChallenges, 'active challenge')}
      <span className="text-slate-300"> · </span>
      {plural(kpis.totalSubmissions, 'submission')}
      <span className="text-slate-300"> · </span>
      {kpis.awaitingReview > 0 ? (
        <span className="font-semibold text-amber-700">{kpis.awaitingReview} need review</span>
      ) : (
        <span className="text-emerald-700">all reviewed</span>
      )}
    </>
  );
}

function Kpis({ data, loading }: { data: EmployerDashboard | undefined; loading: boolean }) {
  const k = data?.kpis;
  const nextReview = data?.challenges
    .filter((c) => c.status !== 'awarded' && c.submissionCount > c.scoredCount)
    .sort((a, b) => b.submissionCount - b.scoredCount - (a.submissionCount - a.scoredCount))[0];

  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @5xl:grid-cols-5">
      <StatTile
        label="Active challenges"
        value={k?.activeChallenges ?? 0}
        loading={loading}
        icon={<Layers className="size-4" aria-hidden />}
        tone="indigo"
        sub="Open or in review"
      />
      <StatTile
        label="Submissions"
        value={k?.totalSubmissions ?? 0}
        loading={loading}
        icon={<Inbox className="size-4" aria-hidden />}
        tone="slate"
        sub={k?.avgScore != null ? `Avg. score ${k.avgScore}` : 'Across all challenges'}
      />
      <StatTile
        label="Awaiting review"
        value={k?.awaitingReview ?? 0}
        loading={loading}
        icon={<ClipboardCheck className="size-4" aria-hidden />}
        tone={k && k.awaitingReview > 0 ? 'amber' : 'emerald'}
        sub={
          k && k.awaitingReview > 0 && nextReview ? (
            <Link to={`/challenges/${nextReview.id}/review/next`} className="font-semibold text-primary hover:underline">
              Review now →
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="size-3.5" aria-hidden /> All caught up
            </span>
          )
        }
      />
      <StatTile
        label="Bounties escrowed"
        value={k?.bountiesEscrowed ?? 0}
        format="money"
        loading={loading}
        icon={<Lock className="size-4" aria-hidden />}
        tone="emerald"
        className="@xl:col-span-2 @5xl:col-span-1"
        sub={
          <span>
            <span className="font-semibold text-emerald-700 tabular-nums">{money(k?.bountiesPaid ?? 0)}</span> paid out to
            winners
          </span>
        }
      />
      <StatTile
        label="Interviews sent"
        value={k?.interviewsSent ?? 0}
        loading={loading}
        icon={<UserPlus className="size-4" aria-hidden />}
        tone="violet"
        className="col-span-2 @xl:col-span-1"
        sub="Challenge → shortlist → hire"
      />
    </section>
  );
}

function ChallengesTable({ challenges, loading }: { challenges: ChallengeView[] | undefined; loading: boolean }) {
  const navigate = useNavigate();
  useNow(60_000);
  const sorted = [...(challenges ?? [])].sort((a, b) => {
    const rank = (c: ChallengeView) => (c.status === 'awarded' ? 1 : 0);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card className="@container min-w-0 overflow-hidden">
      <CardHeader
        title="Your challenges"
        subtitle="Live challenges you’ve posted, newest first"
        actions={
          <ButtonLink to="/challenges/new" size="sm" variant="secondary" icon={<Plus className="size-3.5" aria-hidden />}>
            New
          </ButtonLink>
        }
      />
      {loading ? (
        <div className="divide-y divide-slate-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-2 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Rocket className="size-5" aria-hidden />}
          title="Post your first challenge"
          body="Turn a week-one task into a 3–5 hour challenge. Students compete, you review blind and hire on proof."
          action={
            <ButtonLink to="/challenges/new" variant="primary" icon={<Plus className="size-4" aria-hidden />}>
              Add challenge
            </ButtonLink>
          }
        />
      ) : (
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                <th scope="col" className="py-2.5 pr-3 pl-4 font-semibold">
                  Challenge
                </th>
                <th scope="col" className="w-32 px-3 py-2.5 font-semibold">
                  Joined
                </th>
                <th scope="col" className="w-16 px-3 py-2.5 text-right font-semibold">
                  Subs
                </th>
                <th scope="col" className="w-24 px-3 py-2.5 font-semibold">
                  To review
                </th>
                <th scope="col" className="hidden w-28 px-3 py-2.5 font-semibold @3xl:table-cell">
                  Deadline
                </th>
                <th scope="col" className="w-24 py-2.5 pr-4 pl-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((c) => {
                const awaiting = Math.max(0, c.submissionCount - c.scoredCount);
                const awarded = c.status === 'awarded';
                return (
                  <tr
                    key={c.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                    onClick={() => navigate(`/challenges/${c.id}`)}
                  >
                    <td className="py-3 pr-3 pl-4 align-middle">
                      <Link
                        to={`/challenges/${c.id}`}
                        className="line-clamp-2 font-semibold text-slate-900 group-hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.title}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <TypeChip type={c.type} size="sm" />
                        <StatusBadge status={c.status} />
                        {!awarded && c.rewardTotal > 0 && <EscrowChip amount={c.rewardTotal} className="h-5 text-[11px]" />}
                        <Countdown deadline={c.deadline} status={c.status} className="@3xl:hidden" />
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <SpotsBar joined={c.participantCount} cap={c.applicantCap} compact />
                    </td>
                    <td className="px-3 py-3 text-right align-middle font-semibold text-slate-800 tabular-nums">
                      {c.submissionCount}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      {awaiting > 0 ? (
                        <span className="inline-flex h-6 items-center gap-1 rounded-md bg-amber-50 px-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset tabular-nums">
                          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
                          {awaiting}
                        </span>
                      ) : c.submissionCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="size-3.5" aria-hidden /> Done
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 align-middle @3xl:table-cell">
                      <Countdown deadline={c.deadline} status={c.status} />
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                      {awarded ? (
                        <ButtonLink to={`/challenges/${c.id}?tab=leaderboard`} size="sm" variant="secondary">
                          Results
                        </ButtonLink>
                      ) : awaiting > 0 ? (
                        <ButtonLink to={`/challenges/${c.id}/review/next`} size="sm" variant="primary">
                          Review
                        </ButtonLink>
                      ) : (
                        <ButtonLink to={`/challenges/${c.id}`} size="sm" variant="secondary">
                          Open
                        </ButtonLink>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const ACTIVITY_ICON: Record<ActivityItem['kind'], { icon: typeof Inbox; cls: string }> = {
  join: { icon: UserPlus, cls: 'bg-sky-50 text-sky-600' },
  submission: { icon: Inbox, cls: 'bg-indigo-50 text-indigo-600' },
  scored: { icon: ClipboardCheck, cls: 'bg-slate-100 text-slate-600' },
  award: { icon: Trophy, cls: 'bg-amber-50 text-amber-600' },
  invite: { icon: Mail, cls: 'bg-violet-50 text-violet-600' },
};

function ActivityFeed({ items, loading }: { items: ActivityItem[] | undefined; loading: boolean }) {
  useNow(30_000);
  const list = (items ?? []).slice(0, 14);
  const isNew = useNewIds(items?.map((i) => i.id));

  return (
    <Card className="min-w-0 self-start overflow-hidden">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Live activity
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          </span>
        }
        subtitle="Joins, submissions and results as they happen"
      />
      {loading ? (
        <div className="space-y-4 p-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-7 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={<Activity className="size-5" aria-hidden />}
          title="No activity yet"
          body="When students join or submit, it shows up here instantly."
        />
      ) : (
        <ol className="divide-y divide-slate-100" aria-live="polite">
          {list.map((item) => {
            const meta = ACTIVITY_ICON[item.kind] ?? ACTIVITY_ICON.submission;
            const Icon = meta.icon;
            const fresh = isNew(item.id);
            const content = (
              <>
                <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', meta.cls)}>
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug text-slate-700">{item.text}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                    {timeAgo(item.at)}
                    {fresh && <span className="rounded bg-emerald-100 px-1 font-semibold text-emerald-700">New</span>}
                  </span>
                </span>
                {item.challengeId && (
                  <ArrowRight className="mt-1 size-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                )}
              </>
            );
            return (
              <li key={item.id} className={cn(fresh && 'animate-slide-down')}>
                {item.challengeId ? (
                  <Link
                    to={`/challenges/${item.challengeId}`}
                    className={cn('group flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50', fresh && 'animate-flash')}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={cn('flex gap-3 px-4 py-3', fresh && 'animate-flash')}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
