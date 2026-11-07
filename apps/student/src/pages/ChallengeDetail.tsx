import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CircleCheck,
  Clock,
  Download,
  FileArchive,
  GraduationCap,
  Hourglass,
  ListChecks,
  Lock,
  MapPin,
  NotebookPen,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import type { ChallengeView, RubricCriterion, SubmissionView } from '@shared/types';
import {
  CompanyLogo,
  Countdown,
  DifficultyBadge,
  EscrowChip,
  HiringTag,
  RewardBadge,
  ScoreRing,
  SpotsBar,
  TypeChip,
} from '@/components/brand';
import { Markdown } from '@/components/Markdown';
import { Button, ButtonLink, Card, ErrorState, Skeleton, buttonClass } from '@/components/ui';
import { errorMessage, isApiError, starterKitUrl } from '@/lib/api';
import { TASK_PROMPTS, useCoach } from '@/lib/coach';
import { cn } from '@/lib/cn';
import { originOf, pop } from '@/lib/confetti';
import { isPastDeadline } from '@/lib/derive';
import { longDate, medal, money, ordinal, payoutLine, timeAgo } from '@/lib/format';
import { useChallenge, useJoinChallenge, useSubmission } from '@/lib/queries';
import { useNow } from '@/lib/useNow';

/* ─────────────────────────────── State machine ─────────────────────────────── */

type ActionState =
  | 'join'
  | 'joined'
  | 'practice'
  | 'submitted'
  | 'coach_result'
  | 'result'
  | 'full'
  | 'closed'
  | 'ended';

function actionState(c: ChallengeView, now: number): ActionState {
  const v = c.viewer;
  if (v?.submissionId) {
    if (v.submissionStatus === 'awarded' || v.submissionStatus === 'not_selected') return 'result';
    if (c.kind === 'practice' && v.submissionStatus === 'scored') return 'coach_result';
    return 'submitted';
  }
  if (c.kind === 'practice') return c.status === 'open' ? 'practice' : 'closed';
  if (c.status === 'awarded') return 'ended';
  if (c.status !== 'open' || isPastDeadline(c, now)) return 'closed';
  if (v?.joined) return 'joined';
  if (c.spotsLeft !== null && c.spotsLeft <= 0) return 'full';
  return 'join';
}

/* ─────────────────────────────── Pieces ─────────────────────────────── */

function RewardLadder({ c }: { c: ChallengeView }) {
  if (c.reward.mode === 'none' || c.reward.amounts.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
        <span className="font-semibold text-ink">No bounty</span> — a hiring signal for{' '}
        <span className="font-semibold text-ink">{c.company?.name}</span>. Feedback is still guaranteed.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {c.reward.amounts.map((amt, i) => (
        <div key={i} className={cn('rounded-xl px-2 py-2 text-center', i === 0 ? 'bg-amber-50 ring-1 ring-amber-200 ring-inset' : 'bg-slate-50')}>
          <div className="text-base" aria-hidden>
            {medal(i + 1)}
          </div>
          <div className="text-sm font-extrabold tabular-nums text-ink">{money(amt)}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{ordinal(i + 1)}</div>
        </div>
      ))}
    </div>
  );
}

function CriterionScores({ rubric, scores }: { rubric: RubricCriterion[]; scores: Record<string, number> | null }) {
  if (!scores) return null;
  return (
    <ul className="space-y-2.5">
      {rubric.map((r) => {
        const s = scores[r.id] ?? 0;
        return (
          <li key={r.id}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">{r.name}</span>
              <span className="tabular-nums text-slate-500">
                <span className="font-bold text-ink">{s}</span>/5 · {r.weight}%
              </span>
            </div>
            <div className="mt-1 flex gap-1" aria-hidden>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= s ? 'brand-gradient' : 'bg-slate-100')} />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ResultBody({ c, sub, coachReview }: { c: ChallengeView; sub: SubmissionView | undefined; coachReview?: boolean }) {
  if (!sub) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  const paid = (sub.payout ?? 0) > 0;
  return (
    <div className="space-y-4">
      {coachReview ? (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="size-3.5" aria-hidden /> Coach review · preview
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck className="size-3.5" aria-hidden /> Employer-verified result
        </div>
      )}
      <div className="flex items-center gap-4">
        {sub.totalScore !== null ? <ScoreRing score={sub.totalScore} size={72} stroke={7} /> : null}
        <div className="min-w-0">
          {sub.rank ? (
            <div className="text-lg font-extrabold tracking-tight text-ink">
              {medal(sub.rank) ? `${medal(sub.rank)} ` : ''}
              {ordinal(sub.rank)} place
              {c.submissionCount ? <span className="text-sm font-semibold text-slate-400"> of {c.submissionCount}</span> : null}
            </div>
          ) : (
            <div className="text-lg font-extrabold tracking-tight text-ink">{coachReview ? 'Reviewed' : 'Scored'}</div>
          )}
          {paid ? (
            <div className="mt-0.5 text-sm font-semibold text-emerald-600">{money(sub.payout)} is on its way 🎉</div>
          ) : coachReview ? (
            <div className="mt-0.5 text-sm text-slate-500">+{c.estHours} practice hours on your profile</div>
          ) : (
            <div className="mt-0.5 text-sm text-slate-500">Not in the paid places this time — your feedback is below.</div>
          )}
        </div>
      </div>
      <CriterionScores rubric={c.rubric} scores={sub.scores} />
      {sub.feedback ? (
        <figure className="rounded-xl border border-line bg-slate-50/80 p-3.5">
          <figcaption className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-500">
            {coachReview ? <Sparkles className="size-3.5 text-indigo-500" aria-hidden /> : <CompanyLogo company={c.company} size={18} className="rounded-md" />}
            {coachReview ? 'Coach feedback' : `Feedback from ${c.company?.name ?? 'the employer'}`}
          </figcaption>
          <blockquote className="text-sm leading-relaxed text-slate-700">{sub.feedback}</blockquote>
        </figure>
      ) : null}
    </div>
  );
}

function ActionCard({ c }: { c: ChallengeView }) {
  const now = useNow(1000);
  const state = actionState(c, now);
  const join = useJoinChallenge();
  const joinBtn = useRef<HTMLButtonElement>(null);
  const subQ = useSubmission(state === 'result' || state === 'coach_result' || state === 'submitted' ? c.viewer?.submissionId : null);
  const sub = subQ.data;

  const onJoin = () => {
    join.mutate(c.id, {
      onSuccess: () => {
        pop(originOf(joinBtn.current));
        toast.success("You're in! Spot claimed 🎉", {
          description: c.deadline ? `Submit before ${longDate(c.deadline)}. Good luck!` : 'Submit whenever you are ready.',
        });
      },
      onError: (err) => {
        toast.error(errorMessage(err));
      },
    });
  };

  const header = (title: string, tone: string, icon: ReactNode) => (
    <div className={cn('flex items-center gap-2 px-5 py-3 text-sm font-bold', tone)}>
      {icon}
      {title}
    </div>
  );

  let body: ReactNode;
  let top: ReactNode = null;

  switch (state) {
    case 'join':
      top = header(c.rewardTotal > 0 ? `${money(c.rewardTotal)} for the top performers` : 'Get seen by the hiring team', 'bg-amber-50 text-amber-800', <span aria-hidden>💰</span>);
      body = (
        <div className="space-y-4">
          <RewardLadder c={c} />
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-ink">{payoutLine(c)}.</span> Everyone who submits gets scores and written feedback.
          </p>
          <Button ref={joinBtn} size="lg" className="w-full" onClick={onJoin} loading={join.isPending}>
            Join challenge
          </Button>
          <div className="space-y-2">
            <SpotsBar participantCount={c.participantCount} applicantCap={c.applicantCap} />
            <p className="text-center text-xs text-slate-500">
              {c.applicantCap ? `Claims 1 of ${c.applicantCap} spots` : 'Claims your spot'} · ~{c.estHours} h of focused work
            </p>
          </div>
        </div>
      );
      break;

    case 'joined':
      top = header("You're in — spot claimed", 'bg-indigo-50 text-indigo-800', <CircleCheck className="size-4" aria-hidden />);
      body = (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time left to submit</div>
            <Countdown deadline={c.deadline} prefix="" icon={false} className="mt-0.5 text-2xl font-extrabold" />
          </div>
          <ButtonLink to={`/challenges/${c.id}/submit`} size="lg" className="w-full">
            Submit your work <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <ol className="space-y-2 text-sm text-slate-600">
            {[
              c.hasStarterKit ? 'Download the starter kit' : 'Read the brief and rubric',
              `Do the work (about ${c.estHours} h)`,
              'Zip it up and write your approach notes',
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          {c.hasStarterKit ? (
            <a href={starterKitUrl(c.id)} className={buttonClass('secondary', 'md', 'w-full')} download>
              <Download className="size-4" aria-hidden /> Starter kit (.zip)
            </a>
          ) : null}
        </div>
      );
      break;

    case 'practice':
      top = header('Practice · instant Coach review', 'bg-emerald-50 text-emerald-800', <Sparkles className="size-4" aria-hidden />);
      body = (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Free and evergreen. No need to join — submit whenever you're ready and Coach scores it against the rubric right away.
          </p>
          <ButtonLink to={`/challenges/${c.id}/submit`} size="lg" className="w-full">
            Submit your work <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          {c.hasStarterKit ? (
            <a href={starterKitUrl(c.id)} className={buttonClass('secondary', 'md', 'w-full')} download>
              <Download className="size-4" aria-hidden /> Starter kit (.zip)
            </a>
          ) : null}
          <p className="text-center text-xs text-slate-500">{c.participantCount} students have practiced this task</p>
        </div>
      );
      break;

    case 'submitted':
      top = header('Submitted · under review', 'bg-sky-50 text-sky-800', <Hourglass className="size-4" aria-hidden />);
      body = (
        <div className="space-y-4">
          {sub ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50/60 p-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-indigo-500 shadow-sm">
                <FileArchive className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{sub.file.originalName}</div>
                <div className="text-xs text-slate-500">
                  {sub.file.fileCount} files · submitted {timeAgo(sub.submittedAt, now)}
                </div>
              </div>
            </div>
          ) : (
            <Skeleton className="h-16 w-full" />
          )}
          <p className="text-sm leading-relaxed text-slate-600">
            {c.company?.name ?? 'The employer'} is scoring every submission against the rubric. Results publish all at once — you'll get a
            notification the moment they're out.
          </p>
          <ButtonLink to="/work?tab=submitted" variant="secondary" className="w-full">
            View in My work
          </ButtonLink>
        </div>
      );
      break;

    case 'coach_result':
      top = header('Practice complete', 'bg-indigo-50 text-indigo-800', <Sparkles className="size-4" aria-hidden />);
      body = <ResultBody c={c} sub={sub} coachReview />;
      break;

    case 'result': {
      const paid = (sub?.payout ?? 0) > 0;
      top = header(
        paid ? 'You placed — congratulations!' : 'Results & feedback are in',
        paid ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700',
        <span aria-hidden>{paid ? medal(sub?.rank) ?? '🏆' : '📬'}</span>,
      );
      body = <ResultBody c={c} sub={sub} />;
      break;
    }

    case 'full':
      top = header('All spots are taken', 'bg-red-50 text-red-700', <Users className="size-4" aria-hidden />);
      body = (
        <div className="space-y-4">
          <SpotsBar participantCount={c.participantCount} applicantCap={c.applicantCap} />
          <p className="text-sm text-slate-600">The applicant cap keeps the odds fair. Try a similar challenge or practice this skill for free.</p>
          <ButtonLink to={`/explore?type=${c.type}`} variant="secondary" className="w-full">
            Similar challenges
          </ButtonLink>
        </div>
      );
      break;

    case 'closed':
      top = header('Submissions closed', 'bg-slate-100 text-slate-700', <Lock className="size-4" aria-hidden />);
      body = (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{c.company?.name ?? 'The employer'} is reviewing submissions. Results and feedback are on the way.</p>
          <ButtonLink to="/explore" variant="secondary" className="w-full">
            Explore open challenges
          </ButtonLink>
        </div>
      );
      break;

    case 'ended':
      top = header('This challenge has ended', 'bg-slate-100 text-slate-700', <BadgeCheck className="size-4" aria-hidden />);
      body = (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Results are published. {c.submissionCount} students submitted and every one got feedback.</p>
          <ButtonLink to="/explore" className="w-full">
            Explore open challenges
          </ButtonLink>
        </div>
      );
      break;
  }

  return (
    <Card className="overflow-hidden">
      {top}
      <div className="p-5">{body}</div>
      {subQ.isError && !isApiError(subQ.error) ? <p className="px-5 pb-4 text-xs text-red-600">Couldn't load your submission.</p> : null}
    </Card>
  );
}

function FairWorkBox({ c }: { c: ChallengeView }) {
  const items = [
    c.kind === 'live' && c.rewardTotal > 0
      ? { icon: Lock, title: 'Bounty escrowed', text: `${money(c.rewardTotal)} is held by Tryout from posting until results are out.` }
      : c.kind === 'live'
        ? { icon: Lock, title: 'No bounty, no catch', text: 'A hiring signal — you still get scores and written feedback.' }
        : { icon: Sparkles, title: 'Free practice', text: 'Instant Coach review. Practice hours count separately on your profile.' },
    { icon: NotebookPen, title: 'Feedback guaranteed', text: 'Results can’t publish until every submission has scores and written feedback.' },
    { icon: ShieldCheck, title: 'You keep your IP', text: 'A license transfers only for paid placements.' },
    { icon: Hourglass, title: 'Time-boxed', text: `Designed for ~${c.estHours} h. Platform rule: never more than 5.` },
  ];
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
        <Scale className="size-4 text-emerald-500" aria-hidden /> Fair work, guaranteed
      </h3>
      <ul className="mt-3 space-y-3">
        {items.map((it) => (
          <li key={it.title} className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <it.icon className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-ink">{it.title}</span>
              <span className="block text-xs leading-relaxed text-slate-500">{it.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CoachCard({ c, className }: { c: ChallengeView; className?: string }) {
  const coach = useCoach();
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center gap-2.5 border-b border-line bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-3">
        <span className="grid size-7 place-items-center rounded-lg brand-gradient text-white">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <span className="text-sm font-bold text-ink">Ask Coach about this task</span>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Preview</span>
      </div>
      <div className="grid gap-1.5 p-3">
        {TASK_PROMPTS.map((p) => (
          <button
            key={p.key}
            onClick={() => coach.open({ challengeId: c.id, send: { text: p.label, quickPrompt: p.key } })}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-800"
          >
            <span aria-hidden>{p.emoji}</span>
            {p.label}
            <ArrowRight className="ml-auto size-3.5 text-slate-300" aria-hidden />
          </button>
        ))}
      </div>
    </Card>
  );
}

function Section({ icon: Icon, title, children, sub }: { icon: typeof BookOpen; title: string; children: ReactNode; sub?: string }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
        <Icon className="size-[18px] text-indigo-500" aria-hidden /> {title}
      </h2>
      {sub ? <p className="mt-1 text-sm text-slate-500">{sub}</p> : null}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-24" />
      <div className="rounded-3xl border border-line bg-white p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="mt-5 h-8 w-4/5" />
        <Skeleton className="mt-3 h-4 w-3/5" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export function ChallengeDetailPage() {
  const { id } = useParams();
  const q = useChallenge(id);
  const c = q.data;

  if (q.isLoading && !c) return <DetailSkeleton />;
  if (q.isError && !c) {
    const notFound = isApiError(q.error) && q.error.status === 404;
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          title={notFound ? 'Challenge not found' : "Couldn't load this challenge"}
          message={notFound ? 'It may have been removed. Browse the open challenges instead.' : errorMessage(q.error)}
          onRetry={notFound ? undefined : () => void q.refetch()}
        />
      </div>
    );
  }
  if (!c) return null;

  const showEscrow = c.kind === 'live' && c.rewardTotal > 0 && c.status !== 'awarded';

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="relative overflow-hidden rounded-3xl border border-line/80 bg-white p-5 shadow-soft sm:p-7">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${'#4F46E5'}, ${'#7C3AED'})` }}
          aria-hidden
        />
        <div className="flex flex-wrap items-center gap-3">
          <CompanyLogo company={c.company} size={48} />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-ink">{c.company?.name ?? 'Tryout Practice'}</div>
            <div className="text-sm text-slate-500">{c.company ? c.company.industry : 'Practice arena · curated by Tryout'}</div>
          </div>
          {c.hiringFor ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700" title={c.hiringFor}>
              <span aria-hidden>💼</span> Hiring: {c.hiringFor}
            </span>
          ) : null}
        </div>
        <h1 className="mt-4 text-[24px] font-extrabold leading-tight tracking-tight text-ink sm:text-[30px]">{c.title}</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">{c.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TypeChip type={c.type} />
          <RewardBadge challenge={c} />
          {showEscrow ? <EscrowChip amount={c.rewardTotal} /> : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold leading-5 text-slate-700">
            <Clock className="size-3.5" aria-hidden /> ~{c.estHours} h
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 leading-5">
            <DifficultyBadge difficulty={c.difficulty} />
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm">
          {c.kind === 'live' ? (
            <>
              <Countdown deadline={c.deadline} className="text-sm" />
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Users className="size-4 text-slate-400" aria-hidden />
                <span className="font-semibold tabular-nums text-ink">{c.participantCount}</span>
                {c.applicantCap ? <span className="tabular-nums">/ {c.applicantCap} joined</span> : ' joined'}
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <span aria-hidden>🏅</span> {payoutLine(c)}
              </span>
            </>
          ) : (
            <span className="text-slate-600">
              <span className="font-semibold text-ink">{c.submissionCount}</span> submissions · evergreen · instant Coach review
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside className="lg:order-2">
          <div className="space-y-4 lg:sticky lg:top-24">
            <ActionCard c={c} />
            <FairWorkBox c={c} />
            <CoachCard c={c} className="hidden lg:block" />
          </div>
        </aside>

        <div className="min-w-0 space-y-6 lg:order-1">
          <Section icon={BookOpen} title="The brief">
            <Markdown>{c.brief}</Markdown>
          </Section>

          <Section icon={ListChecks} title="Deliverables" sub="What your zip and notes should include.">
            <ul className="space-y-2.5">
              {c.deliverables.map((d) => (
                <li key={d} className="flex gap-3 text-[15px] text-slate-700">
                  <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-emerald-500" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Scale} title="How you'll be judged" sub="Each criterion is scored 1–5 and weighted. Your total is out of 100.">
            <ul className="space-y-4">
              {c.rubric.map((r) => (
                <li key={r.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink">{r.name}</span>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold tabular-nums text-indigo-700">{r.weight}%</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{r.description}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                    <div className="h-full rounded-full brand-gradient" style={{ width: `${r.weight}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          {c.classroomConcepts.length > 0 ? (
            <Section icon={GraduationCap} title="From the classroom" sub="The theory this task puts into practice.">
              <div className="grid gap-3 sm:grid-cols-2">
                {c.classroomConcepts.map((cc) => (
                  <div key={cc.concept} className="flex gap-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm">
                      <GraduationCap className="size-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">{cc.concept}</span>
                      <span className="block text-xs text-slate-500">{cc.course}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {c.hasStarterKit ? (
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FileArchive className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-ink">Starter kit</h2>
                <p className="text-sm text-slate-500">The files the team works with — data, a starter repo or logs. Everything you need to begin.</p>
              </div>
              <a href={starterKitUrl(c.id)} className={buttonClass('secondary', 'md', 'shrink-0')} download>
                <Download className="size-4" aria-hidden /> Download .zip
              </a>
            </Card>
          ) : null}

          {c.skills.length > 0 ? (
            <Section icon={Sparkles} title="Skills you'll show">
              <div className="flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <span key={s} className="rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {c.company ? (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <CompanyLogo company={c.company} size={44} />
                <div className="min-w-0">
                  <h2 className="font-bold text-ink">About {c.company.name}</h2>
                  <p className="text-sm text-slate-500">{c.company.tagline}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.company.about}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden /> {c.company.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden /> {c.company.size}
                </span>
              </div>
              {c.company.hiringFor.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.company.hiringFor.map((r) => (
                    <HiringTag key={r} role={r} />
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}

          <CoachCard c={c} className="lg:hidden" />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/explore" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden /> Explore
    </Link>
  );
}
