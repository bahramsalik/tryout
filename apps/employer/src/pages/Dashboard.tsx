import { Link } from 'react-router';
import { ClipboardCheck, Inbox, Trophy, UserPlus } from '@/components/icons';
import type { ActivityItem, EmployerDashboard } from '@shared/types';
import { timeAgo } from '@/lib/format';
import { useDocumentTitle, useNewIds } from '@/lib/hooks';
import { useDashboard } from '@/lib/queries';
import { useNow } from '@/components/brand';
import { ChallengesTable } from '@/components/ChallengesTable';
import { StatTile } from '@/components/StatTile';
import { Badge, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui';

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useDashboard();
  useDocumentTitle('Dashboard');

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title="Dashboard" />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="grid items-start gap-4 @5xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4">
            <Kpis data={data} loading={isPending} />
            <ChallengesTable
              challenges={data?.challenges.filter((c) => c.status !== 'awarded')}
              loading={isPending}
              title="Ongoing challenges"
              emptyTitle="No ongoing challenges"
            />
          </div>
          <ActivityFeed items={data?.recentActivity} loading={isPending} />
        </div>
      )}
    </div>
  );
}

function Kpis({ data, loading }: { data: EmployerDashboard | undefined; loading: boolean }) {
  const k = data?.kpis;
  return (
    <section aria-label="Key numbers" className="grid grid-cols-3 gap-3">
      <StatTile label="Submissions" value={k?.totalSubmissions ?? 0} loading={loading} icon={<Inbox aria-hidden />} />
      <StatTile label="To review" value={k?.awaitingReview ?? 0} loading={loading} icon={<ClipboardCheck aria-hidden />} />
      <StatTile label="Active challenges" value={k?.activeChallenges ?? 0} loading={loading} icon={<Trophy aria-hidden />} />
    </section>
  );
}

const ACTIVITY_ICON: Record<ActivityItem['kind'], typeof Inbox> = {
  join: UserPlus,
  submission: Inbox,
  scored: ClipboardCheck,
  award: Trophy,
};

function ActivityFeed({ items, loading }: { items: ActivityItem[] | undefined; loading: boolean }) {
  useNow(30_000);
  const list = (items ?? []).slice(0, 8);
  const isNew = useNewIds(items?.map((i) => i.id));

  return (
    <Card className="min-w-0 self-start overflow-hidden">
      <CardHeader title="Activity" />
      {loading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState compact title="No activity yet" />
      ) : (
        <ol className="pb-2" aria-live="polite">
          {list.map((item) => {
            const Icon = ACTIVITY_ICON[item.kind] ?? Inbox;
            const content = (
              <>
                <Icon className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{item.text}</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    {timeAgo(item.at)}
                    {isNew(item.id) && <Badge tone="indigo">New</Badge>}
                  </span>
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {item.challengeId ? (
                  <Link
                    to={`/challenges/${item.challengeId}`}
                    className="flex gap-2.5 px-4 py-2 hover:bg-[var(--colorNeutralBackground1Hover)]"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex gap-2.5 px-4 py-2">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
