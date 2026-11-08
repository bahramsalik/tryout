import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useBlocker, useNavigate, useParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, Download } from '@/components/icons';
import { PLATFORM_RULES, computeTotalScore, needsRecruiterReview, type ChallengeView, type ScoreSubmissionInput, type SubmissionView } from '@shared/types';
import { ApiError, api, urlWithPersona } from '@/lib/api';
import { bytes, timeAgo } from '@/lib/format';
import { useDocumentTitle } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { isScored, qk, queryClient, useChallenge, useSubmission, useSubmissions } from '@/lib/queries';
import { useBlind } from '@/lib/stores';
import { MedalBadge } from '@/components/brand';
import { FileBrowser } from '@/components/FileBrowser';
import { Markdown } from '@/components/Markdown';
import { Dialog, DialogFooter, DialogHeader } from '@/components/overlay';
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  InlineError,
  PageHeader,
  Skeleton,
  Textarea,
  buttonClass,
  cn,
} from '@/components/ui';

/** Oldest first (FIFO), so nobody waits longest. Only what needs a recruiter: ungraded work, or a strong AI grade nobody confirmed. */
function nextUnscored(subs: SubmissionView[], excludeId?: string): SubmissionView | undefined {
  return [...subs]
    .filter((s) => needsRecruiterReview(s) && s.id !== excludeId)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())[0];
}

export function ReviewPage() {
  const { id, submissionId } = useParams();
  if (submissionId === 'next') return <ResolveNext challengeId={id!} />;
  return <Review challengeId={id!} submissionId={submissionId!} />;
}

function ResolveNext({ challengeId }: { challengeId: string }) {
  const subs = useSubmissions(challengeId);
  if (subs.isPending) return <ReviewSkeleton />;
  if (subs.isError) return <ErrorState error={subs.error} onRetry={() => subs.refetch()} />;
  const next = nextUnscored(subs.data);
  if (next) return <Navigate to={`/challenges/${challengeId}/review/${next.id}`} replace />;
  // Nothing left to score: the leaderboard is the useful next stop.
  return <Navigate to={`/challenges/${challengeId}${subs.data.length ? '?tab=leaderboard' : ''}`} replace />;
}

function Review({ challengeId, submissionId }: { challengeId: string; submissionId: string }) {
  const { company } = usePersona();
  const challenge = useChallenge(challengeId);
  const submission = useSubmission(submissionId);
  const list = useSubmissions(challengeId);
  const [blind] = useBlind(challengeId, challenge.data?.status);
  const sub = submission.data;
  const c = challenge.data;
  useDocumentTitle(sub ? `Review ${blind ? sub.alias : sub.student.name}` : 'Review');

  const subs = useMemo(() => list.data ?? [], [list.data]);

  if (challenge.isPending || submission.isPending) return <ReviewSkeleton />;
  if (challenge.isError || submission.isError || !c || !sub) {
    const err = challenge.error ?? submission.error;
    const notFound = err instanceof ApiError && err.status === 404;
    const forbidden = err instanceof ApiError && err.status === 403;
    return (
      <Card className="mx-auto max-w-xl">
        {notFound || forbidden ? (
          <EmptyState
            title={notFound ? 'Submission not found' : 'Not your company’s submission'}
            action={<ButtonLink to={`/challenges/${challengeId}`}>Back to challenge</ButtonLink>}
          />
        ) : (
          <ErrorState
            error={err}
            onRetry={() => {
              void challenge.refetch();
              void submission.refetch();
            }}
          />
        )}
      </Card>
    );
  }
  if (company && c.companyId !== company.id) {
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState title="Not your company’s submission" action={<ButtonLink to="/">Dashboard</ButtonLink>} />
      </Card>
    );
  }

  const scoredCount = subs.filter(isScored).length;
  const name = blind ? sub.alias : sub.student.name;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Link
        to={`/challenges/${challengeId}`}
        className="mb-2 inline-flex max-w-full items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{c.title}</span>
      </Link>

      <PageHeader
        title={name}
        meta={
          <span>
            Submitted {timeAgo(sub.submittedAt)} · {sub.file.fileCount} files · {bytes(sub.file.sizeBytes)}
            {scoredCount < subs.length && ` · ${subs.length - scoredCount} to review`}
          </span>
        }
        actions={
          <a href={urlWithPersona(`/submissions/${encodeURIComponent(sub.id)}/download`)} className={buttonClass('secondary')} download>
            <Download className="size-5" aria-hidden /> Download
          </a>
        }
      />

      <div className="grid items-start gap-4 @5xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <ReadmeCard sub={sub} />
          <Card className="@container overflow-hidden">
            <CardHeader title="Files" />
            <FileBrowser submissionId={sub.id} paths={sub.file.tree} />
          </Card>
          <NotesCard sub={sub} />
        </div>

        <ScorePanel key={sub.id} sub={sub} challenge={c} subs={subs} />
      </div>
    </div>
  );
}

function NotesCard({ sub }: { sub: SubmissionView }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Approach notes" />
      <div className="px-4 pb-4">
        <Markdown>{sub.notes}</Markdown>
        <p className="mt-4 text-sm">
          <span className="font-semibold">AI use: </span>
          <span className="text-slate-700">{sub.aiDisclosure ?? 'None'}</span>
        </p>
      </div>
    </Card>
  );
}

const README_LINES = 12;

function ReadmeCard({ sub }: { sub: SubmissionView }) {
  const [expanded, setExpanded] = useState(false);
  const readme = sub.file.readme ?? '';
  const lines = readme.split('\n');
  // Cut at a blank line near the 12-line mark so markdown blocks aren't split mid-list or mid-fence.
  let cut = README_LINES;
  while (cut < lines.length && cut < README_LINES + 8 && lines[cut].trim() !== '') cut++;
  const long = lines.length > cut;
  const shown = expanded || !long ? readme : lines.slice(0, cut).join('\n');

  return (
    <Card className="overflow-hidden">
      <CardHeader title="README" />
      {readme ? (
        <div className="px-4 pb-4">
          <Markdown>{shown}</Markdown>
          {long && !expanded && (
            <Button size="sm" variant="subtle" className="mt-2 -ml-2" onClick={() => setExpanded(true)}>
              Show all
            </Button>
          )}
        </div>
      ) : (
        <p className="px-4 pb-4 text-sm text-slate-500">No README.</p>
      )}
    </Card>
  );
}

/* ───────────────────────────── Scoring panel ───────────────────────────── */

function ScorePanel({ sub, challenge, subs }: { sub: SubmissionView; challenge: ChallengeView; subs: SubmissionView[] }) {
  const navigate = useNavigate();
  const rubric = challenge.rubric;
  const practice = challenge.kind === 'practice';
  const readOnly = challenge.status === 'awarded' || practice;
  const [scores, setScores] = useState<Record<string, number>>(() => ({ ...(sub.scores ?? {}) }));
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [tried, setTried] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(true);

  const total = computeTotalScore(rubric, scores);
  const scoredCriteria = rubric.filter((r) => scores[r.id] != null).length;
  const complete = scoredCriteria === rubric.length;
  const minChars = PLATFORM_RULES.minFeedbackChars;
  const feedbackLen = feedback.trim().length;
  const feedbackOk = feedbackLen >= minChars;
  const dirty = JSON.stringify(scores) !== JSON.stringify(sub.scores ?? {}) || feedback !== (sub.feedback ?? '');

  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const refresh = (updated: SubmissionView) => {
    queryClient.setQueryData(qk.submission(updated.id), updated);
    queryClient.setQueryData<SubmissionView[]>(qk.submissions(challenge.id), (list) =>
      list?.map((s) => (s.id === updated.id ? updated : s)),
    );
    void queryClient.invalidateQueries({ queryKey: qk.challenge(challenge.id) });
    void queryClient.invalidateQueries({ queryKey: qk.leaderboard(challenge.id) });
    void queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };

  const save = useMutation({
    mutationFn: (body: ScoreSubmissionInput) =>
      api<SubmissionView>(`/submissions/${encodeURIComponent(sub.id)}/score`, { method: 'POST', json: body }),
    onSuccess: refresh,
  });

  // Confirming an AI grade as it is: the scores stay, the result becomes Verified.
  const aiGraded = sub.reviewer === 'ai' && !sub.verified && !readOnly;
  const confirm = useMutation({
    mutationFn: () => api<SubmissionView>(`/submissions/${encodeURIComponent(sub.id)}/verify`, { method: 'POST' }),
    onSuccess: refresh,
  });

  // Don't silently drop unsaved scores when the reviewer navigates away.
  const skipBlock = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !skipBlock.current && !readOnly && dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  const goNext = (updated: SubmissionView) => {
    const following = nextUnscored(
      subs.map((s) => (s.id === updated.id ? updated : s)),
      updated.id,
    );
    skipBlock.current = true;
    navigate(following ? `/challenges/${challenge.id}/review/${following.id}` : `/challenges/${challenge.id}?tab=leaderboard`);
  };

  const confirmGrade = () => confirm.mutate(undefined, { onSuccess: goNext });

  const submit = () => {
    setTried(true);
    if (!complete || !feedbackOk) return;
    save.mutate(
      { scores, feedback: feedback.trim(), shortlisted: sub.shortlisted },
      {
        onSuccess: (updated) => {
          const following = nextUnscored(
            subs.map((s) => (s.id === updated.id ? updated : s)),
            updated.id,
          );
          skipBlock.current = true;
          navigate(following ? `/challenges/${challenge.id}/review/${following.id}` : `/challenges/${challenge.id}?tab=leaderboard`);
        },
      },
    );
  };

  return (
    <>
      <aside
        ref={panelRef}
        id="score-panel"
        className="scrollbar-thin @5xl:sticky @5xl:top-4 @5xl:max-h-[calc(100dvh-5rem)] @5xl:overflow-y-auto"
        aria-label="Scoring"
      >
        <Card>
          <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
            <h2 className="text-lg font-semibold">Score</h2>
            <p className="text-2xl font-semibold tabular-nums" aria-live="polite">
              {scoredCriteria ? total : '–'}
              <span className="text-sm font-normal text-slate-500">/100</span>
            </p>
          </div>
          {aiGraded && (
            <p className="mx-4 mt-2 rounded-[var(--borderRadiusMedium)] bg-[var(--colorNeutralBackground3)] px-3 py-2 text-xs text-slate-600">
              Graded automatically. Confirm it as it is, or change a score or the feedback and save.
            </p>
          )}
          {readOnly && sub.rank != null && (
            <div className="px-4 pt-1">
              <MedalBadge rank={sub.rank} medal={sub.status === 'awarded'} />
            </div>
          )}

          <ol className="space-y-3 px-4 py-3">
            {rubric.map((r) => {
              const value = scores[r.id];
              const missing = tried && value == null;
              return (
                <li key={r.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className={cn('font-semibold', missing && 'text-red-600')} title={r.description || undefined}>
                      {r.name}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500 tabular-nums">{r.weight}%</span>
                  </div>
                  {sub.scoreNotes?.[r.id] && <p className="mb-1.5 text-xs text-slate-600">{sub.scoreNotes[r.id]}</p>}
                  <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label={`${r.name} score`}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = value === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-label={`${n} of 5`}
                          disabled={readOnly}
                          onClick={() => setScores((prev) => ({ ...prev, [r.id]: n }))}
                          className={cn(
                            'h-8 rounded-[var(--borderRadiusMedium)] border text-sm tabular-nums transition-colors disabled:cursor-default',
                            active
                              ? 'border-transparent bg-[var(--colorBrandBackground)] font-semibold text-white'
                              : 'border-[var(--colorNeutralStroke1)] bg-white hover:bg-[var(--colorNeutralBackground1Hover)] disabled:hover:bg-white',
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="space-y-3 px-4 pb-4">
            <Field
              label="Feedback"
              htmlFor="feedback"
              counter={!readOnly && !feedbackOk && `${feedbackLen}/${minChars}`}
              error={tried && !feedbackOk ? `At least ${minChars} characters` : undefined}
            >
              <Textarea
                id="feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={readOnly}
                invalid={tried && !feedbackOk}
                placeholder="What worked, and one thing to improve"
              />
            </Field>
            <InlineError error={save.error ?? confirm.error} />
            {!readOnly &&
              (aiGraded && !dirty ? (
                <Button variant="primary" className="w-full" loading={confirm.isPending} onClick={confirmGrade}>
                  Confirm &amp; next
                </Button>
              ) : (
                <Button variant="primary" className="w-full" loading={save.isPending} onClick={submit}>
                  Save &amp; next
                </Button>
              ))}
          </div>
        </Card>
      </aside>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} width="24rem" labelledBy="unsaved-title">
        <DialogHeader id="unsaved-title" title="Discard unsaved scores?" onClose={() => blocker.reset?.()} />
        <DialogFooter>
          <Button onClick={() => blocker.proceed?.()}>Discard</Button>
          <Button variant="primary" onClick={() => blocker.reset?.()}>
            Keep reviewing
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Narrow layouts: jump to the scoring panel. */}
      {!panelVisible && !readOnly && (
        <button
          type="button"
          onClick={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={cn(buttonClass('secondary'), 'fixed right-4 bottom-4 z-30 shadow-[var(--shadow16)] @5xl:hidden')}
        >
          <ArrowDown className="size-5" aria-hidden />
          Score <span className="tabular-nums">{scoredCriteria ? total : '–'}</span>
        </button>
      )}
    </>
  );
}

function ReviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-3" aria-busy>
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
