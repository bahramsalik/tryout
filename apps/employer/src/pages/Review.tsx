import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useBlocker, useNavigate, useParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  FolderTree,
  Lock,
  Mail,
  NotebookPen,
  PartyPopper,
  Save,
  Star,
  XCircle,
} from 'lucide-react';
import {
  PLATFORM_RULES,
  computeTotalScore,
  type ChallengeView,
  type ScoreSubmissionInput,
  type SubmissionView,
} from '@shared/types';
import { ApiError, api, errorMessage, urlWithPersona } from '@/lib/api';
import { bytes, dateTime, money, ordinal, timeAgo } from '@/lib/format';
import { useDocumentTitle } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { isScored, qk, queryClient, useChallenge, useSubmission, useSubmissions } from '@/lib/queries';
import { useBlind } from '@/lib/stores';
import { Avatar, MedalBadge, StatusBadge, TypeChip, scoreTone } from '@/components/brand';
import { FileBrowser } from '@/components/FileBrowser';
import { InviteModal, type InviteTarget } from '@/components/InviteModal';
import { Markdown } from '@/components/Markdown';
import { Dialog, DialogFooter, DialogHeader } from '@/components/overlay';
import { Button, ButtonLink, Card, CardHeader, EmptyState, ErrorState, Kbd, ProgressBar, Skeleton, Textarea, cn } from '@/components/ui';

const SCORE_LABELS = ['', 'Poor', 'Fair', 'Good', 'Strong', 'Exceptional'];

/** Oldest unscored first (FIFO), so nobody waits longest. */
function nextUnscored(subs: SubmissionView[], excludeId?: string): SubmissionView | undefined {
  return [...subs]
    .filter((s) => !isScored(s) && s.id !== excludeId)
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
  if (subs.isError) {
    return (
      <Card className="mx-auto max-w-xl">
        <ErrorState error={subs.error} onRetry={() => subs.refetch()} />
      </Card>
    );
  }
  const next = nextUnscored(subs.data);
  if (next) return <Navigate to={`/challenges/${challengeId}/review/${next.id}`} replace />;
  // Nothing left to score: the leaderboard is the useful next stop.
  return <Navigate to={`/challenges/${challengeId}${subs.data.length ? '?tab=leaderboard' : ''}`} replace />;
}

function Review({ challengeId, submissionId }: { challengeId: string; submissionId: string }) {
  const navigate = useNavigate();
  const { company } = usePersona();
  const challenge = useChallenge(challengeId);
  const submission = useSubmission(submissionId);
  const list = useSubmissions(challengeId);
  const [blind] = useBlind(challengeId, challenge.data?.status);
  const [invite, setInvite] = useState<InviteTarget | null>(null);
  const sub = submission.data;
  const c = challenge.data;
  useDocumentTitle(sub ? `Review ${blind ? sub.alias : sub.student.name}` : 'Review');

  // Keyboard: [ and ] move between submissions.
  const subs = useMemo(() => list.data ?? [], [list.data]);
  const index = subs.findIndex((s) => s.id === submissionId);
  const prev = index > 0 ? subs[index - 1] : undefined;
  const next = index >= 0 && index < subs.length - 1 ? subs[index + 1] : undefined;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === '[' && prev) navigate(`/challenges/${challengeId}/review/${prev.id}`);
      if (e.key === ']' && next) navigate(`/challenges/${challengeId}/review/${next.id}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, challengeId, navigate]);

  if (challenge.isPending || submission.isPending) return <ReviewSkeleton />;
  if (challenge.isError || submission.isError || !c || !sub) {
    const err = challenge.error ?? submission.error;
    const notFound = err instanceof ApiError && err.status === 404;
    const forbidden = err instanceof ApiError && err.status === 403;
    return (
      <Card className="mx-auto max-w-xl">
        {notFound || forbidden ? (
          <EmptyState
            icon={<Lock className="size-5" aria-hidden />}
            title={notFound ? 'Submission not found' : 'You can’t open this submission'}
            body={notFound ? 'It may have been removed by a demo reset.' : 'Files are only visible to the company that posted the challenge.'}
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
        <EmptyState
          icon={<Lock className="size-5" aria-hidden />}
          title="This submission belongs to another company’s challenge"
          body="Switch to that company to review it."
          action={<ButtonLink to="/">Back to dashboard</ButtonLink>}
        />
      </Card>
    );
  }

  const scoredCount = subs.filter(isScored).length;
  const name = blind ? sub.alias : sub.student.name;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          to={`/challenges/${challengeId}`}
          className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{c.title}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {subs.length > 0 && index >= 0 && (
            <span className="text-xs text-slate-500 tabular-nums">
              {index + 1} of {subs.length}
            </span>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="px-2"
            disabled={!prev}
            onClick={() => prev && navigate(`/challenges/${challengeId}/review/${prev.id}`)}
            aria-label="Previous submission ([)"
            title="Previous ( [ )"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="px-2"
            disabled={!next}
            onClick={() => next && navigate(`/challenges/${challengeId}/review/${next.id}`)}
            aria-label="Next submission (])"
            title="Next ( ] )"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 space-y-4">
          <SubmissionHeader sub={sub} challenge={c} blind={blind} name={name} />
          <NotesCard sub={sub} />
          <ReadmeCard sub={sub} />
          <Card className="@container overflow-hidden">
            <CardHeader
              title={
                <span className="inline-flex items-center gap-1.5">
                  <FolderTree className="size-4 text-slate-400" aria-hidden /> Files
                </span>
              }
              subtitle={`${sub.file.fileCount} files · click any file to preview it`}
            />
            <FileBrowser submissionId={sub.id} paths={sub.file.tree} />
          </Card>
        </div>

        <ScorePanel
          key={sub.id}
          sub={sub}
          challenge={c}
          subs={subs}
          scoredCount={scoredCount}
          blind={blind}
          onInvite={() =>
            setInvite({
              student: sub.student,
              challenge: { id: c.id, title: c.title, hiringFor: c.hiringFor },
              alias: blind ? sub.alias : null,
            })
          }
        />
      </div>

      <InviteModal open={!!invite} target={invite} onClose={() => setInvite(null)} />
    </div>
  );
}

function SubmissionHeader({ sub, challenge, blind, name }: { sub: SubmissionView; challenge: ChallengeView; blind: boolean; name: string }) {
  const passed = sub.autoChecks.filter((a) => a.passed).length;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={sub.student.name} color={sub.student.avatarColor} size={44} blind={blind} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg leading-tight font-bold tracking-tight text-slate-900">{name}</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {blind ? (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" aria-hidden /> Blind review — name and school hidden
              </span>
            ) : (
              <Link to={`/candidates/${sub.student.handle || sub.studentId}`} className="hover:text-primary hover:underline">
                {sub.student.major} · {sub.student.university}
              </Link>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TypeChip type={challenge.type} size="sm" />
            <StatusBadge status={challenge.status} />
            <span className="text-xs text-slate-500" title={dateTime(sub.submittedAt)}>
              Submitted {timeAgo(sub.submittedAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sub.demoUrl && (
            <a
              href={sub.demoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
            >
              <ExternalLink className="size-3.5" aria-hidden /> Demo
            </a>
          )}
          <a
            href={urlWithPersona(`/submissions/${encodeURIComponent(sub.id)}/download`)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[13px] font-semibold text-white hover:bg-slate-800"
            download
          >
            <Download className="size-3.5" aria-hidden /> Download zip
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
          <FileArchive className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate font-mono">{sub.file.originalName}</span>
          <span className="text-slate-400">· {bytes(sub.file.sizeBytes)} · {sub.file.fileCount} files</span>
        </span>
        {sub.autoChecks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5" aria-label={`Auto-checks: ${passed} of ${sub.autoChecks.length} passed`}>
            {sub.autoChecks.map((a) => (
              <span
                key={a.label}
                className={cn(
                  'inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold ring-1 ring-inset',
                  a.passed ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-50 text-slate-500 ring-slate-200',
                )}
              >
                {a.passed ? <CheckCircle2 className="size-3" aria-hidden /> : <XCircle className="size-3" aria-hidden />}
                {a.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function NotesCard({ sub }: { sub: SubmissionView }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <NotebookPen className="size-4 text-slate-400" aria-hidden /> Approach notes
          </span>
        }
        subtitle="Their thinking: what they built, key decisions, what they’d do next"
      />
      <div className="px-4 py-3">
        <Markdown>{sub.notes}</Markdown>
      </div>
      <div
        className={cn(
          'flex gap-2.5 border-t px-4 py-3 text-[13px]',
          sub.aiDisclosure ? 'border-violet-100 bg-violet-50/50 text-violet-900' : 'border-slate-100 bg-slate-50/60 text-slate-500',
        )}
      >
        <Bot className={cn('mt-0.5 size-4 shrink-0', sub.aiDisclosure ? 'text-violet-500' : 'text-slate-400')} aria-hidden />
        <p>
          <span className="font-semibold">AI use disclosed: </span>
          {sub.aiDisclosure ?? 'None — the candidate didn’t report using AI tools.'}
        </p>
      </div>
    </Card>
  );
}

function ReadmeCard({ sub }: { sub: SubmissionView }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 8);
  }, [sub.file.readme]);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-4 text-slate-400" aria-hidden /> README
          </span>
        }
        subtitle="Rendered from the zip"
      />
      {sub.file.readme ? (
        <div className="relative">
          <div ref={ref} className={cn('px-4 py-3', !expanded && 'max-h-80 overflow-hidden')}>
            <Markdown>{sub.file.readme}</Markdown>
          </div>
          {!expanded && overflowing && (
            <div className="absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-3">
              <Button size="sm" variant="secondary" onClick={() => setExpanded(true)}>
                Show full README
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-slate-500">No README in this zip.</p>
      )}
    </Card>
  );
}

/* ───────────────────────────── Scoring panel ───────────────────────────── */

function ScorePanel({
  sub,
  challenge,
  subs,
  scoredCount,
  blind,
  onInvite,
}: {
  sub: SubmissionView;
  challenge: ChallengeView;
  subs: SubmissionView[];
  scoredCount: number;
  blind: boolean;
  onInvite: () => void;
}) {
  const navigate = useNavigate();
  const rubric = challenge.rubric;
  const practice = challenge.kind === 'practice';
  const readOnly = challenge.status === 'awarded' || practice;
  const [scores, setScores] = useState<Record<string, number>>(() => ({ ...(sub.scores ?? {}) }));
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [shortlisted, setShortlisted] = useState(sub.shortlisted);
  const shortlist = useMutation({
    mutationFn: (value: boolean) =>
      api<SubmissionView>(`/submissions/${encodeURIComponent(sub.id)}/shortlist`, { method: 'POST', json: { shortlisted: value } }),
    onMutate: (value) => setShortlisted(value),
    onError: (err, value) => {
      setShortlisted(!value);
      toast.error('Couldn’t update the shortlist', { description: errorMessage(err) });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<SubmissionView>(qk.submission(updated.id), (prev) => (prev ? { ...prev, shortlisted: updated.shortlisted } : updated));
      queryClient.setQueryData<SubmissionView[]>(qk.submissions(challenge.id), (list) =>
        list?.map((s) => (s.id === updated.id ? { ...s, shortlisted: updated.shortlisted } : s)),
      );
      if (updated.shortlisted) toast.success('Added to your shortlist');
    },
  });
  const [allDone, setAllDone] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  // Keyboard scoring: 1–5 scores the highlighted criterion, then moves to the next unscored one.
  const [activeIdx, setActiveIdx] = useState(() => {
    const i = rubric.findIndex((r) => (sub.scores ?? {})[r.id] == null);
    return i === -1 ? 0 : i;
  });
  const pick = (idx: number, n: number) => {
    const criterion = rubric[idx];
    if (!criterion || readOnly) return;
    const nextScores = { ...scores, [criterion.id]: n };
    setScores(nextScores);
    const after = rubric.findIndex((r, j) => j > idx && nextScores[r.id] == null);
    const before = rubric.findIndex((r) => nextScores[r.id] == null);
    setActiveIdx(after !== -1 ? after : before !== -1 ? before : Math.min(idx + 1, rubric.length - 1));
  };

  const total = computeTotalScore(rubric, scores);
  const scoredCriteria = rubric.filter((r) => scores[r.id] != null).length;
  const complete = scoredCriteria === rubric.length;
  const feedbackOk = feedback.trim().length >= PLATFORM_RULES.minFeedbackChars;
  const dirty = JSON.stringify(scores) !== JSON.stringify(sub.scores ?? {}) || feedback !== (sub.feedback ?? '');
  const tone = scoreTone(total);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const save = useMutation({
    mutationFn: (body: ScoreSubmissionInput) =>
      api<SubmissionView>(`/submissions/${encodeURIComponent(sub.id)}/score`, { method: 'POST', json: body }),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.submission(updated.id), updated);
      queryClient.setQueryData<SubmissionView[]>(qk.submissions(challenge.id), (list) =>
        list?.map((s) => (s.id === updated.id ? updated : s)),
      );
      void queryClient.invalidateQueries({ queryKey: qk.challenge(challenge.id) });
      void queryClient.invalidateQueries({ queryKey: qk.leaderboard(challenge.id) });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toast.error('Couldn’t save the score', { description: errorMessage(err) }),
  });

  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    if (readOnly || allDone) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!save.isPending) submit(true);
      return;
    }
    const t = e.target;
    if (t instanceof Element && t.closest('input, textarea, select, [contenteditable]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-5]$/.test(e.key)) {
      e.preventDefault();
      pick(activeIdx, Number(e.key));
    } else if (e.key === 'ArrowDown' && activeIdx < rubric.length - 1) {
      e.preventDefault();
      setActiveIdx(activeIdx + 1);
    } else if (e.key === 'ArrowUp' && activeIdx > 0) {
      e.preventDefault();
      setActiveIdx(activeIdx - 1);
    }
  };
  useEffect(() => {
    const fn = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Don't silently drop unsaved scores when the reviewer navigates away.
  const skipBlock = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !skipBlock.current && !readOnly && dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  const submit = (goNext: boolean) => {
    if (!complete) {
      toast.error('Score every criterion first', { description: `${rubric.length - scoredCriteria} left to score.` });
      return;
    }
    if (!feedbackOk) {
      toast.error('Feedback is required', {
        description: `Write at least ${PLATFORM_RULES.minFeedbackChars} characters — every student is guaranteed written feedback.`,
      });
      return;
    }
    save.mutate(
      { scores, feedback: feedback.trim(), shortlisted },
      {
        onSuccess: (updated) => {
          const label = blind ? updated.alias : updated.student.name;
          if (!goNext) {
            toast.success(`Saved · ${label} scored ${updated.totalScore ?? total}`);
            return;
          }
          const following = nextUnscored(
            subs.map((s) => (s.id === updated.id ? updated : s)),
            updated.id,
          );
          if (following) {
            toast.success(`Saved · ${label} scored ${updated.totalScore ?? total}`, { description: 'On to the next one.' });
            skipBlock.current = true;
            navigate(`/challenges/${challenge.id}/review/${following.id}`);
          } else {
            setAllDone(true);
            toast.success('All submissions scored', { description: 'You can publish results and award the bounty.' });
          }
        },
      },
    );
  };

  const progressScored = Math.min(subs.length, scoredCount);

  return (
    <>
      <aside
        ref={panelRef}
        id="score-panel"
        className="scrollbar-thin @5xl:sticky @5xl:top-[4.5rem] @5xl:max-h-[calc(100dvh-5.5rem)] @5xl:overflow-y-auto"
        aria-label="Scoring"
      >
        <Card className="overflow-hidden">
          {/* Live total */}
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {readOnly ? 'Final score' : 'Live weighted total'}
                </p>
                <p className={cn('mt-0.5 flex items-baseline gap-1 text-4xl font-extrabold tracking-tight tabular-nums', scoredCriteria ? tone.text : 'text-slate-300')}>
                  <span key={total} className="inline-block animate-pop-in">
                    {scoredCriteria ? total : '—'}
                  </span>
                  <span className="text-base font-semibold text-slate-400">/100</span>
                </p>
              </div>
              <ScoreRing value={scoredCriteria ? total : 0} className={tone.text} />
            </div>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {scoredCriteria}/{rubric.length} criteria scored
              {readOnly && sub.rank != null && (
                <>
                  {' '}
                  · placed <span className="font-semibold text-slate-800">{ordinal(sub.rank)}</span>
                  {sub.payout ? <span className="font-semibold text-emerald-700"> · {money(sub.payout)}</span> : null}
                </>
              )}
            </p>
          </div>

          {/* Criteria */}
          <ol className="divide-y divide-slate-100">
            {rubric.map((r, i) => {
              const value = scores[r.id];
              const points = value != null ? Math.round((value / PLATFORM_RULES.scoreMax) * r.weight) : null;
              return (
                <li
                  key={r.id}
                  onClick={() => !readOnly && setActiveIdx(i)}
                  className={cn(
                    'relative px-4 py-3 transition-colors',
                    !readOnly && i === activeIdx && 'bg-indigo-50/50 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-semibold text-slate-900">
                      <span className="mr-1 text-slate-400 tabular-nums">{i + 1}.</span>
                      {r.name}
                    </p>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-500 tabular-nums">
                      {value != null && <span className="mr-1.5 font-medium text-indigo-700">{SCORE_LABELS[value]}</span>}
                      {points != null ? <span className="text-slate-700">+{points}</span> : null}
                      <span className="text-slate-400"> / {r.weight}</span>
                    </span>
                  </div>
                  {r.description && <p className="mt-0.5 text-xs leading-snug text-slate-500">{r.description}</p>}
                  <div className="mt-2 grid grid-cols-5 gap-1" role="radiogroup" aria-label={`${r.name} score`}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = value === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-label={`${n} — ${SCORE_LABELS[n]}`}
                          title={SCORE_LABELS[n]}
                          disabled={readOnly}
                          onClick={(e) => {
                            e.stopPropagation();
                            pick(i, n);
                          }}
                          className={cn(
                            'h-9 rounded-lg text-sm font-bold tabular-nums transition-all disabled:cursor-default',
                            active
                              ? 'bg-primary text-white shadow-sm shadow-indigo-600/30 ring-2 ring-indigo-200'
                              : value != null && n < value
                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
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

          {!readOnly && (
            <p className="hidden border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 @5xl:flex @5xl:flex-wrap @5xl:items-center @5xl:gap-1">
              <Kbd>1</Kbd>–<Kbd>5</Kbd> score the highlighted row · <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> move · <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd> save &amp; next · <Kbd>[</Kbd>
              <Kbd>]</Kbd> prev / next
            </p>
          )}

          {/* Feedback + shortlist */}
          <div className="space-y-3 border-t border-slate-100 p-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="feedback" className="text-[13px] font-semibold text-slate-800">
                  Written feedback <span className="font-normal text-red-500">*</span>
                </label>
                <span className={cn('text-[11px] tabular-nums', feedbackOk ? 'text-emerald-700' : 'text-slate-400')}>
                  {feedback.trim().length}/{PLATFORM_RULES.minFeedbackChars}+
                </span>
              </div>
              <Textarea
                id="feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={readOnly}
                placeholder="What worked well, and one thing to improve. Students see this when results are published."
              />
              {!readOnly && !feedback && (
                <button
                  type="button"
                  onClick={() => setFeedback('What worked well: \n\nWhat to improve next time: ')}
                  className="mt-1 text-[11px] font-semibold text-primary hover:text-indigo-800"
                >
                  Use a feedback template
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => shortlist.mutate(!shortlisted)}
              disabled={shortlist.isPending}
              aria-pressed={shortlisted}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold ring-1 transition-colors ring-inset',
                shortlisted ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50',
              )}
            >
              <Star className={cn('size-4', shortlisted ? 'text-amber-500' : 'text-slate-400')} fill={shortlisted ? 'currentColor' : 'none'} aria-hidden />
              {shortlisted ? 'On your shortlist' : 'Add to shortlist'}
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-4">
            {readOnly ? (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Lock className="size-3.5" aria-hidden />
                {practice ? 'Practice task — Coach reviewed it instantly.' : 'Results are published — scores are final.'}
              </p>
            ) : allDone ? (
              <div className="animate-pop-in rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <PartyPopper className="mx-auto size-5 text-emerald-600" aria-hidden />
                <p className="mt-1 text-sm font-semibold text-emerald-900">All {subs.length} submissions scored</p>
                <ButtonLink
                  to={`/challenges/${challenge.id}?tab=leaderboard`}
                  variant="success"
                  size="sm"
                  className="mt-2"
                >
                  Go to leaderboard & award
                </ButtonLink>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  loading={save.isPending}
                  onClick={() => submit(true)}
                  icon={<Save className="size-4" aria-hidden />}
                >
                  Save & next unscored
                </Button>
                <Button variant="secondary" onClick={() => submit(false)} disabled={save.isPending || !dirty} title="Save without moving on">
                  Save
                </Button>
              </div>
            )}
            <div>
              <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500 tabular-nums">
                <span>
                  {progressScored}/{subs.length} scored
                </span>
                {subs.length - progressScored > 0 && <span>{subs.length - progressScored} left</span>}
              </div>
              <ProgressBar value={progressScored} max={subs.length || 1} tone={progressScored === subs.length ? 'emerald' : 'indigo'} />
            </div>
            <Button variant="ghost" size="sm" className="w-full" icon={<Mail className="size-3.5" aria-hidden />} onClick={onInvite}>
              Invite {blind ? 'this candidate' : sub.student.name.split(' ')[0]} to interview
            </Button>
          </div>
        </Card>
        {readOnly && sub.rank != null && sub.rank <= 3 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-900">
            <MedalBadge rank={sub.rank} /> Placed {ordinal(sub.rank)}
          </div>
        )}
      </aside>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} width="26rem" labelledBy="unsaved-title">
        <DialogHeader
          id="unsaved-title"
          title="Leave without saving?"
          subtitle="Your scores and feedback for this submission aren’t saved yet."
          onClose={() => blocker.reset?.()}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => blocker.proceed?.()}>
            Discard changes
          </Button>
          <Button variant="primary" onClick={() => blocker.reset?.()}>
            Keep reviewing
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Narrow layouts: jump to the scoring panel, with the live total. */}
      {!panelVisible && (
        <button
          type="button"
          onClick={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="fixed right-4 bottom-4 z-30 inline-flex h-11 animate-pop-in items-center gap-2 rounded-full bg-slate-900 pr-4 pl-3 text-sm font-semibold text-white shadow-pop hover:bg-slate-800 @5xl:hidden"
        >
          <ArrowDown className="size-4" aria-hidden />
          Score
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs tabular-nums">
            {scoredCriteria ? total : '—'} · {scoredCriteria}/{rubric.length}
          </span>
        </button>
      )}
    </>
  );
}

function ScoreRing({ value, className }: { value: number; className?: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 52 52" className={cn('size-14 -rotate-90', className)} aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(100, Math.max(0, value)) / 100)}
        className="transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}

function ReviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl" aria-busy>
      <Skeleton className="h-3 w-48" />
      <div className="mt-4 grid gap-5 @5xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[32rem] w-full rounded-xl" />
      </div>
    </div>
  );
}
