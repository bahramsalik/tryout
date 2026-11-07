import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  Eye,
  EyeOff,
  FileSearch,
  Inbox,
  ListOrdered,
  Lock,
  Mail,
  Star,
  Trophy,
  UserRound,
  XCircle,
} from 'lucide-react';
import { payoutForRank, type ChallengeView, type SubmissionView } from '@shared/types';
import { api, ApiError, errorMessage, STUDENT_SITE_URL } from '@/lib/api';
import { dateTime, money, plural, timeAgo } from '@/lib/format';
import { useDocumentTitle } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { isScored, qk, queryClient, rankSubmissions, useChallenge, useInvitesByStudent, useSubmissions } from '@/lib/queries';
import { isFreshArrival, useArrivals, useBlind } from '@/lib/stores';
import {
  Avatar,
  Countdown,
  EscrowChip,
  MedalBadge,
  NeedsReview,
  RewardBadge,
  ScorePill,
  SpotsBar,
  StatusBadge,
  TypeChip,
  scoreTone,
  useNow,
} from '@/components/brand';
import { AwardModal } from '@/components/AwardModal';
import { InviteModal, type InviteTarget } from '@/components/InviteModal';
import { Tabs } from '@/components/overlay';
import { StudentChallengePreview } from '@/components/StudentPreview';
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, Segmented, Skeleton, Switch, cn } from '@/components/ui';

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
  const [invite, setInvite] = useState<InviteTarget | null>(null);
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
          <EmptyState
            icon={<FileSearch className="size-5" aria-hidden />}
            title="Challenge not found"
            body="It may have been removed by a demo reset."
            action={<ButtonLink to="/">Back to dashboard</ButtonLink>}
          />
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
          icon={<Lock className="size-5" aria-hidden />}
          title="This challenge belongs to another company"
          body={`“${c.title}” is posted by ${c.company?.name ?? 'another employer'}. Switch to that company to review it.`}
          action={<ButtonLink to="/">Back to dashboard</ButtonLink>}
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
      <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-3.5" aria-hidden /> Dashboard
      </Link>

      <header className="mt-2 flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-[1_1_22rem]">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeChip type={c.type} size="sm" />
            <StatusBadge status={c.status} />
            <RewardBadge reward={c.reward} size="sm" />
          </div>
          <h1 className="mt-2 text-xl leading-tight font-bold tracking-tight text-slate-900 sm:text-[22px]">{c.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
            {c.hiringFor && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-violet-500" aria-hidden /> Hiring: {c.hiringFor}
              </span>
            )}
            <a
              href={`${STUDENT_SITE_URL}/challenges/${c.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-indigo-800"
            >
              <ExternalLink className="size-3.5" aria-hidden /> View as a student
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BlindToggle blind={blind} awarded={awarded} onChange={setBlind} />
          {!awarded && c.kind !== 'practice' && (
            <Button
              variant={unscored > 0 || subs.length === 0 ? 'secondary' : 'success'}
              icon={<Trophy className={cn('size-4', unscored > 0 || subs.length === 0 ? 'text-slate-400' : '')} aria-hidden />}
              onClick={() => setAwardOpen(true)}
              disabled={subs.length === 0}
              title={subs.length === 0 ? 'No submissions yet' : unscored > 0 ? 'Every submission needs scores and feedback first' : undefined}
            >
              Publish results
              {unscored > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-semibold text-amber-800 tabular-nums">
                  {unscored} left to score
                </span>
              )}
            </Button>
          )}
        </div>
      </header>

      <HeaderStats challenge={c} submissions={subs.length} scored={scoredCount} avg={avg} loading={submissions.isPending} />

      {awarded && <AwardedBanner challenge={c} subs={subs} />}

      <Tabs<Tab>
        label="Challenge sections"
        className="mt-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'submissions', label: 'Submissions', count: submissions.data ? subs.length : null, icon: <Inbox className="size-4" /> },
          { value: 'leaderboard', label: 'Leaderboard', icon: <ListOrdered className="size-4" /> },
          { value: 'brief', label: 'Brief', icon: <ClipboardList className="size-4" /> },
        ]}
      />

      <div className="mt-4">
        {tab === 'submissions' && (
          <SubmissionsTab
            challenge={c}
            query={submissions}
            subs={subs}
            blind={blind}
            unscored={unscored}
          />
        )}
        {tab === 'leaderboard' && (
          <LeaderboardTab
            challenge={c}
            query={submissions}
            subs={subs}
            blind={blind}
            unscored={unscored}
            onAward={() => setAwardOpen(true)}
            onInvite={setInvite}
          />
        )}
        {tab === 'brief' && (
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
              <Eye className="size-3.5" aria-hidden /> Read-only — this is what students see.
            </p>
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
        onInvite={(t) => setInvite(t)}
      />
      <InviteModal open={!!invite} target={invite} onClose={() => setInvite(null)} />
    </div>
  );
}

function BlindToggle({ blind, awarded, onChange }: { blind: boolean; awarded: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={cn(
        'flex h-9 items-center gap-2.5 rounded-lg border px-3',
        awarded ? 'border-slate-200 bg-slate-50' : blind ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-200 bg-white',
      )}
      title={awarded ? 'Results are published, so identities are revealed' : 'Hide names, schools and avatars until results are published'}
    >
      {blind ? <EyeOff className="size-4 text-indigo-600" aria-hidden /> : <Eye className="size-4 text-slate-400" aria-hidden />}
      <label htmlFor="blind-toggle" className="text-[13px] font-semibold text-slate-800">
        Blind review
        <span className="ml-1 font-normal text-slate-500 max-[520px]:hidden">{awarded ? '· revealed' : blind ? '· on' : '· off'}</span>
      </label>
      <Switch id="blind-toggle" size="sm" checked={blind} onChange={onChange} disabled={awarded} label="Blind review" />
    </div>
  );
}

function HeaderStats({
  challenge: c,
  submissions,
  scored,
  avg,
  loading,
}: {
  challenge: ChallengeView;
  submissions: number;
  scored: number;
  avg: number | null;
  loading: boolean;
}) {
  useNow(60_000);
  const awarded = c.status === 'awarded';
  return (
    <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-card @xl:grid-cols-3 @5xl:grid-cols-6">
      <StatCell label="Joined">
        <SpotsBar joined={c.participantCount} cap={c.applicantCap} className="mt-1" />
      </StatCell>
      <StatCell label="Submissions">
        <span className="text-lg font-bold text-slate-900 tabular-nums">{loading ? '—' : submissions}</span>
      </StatCell>
      <StatCell label="Scored">
        <span className="text-lg font-bold text-slate-900 tabular-nums">
          {loading ? '—' : scored}
          <span className="text-sm font-medium text-slate-400">/{loading ? '—' : submissions}</span>
        </span>
        {!loading && submissions > 0 && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn('h-full rounded-full transition-[width] duration-500', scored === submissions ? 'bg-emerald-500' : 'bg-amber-500')}
              style={{ width: `${(scored / submissions) * 100}%` }}
            />
          </div>
        )}
      </StatCell>
      <StatCell label="Avg. score">
        {avg != null ? (
          <span className={cn('text-lg font-bold tabular-nums', scoreTone(avg).text)}>{avg}</span>
        ) : (
          <span className="text-lg font-bold text-slate-300">—</span>
        )}
      </StatCell>
      <StatCell label={awarded ? 'Status' : 'Deadline'}>
        {awarded ? (
          <span className="text-sm font-semibold text-violet-700">Awarded</span>
        ) : (
          <>
            <Countdown deadline={c.deadline} status={c.status} className="text-sm" icon={false} />
            <p className="text-[11px] text-slate-400">{dateTime(c.deadline)}</p>
          </>
        )}
      </StatCell>
      <StatCell label="Reward">
        <span className="text-lg font-bold text-emerald-700 tabular-nums">{c.rewardTotal > 0 ? money(c.rewardTotal) : '—'}</span>
        <div className="mt-0.5">
          {c.rewardTotal > 0 ? (
            awarded ? (
              <span className="text-[11px] font-medium text-slate-500">Paid out</span>
            ) : (
              <EscrowChip amount={c.rewardTotal} className="h-5 px-1.5 text-[11px]" />
            )
          ) : (
            <span className="text-[11px] text-slate-500">Feedback only</span>
          )}
        </div>
      </StatCell>
    </dl>
  );
}

function StatCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 bg-white px-4 py-3">
      <dt className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 min-w-0">{children}</dd>
    </div>
  );
}

function AwardedBanner({ challenge, subs }: { challenge: ChallengeView; subs: SubmissionView[] }) {
  const paid = subs.reduce((s, x) => s + (x.payout ?? 0), 0);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3">
      <Trophy className="size-5 text-violet-600" aria-hidden />
      <p className="min-w-0 flex-1 text-[13px] text-violet-900">
        <span className="font-semibold">Results published{challenge.awardedAt ? ` ${timeAgo(challenge.awardedAt)}` : ''}.</span>{' '}
        {plural(subs.length, 'student')} got scores and feedback
        {paid > 0 ? (
          <>
            {' '}
            · <span className="font-semibold text-emerald-700">{money(paid)}</span> paid out
          </>
        ) : null}
        . Identities are revealed.
      </p>
      <ButtonLink to={`/challenges/${challenge.id}?tab=leaderboard`} size="sm" variant="secondary">
        View leaderboard
      </ButtonLink>
    </div>
  );
}

/* ───────────────────────────── Submissions tab ───────────────────────────── */

type Filter = 'all' | 'review' | 'scored' | 'shortlisted';

function useShortlist(challengeId: string) {
  return useMutation({
    mutationFn: ({ id, shortlisted }: { id: string; shortlisted: boolean }) =>
      api<SubmissionView>(`/submissions/${encodeURIComponent(id)}/shortlist`, { method: 'POST', json: { shortlisted } }),
    onMutate: async ({ id, shortlisted }) => {
      await queryClient.cancelQueries({ queryKey: qk.submissions(challengeId) });
      const prev = queryClient.getQueryData<SubmissionView[]>(qk.submissions(challengeId));
      queryClient.setQueryData<SubmissionView[]>(qk.submissions(challengeId), (list) =>
        list?.map((s) => (s.id === id ? { ...s, shortlisted } : s)),
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.submissions(challengeId), ctx.prev);
      toast.error('Couldn’t update the shortlist', { description: errorMessage(err) });
    },
    onSuccess: (sub) => {
      queryClient.setQueryData(qk.submission(sub.id), sub);
    },
  });
}

export function ShortlistStar({
  active,
  onToggle,
  disabled,
  size = 'md',
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? 'Remove from shortlist' : 'Add to shortlist'}
      title={active ? 'Shortlisted' : 'Shortlist'}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50',
        size === 'sm' ? 'size-7' : 'size-8',
        active ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500',
      )}
    >
      <Star className={size === 'sm' ? 'size-4' : 'size-[18px]'} fill={active ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
}

function CandidateCell({ sub, blind, fresh }: { sub: SubmissionView; blind: boolean; fresh?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={sub.student.name} color={sub.student.avatarColor} size={30} blind={blind} />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-slate-900">
          <span className="truncate">{blind ? sub.alias : sub.student.name}</span>
          {fresh && <Badge tone="emerald">New</Badge>}
        </p>
        <p className="truncate text-xs text-slate-500">{blind ? 'Identity hidden' : sub.student.university}</p>
      </div>
    </div>
  );
}

function ChecksCell({ sub }: { sub: SubmissionView }) {
  const passed = sub.autoChecks.filter((c) => c.passed).length;
  const total = sub.autoChecks.length;
  if (total === 0) return <span className="text-xs text-slate-400">—</span>;
  const all = passed === total;
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-semibold tabular-nums', all ? 'text-emerald-700' : 'text-amber-700')}
      title={sub.autoChecks.map((c) => `${c.passed ? '✓' : '✗'} ${c.label}`).join('\n')}
    >
      {all ? <CheckCircle2 className="size-3.5" aria-hidden /> : <XCircle className="size-3.5" aria-hidden />}
      {passed}/{total}
    </span>
  );
}

function SubmissionsTab({
  challenge,
  query,
  subs,
  blind,
  unscored,
}: {
  challenge: ChallengeView;
  query: ReturnType<typeof useSubmissions>;
  subs: SubmissionView[];
  blind: boolean;
  unscored: number;
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const arrivals = useArrivals();
  const shortlist = useShortlist(challenge.id);
  useNow(30_000);

  const counts = {
    all: subs.length,
    review: subs.filter((s) => !isScored(s)).length,
    scored: subs.filter(isScored).length,
    shortlisted: subs.filter((s) => s.shortlisted).length,
  };
  const list = subs.filter((s) =>
    filter === 'review' ? !isScored(s) : filter === 'scored' ? isScored(s) : filter === 'shortlisted' ? s.shortlisted : true,
  );

  if (query.isPending) return <TableSkeleton />;
  if (query.isError) {
    return (
      <Card>
        <ErrorState error={query.error} onRetry={() => query.refetch()} title="Couldn’t load submissions" />
      </Card>
    );
  }
  if (subs.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Inbox className="size-5" aria-hidden />}
          title="No submissions yet"
          body={`${plural(challenge.participantCount, 'student')} joined so far. You’ll get a live toast the moment someone submits.`}
        />
      </Card>
    );
  }

  return (
    <Card className="@container overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2.5">
        <Segmented<Filter>
          label="Filter submissions"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'review', label: 'Needs review', count: counts.review },
            { value: 'scored', label: 'Scored', count: counts.scored },
            { value: 'shortlisted', label: '⭐', count: counts.shortlisted },
          ]}
        />
        {unscored > 0 && challenge.status !== 'awarded' && (
          <ButtonLink
            to={`/challenges/${challenge.id}/review/next`}
            size="sm"
            variant="primary"
            className="ml-auto"
            icon={<ClipboardCheck className="size-3.5" aria-hidden />}
          >
            Review next
          </ButtonLink>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState compact title="Nothing here" body="No submissions match this filter." />
      ) : (
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                <th scope="col" className="py-2.5 pr-3 pl-4">
                  Candidate
                </th>
                <th scope="col" className="w-28 px-3 py-2.5">
                  Submitted
                </th>
                <th scope="col" className="hidden w-24 px-3 py-2.5 @xl:table-cell">
                  Checks
                </th>
                <th scope="col" className="w-32 px-3 py-2.5">
                  Score
                </th>
                <th scope="col" className="w-14 py-2.5 pr-3 pl-1 text-center">
                  <span className="sr-only">Shortlist</span>
                  <Star className="mx-auto size-3.5" aria-hidden />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((s) => {
                const fresh = isFreshArrival(arrivals, s.id);
                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/challenges/${challenge.id}/review/${s.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/challenges/${challenge.id}/review/${s.id}`);
                    }}
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-indigo-50/50 focus-visible:outline-none',
                      fresh && 'animate-flash',
                    )}
                  >
                    <td className="py-2.5 pr-3 pl-4">
                      <CandidateCell sub={s} blind={blind} fresh={fresh} />
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap text-slate-600" title={dateTime(s.submittedAt)}>
                      {timeAgo(s.submittedAt)}
                    </td>
                    <td className="hidden px-3 py-2.5 @xl:table-cell">
                      <ChecksCell sub={s} />
                    </td>
                    <td className="px-3 py-2.5">
                      {s.totalScore != null ? (
                        <span className="flex items-center gap-2">
                          <ScorePill score={s.totalScore} />
                          {s.rank != null && <span className="text-xs text-slate-500 tabular-nums">#{s.rank}</span>}
                        </span>
                      ) : (
                        <NeedsReview />
                      )}
                    </td>
                    <td className="py-2.5 pr-3 pl-1 text-center">
                      <ShortlistStar
                        active={s.shortlisted}
                        onToggle={() => shortlist.mutate({ id: s.id, shortlisted: !s.shortlisted })}
                      />
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

/* ───────────────────────────── Leaderboard tab ───────────────────────────── */

function LeaderboardTab({
  challenge,
  query,
  subs,
  blind,
  unscored,
  onAward,
  onInvite,
}: {
  challenge: ChallengeView;
  query: ReturnType<typeof useSubmissions>;
  subs: SubmissionView[];
  blind: boolean;
  unscored: number;
  onAward: () => void;
  onInvite: (t: InviteTarget) => void;
}) {
  const invites = useInvitesByStudent();
  const ranked = useMemo(() => rankSubmissions(subs), [subs]);
  const shortlist = useShortlist(challenge.id);
  const awarded = challenge.status === 'awarded';
  const top = ranked[0]?.totalScore ?? 100;

  if (query.isPending) return <TableSkeleton />;
  if (query.isError) {
    return (
      <Card>
        <ErrorState error={query.error} onRetry={() => query.refetch()} title="Couldn’t load the leaderboard" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {!awarded && challenge.kind !== 'practice' && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3',
            unscored > 0 ? 'border-amber-200 bg-amber-50/70' : 'border-emerald-200 bg-emerald-50/70',
          )}
        >
          {unscored > 0 ? (
            <ClipboardCheck className="size-5 shrink-0 text-amber-600" aria-hidden />
          ) : (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-semibold', unscored > 0 ? 'text-amber-900' : 'text-emerald-900')}>
              {unscored > 0 ? `${unscored} left to score` : 'Everything is scored — ready to publish'}
            </p>
            <p className="text-xs text-slate-600">
              Payouts below are projected. Students see results only after you publish.
            </p>
          </div>
          {unscored > 0 ? (
            <ButtonLink to={`/challenges/${challenge.id}/review/next`} size="sm" variant="primary">
              Score next
            </ButtonLink>
          ) : (
            <Button size="sm" variant="success" icon={<Trophy className="size-3.5" aria-hidden />} onClick={onAward}>
              Publish results & award
            </Button>
          )}
        </div>
      )}

      <Card className="@container overflow-hidden">
        {ranked.length === 0 ? (
          <EmptyState
            icon={<ListOrdered className="size-5" aria-hidden />}
            title="No scored submissions yet"
            body="Score submissions to build the leaderboard. Ranks are by total score; ties go to the earlier submission."
          />
        ) : (
          <ol className="divide-y divide-slate-100">
            {ranked.map((s, i) => {
              const rank = s.rank ?? i + 1;
              const payout = awarded ? (s.payout ?? 0) : payoutForRank(challenge.reward, rank);
              const name = blind ? s.alias : s.student.name;
              const invite = invites.get(s.studentId);
              const alreadyInvited = !!invite && invite.status !== 'declined';
              return (
                <li key={s.id} className={cn('flex items-center gap-3 px-3 py-2.5 @xl:px-4', rank <= 3 && 'bg-amber-50/20')}>
                  <MedalBadge rank={rank} />
                  <Link
                    to={`/challenges/${challenge.id}/review/${s.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg hover:opacity-80"
                  >
                    <Avatar name={s.student.name} color={s.student.avatarColor} size={30} blind={blind} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">{name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {blind ? `Submitted ${timeAgo(s.submittedAt)}` : s.student.university}
                      </span>
                    </span>
                  </Link>
                  <div className="hidden w-32 @2xl:block" aria-hidden>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', scoreTone(s.totalScore ?? 0).bar)}
                        style={{ width: `${Math.max(4, ((s.totalScore ?? 0) / Math.max(top, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <ScorePill score={s.totalScore ?? 0} />
                  <span
                    className={cn(
                      'w-14 text-right text-[13px] font-bold tabular-nums @xl:w-16',
                      payout > 0 ? 'text-emerald-700' : 'text-slate-300',
                    )}
                    title={awarded ? 'Paid' : 'Projected payout'}
                  >
                    {payout > 0 ? money(payout) : '—'}
                  </span>
                  <ShortlistStar
                    size="sm"
                    active={s.shortlisted}
                    onToggle={() => shortlist.mutate({ id: s.id, shortlisted: !s.shortlisted })}
                  />
                  {!blind && (
                    <Link
                      to={`/candidates/${s.student.handle || s.studentId}`}
                      className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 @xl:inline-flex"
                      aria-label={`${s.student.name}’s Proof Profile`}
                      title="Proof Profile"
                    >
                      <UserRound className="size-4" aria-hidden />
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant={alreadyInvited ? 'ghost' : 'secondary'}
                    icon={alreadyInvited ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Mail className="size-3.5" />}
                    onClick={() =>
                      onInvite({
                        student: s.student,
                        challenge: { id: challenge.id, title: challenge.title, hiringFor: challenge.hiringFor },
                        alias: blind ? s.alias : null,
                      })
                    }
                    aria-label={`Invite ${name} to interview`}
                  >
                    <span className="hidden @xl:inline">
                      {invite?.status === 'accepted' ? 'Accepted' : alreadyInvited ? 'Invited' : 'Invite'}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
      {ranked.length > 0 && unscored > 0 && (
        <p className="text-xs text-slate-500">
          {plural(unscored, 'submission')} not shown — {unscored === 1 ? 'it' : 'they'} still need{unscored === 1 ? 's' : ''} a
          score.
        </p>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card className="divide-y divide-slate-100">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </Card>
  );
}

function ChallengeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl" aria-busy>
      <Skeleton className="h-3 w-20" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mt-3 h-7 w-2/3" />
      <Skeleton className="mt-5 h-20 w-full rounded-xl" />
      <Skeleton className="mt-6 h-9 w-72" />
      <div className="mt-4">
        <TableSkeleton />
      </div>
    </div>
  );
}
