import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Trophy } from '@/components/icons';
import { TYPE_META, placementsFor, type ChallengeView, type SubmissionView } from '@shared/types';
import { ApiError } from '@/lib/api';
import { dateTime, timeAgo, timeLeft, usd } from '@/lib/format';
import { useDocumentTitle } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { isScored, rankSubmissions, useChallenge, useSubmissions } from '@/lib/queries';
import { isFreshArrival, useArrivals, useBlind } from '@/lib/stores';
import { Avatar, MedalBadge, NeedsReview, ScorePill, useNow } from '@/components/brand';
import { AwardModal } from '@/components/AwardModal';
import { StudentChallengePreview } from '@/components/StudentPreview';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  MessageBar,
  PageHeader,
  Skeleton,
  Switch,
  TabList,
  ToggleButton,
  cn,
  selectClass,
} from '@/components/ui';

type Tab = 'submissions' | 'leaderboard' | 'brief';

export function ChallengePage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (['submissions', 'leaderboard', 'brief'].includes(params.get('tab') ?? '') ? params.get('tab') : 'submissions') as Tab;
  const challenge = useChallenge(id);
  const { company } = usePersona();
  const c = challenge.data;
  const owns = !!c && !!company && c.companyId === company.id;
  const submissions = useSubmissions(id, owns);
  const [blind, setBlind] = useBlind(id, c?.status);
  const [awardOpen, setAwardOpen] = useState(false);
  useDocumentTitle(c?.title ?? 'Challenge');

  const subs = useMemo(() => submissions.data ?? [], [submissions.data]);
  const scoredCount = subs.filter(isScored).length;
  const unscored = subs.length - scoredCount;
  const computedAvg = scoredCount
    ? Math.round(subs.filter(isScored).reduce((s, x) => s + (x.totalScore ?? 0), 0) / scoredCount)
    : null;
  const avg = challenge.data?.avgScore ?? computedAvg;

  if (challenge.isPending) return <ChallengeSkeleton />;
  if (challenge.isError || !c) {
    const notFound = challenge.error instanceof ApiError && challenge.error.status === 404;
    return (
      <Card className="mx-auto max-w-xl">
        {notFound ? (
          <EmptyState title="Challenge not found" action={<ButtonLink to="/challenges">Challenges</ButtonLink>} />
        ) : (
          <ErrorState error={challenge.error} onRetry={() => challenge.refetch()} />
        )}
      </Card>
    );
  }

  if (!owns) {
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState
          title={`Posted by ${c.company?.name ?? 'another company'}`}
          action={<ButtonLink to="/challenges">Challenges</ButtonLink>}
        />
      </Card>
    );
  }

  const awarded = c.status === 'awarded';
  const setTab = (t: Tab) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (t === 'submissions') n.delete('tab');
        else n.set('tab', t);
        return n;
      },
      { replace: true },
    );

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Breadcrumb />
      <PageHeader
        title={c.title}
        meta={<MetaLine challenge={c} avg={avg} />}
        actions={<Switch showLabel checked={blind} onChange={setBlind} disabled={awarded} label="Blind review" />}
      />

      {awarded && <AwardedBar challenge={c} />}

      <TabList<Tab>
        label="Challenge sections"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'submissions', label: 'Submissions', count: submissions.data ? subs.length : null },
          { value: 'leaderboard', label: 'Leaderboard' },
          { value: 'brief', label: 'Brief' },
        ]}
      />

      <div className="mt-4">
        {tab === 'submissions' && <SubmissionsTab challenge={c} query={submissions} subs={subs} blind={blind} />}
        {tab === 'leaderboard' && (
          <LeaderboardTab
            challenge={c}
            query={submissions}
            subs={subs}
            blind={blind}
            unscored={unscored}
            onAward={() => setAwardOpen(true)}
          />
        )}
        {tab === 'brief' && (
          <div className="max-w-3xl">
            <StudentChallengePreview challenge={c} />
          </div>
        )}
      </div>

      <AwardModal
        open={awardOpen}
        onClose={() => setAwardOpen(false)}
        challenge={c}
        submissions={subs}
        blind={blind}
      />
    </div>
  );
}

function Breadcrumb() {
  return (
    <Link to="/challenges" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
      <ArrowLeft className="size-4" aria-hidden /> Challenges
    </Link>
  );
}

/** One meta line of numbers under the title. */
function MetaLine({ challenge: c, avg }: { challenge: ChallengeView; avg: number | null }) {
  const now = useNow(60_000);
  const parts: ReactNode[] = [
    TYPE_META[c.type]?.label ?? c.type,
    `${c.participantCount}${c.applicantCap != null ? `/${c.applicantCap}` : ''} joined`,
  ];
  if ((c.prizePool ?? 0) > 0 && placementsFor(c) > 0) parts.push(usd(c.prizePool!) + ' prize');
  if (avg != null) parts.push(`avg ${avg}`);
  if (c.status !== 'awarded') {
    const t = timeLeft(c.deadline, now);
    parts.push(<span className={t.urgent ? 'text-amber-700' : undefined}>{t.label}</span>);
  }
  return (
    <span className="tabular-nums">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {p}
        </span>
      ))}
    </span>
  );
}

function AwardedBar({ challenge }: { challenge: ChallengeView }) {
  return (
    <MessageBar intent="success" className="mb-3">
      Results published{challenge.awardedAt ? ` ${timeAgo(challenge.awardedAt)}` : ''}
    </MessageBar>
  );
}

/* ───────────────────────────── Submissions tab ───────────────────────────── */

function CandidateCell({ sub, blind, fresh }: { sub: SubmissionView; blind: boolean; fresh?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={sub.student.name} color={sub.student.avatarColor} size={28} blind={blind} />
      <span className="truncate font-semibold">{blind ? sub.alias : sub.student.name}</span>
      {fresh && <Badge tone="indigo">New</Badge>}
    </div>
  );
}

function SubmissionsTab({
  challenge,
  query,
  subs,
  blind,
}: {
  challenge: ChallengeView;
  query: ReturnType<typeof useSubmissions>;
  subs: SubmissionView[];
  blind: boolean;
}) {
  const navigate = useNavigate();
  const [toReview, setToReview] = useState(false);
  const arrivals = useArrivals();
  useNow(30_000);

  const pending = subs.filter((s) => !isScored(s)).length;
  const list = toReview ? subs.filter((s) => !isScored(s)) : subs;

  if (query.isPending) return <TableSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (subs.length === 0) {
    return (
      <Card>
        <EmptyState title="No submissions yet" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleButton pressed={toReview} onChange={setToReview}>
          To review <span className="font-normal tabular-nums">{pending}</span>
        </ToggleButton>
        {pending > 0 && challenge.status !== 'awarded' && (
          <ButtonLink to={`/challenges/${challenge.id}/review/next`} variant="primary" className="ml-auto">
            Review next
          </ButtonLink>
        )}
      </div>
      <Card className="@container overflow-hidden">
        {list.length === 0 ? (
          <EmptyState compact title="All scored" />
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[26rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                  <th scope="col" className="py-2 pr-3 pl-4 font-semibold">
                    Candidate
                  </th>
                  <th scope="col" className="w-28 px-3 py-2 font-semibold">
                    Submitted
                  </th>
                  <th scope="col" className="w-28 px-3 py-2 pr-4 font-semibold">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const fresh = isFreshArrival(arrivals, s.id);
                  const open = () => navigate(`/challenges/${challenge.id}/review/${s.id}`);
                  return (
                    <tr
                      key={s.id}
                      onClick={open}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') open();
                      }}
                      tabIndex={0}
                      className={cn(
                        'cursor-pointer border-b border-slate-200 last:border-0 hover:bg-[var(--colorNeutralBackground1Hover)]',
                        fresh && 'bg-[var(--colorBrandBackground2)]',
                      )}
                    >
                      <td className="py-2 pr-3 pl-4">
                        <CandidateCell sub={s} blind={blind} fresh={fresh} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600 tabular-nums" title={dateTime(s.submittedAt)}>
                        {timeAgo(s.submittedAt).replace(' ago', '')}
                      </td>
                      <td className="px-3 py-2 pr-4">
                        {s.totalScore != null ? <ScorePill score={s.totalScore} /> : <NeedsReview />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ───────────────────────────── Leaderboard tab ───────────────────────────── */

function LeaderboardTab({
  challenge,
  query,
  subs,
  blind,
  unscored,
  onAward,
}: {
  challenge: ChallengeView;
  query: ReturnType<typeof useSubmissions>;
  subs: SubmissionView[];
  blind: boolean;
  unscored: number;
  onAward: () => void;
}) {
  const ranked = useMemo(() => rankSubmissions(subs), [subs]);
  const awarded = challenge.status === 'awarded';
  // Order by the overall score (the official ranking) or by any one rubric criterion.
  const [orderBy, setOrderBy] = useState('overall');
  const criterion = challenge.rubric.find((r) => r.id === orderBy) ?? null;
  const rows = useMemo(() => {
    if (!criterion) return ranked;
    // The sort is stable, so ties keep their overall order.
    return [...ranked].sort((a, b) => (b.scores?.[criterion.id] ?? 0) - (a.scores?.[criterion.id] ?? 0));
  }, [ranked, criterion]);

  if (query.isPending) return <TableSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Order by
          <select className={`${selectClass} w-48`} value={criterion ? criterion.id : 'overall'} onChange={(e) => setOrderBy(e.target.value)}>
            <option value="overall">Overall</option>
            {challenge.rubric.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        {!awarded && challenge.kind !== 'practice' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-600">{unscored > 0 ? `${unscored} left to score` : 'All scored'}</span>
            <Button
              variant="primary"
              icon={<Trophy className="size-5" aria-hidden />}
              onClick={onAward}
              disabled={subs.length === 0 || unscored > 0}
            >
              Publish results
            </Button>
          </div>
        )}
      </div>

      <Card className="@container overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="No scores yet" />
        ) : (
          <ol>
            {rows.map((s, i) => {
              // Overall keeps the official rank and medals; ordering by a criterion just numbers the rows.
              const rank = criterion ? i + 1 : (s.rank ?? i + 1);
              const name = blind ? s.alias : s.student.name;
              return (
                <li key={s.id} className="flex items-center gap-3 border-b border-slate-200 px-3 py-2 last:border-0 @xl:px-4">
                  <MedalBadge rank={rank} medal={!criterion && rank <= placementsFor(challenge)} />
                  <Link
                    to={blind ? `/challenges/${challenge.id}/review/${s.id}` : `/candidates/${s.student.handle || s.studentId}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5 hover:underline"
                  >
                    <Avatar name={s.student.name} color={s.student.avatarColor} size={28} blind={blind} />
                    <span className="truncate text-sm font-semibold">{name}</span>
                  </Link>
                  {criterion && (
                    <span className="w-12 shrink-0 text-right text-sm text-slate-600 tabular-nums" title={criterion.name}>
                      <span className="font-semibold text-slate-900">{s.scores?.[criterion.id] ?? '–'}</span>/5
                    </span>
                  )}
                  <ScorePill score={s.totalScore ?? 0} className="text-right" />
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card className="space-y-3 p-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </Card>
  );
}

function ChallengeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-3" aria-busy>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <TableSkeleton />
    </div>
  );
}
