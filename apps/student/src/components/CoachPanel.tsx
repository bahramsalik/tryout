import { ArrowUp, RotateCcw, Sparkles, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { EXPLORE_KEY, EXPLORE_PROMPTS, TASK_PROMPTS, useCoach, type CoachMessage } from '@/lib/coach';
import { cn } from '@/lib/cn';
import { firstName } from '@/lib/format';
import { useChallenge, useCurrentStudent } from '@/lib/queries';
import { TypeChip } from './brand';
import { MiniChallengeCard } from './ChallengeCard';
import { Markdown } from './Markdown';
import { Skeleton } from './ui';

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Reveals markdown progressively; finishes in ~1–2 s regardless of length. Click to skip. */
function Typewriter({ text, onDone, onTick }: { text: string; onDone: () => void; onTick: () => void }) {
  const [n, setN] = useState(() => (reducedMotion() ? text.length : 0));
  const doneRef = useRef(onDone);
  const tickRef = useRef(onTick);
  doneRef.current = onDone;
  tickRef.current = onTick;

  useEffect(() => {
    if (n >= text.length) {
      doneRef.current();
      return;
    }
    const step = Math.max(2, Math.ceil(text.length / 110));
    const id = window.setTimeout(() => {
      setN((v) => Math.min(text.length, v + step));
      tickRef.current();
    }, 16);
    return () => window.clearTimeout(id);
  }, [n, text.length]);

  return (
    <div onClick={() => setN(text.length)} className="cursor-text">
      <Markdown size="sm">{text.slice(0, n) + (n < text.length ? ' ▍' : '')}</Markdown>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-2" aria-live="polite" aria-label="Coach is typing">
      <CoachAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${i * 140}ms`, animationDuration: '0.9s' }}
          />
        ))}
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full brand-gradient text-white shadow-sm" aria-hidden>
      <Sparkles className="size-3.5" />
    </span>
  );
}

function RecCard({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const q = useChallenge(id);
  if (q.data) return <MiniChallengeCard challenge={q.data} onNavigate={onNavigate} />;
  if (q.isError) return null;
  return <Skeleton className="h-[86px] w-full rounded-xl" />;
}

function MessageBubble({
  msg,
  onRevealed,
  onTick,
  onRetry,
  onNavigate,
}: {
  msg: CoachMessage;
  onRevealed: () => void;
  onTick: () => void;
  onRetry: () => void;
  onNavigate: () => void;
}) {
  if (msg.role === 'user') {
    return (
      <div className="flex animate-fade-up justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md brand-gradient px-3.5 py-2.5 text-sm font-medium text-white shadow-sm">
          {msg.text}
        </div>
      </div>
    );
  }
  const recs = msg.recommendedIds ?? [];
  return (
    <div className="flex animate-fade-up items-start gap-2">
      <CoachAvatar />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'rounded-2xl rounded-tl-md px-3.5 py-2.5',
            msg.error ? 'border border-red-100 bg-red-50 text-sm text-red-700' : 'bg-slate-100/80',
          )}
        >
          {msg.error ? (
            <>
              <p>{msg.text}</p>
              <button onClick={onRetry} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 underline">
                <RotateCcw className="size-3" aria-hidden /> Try again
              </button>
            </>
          ) : msg.animate ? (
            <Typewriter text={msg.text} onDone={onRevealed} onTick={onTick} />
          ) : (
            <Markdown size="sm">{msg.text}</Markdown>
          )}
        </div>
        {!msg.animate && recs.length > 0 ? (
          <div className="mt-2 space-y-2">
            {recs.slice(0, 3).map((id, i) => (
              <div key={id} className="animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
                <RecCard id={id} onNavigate={onNavigate} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CoachPanel() {
  const coach = useCoach();
  const student = useCurrentStudent();
  const isTask = coach.activeKey !== EXPLORE_KEY;
  const challengeQ = useChallenge(isTask ? coach.activeKey : undefined);
  const challenge = isTask ? challengeQ.data : undefined;
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  useLayoutEffect(() => {
    scrollToBottom(true);
  }, [coach.messages.length, coach.pending]);

  // Focus management + Escape.
  useEffect(() => {
    if (!coach.isOpen) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') coach.close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach.isOpen]);

  if (!coach.isOpen) return null;

  const submit = () => {
    if (!draft.trim() || coach.pending) return;
    coach.send(draft);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const name = firstName(student?.name) || 'there';
  const greeting = isTask
    ? `Let's crack **${challenge?.title ?? 'this task'}**. Ask me what it's really testing, how to break it down or what great looks like. I'll guide you — the work stays yours.`
    : `Hi ${name}! 👋 I'm **Coach**. Tell me the kind of role you're aiming for and I'll suggest a learning path plus real tasks that match.`;

  const quick = isTask
    ? TASK_PROMPTS.map((p) => ({ label: p.label, emoji: p.emoji, run: () => coach.send(p.label, p.key) }))
    : EXPLORE_PROMPTS.map((p) => ({ label: p, emoji: '', run: () => coach.send(p) }));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]" onClick={coach.close} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Coach"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] animate-slide-in-right flex-col border-l border-line bg-white shadow-2xl"
      >
        <header className="relative overflow-hidden border-b border-line px-4 py-3.5">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" aria-hidden />
          <div className="relative flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl brand-gradient text-white shadow-md">
              <Sparkles className="size-[18px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-ink">Coach</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Preview
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">{isTask ? 'Help with this task' : 'Find the right challenges for you'}</p>
            </div>
            {coach.messages.length > 0 ? (
              <button
                onClick={coach.reset}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <RotateCcw className="size-4" />
              </button>
            ) : null}
            <button
              onClick={coach.close}
              className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink"
              aria-label="Close Coach"
            >
              <X className="size-5" />
            </button>
          </div>
          {isTask ? (
            <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-line bg-white/80 px-3 py-2">
              {challenge ? <TypeChip type={challenge.type} size="sm" /> : <Skeleton className="h-5 w-16 rounded-full" />}
              <span className="truncate text-xs font-semibold text-ink">{challenge?.title ?? 'Loading task…'}</span>
            </div>
          ) : null}
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="flex items-start gap-2">
            <CoachAvatar />
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-slate-100/80 px-3.5 py-2.5">
              <Markdown size="sm">{greeting}</Markdown>
            </div>
          </div>
          {coach.messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              onRevealed={() => {
                coach.markRevealed(m.id);
                window.setTimeout(() => scrollToBottom(true), 30);
              }}
              onTick={() => scrollToBottom(false)}
              onRetry={() => m.retry && coach.send(m.retry.text, m.retry.quickPrompt)}
              onNavigate={coach.close}
            />
          ))}
          {coach.pending ? <TypingDots /> : null}
        </div>

        <footer className="border-t border-line bg-white px-4 pb-4 pt-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {quick.map((q) => (
              <button
                key={q.label}
                onClick={q.run}
                disabled={coach.pending}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/70 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100 disabled:opacity-50"
              >
                {q.emoji ? <span aria-hidden>{q.emoji}</span> : null}
                {q.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-slate-50 p-1.5 pl-3.5 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-glow">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={isTask ? 'Ask about this task…' : 'e.g. I want to be a backend engineer'}
              aria-label="Message Coach"
              className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-400"
              style={{ fieldSizing: 'content' } as CSSProperties}
            />
            <button
              onClick={submit}
              disabled={!draft.trim() || coach.pending}
              className="grid size-9 shrink-0 place-items-center rounded-xl brand-gradient text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">Coach is a preview. It guides your thinking and never does the task for you.</p>
        </footer>
      </aside>
    </>
  );
}
