import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { ChallengeView, InterviewInvite, InviteView, Notification, ServerEvent, ServerEventType } from '@shared/types';
import { api, eventsUrl } from './api';
import { celebrate, pop } from './confetti';
import { medal, money, ordinal } from './format';
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
  'invite.created',
  'invite.updated',
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
            const reward = challenge.rewardTotal > 0 ? `${money(challenge.rewardTotal)} bounty` : 'Feedback guaranteed';
            toast(`New from ${from}`, {
              description: `${challenge.title} · ${reward} · ~${challenge.estHours} h`,
              icon: '✨',
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
          const company = info?.company?.name;
          const go = () => navigateRef.current(`/challenges/${challengeId}`);
          if (mine && mine.payout > 0) {
            celebrate();
            toast.success(`${medal(mine.rank) ?? '🏆'} You placed ${ordinal(mine.rank)} — ${money(mine.payout)} is on its way`, {
              description: `${title}${company ? ` · Feedback from ${company} is ready` : ''}`,
              duration: 12000,
              action: { label: 'See results', onClick: go },
            });
          } else {
            toast('Results and feedback are in', {
              description: `${title}${mine?.rank ? ` · You placed ${ordinal(mine.rank)}` : ''}${company ? ` · Feedback from ${company}` : ''}`,
              icon: '📬',
              duration: 10000,
              action: { label: 'Read feedback', onClick: go },
            });
          }
          return;
        }

        case 'invite.created': {
          const invite = event.payload.invite as InterviewInvite;
          if (invite?.studentId !== me) return;
          inv(['notifications']);
          let company = 'An employer';
          let role = invite.role;
          try {
            const list = await queryClient.fetchQuery({ queryKey: qk.invites(me), queryFn: () => api.myInvites(), staleTime: 0 });
            const view = (list as InviteView[]).find((i) => i.id === invite.id);
            if (view) {
              company = view.company.name;
              role = view.role ?? role;
            }
          } catch {
            inv(['invites']);
          }
          pop({ x: 0.85, y: 0.12 });
          toast.success(`${company} wants to interview you`, {
            description: role ? `${role} · Respond in My work` : 'Respond in My work',
            icon: '🎉',
            duration: 12000,
            action: { label: 'View invite', onClick: () => navigateRef.current('/work') },
          });
          return;
        }

        case 'invite.updated': {
          if (event.payload.invite?.studentId === me) inv(['invites']);
          return;
        }

        case 'notification.created': {
          const n = event.payload.notification as Notification;
          if (n?.recipientId === me) inv(['notifications']);
          return;
        }

        case 'system.reset': {
          void queryClient.invalidateQueries();
          toast('Demo data was reset', { icon: '🔄', description: 'Everything is fresh again.' });
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

    const connect = () => {
      es = new EventSource(eventsUrl());
      es.onopen = () => {
        setStatus('live');
        if (hadError) {
          // We may have missed events while disconnected.
          void queryClient.invalidateQueries();
          hadError = false;
        }
      };
      es.onerror = () => {
        if (closed) return;
        hadError = true;
        setStatus('reconnecting');
      };
      for (const type of EVENT_TYPES) {
        es.addEventListener(type, (e) => {
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

    connect();
    return () => {
      closed = true;
      es?.close();
    };
  }, [queryClient]);

  const value = useMemo(() => ({ status, freshIds }), [status, freshIds]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  return useContext(LiveContext);
}
