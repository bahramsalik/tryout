import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, Filter } from '@/components/icons';
import { CHALLENGE_TYPES, TYPE_META, type ChallengeType, type ChallengeView } from '@shared/types';
import { Countdown, StatusBadge, TypeIcon, useNow } from './brand';
import { MenuItem, MenuSeparator, Popover } from './overlay';
import { Button, ButtonLink, Card, CardHeader, EmptyState, Skeleton } from './ui';

type Show = 'ongoing' | 'done' | 'all';

const SHOW_OPTIONS: { value: Show; label: string }[] = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
];

const th = 'px-3 py-2 text-left text-xs font-semibold text-slate-500';

/**
 * The list of a company's challenges. Used on the dashboard (plain list) and on the Challenges page
 * (`filterable`: a Filter menu with ongoing / done / all, field and posted-date order).
 */
export function ChallengesTable({
  challenges,
  loading,
  title = 'Challenges',
  emptyTitle = 'No challenges yet',
  filterable = false,
}: {
  challenges: ChallengeView[] | undefined;
  loading: boolean;
  title?: string;
  emptyTitle?: string;
  filterable?: boolean;
}) {
  const navigate = useNavigate();
  useNow(60_000);
  const [show, setShow] = useState<Show>('all');
  const [type, setType] = useState<ChallengeType | 'all'>('all');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const all = challenges ?? [];
  const types = CHALLENGE_TYPES.filter((t) => all.some((c) => c.type === t));
  const dir = order === 'newest' ? -1 : 1;
  const sorted = all
    .filter((c) => show === 'all' || (show === 'done' ? c.status === 'awarded' : c.status !== 'awarded'))
    .filter((c) => type === 'all' || c.type === type)
    .sort((a, b) => {
      const rank = (c: ChallengeView) => (c.status === 'awarded' ? 1 : 0);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  const active = (show !== 'all' ? 1 : 0) + (type !== 'all' ? 1 : 0) + (order !== 'newest' ? 1 : 0);
  const tick = (on: boolean) => (on ? <Check className="size-4" aria-hidden /> : null);

  return (
    <Card className="@container min-w-0 self-start">
      <CardHeader
        title={title}
        actions={
          filterable ? (
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
                  <p className="px-2 pt-1 pb-0.5 text-xs font-semibold text-slate-500">Show</p>
                  {SHOW_OPTIONS.map((o) => (
                    <MenuItem key={o.value} active={show === o.value} hint={tick(show === o.value)} onSelect={() => setShow(o.value)}>
                      {o.label}
                    </MenuItem>
                  ))}
                  <MenuSeparator />
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
                          setShow('all');
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
          ) : undefined
        }
      />
      {loading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState title={active > 0 ? 'No matching challenges' : emptyTitle} />
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
