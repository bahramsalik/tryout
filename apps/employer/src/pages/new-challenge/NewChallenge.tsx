import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  Plus,
  Rocket,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { TYPE_META, rewardTotal, type ChallengeView, type CreateChallengeInput } from '@shared/types';
import { api, errorMessage } from '@/lib/api';
import { celebrate } from '@/lib/confetti';
import { money } from '@/lib/format';
import { useDocumentTitle } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { qk, queryClient } from '@/lib/queries';
import { StudentCard, StudentChallengePreview, payoutLine } from '@/components/StudentPreview';
import { Button, ButtonLink, Card, TypingDots, cn } from '@/components/ui';
import {
  draftReward,
  draftToInput,
  draftToPreview,
  emptyDraft,
  inputToDraft,
  stepValid,
  validateStep,
  weightTotal,
  type Draft,
} from './draft';
import { EscrowSummary, StepRewards } from './StepRewards';
import { StepRubric } from './StepRubric';
import { StepTask } from './StepTask';

const STEPS = [
  { title: 'The task', subtitle: 'What students will do, and for how long.' },
  { title: 'How you’ll judge', subtitle: 'A weighted rubric students see before they start.' },
  { title: 'Rewards & limits', subtitle: 'Bounty, applicant cap and deadline.' },
  { title: 'Review & publish', subtitle: 'Exactly what students will see.' },
] as const;

function draftKey(personaId: string) {
  return `tryout.employer.draft.${personaId}`;
}

function loadDraft(personaId: string): Draft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(personaId));
    return raw ? { ...emptyDraft(), ...(JSON.parse(raw) as Partial<Draft>) } : null;
  } catch {
    return null;
  }
}

export function NewChallengePage() {
  const { personaId, company } = usePersona();
  useDocumentTitle('Add a challenge');
  const [draft, setDraft] = useState<Draft>(() => loadDraft(personaId) ?? emptyDraft());
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState<boolean[]>([false, false, false, false]);
  const [showPreview, setShowPreview] = useState(false);
  const [published, setPublished] = useState<ChallengeView | null>(null);

  // Persist the draft per persona for the session, so a refresh or a detour doesn't lose work.
  useEffect(() => {
    if (published) return;
    try {
      sessionStorage.setItem(draftKey(personaId), JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, personaId, published]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const errors = attempted[step] ? validateStep(step, draft) : {};
  const preview = useMemo(() => draftToPreview(draft, company), [draft, company]);
  const isDirty = draft.title.trim() !== '' || draft.brief.trim() !== '' || draft.rubric.length > 0;

  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const furthestReachable = (() => {
    let i = 0;
    while (i < 3 && stepValid(i, draft)) i++;
    return i;
  })();

  const next = () => {
    setAttempted((a) => a.map((v, i) => (i === step ? true : v)));
    const errs = validateStep(step, draft);
    const n = Object.keys(errs).length;
    if (n > 0) {
      toast.error(n === 1 ? 'One thing to fix before continuing' : `${n} things to fix before continuing`, {
        description: Object.values(errs)[0],
      });
      return;
    }
    goTo(Math.min(3, step + 1));
  };

  const example = useMutation({
    mutationFn: () => api<CreateChallengeInput & { deadlineInDays?: number }>('/employer/example-challenge'),
    onSuccess: (ex) => {
      const previous = draft;
      setDraft(inputToDraft(ex));
      setAttempted([false, false, false, false]);
      goTo(0);
      toast.success('Example loaded', {
        description: 'A realistic challenge from your company — edit anything before publishing.',
        action: isDirty ? { label: 'Undo', onClick: () => setDraft(previous) } : undefined,
      });
    },
    onError: (err) => toast.error('Couldn’t load the example', { description: errorMessage(err) }),
  });

  const publish = useMutation({
    mutationFn: (input: CreateChallengeInput) => api<ChallengeView>('/challenges', { method: 'POST', json: input }),
    onSuccess: (challenge) => {
      try {
        sessionStorage.removeItem(draftKey(personaId));
      } catch {
        /* ignore */
      }
      queryClient.setQueryData(qk.challenge(challenge.id), challenge);
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      setPublished(challenge);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => celebrate({ y: 0.3 }), 150);
    },
    onError: (err) => toast.error('Couldn’t publish the challenge', { description: errorMessage(err) }),
  });

  const doPublish = () => {
    for (let i = 0; i < 3; i++) {
      if (!stepValid(i, draft)) {
        setAttempted((a) => a.map((v, j) => (j === i ? true : v)));
        goTo(i);
        toast.error(`Step ${i + 1} needs attention`, { description: Object.values(validateStep(i, draft))[0] });
        return;
      }
    }
    publish.mutate(draftToInput(draft));
  };

  const startOver = () => {
    setDraft(emptyDraft());
    setAttempted([false, false, false, false]);
    setPublished(null);
    goTo(0);
  };

  if (published) return <PublishedScreen challenge={published} onAnother={startOver} />;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="size-3.5" aria-hidden /> Dashboard
          </Link>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Add a challenge</h1>
          <p className="mt-1 text-sm text-slate-500">Post a 1–5 hour task that mirrors week-one work for the role.</p>
        </div>
        <div className="flex items-center gap-2 pt-5">
          {isDirty && (
            <Button size="sm" variant="ghost" icon={<RotateCcw className="size-3.5" />} onClick={startOver}>
              Start over
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => example.mutate()}
            disabled={example.isPending}
            icon={example.isPending ? undefined : <Wand2 className="size-4 text-violet-600" aria-hidden />}
          >
            {example.isPending ? (
              <>
                Loading <TypingDots className="text-violet-600" />
              </>
            ) : (
              'Use example'
            )}
          </Button>
        </div>
      </header>

      <Stepper step={step} furthest={furthestReachable} onGo={goTo} />

      <div className="mt-5 grid gap-6 @5xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          {step < 3 && (
            <div className="mb-4 @5xl:hidden">
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-indigo-800"
                aria-expanded={showPreview}
              >
                {showPreview ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                {showPreview ? 'Hide student card preview' : 'Show student card preview'}
              </button>
              {showPreview && (
                <div className="mt-2 max-w-sm animate-pop-in">
                  <StudentCard challenge={preview} />
                </div>
              )}
            </div>
          )}

          <Card className="@container p-4 sm:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{STEPS[step].title}</h2>
              <p className="text-[13px] text-slate-500">{STEPS[step].subtitle}</p>
            </div>
            {step === 0 && <StepTask draft={draft} set={set} errors={errors} company={company} />}
            {step === 1 && <StepRubric draft={draft} set={set} errors={errors} />}
            {step === 2 && <StepRewards draft={draft} set={set} errors={errors} />}
            {step === 3 && <StepReview draft={draft} onEdit={goTo} />}
          </Card>
        </div>

        <aside className="hidden @5xl:block">
          <div className="sticky top-20 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <Eye className="size-3.5" aria-hidden /> Live student preview
            </p>
            <StudentCard challenge={preview} />
            <PreviewFacts draft={draft} />
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Button variant="ghost" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} icon={<ArrowLeft className="size-4" />}>
            Back
          </Button>
          <div className="mx-auto hidden items-center gap-1.5 @lg:flex" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-slate-200')} />
            ))}
          </div>
          {step < 3 ? (
            <Button variant="primary" className="ml-auto" onClick={next} iconRight={<ArrowRight className="size-4" />}>
              Continue
            </Button>
          ) : (
            <Button
              variant="success"
              size="lg"
              className="ml-auto"
              onClick={doPublish}
              loading={publish.isPending}
              icon={publish.isPending ? undefined : <Rocket className="size-4" aria-hidden />}
            >
              {publish.isPending ? 'Publishing…' : 'Publish challenge'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step, furthest, onGo }: { step: number; furthest: number; onGo: (i: number) => void }) {
  return (
    <nav aria-label="Wizard steps">
      <ol className="flex items-center gap-1.5 @xl:gap-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          const reachable = i <= furthest || i <= step;
          return (
            <li key={s.title} className={cn('flex min-w-0 items-center gap-1.5 @xl:gap-2', current ? 'flex-[1.6]' : 'flex-1')}>
              <button
                type="button"
                onClick={() => reachable && onGo(i)}
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-lg py-1 pr-2 text-left transition-colors',
                  reachable ? 'hover:bg-slate-100' : 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors',
                    current ? 'bg-primary text-white ring-4 ring-indigo-100' : done ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500',
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    'truncate text-[13px] font-semibold',
                    current ? 'text-slate-900' : 'hidden text-slate-500 @2xl:inline',
                  )}
                >
                  {s.title}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={cn('h-px min-w-3 flex-1 rounded-full', i < step ? 'bg-indigo-300' : 'bg-slate-200')} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PreviewFacts({ draft }: { draft: Draft }) {
  const total = weightTotal(draft.rubric);
  const pool = rewardTotal(draftReward(draft));
  const items = [
    { ok: draft.estHours <= 5, label: `${draft.estHours} h time-box (max 5)` },
    { ok: draft.rubric.length > 0 && total === 100, label: draft.rubric.length ? `Rubric weights ${total}%` : 'Rubric not set' },
    { ok: true, label: pool > 0 ? `${money(pool)} escrowed on publish` : 'No bounty · feedback guaranteed' },
    { ok: true, label: draft.capped ? `Cap: ${Number.isFinite(draft.cap) ? draft.cap : '—'} applicants` : 'No applicant cap' },
  ];
  return (
    <ul className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-slate-600">
          <CheckCircle2 className={cn('size-3.5 shrink-0', it.ok ? 'text-emerald-500' : 'text-slate-300')} aria-hidden />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function StepReview({ draft, onEdit }: { draft: Draft; onEdit: (step: number) => void }) {
  const { company } = usePersona();
  const preview = draftToPreview(draft, company);
  const type = draft.type ? TYPE_META[draft.type] : null;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-[13px] text-indigo-900">
        <Eye className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
        <p>
          This is exactly what students will see. Publishing escrows the bounty and notifies students interested in{' '}
          <strong>{type?.label ?? 'this field'}</strong> instantly.
        </p>
      </div>

      <div className="grid gap-5 @3xl:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Card on Explore</p>
          <StudentCard challenge={preview} />
          <EscrowSummary draft={draft} />
          <div className="flex flex-wrap gap-1.5">
            {STEPS.slice(0, 3).map((s, i) => (
              <Button key={s.title} size="xs" variant="subtle" onClick={() => onEdit(i)}>
                Edit {s.title.toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Challenge page</p>
          <StudentChallengePreview challenge={preview} />
        </div>
      </div>
    </div>
  );
}

function PublishedScreen({ challenge, onAnother }: { challenge: ChallengeView; onAnother: () => void }) {
  useDocumentTitle('Challenge published');
  const type = TYPE_META[challenge.type];
  return (
    <div className="mx-auto w-full max-w-3xl py-4">
      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-8 text-white">
          <div className="flex size-12 animate-pop-in items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <Rocket className="size-6" aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Your challenge is live</h1>
          <p className="mt-1 max-w-lg text-sm text-indigo-100">
            Students can join right now. You’ll get a live toast for every submission, and scores stay private until you
            publish results.
          </p>
        </div>
        <div className="grid gap-6 p-6 @2xl:grid-cols-[17rem_minmax(0,1fr)]">
          <StudentCard challenge={challenge} />
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Bell className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-slate-900">Students notified</span>
                <span className="text-slate-500">Everyone interested in {type.label} sees it at the top of Explore.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Lock className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-slate-900">
                  {challenge.rewardTotal > 0 ? `${money(challenge.rewardTotal)} escrowed` : 'No bounty — feedback guaranteed'}
                </span>
                <span className="text-slate-500">{payoutLine(challenge)}.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <EyeOff className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-slate-900">Blind review is on</span>
                <span className="text-slate-500">You’ll see “Candidate K7”, not names, until results are out.</span>
              </span>
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <ButtonLink to={`/challenges/${challenge.id}`} variant="primary" iconRight={<ArrowRight className="size-4" />}>
            View challenge
          </ButtonLink>
          <ButtonLink to="/" variant="secondary" icon={<LayoutDashboard className="size-4" />}>
            Dashboard
          </ButtonLink>
          <Button variant="ghost" className="ml-auto" icon={<Plus className="size-4" />} onClick={onAnother}>
            Post another
          </Button>
        </div>
      </Card>
    </div>
  );
}
