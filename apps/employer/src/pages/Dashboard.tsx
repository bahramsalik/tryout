import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, ClipboardCheck, Filter, Inbox, Mail, Trophy, UserPlus } from '@/components/icons';
import { CHALLENGE_TYPES, TYPE_META, type ActivityItem, type ChallengeType, type ChallengeView, type EmployerDashboard } from '@shared/types';
import { timeAgo } from '@/lib/format';
import { useDocumentTitle, useNewIds } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { useDashboard } from '@/lib/queries';
import { Countdown, StatusBadge, TypeIcon, useNow } from '@/components/brand';
import { StatTile } from '@/components/StatTile';
import { MenuItem, MenuSeparator, Popover } from '@/components/overlay';
import { Badge, Button, ButtonLink, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui';

export function DashboardPage() {
  const { company } = usePersona();
  const { data, isPending, isError, error, refetch } = useDashboard();
  useDocumentTitle('Dashboard');

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title={data?.company.name ?? company?.name ?? 'Dashboard'} />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <Kpis data={data} loading={isPending} />
          <div className="mt-4 grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_20rem]">
            <ChallengesTable challenges={data?.challenges} loading={isPending} />
            <ActivityFeed items={data?.recentActivity} loading={isPending} />
          </div>
        </>
      )}
    </div>
  );
}

function Kpis({ data, loading }: { data: EmployerDashboard | undefined; loading: boolean }) {
  const k = data?.kpis;
  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
      <StatTile label="Submissions" value={k?.totalSubmissions ?? 0} loading={loading} icon={<Inbox aria-hidden />} />
      <StatTile label="To review" value={k?.awaitingReview ?? 0} loading={loading} icon={<ClipboardCheck aria-hidden />} />
      <StatTile label="Active challenges" value={k?.activeChallenges ?? 0} loading={loading} icon={<Trophy aria-hidden />} />
      <StatTile label="Interviews" value={k?.interviewsSent ?? 0} loading={loading} icon={<UserPlus aria-hidden />} />
    </section>
  );
}

const th = 'px-3 py-2 text-left text-xs font-semibold text-slate-500';

function ChallengesTable({ challenges, loading }: { challenges: ChallengeView[] | undefined; loading: boolean }) {
  const navigate = useNavigate();
  useNow(60_000);
  const [type, setType] = useState<ChallengeType | 'all'>('all');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const all = challenges ?? [];
  const types = CHALLENGE_TYPES.filter((t) => all.some((c) => c.type === t));
  const dir = order === 'newest' ? -1 : 1;
  const sorted = all
    .filter((c) => type === 'all' || c.type === type)
    .sort((a, b) => {
      const rank = (c: ChallengeView) => (c.status === 'awarded' ? 1 : 0);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  const active = (type !== 'all' ? 1 : 0) + (order !== 'newest' ? 1 : 0);
  const tick = (on: boolean) => (on ? <Check className="size-4" aria-hidden /> : null);

  return (
    <Card className="@container min-w-0 self-start">
      <CardHeader
        title="Challenges"
        actions={
          <Popover
            placement="bottom-end"
            panelClassName="w-56"
            trigger={(p) => (
              <Button size="sm" icon={<Filter />} onClick={p.toggle} aria-expanded={p['aria-expanded']} aria-haspopup={p['aria-haspopup']}>
                Filter{active > 0 ? ` · ${active}` : ''}
              </Button>
            )}
          >
            {() => (
              <>
                <p className="px-2 pt-1 pb-0.5 text-xs font-semibold text-slate-500">Field</p>
                <MenuItem active={type === 'all'} hint={tick(type === 'all')} onSelect={() => setType('all')}>
                  All fields
                </MenuItem>
                {types.map((t) => (
                  <MenuItem key={t} active={type === t} hint={tick(type === t)} onSelect={() => setType(t)}>
                    {TYPE_META[t].label}
                  </MenuItem>
                ))}
                <MenuSeparator />
                <p className="px-2 pt-1 pb-0.5 text-xs font-semibold text-slate-500">Posted</p>
                <MenuItem active={order === 'newest'} hint={tick(order === 'newest')} onSelect={() => setOrder('newest')}>
                  Newest first
                </MenuItem>
                <MenuItem active={order === 'oldest'} hint={tick(order === 'oldest')} onSelect={() => setOrder('oldest')}>
                  Oldest first
                </MenuItem>
                {active > 0 && (
                  <>
                    <MenuSeparator />
                    <MenuItem
                      onSelect={() => {
                        setType('all');
                        setOrder('newest');
                      }}
                    >
                      Clear filter
                    </MenuItem>
                  </>
                )}
              </>
            )}
          </Popover>
        }
      />
      {loading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState title="No challenges yet" />
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-b-[inherit]">
          <table className="w-full min-w-[26rem] table-fixed text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className={`${th} pl-4`}>
                  Challenge
                </th>
                <th scope="col" className={`${th} hidden w-20 text-right @2xl:table-cell`}>
                  Joined
                </th>
                <th scope="col" className={`${th} w-24 text-right`}>
                  Submissions
                </th>
                <th scope="col" className={`${th} w-28`}>
                  To review
                </th>
                <th scope="col" className={`${th} hidden w-28 @3xl:table-cell`}>
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const awaiting = Math.max(0, c.submissionCount - c.scoredCount);
                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-[var(--colorNeutralBackground1Hover)]"
                    onClick={() => navigate(`/challenges/${c.id}`)}
                  >
                    <td className="py-2.5 pr-3 pl-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon type={c.type} className="size-5 shrink-0 text-slate-500" />
                        <Link
                          to={`/challenges/${c.id}`}
                          className="min-w-0 truncate font-semibold hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.title}
                        </Link>
                        {c.status !== 'open' && <StatusBadge status={c.status} />}
                      </div>
                    </td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums @2xl:table-cell">
                      {c.participantCount}
                      {c.applicantCap != null && <span className="text-slate-500">/{c.applicantCap}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{c.submissionCount}</td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {awaiting > 0 ? (
                        <ButtonLink to={`/challenges/${c.id}/review/next`} size="sm">
                          Review {awaiting}
                        </ButtonLink>
                      ) : (
                        <span className="text-slate-500">–</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2.5 @3xl:table-cell">
                      <Countdown deadline={c.deadline} status={c.status} icon={false} />
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

const ACTIVITY_ICON: Record<ActivityItem['kind'], typeof Inbox> = {
  join: UserPlus,
  submission: Inbox,
  scored: ClipboardCheck,
  award: Trophy,
  invite: Mail,
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
