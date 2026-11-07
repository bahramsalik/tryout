import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  FileArchive,
  Hourglass,
  Link2,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  WandSparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { PLATFORM_RULES, type ChallengeView, type SubmissionView } from '@shared/types';
import { CompanyLogo, Countdown, ScoreRing, TypeChip } from '@/components/brand';
import { Button, ButtonLink, Card, EmptyState, ErrorState, ProgressBar, Skeleton } from '@/components/ui';
import { errorMessage, isApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { celebrate } from '@/lib/confetti';
import { isPastDeadline } from '@/lib/derive';
import { bytes, money } from '@/lib/format';
import { usePersona } from '@/lib/persona';
import { qk, useChallenge, useJoinChallenge } from '@/lib/queries';
import { looksLikeZip, uploadSubmission, type UploadHandle } from '@/lib/upload';

const TEMPLATE_HEADINGS = ['## What I built', "## Key decisions & trade-offs", "## What I'd do with more time"];
const TEMPLATE = `${TEMPLATE_HEADINGS[0]}\n\n\n${TEMPLATE_HEADINGS[1]}\n\n\n${TEMPLATE_HEADINGS[2]}\n\n`;
const PLACEHOLDER = `What I built — the approach in two or three sentences.

Key decisions & trade-offs — what you chose, what you didn't, and why.

What I'd do with more time — the next things you'd improve.`;

/** Characters of real content (template headings don't count toward the minimum). */
function contentLength(notes: string): number {
  let s = notes;
  for (const h of TEMPLATE_HEADINGS) s = s.split(h).join('');
  return s.replace(/\s+/g, ' ').trim().length;
}

function isUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ─────────────────────────────── Success ─────────────────────────────── */

function Timeline({ steps }: { steps: { title: string; text: string; state: 'done' | 'active' | 'todo'; icon: typeof Clock }[] }) {
  return (
    <ol className="relative space-y-5">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-3.5">
          {i < steps.length - 1 ? (
            <span
              className={cn('absolute left-[17px] top-9 h-[calc(100%-12px)] w-0.5', s.state === 'done' ? 'bg-emerald-300' : 'bg-slate-200')}
              aria-hidden
            />
          ) : null}
          <span
            className={cn(
              'relative z-10 grid size-9 shrink-0 place-items-center rounded-full ring-4 ring-white',
              s.state === 'done' && 'bg-emerald-500 text-white',
              s.state === 'active' && 'bg-indigo-100 text-indigo-600',
              s.state === 'todo' && 'bg-slate-100 text-slate-400',
            )}
          >
            {s.state === 'done' ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <s.icon className="size-4" aria-hidden />}
            {s.state === 'active' ? <span className="absolute inset-0 animate-ping rounded-full bg-indigo-300 opacity-30" aria-hidden /> : null}
          </span>
          <div className="pt-1.5">
            <div className={cn('text-sm font-bold', s.state === 'todo' ? 'text-slate-500' : 'text-ink')}>{s.title}</div>
            <div className="text-xs leading-relaxed text-slate-500">{s.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SuccessScreen({ c, sub }: { c: ChallengeView; sub: SubmissionView }) {
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    celebrate();
  }, []);
  const practice = c.kind === 'practice';
  const company = c.company?.name ?? 'The employer';
  const coachScored = practice && sub.totalScore !== null;
  const steps = practice
    ? [
        { title: 'Submitted', text: `${sub.file.originalName} · ${sub.file.fileCount} files`, state: 'done' as const, icon: Upload },
        {
          title: 'Coach review',
          text: coachScored ? `Scored ${sub.totalScore}/100 against the rubric` : 'Scoring against the rubric…',
          state: coachScored ? ('done' as const) : ('active' as const),
          icon: Sparkles,
        },
        { title: 'Practice hours added', text: `+${c.estHours} h on your Proof Profile`, state: coachScored ? ('done' as const) : ('todo' as const), icon: BadgeCheck },
      ]
    : [
        { title: 'Submitted', text: `${sub.file.originalName} · ${sub.file.fileCount} files · ${bytes(sub.file.sizeBytes)}`, state: 'done' as const, icon: Upload },
        { title: 'Employer review', text: `${company} scores every submission against the rubric — blind.`, state: 'active' as const, icon: Hourglass },
        { title: 'Results & feedback', text: 'Everyone gets rubric scores and written feedback.', state: 'todo' as const, icon: MessageSquareText },
        {
          title: 'Payout',
          text: c.rewardTotal > 0 ? `Top places split ${money(c.rewardTotal)} from escrow.` : 'No bounty on this one — strong work gets interview invites.',
          state: 'todo' as const,
          icon: Wallet,
        },
      ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="relative overflow-hidden p-6 text-center sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-50 to-transparent" aria-hidden />
        <div className="relative">
          <div className="mx-auto grid size-16 animate-pop-in place-items-center rounded-full bg-emerald-500 text-white shadow-[0_10px_30px_-10px_rgb(16_185_129/0.8)]">
            <Check className="size-8" strokeWidth={3} aria-hidden />
          </div>
          <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-ink">Submitted! 🎉</h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-slate-600">
            {practice ? (
              <>Nice work on <span className="font-semibold text-ink">{c.title}</span>. Coach has reviewed it — here's how you did.</>
            ) : (
              <>
                Your work for <span className="font-semibold text-ink">{c.title}</span> is in. {company} will review it, and you'll get a
                notification the moment results are out.
              </>
            )}
          </p>
        </div>
      </Card>

      {coachScored ? (
        <Card className="p-5 sm:p-6">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles className="size-3.5" aria-hidden /> Coach review · preview
          </div>
          <div className="flex items-start gap-4">
            <ScoreRing score={sub.totalScore!} size={72} stroke={7} />
            <p className="text-sm leading-relaxed text-slate-700">{sub.feedback}</p>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">What happens next</h2>
          <Timeline steps={steps} />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Auto-checks</h2>
          {sub.autoChecks.length > 0 ? (
            <ul className="space-y-2">
              {sub.autoChecks.map((a) => (
                <li key={a.label} className="flex items-center gap-2 text-sm">
                  {a.passed ? (
                    <CircleCheck className="size-4 shrink-0 text-emerald-500" aria-hidden />
                  ) : (
                    <CircleX className="size-4 shrink-0 text-slate-300" aria-hidden />
                  )}
                  <span className={a.passed ? 'text-slate-700' : 'text-slate-400'}>{a.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Your zip was received.</p>
          )}
          {sub.file.tree.length > 0 ? (
            <>
              <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">In your zip</h3>
              <ul className="space-y-1 font-mono text-xs text-slate-600">
                {sub.file.tree.slice(0, 6).map((p) => (
                  <li key={p} className="truncate">
                    {p}
                  </li>
                ))}
                {sub.file.tree.length > 6 ? <li className="text-slate-400">+ {sub.file.tree.length - 6} more</li> : null}
              </ul>
            </>
          ) : null}
        </Card>
      </div>

      <div className="flex flex-wrap justify-center gap-2.5">
        <ButtonLink to={practice ? '/profile' : '/work?tab=submitted'} size="lg">
          {practice ? 'See my Proof Profile' : 'Go to My work'} <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink to="/explore" variant="secondary" size="lg">
          Explore more challenges
        </ButtonLink>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Form ─────────────────────────────── */

function Field({ label, hint, children, optional, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; optional?: boolean; htmlFor?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-bold text-ink">
          {label}
          {optional ? <span className="ml-1.5 text-xs font-medium text-slate-400">optional</span> : null}
        </label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Dropzone({
  file,
  error,
  checking,
  disabled,
  onFile,
  onClear,
}: {
  file: File | null;
  error: string | null;
  checking: boolean;
  disabled: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  if (file && !error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <FileArchive className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{file.name}</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CircleCheck className="size-3.5" aria-hidden /> {bytes(file.size)} · valid zip
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-40"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        disabled={disabled}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition',
          over ? 'scale-[1.01] border-indigo-400 bg-indigo-50' : error ? 'border-red-200 bg-red-50/40' : 'border-slate-300 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40',
        )}
      >
        <span className={cn('grid size-12 place-items-center rounded-2xl shadow-sm', over ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500')}>
          {checking ? <Clock className="size-6 animate-pulse" aria-hidden /> : <Upload className="size-6" aria-hidden />}
        </span>
        <span className="mt-3 text-sm font-bold text-ink">{over ? 'Drop it!' : 'Drag your .zip here, or click to browse'}</span>
        <span className="mt-1 text-xs text-slate-500">One .zip file, up to {PLATFORM_RULES.maxUploadMb} MB. Include a README so reviewers know where to start.</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600" role="alert">
          <CircleX className="size-4" aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
}

function Gate({ c, children }: { c: ChallengeView; children: ReactNode }) {
  const join = useJoinChallenge();
  const v = c.viewer;
  const now = Date.now();
  if (v?.submissionId) {
    return (
      <EmptyState
        emoji="✅"
        title="You've already submitted to this challenge"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink to={`/challenges/${c.id}`}>View status</ButtonLink>
            <ButtonLink to="/work" variant="secondary">
              My work
            </ButtonLink>
          </div>
        }
      >
        One submission per challenge keeps it fair for everyone.
      </EmptyState>
    );
  }
  if (c.status !== 'open' || isPastDeadline(c, now)) {
    return (
      <EmptyState emoji="🔒" title="Submissions are closed" action={<ButtonLink to="/explore">Explore open challenges</ButtonLink>}>
        {c.status === 'awarded' ? 'Results for this challenge are already published.' : 'The deadline has passed and the team is reviewing.'}
      </EmptyState>
    );
  }
  if (c.kind === 'live' && !v?.joined) {
    const full = c.spotsLeft !== null && c.spotsLeft <= 0;
    return (
      <EmptyState
        emoji={full ? '🚫' : '🎟️'}
        title={full ? 'All spots are taken' : 'Join the challenge first'}
        action={
          full ? (
            <ButtonLink to={`/explore?type=${c.type}`}>Similar challenges</ButtonLink>
          ) : (
            <Button loading={join.isPending} onClick={() => join.mutate(c.id)}>
              Join & claim a spot
            </Button>
          )
        }
      >
        {full
          ? 'The applicant cap for this challenge has been reached.'
          : `Live challenges need a claimed spot before you submit${c.applicantCap ? ` (${c.spotsLeft ?? 0} of ${c.applicantCap} left)` : ''}.`}
        {join.isError ? <span className="mt-2 block font-medium text-red-600">{errorMessage(join.error)}</span> : null}
      </EmptyState>
    );
  }
  return <>{children}</>;
}

export function SubmitPage() {
  const { id } = useParams();
  const q = useChallenge(id);
  const c = q.data;
  const queryClient = useQueryClient();
  const { personaId } = usePersona();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [notes, setNotes] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [aiDisclosure, setAiDisclosure] = useState('');
  const [honor, setHonor] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionView | null>(null);
  const handleRef = useRef<UploadHandle | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => () => handleRef.current?.abort(), []);

  const notesLen = contentLength(notes);
  const notesOk = notesLen >= PLATFORM_RULES.minNotesChars;
  const urlOk = !demoUrl.trim() || isUrl(demoUrl.trim());
  const uploading = progress !== null;
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!file || fileError) m.push('a .zip file');
    if (!notesOk) m.push(`${PLATFORM_RULES.minNotesChars - notesLen} more characters of notes`);
    if (!urlOk) m.push('a valid link (or leave it empty)');
    if (!honor) m.push('the honor pledge');
    return m;
  }, [file, fileError, notesOk, notesLen, urlOk, honor]);
  const canSubmit = missing.length === 0 && !uploading;

  const pickFile = async (f: File) => {
    setServerError(null);
    setFile(f);
    setFileError(null);
    if (!/\.zip$/i.test(f.name)) {
      setFileError('Only .zip files are accepted.');
      return;
    }
    if (f.size > PLATFORM_RULES.maxUploadMb * 1024 * 1024) {
      setFileError(`That file is ${bytes(f.size)} — the limit is ${PLATFORM_RULES.maxUploadMb} MB.`);
      return;
    }
    setChecking(true);
    const ok = await looksLikeZip(f);
    setChecking(false);
    if (!ok) setFileError("That doesn't look like a real zip archive. Try re-zipping your folder.");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!c || !file || !canSubmit) return;
    setServerError(null);
    setProgress(0);
    const handle = uploadSubmission(
      c.id,
      { file, notes: notes.trim(), demoUrl: demoUrl.trim() || undefined, aiDisclosure: aiDisclosure.trim() || undefined },
      (p) => setProgress(p),
    );
    handleRef.current = handle;
    try {
      const sub = await handle.promise;
      setProgress(1);
      setResult(sub);
      // Reflect the new state everywhere.
      queryClient.setQueryData<ChallengeView>(qk.challenge(personaId, c.id), (prev) =>
        prev ? { ...prev, viewer: { joined: true, submissionId: sub.id, submissionStatus: sub.status } } : prev,
      );
      ['challenges', 'challenge', 'mySubmissions', 'student', 'notifications'].forEach(
        (k) => void queryClient.invalidateQueries({ queryKey: [k] }),
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (isApiError(err) && err.code === 'ABORTED') setServerError('Upload cancelled.');
      else setServerError(errorMessage(err));
      if (isApiError(err) && (err.code === 'NOT_ZIP' || err.code === 'FILE_TOO_LARGE')) setFileError(errorMessage(err));
    } finally {
      handleRef.current = null;
      setProgress(null);
    }
  };

  if (q.isLoading && !c) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (q.isError && !c) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;
  if (!c) return null;
  if (result) return <SuccessScreen c={c} sub={result} />;

  const company = c.company?.name ?? 'Coach';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to={`/challenges/${c.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to the challenge
      </Link>

      <header className="flex flex-wrap items-center gap-3 rounded-3xl border border-line/80 bg-white p-5 shadow-soft">
        <CompanyLogo company={c.company} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">{c.company?.name ?? 'Tryout Practice'}</span>
            <TypeChip type={c.type} size="sm" />
          </div>
          <h1 className="mt-0.5 text-xl font-extrabold leading-snug tracking-tight text-ink sm:text-2xl">Submit: {c.title}</h1>
        </div>
        {c.kind === 'live' ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due in</div>
            <Countdown deadline={c.deadline} prefix="" icon={false} className="text-base" />
          </div>
        ) : null}
      </header>

      <Gate c={c}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form onSubmit={onSubmit} className="min-w-0 space-y-6" noValidate>
            <Card className="space-y-6 p-5 sm:p-6">
              <Field label="Your work" hint=".zip · max 50 MB">
                <Dropzone
                  file={file}
                  error={fileError ?? (touched && !file ? 'Add your .zip to submit.' : null)}
                  checking={checking}
                  disabled={uploading}
                  onFile={pickFile}
                  onClear={() => {
                    setFile(null);
                    setFileError(null);
                  }}
                />
              </Field>

              <Field
                label="Approach notes"
                htmlFor="notes"
                hint={
                  <button
                    type="button"
                    onClick={() => setNotes((n) => (n.trim() ? `${n.trimEnd()}\n\n${TEMPLATE}` : TEMPLATE))}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                    disabled={uploading}
                  >
                    <WandSparkles className="size-3.5" aria-hidden /> Insert template
                  </button>
                }
              >
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={uploading}
                  rows={9}
                  placeholder={PLACEHOLDER}
                  className={cn(
                    'w-full resize-y rounded-2xl border bg-white px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:shadow-glow',
                    touched && !notesOk ? 'border-red-300 focus:border-red-400' : 'border-line focus:border-indigo-300',
                  )}
                />
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500">Reviewers read these first — explain your thinking, not just the output.</span>
                  <span className={cn('inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums', notesOk ? 'text-emerald-600' : 'text-slate-500')}>
                    {notesOk ? <CircleCheck className="size-3.5" aria-hidden /> : null}
                    {notesLen} / {PLATFORM_RULES.minNotesChars}+ chars
                  </span>
                </div>
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Demo or repo link" optional htmlFor="demo">
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <input
                      id="demo"
                      type="url"
                      inputMode="url"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      disabled={uploading}
                      placeholder="https://github.com/you/project"
                      className={cn(
                        'h-11 w-full rounded-xl border bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:shadow-glow',
                        urlOk ? 'border-line focus:border-indigo-300' : 'border-red-300',
                      )}
                    />
                  </div>
                  {!urlOk ? <p className="mt-1 text-xs font-medium text-red-600">Use a full link starting with https://</p> : null}
                </Field>
                <Field label="AI-use disclosure" optional htmlFor="ai">
                  <textarea
                    id="ai"
                    value={aiDisclosure}
                    onChange={(e) => setAiDisclosure(e.target.value)}
                    disabled={uploading}
                    rows={2}
                    placeholder="e.g. Used Copilot for test boilerplate; design and code are mine."
                    className="w-full resize-y rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:shadow-glow"
                  />
                  <p className="mt-1 text-xs text-slate-500">AI use is allowed. Being upfront is what counts.</p>
                </Field>
              </div>

              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                  honor ? 'border-indigo-200 bg-indigo-50/60' : touched ? 'border-red-200 bg-red-50/30' : 'border-line bg-slate-50/60 hover:border-slate-300',
                )}
              >
                <input
                  type="checkbox"
                  checked={honor}
                  onChange={(e) => setHonor(e.target.checked)}
                  disabled={uploading}
                  className="mt-0.5 size-4 shrink-0 accent-indigo-600"
                />
                <span className="text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-ink">This is my own work</span>, and I've disclosed any AI help. I keep my IP unless my
                  submission is paid.
                </span>
              </label>
            </Card>

            {serverError ? (
              <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{serverError}</span>
              </div>
            ) : null}

            <Card className="p-5">
              {uploading ? (
                <div className="space-y-3" aria-live="polite">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-ink">
                      <Upload className="size-4 shrink-0 animate-bounce text-indigo-500" aria-hidden />
                      <span className="truncate">{(progress ?? 0) < 1 ? `Uploading ${file?.name}…` : 'Checking your zip…'}</span>
                    </span>
                    <span className="font-bold tabular-nums text-indigo-600">{Math.round((progress ?? 0) * 100)}%</span>
                  </div>
                  <ProgressBar value={progress ?? 0} className="h-3" />
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleRef.current?.abort()} disabled={(progress ?? 0) >= 1}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="flex-1 text-sm text-slate-500">
                    {missing.length > 0 ? (
                      <>
                        Still needed: <span className="font-medium text-slate-700">{missing.join(', ')}</span>.
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                        <CircleCheck className="size-4" aria-hidden /> Ready to submit — one submission per challenge.
                      </span>
                    )}
                  </p>
                  <Button type="submit" size="lg" disabled={!canSubmit} className="shrink-0">
                    Submit to {company} <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              )}
            </Card>
          </form>

          <aside className="space-y-4">
            <div className="space-y-4 lg:sticky lg:top-24">
              <Card className="p-5">
                <h2 className="text-sm font-bold text-ink">Deliverables</h2>
                <ul className="mt-3 space-y-2">
                  {c.deliverables.map((d) => (
                    <li key={d} className="flex gap-2 text-[13px] leading-snug text-slate-600">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-5">
                <h2 className="text-sm font-bold text-ink">How you'll be judged</h2>
                <ul className="mt-3 space-y-2">
                  {c.rubric.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="text-slate-600">{r.name}</span>
                      <span className="rounded-full bg-indigo-50 px-1.5 text-xs font-bold tabular-nums text-indigo-700">{r.weight}%</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="space-y-2.5 p-5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Lock className="size-3.5 text-emerald-500" aria-hidden />
                  {c.kind === 'live' && c.rewardTotal > 0 ? `${money(c.rewardTotal)} bounty is escrowed` : 'Feedback is guaranteed'}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-emerald-500" aria-hidden /> You keep your IP unless paid
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="size-3.5 text-emerald-500" aria-hidden /> {c.kind === 'live' ? 'Blind review — judged on the work alone' : 'Instant Coach review'}
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </Gate>
    </div>
  );
}
