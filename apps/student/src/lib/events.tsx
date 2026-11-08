import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { type ChallengeView, type Notification, type ServerEvent, type ServerEventType } from '@shared/types';
import { eventsUrl } from './api';
import { celebrate } from './confetti';
import { ordinal } from './format';
import { usePersona } from './persona';
import { findChallengeAnywhere, qk, useCurrentStudent } from './queries';

export type LiveStatus = 'connecting' | 'live' | 'reconnecting';

interface LiveContextValue {
  status: LiveStatus;
  /** Challenge ids that arrived over SSE in the last few seconds (Explore highlights them). */
  freshIds: ReadonlySet<string>;
}

const LiveContext = createContext<LiveContextValue>({ status: 'connecting', freshIds: new Set() });

const EVENT_TYPES: ServerEventType[] = [
  'challenge.created',
  'challenge.updated',
  'submission.created',
  'submission.scored',
  'challenge.awarded',
  'notification.created',
  'system.reset',
];

const FRESH_MS = 15_000;

/** Accepts either `data: {type, payload}` or `data: payload`. */
function normalize(type: ServerEventType, raw: unknown): ServerEvent {
  const obj = raw as { type?: string; payload?: unknown } | null;
  if (obj && typeof obj === 'object' && 'payload' in obj && obj.type === type) return obj as ServerEvent;
  return { type, payload: (raw ?? {}) as never } as ServerEvent;
}

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { personaId } = usePersona();
  const student = useCurrentStudent();
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());

  // Refs so the EventSource handler always sees the latest persona without reconnecting.
  const personaRef = useRef(personaId);
  const interestsRef = useRef(student?.interests ?? null);
  const navigateRef = useRef(navigate);
  personaRef.current = personaId;
  interestsRef.current = student?.interests ?? null;
  navigateRef.current = navigate;

  const markFresh = useCallback((id: string) => {
    setFreshIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, FRESH_MS);
  }, []);

  const handle = useCallback(
    async (event: ServerEvent) => {
      const me = personaRef.current;
      const inv = (key: readonly unknown[]) => void queryClient.invalidateQueries({ queryKey: key });

      switch (event.type) {
        case 'challenge.created': {
          const challenge = event.payload.challenge as ChallengeView;
          if (!challenge?.id) return inv(['challenges']);
          // Pop it into the list right away, then refetch for viewer-specific fields.
          queryClient.setQueryData<ChallengeView[]>(qk.challenges(me), (list) =>
            list && !list.some((c) => c.id === challenge.id) ? [challenge, ...list] : list,
          );
          markFresh(challenge.id);
          inv(['challenges']);
          const interests = interestsRef.current;
          if (challenge.kind === 'live' && interests?.includes(challenge.type)) {
            const from = challenge.company?.name ?? 'Tryout';
            toast(`New challenge · ${from}`, {
              description: challenge.title,
              duration: 9000,
              action: { label: 'View', onClick: () => navigateRef.current(`/challenges/${challenge.id}`) },
            });
          }
          return;
        }

        case 'challenge.updated':
          inv(['challenges']);
          inv(['challenge']);
          return;

        case 'submission.created': {
          inv(['challenges']);
          inv(['challenge', me, event.payload.challengeId]);
          if (event.payload.studentId === me) {
            inv(['mySubmissions']);
            inv(['student']);
          }
          return;
        }

        case 'submission.scored': {
          if (event.payload.studentId === me) {
            inv(['mySubmissions']);
            inv(['submission']);
            inv(['student']);
            inv(['challenge', me, event.payload.challengeId]);
          }
          return;
        }

        case 'challenge.awarded': {
          const { challengeId, results } = event.payload;
          const mine = results?.find((r) => r.studentId === me);
          const mySubs = queryClient.getQueryData<{ challengeId: string }[]>(qk.mySubmissions(me));
          const iSubmitted = Boolean(mine) || Boolean(mySubs?.some((s) => s.challengeId === challengeId));
          ['challenges', 'challenge', 'submission', 'mySubmissions', 'student', 'leaderboard', 'notifications'].forEach((k) =>
            inv([k]),
          );
          if (!iSubmitted) return;
          const info = findChallengeAnywhere(queryClient, me, challengeId);
          const title = info?.title ?? 'your challenge';
          const go = () => navigateRef.current(`/challenges/${challengeId}`);
          if (mine?.placed && mine.rank !== null) {
            celebrate();
            toast.success(`${ordinal(mine.rank)} place`, {
              description: title,
              duration: 12000,
              action: { label: 'View', onClick: go },
            });
          } else {
            toast(mine?.rank ? `Results in · ${ordinal(mine.rank)} place` : 'Results in', {
              description: title,
              duration: 10000,
              action: { label: 'View', onClick: go },
            });
          }
          return;
        }

        case 'notification.created': {
          const n = event.payload.notification as Notification;
          if (n?.recipientId === me) inv(['notifications']);
          return;
        }

        case 'system.reset': {
          void queryClient.invalidateQueries();
          return;
        }
      }
    },
    [queryClient, markFresh],
  );

  const handleRef = useRef(handle);
  handleRef.current = handle;

  useEffect(() => {
    let es: EventSource | null = null;
    let hadError = false;
    let closed = false;
    // Hosted API (Lambda) answers each stream like a poll and sends `rotate` before a planned close.
    let rotating = false;
    let polling = false;
    let lastId = '';
    let retryTimer: number | undefined;

    const connect = () => {
      window.clearTimeout(retryTimer);
      const url = eventsUrl();
      // Resume after the last event seen, so a manual reconnect misses nothing.
      es = new EventSource(lastId ? `${url}${url.includes('?') ? '&' : '?'}lastEventId=${encodeURIComponent(lastId)}` : url);
      const self = es;
      es.onopen = () => {
        setStatus('live');
        if (hadError) {
          // We may have missed events while disconnected.
          void queryClient.invalidateQueries();
          hadError = false;
        }
      };
      es.onerror = () => {
        if (closed || es !== self) return;
        if (rotating) {
          rotating = false;
          return;
        }
        hadError = true;
        setStatus('reconnecting');
        // A refused reconnect (e.g. throttled) closes the EventSource for good, so retry by hand.
        if (self.readyState === EventSource.CLOSED) retryTimer = window.setTimeout(connect, 3000);
      };
      es.addEventListener('rotate', (e) => {
        rotating = true;
        polling = true;
        lastId = (e as MessageEvent).lastEventId || lastId;
      });
      for (const type of EVENT_TYPES) {
        es.addEventListener(type, (e) => {
          lastId = (e as MessageEvent).lastEventId || lastId;
          try {
            const data = (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data) : {};
            void handleRef.current(normalize(type, data));
          } catch (err) {
            console.warn('[tryout] bad SSE payload', type, err);
          }
        });
      }
      // Servers that send unnamed events with `{type, payload}`.
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.type && EVENT_TYPES.includes(data.type)) void handleRef.current(normalize(data.type, data));
        } catch {
          /* heartbeat or non-JSON */
        }
      };
    };

    // When polling, a hidden tab stops asking and catches up (replayed events) once shown again.
    const onVisibility = () => {
      if (!polling || closed) return;
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
    return () => {
      closed = true;
      window.clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      es?.close();
    };
  }, [queryClient]);

  const value = useMemo(() => ({ status, freshIds }), [status, freshIds]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  return useContext(LiveContext);
}
