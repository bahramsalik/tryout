import { ArrowDownload20Regular, Checkmark16Regular, Checkmark20Regular, ChevronDown16Regular, ChevronUp16Regular } from '@fluentui/react-icons';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { PLATFORM_RULES, type ChallengeView, type RubricCriterion, type SubmissionView } from '@shared/types';
import { ChallengeMeta, CompanyLogo, RankBadge, Score, VerifiedBadge } from '@/components/brand';
import { Markdown } from '@/components/Markdown';
import { AnchorButton, Badge, Button, ButtonLink, Card, ErrorState, Skeleton, Spinner, TabList } from '@/components/ui';
import { errorMessage, isApiError, starterKitUrl } from '@/lib/api';
import { cn } from '@/lib/cn';
import { isPastDeadline } from '@/lib/derive';
import { useChallenge, useJoinChallenge, useSubmission } from '@/lib/queries';
import { useNow } from '@/lib/useNow';

type ActionState = 'join' | 'joined' | 'practice' | 'submitted' | 'result' | 'full' | 'closed' | 'ended';
type Tab = 'brief' | 'rubric' | 'rules';

function actionState(c: ChallengeView, now: number): ActionState {
  const v = c.viewer;
  if (v?.submissionId) {
    if (v.submissionStatus === 'awarded' || v.submissionStatus === 'not_selected') return 'result';
    if (v.submissionStatus === 'scored') return 'result'; // practice Coach review or an AI grade; recruiter scores stay hidden until published
    return 'submitted';
  }
  if (c.kind === 'practice') return c.status === 'open' ? 'practice' : 'closed';
  if (c.status === 'awarded') return 'ended';
  if (c.status !== 'open' || isPastDeadline(c, now)) return 'closed';
  if (v?.joined) return 'joined';
  if (c.spotsLeft !== null && c.spotsLeft <= 0) return 'full';
  return 'join';
}

/* ─────────────────────────────── Header action ─────────────────────────────── */

function PrimaryAction({ c, state }: { c: ChallengeView; state: ActionState }) {
  const join = useJoinChallenge();
  switch (state) {
    case 'join':
      return (
        <>
          <Button appearance="primary" loading={join.isPending} onClick={() => join.mutate(c.id)}>
            Join
          </Button>
          {join.isError ? <span className="text-caption text-danger-fg">{errorMessage(join.error)}</span> : null}
        </>
      );
    case 'joined':
    case 'practice':
      return (
        <ButtonLink to={`/challenges/${c.id}/submit`} appearance="primary">
          Submit
        </ButtonLink>
      );
    case 'submitted':
      return (
        <Button disabled icon={Checkmark20Regular}>
          Submitted
        </Button>
      );
    case 'result':
      return null;
    case 'full':
      return <Button disabled>Full</Button>;
    case 'closed':
      return <Button disabled>Closed</Button>;
    case 'ended':
      return <Button disabled>Ended</Button>;
  }
}

/* ─────────────────────────────── Result ─────────────────────────────── */

function CriterionScores({ rubric, scores, notes }: { rubric: RubricCriterion[]; scores: Record<string, number> | null; notes?: Record<string, string> }) {
  if (!scores) return null;
  return (
    <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {rubric.map((r) => {
        const s = scores[r.id] ?? 0;
        return (
          <li key={r.id} className="text-body">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-fg2">{r.name}</span>
              <span className="flex gap-0.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={cn('h-1.5 w-4 rounded-full', i <= s ? 'bg-brand' : 'bg-bg5')} />
                ))}
              </span>
              <span className="w-7 text-right tabular-nums text-fg1">{s}/5</span>
            </div>
            {notes?.[r.id] ? <p className="mt-0.5 text-caption text-fg3">{notes[r.id]}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Shown while the AI is still working on a live submission. */
function GradingCard({ delayed }: { delayed: boolean }) {
  return (
    <Card className="flex items-center gap-3 p-5" aria-live="polite">
      <Spinner size={20} />
      <div>
        <div className="text-body font-semibold text-fg1">Grading your work…</div>
        <div className="text-caption text-fg3">
          {delayed ? 'This is taking longer than usual. We will keep trying, and your result will appear here.' : 'This usually takes a few seconds. Your result will appear here.'}
        </div>
      </div>
    </Card>
  );
}

function ResultCard({ c, sub }: { c: ChallengeView; sub: SubmissionView | undefined }) {
  if (!sub) return <Skeleton className="h-40 rounded-lg" />;
  const coach = sub.reviewer === 'coach';
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        {sub.totalScore !== null ? <Score score={sub.totalScore} /> : null}
        <RankBadge rank={sub.rank} placed={sub.status === 'awarded'} />
        <span className="ml-auto text-caption text-fg3">
          {sub.verified ? <VerifiedBadge company={c.company?.name} /> : coach ? 'Coach review' : null}
        </span>
      </div>
      <CriterionScores rubric={c.rubric} scores={sub.scores} notes={sub.scoreNotes} />
      {sub.feedback ? <blockquote className="border-l-2 border-stroke1 pl-3 text-body text-fg2">{sub.feedback}</blockquote> : null}
    </Card>
  );
}

/* ─────────────────────────────── Tabs ─────────────────────────────── */

function BriefTab({ c }: { c: ChallengeView }) {
  return (
    <div className="space-y-6">
      <Markdown>{c.brief}</Markdown>
      <section>
        <h2 className="mb-2 text-subtitle2 font-semibold">Deliverables</h2>
        <ul className="space-y-1.5">
          {c.deliverables.map((d) => (
            <li key={d} className="flex gap-2 text-body text-fg1">
              <Checkmark16Regular className="mt-0.5 shrink-0 text-success" aria-hidden />
              {d}
            </li>
          ))}
        </ul>
      </section>
      {c.classroomConcepts.length > 0 ? (
        <section className="flex flex-wrap items-center gap-2">
          <span className="text-body font-semibold">Uses</span>
          {c.classroomConcepts.map((cc) => (
            <Badge key={cc.concept} title={cc.course}>
              {cc.concept}
            </Badge>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function RubricTab({ rubric }: { rubric: RubricCriterion[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="divide-y divide-stroke2">
      {rubric.map((r) => {
        const expanded = open === r.id;
        return (
          <li key={r.id}>
            <button
              onClick={() => setOpen(expanded ? null : r.id)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span className="min-w-0 flex-1 text-body font-semibold text-fg1">{r.name}</span>
              <span className="hidden h-1 w-32 overflow-hidden rounded-full bg-bg5 sm:block" aria-hidden>
                <span className="block h-full rounded-full bg-brand" style={{ width: `${r.weight}%` }} />
              </span>
              <span className="w-10 text-right text-body tabular-nums text-fg2">{r.weight}%</span>
              {expanded ? <ChevronUp16Regular className="text-fg3" aria-hidden /> : <ChevronDown16Regular className="text-fg3" aria-hidden />}
            </button>
            {expanded ? <p className="pb-3 text-body text-fg2">{r.description}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

function RulesTab({ c }: { c: ChallengeView }) {
  const rules = [
    c.kind === 'practice' ? 'Practice task, scored by Coach' : 'Your score is added to your Proof Profile',
    'Every submission gets scores and feedback',
    'You keep your IP',
    `About ${c.estHours} h of work; ${PLATFORM_RULES.maxEstHours} h max`,
  ];
  return (
    <ul className="space-y-2">
      {rules.map((r) => (
        <li key={r} className="flex gap-2 text-body text-fg1">
          <Checkmark16Regular className="mt-0.5 shrink-0 text-fg3" aria-hidden />
          {r}
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────── */

export function ChallengeDetailPage() {
  const { id } = useParams();
  const q = useChallenge(id);
  const c = q.data;
  const now = useNow(30_000);
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'rubric' ? 'rubric' : params.get('tab') === 'rules' ? 'rules' : 'brief';
  const state = c ? actionState(c, now) : null;
  const subQ = useSubmission(state === 'result' || state === 'submitted' ? c?.viewer?.submissionId : null);

  if (q.isLoading && !c) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-6 h-80 rounded-lg" />
      </div>
    );
  }
  if (q.isError && !c) {
    const notFound = isApiError(q.error) && q.error.status === 404;
    return (
      <ErrorState
        title={notFound ? 'Challenge not found' : "Couldn't load this challenge"}
        message={notFound ? undefined : errorMessage(q.error)}
        onRetry={notFound ? undefined : () => void q.refetch()}
      />
    );
  }
  if (!c || !state) return null;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-body text-fg2">
          <CompanyLogo company={c.company} size={24} />
          <span className="truncate">
            {c.company?.name ?? 'Tryout Practice'}
            {c.hiringFor ? <span className="text-fg3"> · Hiring {c.hiringFor.split('·')[0].trim()}</span> : null}
          </span>
        </div>
        <h1 className="text-title2 font-semibold text-fg1">{c.title}</h1>
        <ChallengeMeta c={c} level />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <PrimaryAction c={c} state={state} />
          {c.hasStarterKit ? (
            <AnchorButton href={starterKitUrl(c.id)} icon={ArrowDownload20Regular} download>
              Starter kit
            </AnchorButton>
          ) : null}
        </div>
      </header>

      {state === 'result' ? <ResultCard c={c} sub={subQ.data} /> : null}
      {state === 'submitted' && subQ.data?.gradingState ? <GradingCard delayed={subQ.data.gradingState === 'delayed'} /> : null}

      <Card className="px-5 pb-6">
        <TabList<Tab>
          ariaLabel="Challenge"
          value={tab}
          onChange={(t) => setParams(t === 'brief' ? {} : { tab: t }, { replace: true, preventScrollReset: true })}
          items={[
            { value: 'brief', label: 'Brief' },
            { value: 'rubric', label: 'Rubric' },
            { value: 'rules', label: 'Rules' },
          ]}
          className="-mx-2 mb-5 border-b border-stroke2"
        />
        <div role="tabpanel" className="max-w-3xl">
          {tab === 'brief' ? <BriefTab c={c} /> : tab === 'rubric' ? <RubricTab rubric={c.rubric} /> : <RulesTab c={c} />}
        </div>
      </Card>
    </div>
  );
}
