import { ArrowUpload24Regular, CheckmarkCircle48Filled, Dismiss20Regular, FolderZip24Regular } from '@fluentui/react-icons';
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { PLATFORM_RULES, type ChallengeView, type SubmissionView } from '@shared/types';
import { Countdown, Score } from '@/components/brand';
import { Button, ButtonLink, Card, EmptyState, ErrorState, Field, MessageBar, ProgressBar, Skeleton, Spinner, Textarea } from '@/components/ui';
import { errorMessage, isApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { isPastDeadline } from '@/lib/derive';
import { bytes } from '@/lib/format';
import { usePersona } from '@/lib/persona';
import { qk, useChallenge, useJoinChallenge } from '@/lib/queries';
import { looksLikeZip, uploadSubmission, type UploadHandle } from '@/lib/upload';

const PLACEHOLDER = `What I built

Key decisions and trade-offs

What I'd do with more time`;

/* ─────────────────────────────── Success ─────────────────────────────── */

function SuccessScreen({ c, sub }: { c: ChallengeView; sub: SubmissionView }) {
  const coachScored = c.kind === 'practice' && sub.totalScore !== null;
  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <CheckmarkCircle48Filled className="text-success" aria-hidden />
      <h1 className="text-title3 font-semibold text-fg1">Submitted</h1>
      {coachScored ? <Score score={sub.totalScore!} /> : null}
      <div className="flex flex-wrap justify-center gap-2">
        <ButtonLink to={coachScored ? `/challenges/${c.id}` : '/work?tab=submitted'} appearance="primary">
          {coachScored ? 'Result' : 'My work'}
        </ButtonLink>
        <ButtonLink to="/explore">Explore</ButtonLink>
      </div>
    </Card>
  );
}

/* ─────────────────────────────── Form ─────────────────────────────── */

function Dropzone({
  file,
  checking,
  disabled,
  invalid,
  onFile,
  onClear,
}: {
  file: File | null;
  checking: boolean;
  disabled: boolean;
  invalid: boolean;
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

  if (file && !invalid) {
    return (
      <div className="flex h-14 items-center gap-3 rounded-md border border-stroke1 bg-bg1 px-3">
        <FolderZip24Regular className="shrink-0 text-fg2" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-semibold text-fg1">{file.name}</div>
          <div className="text-caption text-fg3">{checking ? 'Checking…' : bytes(file.size)}</div>
        </div>
        <Button appearance="subtle" iconOnly icon={Dismiss20Regular} onClick={onClear} disabled={disabled} aria-label="Remove file" />
      </div>
    );
  }

  return (
    <>
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
        aria-describedby="zip-limit"
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-6 py-8 text-center transition-colors',
          over ? 'border-brand bg-brand-bg2' : invalid ? 'border-danger bg-bg1' : 'border-stroke-accessible bg-bg1 hover:bg-bg1-hover',
        )}
      >
        <ArrowUpload24Regular className="text-brand-fg1" aria-hidden />
        <span className="text-body font-semibold text-fg1">Drop a .zip or browse</span>
        <span id="zip-limit" className="text-caption text-fg3">
          Max {PLATFORM_RULES.maxUploadMb} MB
        </span>
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
    </>
  );
}

function Gate({ c, children }: { c: ChallengeView; children: ReactNode }) {
  const join = useJoinChallenge();
  const v = c.viewer;
  if (v?.submissionId) {
    return <EmptyState title="Already submitted" action={<ButtonLink to={`/challenges/${c.id}`}>View</ButtonLink>} />;
  }
  if (c.status !== 'open' || isPastDeadline(c)) {
    return <EmptyState title="Submissions are closed" action={<ButtonLink to="/explore">Explore</ButtonLink>} />;
  }
  if (c.kind === 'live' && !v?.joined) {
    const full = c.spotsLeft !== null && c.spotsLeft <= 0;
    return (
      <EmptyState
        title={full ? 'All spots are taken' : join.isError ? errorMessage(join.error) : 'Join to submit'}
        action={
          full ? undefined : (
            <Button appearance="primary" loading={join.isPending} onClick={() => join.mutate(c.id)}>
              Join
            </Button>
          )
        }
      />
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
  const [notesTouched, setNotesTouched] = useState(false);
  const [aiDisclosure, setAiDisclosure] = useState('');
  const [honor, setHonor] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionView | null>(null);
  const handleRef = useRef<UploadHandle | null>(null);

  useEffect(() => () => handleRef.current?.abort(), []);

  const notesLen = notes.replace(/\s+/g, ' ').trim().length;
  const notesOk = notesLen >= PLATFORM_RULES.minNotesChars;
  const uploading = progress !== null;
  const canSubmit = Boolean(file) && !fileError && !checking && notesOk && honor && !uploading;

  const pickFile = async (f: File) => {
    setServerError(null);
    setFile(f);
    setFileError(null);
    if (!/\.zip$/i.test(f.name)) {
      setFileError('Use a .zip file');
      return;
    }
    if (f.size > PLATFORM_RULES.maxUploadMb * 1024 * 1024) {
      setFileError(`Over ${PLATFORM_RULES.maxUploadMb} MB`);
      return;
    }
    setChecking(true);
    const ok = await looksLikeZip(f);
    setChecking(false);
    if (!ok) setFileError('Not a valid zip');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!c || !file || !canSubmit) return;
    setServerError(null);
    setProgress(0);
    const handle = uploadSubmission(c.id, { file, notes: notes.trim(), aiDisclosure: aiDisclosure.trim() || undefined }, (p) => setProgress(p));
    handleRef.current = handle;
    try {
      const sub = await handle.promise;
      setProgress(1);
      setResult(sub);
      queryClient.setQueryData<ChallengeView>(qk.challenge(personaId, c.id), (prev) =>
        prev ? { ...prev, viewer: { joined: true, submissionId: sub.id, submissionStatus: sub.status } } : prev,
      );
      ['challenges', 'challenge', 'mySubmissions', 'student', 'notifications'].forEach((k) => void queryClient.invalidateQueries({ queryKey: [k] }));
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (isApiError(err) && err.code === 'ABORTED') setServerError(null);
      else setServerError(errorMessage(err));
      if (isApiError(err) && (err.code === 'NOT_ZIP' || err.code === 'FILE_TOO_LARGE')) setFileError(errorMessage(err));
    } finally {
      handleRef.current = null;
      setProgress(null);
    }
  };

  if (q.isLoading && !c) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }
  if (q.isError && !c) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;
  if (!c) return null;
  if (result) return <SuccessScreen c={c} sub={result} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link to={`/challenges/${c.id}`} className="text-body text-brand-link hover:text-brand-link-hover hover:underline">
          {c.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-title2 font-semibold text-fg1">Submit</h1>
          {c.kind === 'live' ? <Countdown deadline={c.deadline} /> : null}
        </div>
      </header>

      <Gate c={c}>
        <form onSubmit={onSubmit} noValidate>
          <Card className="space-y-6 p-5 sm:p-6">
            <Field label="Your work" error={fileError}>
              <Dropzone
                file={file}
                checking={checking}
                disabled={uploading}
                invalid={Boolean(fileError)}
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
              counter={`${Math.min(notesLen, PLATFORM_RULES.minNotesChars)}/${PLATFORM_RULES.minNotesChars}`}
              error={notesTouched && !notesOk ? `At least ${PLATFORM_RULES.minNotesChars} characters` : null}
            >
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => setNotesTouched(true)}
                disabled={uploading}
                rows={8}
                placeholder={PLACEHOLDER}
                invalid={notesTouched && !notesOk}
              />
            </Field>

            <Field label="AI use" htmlFor="ai" optional>
              <Textarea
                id="ai"
                value={aiDisclosure}
                onChange={(e) => setAiDisclosure(e.target.value)}
                disabled={uploading}
                rows={2}
                placeholder="e.g. Copilot for test boilerplate"
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-2 text-body text-fg1">
              <input type="checkbox" checked={honor} onChange={(e) => setHonor(e.target.checked)} disabled={uploading} className="mt-0.5 size-4 shrink-0" />
              This is my own work and I've disclosed any AI help.
            </label>

            {serverError ? <MessageBar intent="error">{serverError}</MessageBar> : null}

            {uploading ? (
              <div className="space-y-2" aria-live="polite">
                <div className="flex items-center justify-between gap-2 text-body">
                  <span className="flex items-center gap-2 text-fg2">
                    <Spinner size={16} />
                    {(progress ?? 0) < 1 ? `Uploading ${Math.round((progress ?? 0) * 100)}%` : 'Checking'}
                  </span>
                  <Button appearance="subtle" size="small" onClick={() => handleRef.current?.abort()} disabled={(progress ?? 0) >= 1}>
                    Cancel
                  </Button>
                </div>
                <ProgressBar value={progress ?? 0} />
              </div>
            ) : (
              <div className="flex justify-end">
                <Button type="submit" appearance="primary" disabled={!canSubmit}>
                  Submit
                </Button>
              </div>
            )}
          </Card>
        </form>
      </Gate>
    </div>
  );
}
