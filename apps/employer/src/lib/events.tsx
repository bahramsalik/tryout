import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { ServerEvent, ServerEventType, SubmissionView } from '@shared/types';
import { API_BASE, api } from './api';
import { truncate } from './format';
import { usePersona } from './persona';
import { qk, queryClient } from './queries';
import { clearBlind, isBlind, markArrival } from './stores';

const EVENT_TYPES: ServerEventType[] = [
  'challenge.created',
  'challenge.updated',
  'submission.created',
  'submission.scored',
  'challenge.awarded',
  'notification.created',
  'system.reset',
];

type LiveStatus = 'connecting' | 'live' | 'offline';
const LiveContext = createContext<LiveStatus>('connecting');

export function useLiveStatus(): LiveStatus {
  return useContext(LiveContext);
}

function invalidate(...keys: (readonly unknown[])[]) {
  for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey });
}

function invalidateChallenge(challengeId: string) {
  invalidate(qk.dashboard, qk.challenge(challengeId), qk.submissions(challengeId), qk.leaderboard(challengeId));
}

/**
 * One EventSource on /api/events for the whole app (SPEC §5.4). Filters events to the current
 * company, refreshes the affected queries and turns the interesting ones into toasts.
 */
export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const { company } = usePersona();
  const navigate = useNavigate();
  const [status, setStatus] = useState<LiveStatus>('connecting');

  // Handlers read the latest company/navigate through refs so the stream never reconnects on switch.
  const companyRef = useRef(company?.id ?? null);
  companyRef.current = company?.id ?? null;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    let disposed = false;
    let hadError = false;
    // Hosted API (Lambda) answers each stream like a poll and sends `rotate` before a planned close.
    let rotating = false;
    let polling = false;
    let lastId = '';
    let retryTimer: number | undefined;
    let es: EventSource | null = null;

    const handle = (type: ServerEventType) => (e: MessageEvent<string>) => {
      lastId = e.lastEventId || lastId;
      let parsed: unknown;
      try {
        parsed = JSON.parse(e.data);
      } catch {
        return;
      }
      // Accept both `data: <payload>` and `data: { type, payload }`.
      const payload =
        parsed && typeof parsed === 'object' && 'payload' in parsed && 'type' in parsed
          ? (parsed as { payload: unknown }).payload
          : parsed;
      try {
        onEvent({ type, payload } as ServerEvent);
      } catch (err) {
        console.warn('[tryout] failed to handle event', type, err);
      }
    };

    const listeners = EVENT_TYPES.map((type) => [type, handle(type)] as const);
    const onRotate = (e: MessageEvent<string>) => {
      rotating = true;
      polling = true;
      lastId = e.lastEventId || lastId;
    };

    function connect() {
      window.clearTimeout(retryTimer);
      const base = `${API_BASE}/events`;
      // Resume after the last event seen, so a manual reconnect misses nothing.
      const next = new EventSource(lastId ? `${base}?lastEventId=${encodeURIComponent(lastId)}` : base);
      es = next;
      next.onopen = () => {
        if (disposed) return;
        setStatus('live');
        if (hadError) {
          // Catch up on anything missed while disconnected.
          hadError = false;
          void queryClient.invalidateQueries();
        }
      };
      next.onerror = () => {
        if (disposed || es !== next) return;
        if (rotating) {
          rotating = false;
          return;
        }
        hadError = true;
        setStatus(next.readyState === EventSource.CLOSED ? 'offline' : 'connecting');
        // A refused reconnect (e.g. throttled) closes the EventSource for good, so retry by hand.
        if (next.readyState === EventSource.CLOSED) retryTimer = window.setTimeout(connect, 3000);
      };
      next.addEventListener('rotate', onRotate as EventListener);
      for (const [type, fn] of listeners) next.addEventListener(type, fn as EventListener);
    }

    // When polling, a hidden tab stops asking and catches up (replayed events) once shown again.
    const onVisibility = () => {
      if (!polling || disposed) return;
      if (document.hidden) {
        window.clearTimeout(retryTimer);
        es?.close();
        es = null;
      } else if (!es) {
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    connect();

    function onEvent(evt: ServerEvent) {
      const mine = companyRef.current;
      switch (evt.type) {
        case 'challenge.created': {
          const c = evt.payload.challenge;
          if (c?.companyId && c.companyId === mine) invalidate(qk.dashboard, qk.challenge(c.id));
          break;
        }
        case 'challenge.updated': {
          if (evt.payload.companyId === mine) invalidateChallenge(evt.payload.challengeId);
          break;
        }
        case 'submission.created': {
          const { submissionId, challengeId, studentId, companyId } = evt.payload;
          if (companyId !== mine) break;
          markArrival(submissionId);
          invalidateChallenge(challengeId);
          invalidate(qk.notifications, qk.student(studentId), qk.studentsAll);
          void announceSubmission(submissionId, challengeId);
          break;
        }
        case 'submission.scored': {
          const { submissionId, challengeId, studentId, companyId } = evt.payload;
          if (companyId !== mine) break;
          invalidateChallenge(challengeId);
          invalidate(qk.submission(submissionId), qk.student(studentId), qk.studentsAll);
          break;
        }
        case 'challenge.awarded': {
          const { challengeId, companyId, results } = evt.payload;
          if (companyId !== mine) break;
          invalidateChallenge(challengeId);
          invalidate(qk.studentsAll);
          for (const r of results ?? []) invalidate(qk.student(r.studentId));
          break;
        }
        case 'notification.created': {
          const n = evt.payload.notification;
          if (!n || n.recipientId !== mine) break;
          invalidate(qk.notifications);
          if (n.kind === 'cap_reached') {
            toast(n.title, {
              description: n.body,
              action: n.link ? { label: 'Open', onClick: () => navigateRef.current(n.link!) } : undefined,
            });
          }
          break;
        }
        case 'system.reset': {
          clearBlind();
          void queryClient.invalidateQueries();
          break;
        }
      }
    }

    async function announceSubmission(submissionId: string, challengeId: string) {
      let sub: SubmissionView | null = null;
      try {
        sub = await queryClient.fetchQuery({
          queryKey: qk.submission(submissionId),
          queryFn: () => api<SubmissionView>(`/submissions/${encodeURIComponent(submissionId)}`),
        });
      } catch {
        /* fall back to a generic toast */
      }
      if (disposed) return;
      const title = sub?.challenge.title ?? 'your challenge';
      const who = sub ? (isBlind(challengeId, sub.challenge.status) ? sub.alias : sub.student.name) : 'a candidate';
      toast(`New submission · ${who}`, {
        description: truncate(title, 48),
        duration: 8000,
        action: {
          label: 'Review',
          onClick: () => navigateRef.current(`/challenges/${challengeId}/review/${submissionId}`),
        },
      });
    }

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      es?.close();
    };
  }, []);

  return <LiveContext.Provider value={status}>{children}</LiveContext.Provider>;
}
