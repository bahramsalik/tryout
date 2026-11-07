import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { CoachQuickPrompt } from '@shared/types';
import { api, errorMessage } from './api';
import { usePersona } from './persona';

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  recommendedIds?: string[];
  /** Reveal with the typewriter effect (only for fresh replies). */
  animate?: boolean;
  error?: boolean;
  /** The request to retry when `error`. */
  retry?: { text: string; quickPrompt?: CoachQuickPrompt | null };
}

export const EXPLORE_KEY = 'explore';

export const TASK_PROMPTS: { key: CoachQuickPrompt; label: string; emoji: string }[] = [
  { key: 'testing', label: 'What is this really testing?', emoji: '🎯' },
  { key: 'steps', label: 'Break it into steps', emoji: '🪜' },
  { key: 'greatLooksLike', label: 'What does great look like?', emoji: '🌟' },
  { key: 'pitfalls', label: 'Common pitfalls', emoji: '⚠️' },
];

export const EXPLORE_PROMPTS: string[] = [
  'I want to be a backend engineer',
  'I love working with data',
  "I'm into product design",
  "I'm new — where should I start?",
];

interface OpenOptions {
  /** Force a context; defaults to the challenge in the URL (or Explore mode). */
  challengeId?: string | null;
  /** Send this right away. */
  send?: { text: string; quickPrompt?: CoachQuickPrompt | null };
}

interface CoachContextValue {
  isOpen: boolean;
  /** `EXPLORE_KEY` or a challenge id. */
  activeKey: string;
  messages: CoachMessage[];
  pending: boolean;
  open: (opts?: OpenOptions) => void;
  close: () => void;
  send: (text: string, quickPrompt?: CoachQuickPrompt | null) => void;
  markRevealed: (id: string) => void;
  reset: () => void;
}

const CoachContext = createContext<CoachContextValue | null>(null);

let seq = 0;
const nextId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

function challengeIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/challenges\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function CoachProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { personaId } = usePersona();
  const [isOpen, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>(EXPLORE_KEY);
  const [threads, setThreads] = useState<Record<string, CoachMessage[]>>({});
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set());
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;

  // Conversations belong to a persona.
  useEffect(() => {
    setThreads({});
    setPendingKeys(new Set());
  }, [personaId]);

  // Follow the page while closed, so "Ask Coach" always opens in the right mode.
  const routeKey = challengeIdFromPath(location.pathname) ?? EXPLORE_KEY;
  useEffect(() => {
    if (!isOpen) setActiveKey(routeKey);
  }, [routeKey, isOpen]);

  const append = useCallback((key: string, msg: CoachMessage) => {
    setThreads((t) => ({ ...t, [key]: [...(t[key] ?? []), msg] }));
  }, []);

  const sendTo = useCallback(
    async (key: string, text: string, quickPrompt?: CoachQuickPrompt | null) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      append(key, { id: nextId(), role: 'user', text: trimmed });
      setPendingKeys((s) => new Set(s).add(key));
      const started = performance.now();
      try {
        const res = await api.coach({
          message: trimmed,
          challengeId: key === EXPLORE_KEY ? null : key,
          quickPrompt: quickPrompt ?? null,
        });
        // Keep the typing dots up for a beat even if the server is instant.
        const elapsed = performance.now() - started;
        if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed));
        append(key, {
          id: nextId(),
          role: 'coach',
          text: res.reply,
          recommendedIds: res.recommendedChallengeIds ?? [],
          animate: true,
        });
      } catch (err) {
        append(key, {
          id: nextId(),
          role: 'coach',
          text: `Hmm, I couldn't reach Coach just now. ${errorMessage(err)}`,
          error: true,
          retry: { text: trimmed, quickPrompt },
        });
      } finally {
        setPendingKeys((s) => {
          const next = new Set(s);
          next.delete(key);
          return next;
        });
      }
    },
    [append],
  );

  const open = useCallback(
    (opts?: OpenOptions) => {
      const key = opts?.challengeId === undefined ? routeKey : (opts.challengeId ?? EXPLORE_KEY);
      setActiveKey(key);
      setOpen(true);
      if (opts?.send) void sendTo(key, opts.send.text, opts.send.quickPrompt);
    },
    [routeKey, sendTo],
  );

  const close = useCallback(() => setOpen(false), []);

  const send = useCallback(
    (text: string, quickPrompt?: CoachQuickPrompt | null) => void sendTo(activeKeyRef.current, text, quickPrompt),
    [sendTo],
  );

  const markRevealed = useCallback((id: string) => {
    setThreads((t) => {
      const key = activeKeyRef.current;
      const list = t[key];
      if (!list) return t;
      return { ...t, [key]: list.map((m) => (m.id === id ? { ...m, animate: false } : m)) };
    });
  }, []);

  const reset = useCallback(() => {
    setThreads((t) => ({ ...t, [activeKeyRef.current]: [] }));
  }, []);

  const value = useMemo<CoachContextValue>(
    () => ({
      isOpen,
      activeKey,
      messages: threads[activeKey] ?? [],
      pending: pendingKeys.has(activeKey),
      open,
      close,
      send,
      markRevealed,
      reset,
    }),
    [isOpen, activeKey, threads, pendingKeys, open, close, send, markRevealed, reset],
  );

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoach must be used inside <CoachProvider>');
  return ctx;
}
