import { ArrowCounterclockwise20Regular, Send20Filled } from '@fluentui/react-icons';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { EXPLORE_KEY, EXPLORE_PROMPTS, TASK_PROMPTS, useCoach, type CoachMessage } from '@/lib/coach';
import { cn } from '@/lib/cn';
import { useChallenge } from '@/lib/queries';
import { MiniChallengeCard } from './ChallengeCard';
import { Markdown } from './Markdown';
import { Badge, Button, DrawerHeader, OverlayDrawer, Skeleton, Spinner } from './ui';

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Reveals the reply progressively (~1 s). Click to skip. */
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
    const step = Math.max(2, Math.ceil(text.length / 60));
    const id = window.setTimeout(() => {
      setN((v) => Math.min(text.length, v + step));
      tickRef.current();
    }, 16);
    return () => window.clearTimeout(id);
  }, [n, text.length]);

  return (
    <div onClick={() => setN(text.length)}>
      <Markdown size="sm">{text.slice(0, n)}</Markdown>
    </div>
  );
}

function RecCard({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const q = useChallenge(id);
  if (q.data) return <MiniChallengeCard challenge={q.data} onNavigate={onNavigate} />;
  if (q.isError) return null;
  return <Skeleton className="h-[58px] w-full" />;
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
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-brand-bg2 px-3 py-2 text-body text-fg1">{msg.text}</div>
      </div>
    );
  }
  const recs = msg.recommendedIds ?? [];
  return (
    <div className="min-w-0">
      {msg.error ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-body text-fg1">
          <span className="flex-1">{msg.text}</span>
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : msg.animate ? (
        <Typewriter text={msg.text} onDone={onRevealed} onTick={onTick} />
      ) : (
        <Markdown size="sm">{msg.text}</Markdown>
      )}
      {!msg.animate && recs.length > 0 ? (
        <div className="mt-3 space-y-2">
          {recs.slice(0, 3).map((id) => (
            <RecCard key={id} id={id} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CoachPanel() {
  const coach = useCoach();
  const isTask = coach.activeKey !== EXPLORE_KEY;
  const challengeQ = useChallenge(isTask ? coach.activeKey : undefined);
  const challenge = isTask ? challengeQ.data : undefined;
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  useLayoutEffect(() => {
    scrollToBottom(true);
  }, [coach.messages.length, coach.pending]);

  useEffect(() => {
    if (!coach.isOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(t);
  }, [coach.isOpen]);

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

  const quick = isTask
    ? TASK_PROMPTS.map((p) => ({ label: p.label, run: () => coach.send(p.label, p.key) }))
    : EXPLORE_PROMPTS.map((p) => ({ label: p, run: () => coach.send(p) }));

  return (
    <OverlayDrawer open={coach.isOpen} onClose={coach.close} label="Coach">
      <DrawerHeader
        title="Coach"
        badge={<Badge color="neutral">Preview</Badge>}
        onClose={coach.close}
        actions={
          coach.messages.length > 0 ? (
            <Button appearance="subtle" iconOnly icon={ArrowCounterclockwise20Regular} onClick={coach.reset} aria-label="Clear conversation" title="Clear" />
          ) : null
        }
      />
      {isTask ? <p className="-mt-2 truncate px-6 pb-2 text-caption text-fg3">{challenge?.title ?? '…'}</p> : null}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-3">
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
        {coach.pending ? <Spinner size={20} /> : null}
      </div>

      <footer className="border-t border-stroke2 px-6 pb-5 pt-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quick.map((q) => (
            <Button key={q.label} size="small" onClick={q.run} disabled={coach.pending} className="h-7 rounded-full">
              {q.label}
            </Button>
          ))}
        </div>
        <div className={cn('flex items-end gap-1 rounded-md border border-stroke1 border-b-stroke-accessible bg-bg1 py-1 pl-2.5 pr-1 focus-within:border-b-2 focus-within:border-b-brand')}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={isTask ? 'Ask about this task' : 'What role do you want?'}
            aria-label="Message Coach"
            className="max-h-28 min-h-6 flex-1 resize-none bg-transparent py-1 text-body text-fg1 outline-none placeholder:text-fg4"
            style={{ fieldSizing: 'content' } as CSSProperties}
          />
          <Button appearance="subtle" iconOnly icon={Send20Filled} onClick={submit} disabled={!draft.trim() || coach.pending} aria-label="Send" className="text-brand-fg1" />
        </div>
      </footer>
    </OverlayDrawer>
  );
}
