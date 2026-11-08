import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ChallengeView, Notification, Student, SubmissionView } from '@shared/types';
import { api } from './api';
import { usePersona } from './persona';

/** Every key is `[resource, personaId, ...]` so data never leaks across personas. */
export const qk = {
  personas: () => ['personas'] as const,
  me: (p: string) => ['me', p] as const,
  challenges: (p: string) => ['challenges', p] as const,
  challenge: (p: string, id: string) => ['challenge', p, id] as const,
  submission: (p: string, id: string) => ['submission', p, id] as const,
  mySubmissions: (p: string) => ['mySubmissions', p] as const,
  notifications: (p: string) => ['notifications', p] as const,
  student: (p: string, idOrHandle: string) => ['student', p, idOrHandle] as const,
  leaderboard: (p: string, id: string) => ['leaderboard', p, id] as const,
};

export function usePersonas() {
  return useQuery({ queryKey: qk.personas(), queryFn: ({ signal }) => api.personas(signal), staleTime: 5 * 60_000 });
}

export function useMe() {
  const { personaId } = usePersona();
  return useQuery({ queryKey: qk.me(personaId), queryFn: ({ signal }) => api.me(signal), staleTime: 60_000 });
}

/** The signed-in student (undefined while loading or if the persona isn't a student). */
export function useCurrentStudent(): Student | undefined {
  const me = useMe();
  return me.data?.kind === 'student' ? me.data.student : undefined;
}

/** All live + practice challenges that aren't awarded yet (filtering/sorting happens client-side). */
export function useChallenges() {
  const { personaId } = usePersona();
  return useQuery({ queryKey: qk.challenges(personaId), queryFn: ({ signal }) => api.challenges({}, signal) });
}

export function useChallenge(id: string | undefined) {
  const { personaId } = usePersona();
  const queryClient = useQueryClient();
  return useQuery<ChallengeView>({
    queryKey: qk.challenge(personaId, id ?? ''),
    queryFn: ({ signal }) => api.challenge(id!, signal),
    enabled: Boolean(id),
    // Show the list version instantly while the detail loads.
    placeholderData: () => (id ? findChallengeInLists(queryClient, personaId, id) : undefined),
  });
}

export function useSubmission(id: string | null | undefined) {
  const { personaId } = usePersona();
  return useQuery({
    queryKey: qk.submission(personaId, id ?? ''),
    queryFn: ({ signal }) => api.submission(id!, signal),
    enabled: Boolean(id),
  });
}

export function useMySubmissions() {
  const { personaId } = usePersona();
  return useQuery({ queryKey: qk.mySubmissions(personaId), queryFn: ({ signal }) => api.mySubmissions(signal) });
}

export function useNotifications() {
  const { personaId } = usePersona();
  return useQuery({ queryKey: qk.notifications(personaId), queryFn: ({ signal }) => api.notifications(signal) });
}

export function useStudentProfile(idOrHandle: string | undefined) {
  const { personaId } = usePersona();
  return useQuery({
    queryKey: qk.student(personaId, idOrHandle ?? ''),
    queryFn: ({ signal }) => api.student(idOrHandle!, signal),
    enabled: Boolean(idOrHandle),
  });
}

export function useLeaderboard(challengeId: string | undefined, enabled: boolean) {
  const { personaId } = usePersona();
  return useQuery({
    queryKey: qk.leaderboard(personaId, challengeId ?? ''),
    queryFn: ({ signal }) => api.leaderboard(challengeId!, signal),
    enabled: Boolean(challengeId) && enabled,
    retry: false,
  });
}

/* ─────────────────────────────── Mutations ─────────────────────────────── */

export function useJoinChallenge() {
  const { personaId } = usePersona();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => api.join(challengeId),
    onSuccess: (challenge) => {
      queryClient.setQueryData(qk.challenge(personaId, challenge.id), challenge);
      queryClient.setQueryData<ChallengeView[]>(qk.challenges(personaId), (list) =>
        list?.map((c) => (c.id === challenge.id ? challenge : c)),
      );
      void queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useMarkAllRead() {
  const { personaId } = usePersona();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.readAllNotifications(),
    onMutate: () => {
      queryClient.setQueryData<Notification[]>(qk.notifications(personaId), (list) => list?.map((n) => ({ ...n, read: true })));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

/* ─────────────────────────────── Cache helpers ─────────────────────────────── */

export function findChallengeInLists(queryClient: QueryClient, personaId: string, id: string): ChallengeView | undefined {
  const list = queryClient.getQueryData<ChallengeView[]>(qk.challenges(personaId));
  return list?.find((c) => c.id === id);
}

/** Best-effort lookup of a challenge's title/company from anything cached. */
export function findChallengeAnywhere(
  queryClient: QueryClient,
  personaId: string,
  id: string,
): Pick<ChallengeView, 'id' | 'title' | 'company' | 'kind'> | undefined {
  const detail = queryClient.getQueryData<ChallengeView>(qk.challenge(personaId, id));
  if (detail) return detail;
  const fromList = findChallengeInLists(queryClient, personaId, id);
  if (fromList) return fromList;
  const subs = queryClient.getQueryData<SubmissionView[]>(qk.mySubmissions(personaId));
  const sub = subs?.find((s) => s.challengeId === id);
  if (sub) return { id, title: sub.challenge.title, company: sub.challenge.company, kind: sub.challenge.kind };
  return undefined;
}
