import { ArrowRight, BadgeCheck, CircleCheck, CircleX, Clock, FileArchive, Hourglass, Mail, PartyPopper, Sparkles, Trophy } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import type { ChallengeView, InviteView, SubmissionView } from '@shared/types';
import { CompanyLogo, Countdown, RankBadge, ScoreRing, TypeChip } from '@/components/brand';
import { Button, ButtonLink, Card, EmptyState, ErrorState, Skeleton, Tabs } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { originOf, pop } from '@/lib/confetti';
import { continueItems, hasVisibleResult } from '@/lib/derive';
import { money, shortDate, timeAgo } from '@/lib/format';
import { useChallenges, useInvites, useMySubmissions, useRespondInvite } from '@/lib/queries';
import { useNow } from '@/lib/useNow';

type Tab = 'progress' | 'submitted' | 'results';

/* ─────────────────────────────── Invites ─────────────────────────────── */

function InviteCard({ invite }: { invite: InviteView }) {
  const respond = useRespondInvite();
  const acceptRef = useRef<HTMLButtonElement>(null);
  const pending = invite.status === 'pending';

  const answer = (status: 'accepted' | 'declined') =>
    respond.mutate(
      { id: invite.id, status },
      {
        onSuccess: () => {
          if (status === 'accepted') {
            pop(originOf(acceptRef.current));
            toast.success(`Accepted! ${invite.company.name} will reach out to schedule.`, { icon: '🤝' });
          } else {
            toast('Invite declined', { description: `We let ${invite.company.name} know. No hard feelings.` });
          }
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 shadow-soft',
        pending ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50' : 'border-line bg-white',
      )}
    >
      {pending ? <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-emerald-200/40 blur-2xl" aria-hidden /> : null}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <CompanyLogo company={invite.company} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              <Mail className="size-3" aria-hidden /> Interview invite
            </span>
            <span className="text-xs text-slate-500">{timeAgo(invite.createdAt)}</span>
          </div>
          <h3 className="mt-1.5 text-lg font-extrabold tracking-tight text-ink">{invite.company.name} wants to interview you</h3>
          <div className="mt-0.5 text-sm text-slate-600">
            {invite.role ? <span className="font-semibold text-ink">{invite.role}</span> : null}
            {invite.role && invite.challengeTitle ? ' · ' : null}
            {invite.challengeTitle ? (
              invite.challengeId ? (
                <Link to={`/challenges/${invite.challengeId}`} className="text-indigo-600 hover:underline">
                  after “{invite.challengeTitle}”
                </Link>
              ) : (
                <>after “{invite.challengeTitle}”</>
              )
            ) : null}
          </div>
          {invite.message ? (
            <blockquote className="mt-3 whitespace-pre-line rounded-xl border border-line/80 bg-white/80 p-3.5 text-sm leading-relaxed text-slate-700">
              {invite.message}
            </blockquote>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {pending ? (
              <>
                <Button ref={acceptRef} variant="success" icon={CircleCheck} loading={respond.isPending && respond.variables?.status === 'accepted'} disabled={respond.isPending} onClick={() => answer('accepted')}>
                  Accept invite
                </Button>
                <Button variant="ghost" loading={respond.isPending && respond.variables?.status === 'declined'} disabled={respond.isPending} onClick={() => answer('declined')}>
                  Decline
                </Button>
              </>
            ) : invite.status === 'accepted' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <CircleCheck className="size-4" aria-hidden /> Accepted — {invite.company.name} will reach out to schedule
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                <CircleX className="size-4" aria-hidden /> Declined
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Rows ─────────────────────────────── */

function ProgressRow({ c }: { c: ChallengeView }) {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <CompanyLogo company={c.company} size={44} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">{c.company?.name}</span>
            <TypeChip type={c.type} size="sm" />
          </div>
          <Link to={`/challenges/${c.id}`} className="mt-0.5 block font-bold leading-snug text-ink hover:text-indigo-700">
            {c.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Countdown deadline={c.deadline} prefix="Due in" />
            <span className="text-xs text-slate-500">~{c.estHours} h · {c.rewardTotal > 0 ? `${money(c.rewardTotal)} bounty` : 'Hiring signal'}</span>
          </div>
        </div>
      </div>
      <ButtonLink to={`/challenges/${c.id}/submit`} className="shrink-0">
        Submit your work <ArrowRight className="size-4" aria-hidden />
      </ButtonLink>
    </Card>
  );
}

function SubmittedRow({ s }: { s: SubmissionView }) {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <CompanyLogo company={s.challenge.company} size={44} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">{s.challenge.company?.name ?? 'Tryout Practice'}</span>
            <TypeChip type={s.challenge.type} size="sm" />
          </div>
          <Link to={`/challenges/${s.challengeId}`} className="mt-0.5 block font-bold leading-snug text-ink hover:text-indigo-700">
            {s.challenge.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <FileArchive className="size-3.5" aria-hidden />
              {s.file.originalName}
            </span>
            <span>Submitted {timeAgo(s.submittedAt)}</span>
          </div>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 sm:self-center">
        <Hourglass className="size-3.5" aria-hidden /> Under review
      </span>
    </Card>
  );
}

function ResultRow({ s }: { s: SubmissionView }) {
  const coach = s.reviewer === 'coach';
  const paid = (s.payout ?? 0) > 0;
  return (
    <Link to={`/challenges/${s.challengeId}`} className="block">
      <Card className={cn('flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5', paid && 'border-amber-200')}>
        {s.totalScore !== null ? <ScoreRing score={s.totalScore} size={60} /> : <Skeleton className="size-[60px] rounded-full" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <CompanyLogo company={s.challenge.company} size={18} className="rounded-md" />
            <span className="font-semibold">{s.challenge.company?.name ?? 'Tryout Practice'}</span>
            <span aria-hidden>·</span>
            <span>{shortDate(s.submittedAt)}</span>
          </div>
          <div className="mt-0.5 font-bold leading-snug text-ink">{s.challenge.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {coach ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                <Sparkles className="size-3" aria-hidden /> Practice · Coach review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <BadgeCheck className="size-3" aria-hidden /> Employer-verified
              </span>
            )}
            <RankBadge rank={s.rank} payout={s.payout} />
            {paid ? <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">+{money(s.payout)}</span> : null}
          </div>
          {s.feedback ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">“{s.feedback}”</p> : null}
        </div>
      </Card>
    </Link>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────── */

export function MyWorkPage() {
  const [params, setParams] = useSearchParams();
  const subs = useMySubmissions();
  const challenges = useChallenges();
  const invites = useInvites();
  const now = useNow(60_000);

  const inProgress = useMemo(() => continueItems(challenges.data, now), [challenges.data, now]);
  const all = subs.data ?? [];
  const results = useMemo(
    () => all.filter(hasVisibleResult).sort((a, b) => new Date(b.scoredAt ?? b.submittedAt).getTime() - new Date(a.scoredAt ?? a.submittedAt).getTime()),
    [all],
  );
  const submitted = useMemo(
    () => all.filter((s) => !hasVisibleResult(s)).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [all],
  );
  const inviteList = [...(invites.data ?? [])].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const paramTab = params.get('tab');
  const tab: Tab =
    paramTab === 'progress' || paramTab === 'submitted' || paramTab === 'results'
      ? paramTab
      : inProgress.length > 0
        ? 'progress'
        : submitted.length > 0
          ? 'submitted'
          : 'results';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true, preventScrollReset: true });

  const earned = results.reduce((sum, s) => sum + (s.payout ?? 0), 0);
  const loading = subs.isLoading || challenges.isLoading;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">My work</h1>
          <p className="mt-1 text-[15px] text-slate-500">Everything you've joined, submitted and been scored on.</p>
        </div>
        {earned > 0 ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
            <Trophy className="size-4" aria-hidden /> {money(earned)} earned on Tryout
          </div>
        ) : null}
      </header>

      {inviteList.length > 0 ? (
        <section className="space-y-3" aria-label="Interview invites">
          <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-400">
            <PartyPopper className="size-4 text-emerald-500" aria-hidden /> Interview invites
          </h2>
          {inviteList.map((i) => (
            <InviteCard key={i.id} invite={i} />
          ))}
        </section>
      ) : invites.isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : null}

      <Tabs<Tab>
        ariaLabel="My work"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'progress', label: 'In progress', count: loading ? undefined : inProgress.length, icon: Clock },
          { value: 'submitted', label: 'Submitted', count: loading ? undefined : submitted.length, icon: Hourglass },
          { value: 'results', label: 'Results', count: loading ? undefined : results.length, icon: Trophy },
        ]}
      />

      <div role="tabpanel" className="space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-2xl" />)
        ) : subs.isError ? (
          <ErrorState message={errorMessage(subs.error)} onRetry={() => void subs.refetch()} />
        ) : tab === 'progress' ? (
          inProgress.length === 0 ? (
            <EmptyState emoji="🧭" title="Nothing in progress" action={<ButtonLink to="/explore">Find a challenge</ButtonLink>}>
              Join a live challenge to claim one of its spots. It'll show up here with a countdown.
            </EmptyState>
          ) : (
            inProgress.map((c) => <ProgressRow key={c.id} c={c} />)
          )
        ) : tab === 'submitted' ? (
          submitted.length === 0 ? (
            <EmptyState emoji="📮" title="No submissions under review">
              When you submit to a live challenge it waits here until the employer publishes results.
            </EmptyState>
          ) : (
            submitted.map((s) => <SubmittedRow key={s.id} s={s} />)
          )
        ) : results.length === 0 ? (
          <EmptyState emoji="🏁" title="No results yet" action={<ButtonLink to="/explore?mode=practice" variant="secondary">Try a practice task</ButtonLink>}>
            Practice tasks get an instant Coach review — a quick way to see your first score.
          </EmptyState>
        ) : (
          results.map((s) => <ResultRow key={s.id} s={s} />)
        )}
      </div>
    </div>
  );
}
