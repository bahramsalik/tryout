import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Wand2 } from '@/components/icons';
import type { ChallengeView, CreateChallengeInput } from '@shared/types';
import { api } from '@/lib/api';
import { useDocumentTitle } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { qk, queryClient } from '@/lib/queries';
import { StudentCard } from '@/components/StudentPreview';
import { Button, ButtonLink, Card, InlineError, PageHeader, TabList, cn } from '@/components/ui';
import { draftToInput, draftToPreview, emptyDraft, inputToDraft, stepValid, validateStep, type Draft } from './draft';
import { StepLimits } from './StepLimits';
import { StepRubric } from './StepRubric';
import { StepTask } from './StepTask';

const STEPS = ['Task', 'Judging', 'Limits'] as const;
const LAST = STEPS.length - 1;

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
  useDocumentTitle('Add challenge');
  const [draft, setDraft] = useState<Draft>(() => loadDraft(personaId) ?? emptyDraft());
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState<boolean[]>(STEPS.map(() => false));
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

  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => document.getElementById('main')?.scrollTo({ top: 0 }));
  };

  /** Moving forward validates every step in between; errors show inline on the first invalid one. */
  const tryGo = (target: number) => {
    if (target <= step) return goTo(target);
    for (let i = step; i < target; i++) {
      if (!stepValid(i, draft)) {
        setAttempted((a) => a.map((v, j) => (j === i ? true : v)));
        return goTo(i);
      }
    }
    goTo(target);
  };

  const example = useMutation({
    mutationFn: () => api<CreateChallengeInput & { deadlineInDays?: number }>('/employer/example-challenge'),
    onSuccess: (ex) => {
      setDraft(inputToDraft(ex));
      setAttempted(STEPS.map(() => false));
      goTo(0);
    },
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
      document.getElementById('main')?.scrollTo({ top: 0 });
    },
  });

  const doPublish = () => {
    for (let i = 0; i <= LAST; i++) {
      if (!stepValid(i, draft)) {
        setAttempted((a) => a.map((v, j) => (j === i ? true : v)));
        goTo(i);
        return;
      }
    }
    publish.mutate(draftToInput(draft));
  };

  if (published) return <PublishedScreen challenge={published} />;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link to="/challenges" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Challenges
      </Link>
      <PageHeader
        title="Add challenge"
        actions={
          <Button onClick={() => example.mutate()} loading={example.isPending} icon={<Wand2 className="size-5" aria-hidden />}>
            Use example
          </Button>
        }
      />
      <InlineError error={example.error} className="mb-3" />

      <TabList
        label="Steps"
        value={String(step)}
        onChange={(v) => tryGo(Number(v))}
        items={STEPS.map((title, i) => ({ value: String(i), label: `${i + 1}. ${title}` }))}
      />

      <div className={cn('mt-4 grid items-start gap-6', step === LAST && 'min-[1100px]:grid-cols-[minmax(0,1fr)_18rem]')}>
        <Card className="@container p-5">
          {step === 0 && <StepTask draft={draft} set={set} errors={errors} company={company} />}
          {step === 1 && <StepRubric draft={draft} set={set} errors={errors} />}
          {step === 2 && <StepLimits draft={draft} set={set} errors={errors} />}

          <InlineError error={publish.error} className="mt-4" />
          <div className="mt-6 flex items-center gap-2">
            {step > 0 && <Button onClick={() => goTo(step - 1)}>Back</Button>}
            {step < LAST ? (
              <Button variant="primary" className="ml-auto" onClick={() => tryGo(step + 1)}>
                Next
              </Button>
            ) : (
              <Button variant="primary" className="ml-auto" onClick={doPublish} loading={publish.isPending}>
                Publish
              </Button>
            )}
          </div>
        </Card>

        {step === LAST && (
          <aside className="sticky top-4 hidden min-[1100px]:block" aria-label="Student card">
            <StudentCard challenge={preview} />
          </aside>
        )}
      </div>
    </div>
  );
}

function PublishedScreen({ challenge }: { challenge: ChallengeView }) {
  useDocumentTitle('Challenge is live');
  return (
    <div className="mx-auto w-full max-w-xl py-4">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <CheckCircle2 className="size-7 text-[var(--colorStatusSuccessForeground1)]" aria-hidden />
        Challenge is live
      </h1>
      <StudentCard challenge={challenge} className="mt-4" />
      <div className="mt-4 flex gap-2">
        <ButtonLink to={`/challenges/${challenge.id}`} variant="primary">
          View challenge
        </ButtonLink>
        <ButtonLink to="/challenges">Challenges</ButtonLink>
      </div>
    </div>
  );
}
