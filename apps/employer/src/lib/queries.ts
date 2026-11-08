import { QueryClient, useQuery, keepPreviousData } from '@tanstack/react-query';
import type {
  ChallengeView,
  ChallengeType,
  EmployerDashboard,
  FilePreview,
  Me,
  Notification,
  Personas,
  StudentListItem,
  StudentProfile,
  SubmissionView,
} from '@shared/types';
import { api, ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't hammer the API on client errors; do retry network blips a couple of times.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

/** Query keys. Persona switches clear the whole cache, so keys don't include the persona. */
export const qk = {
  health: ['health'] as const,
  personas: ['personas'] as const,
  me: ['me'] as const,
  dashboard: ['dashboard'] as const,
  challenge: (id: string) => ['challenge', id] as const,
  submissions: (challengeId: string) => ['submissions', challengeId] as const,
  leaderboard: (challengeId: string) => ['leaderboard', challengeId] as const,
  submission: (id: string) => ['submission', id] as const,
  file: (submissionId: string, path: string) => ['file', submissionId, path] as const,
  students: (params: StudentQuery) => ['students', params] as const,
  studentsAll: ['students'] as const,
  student: (idOrHandle: string) => ['student', idOrHandle] as const,
  notifications: ['notifications'] as const,
};

export function useHealth() {
  return useQuery({
    queryKey: qk.health,
    queryFn: () => api<{ ok: boolean; seedId?: string }>('/health'),
    staleTime: 60_000,
  });
}

export function usePersonas() {
  return useQuery({ queryKey: qk.personas, queryFn: () => api<Personas>('/personas'), staleTime: 5 * 60_000 });
}

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: () => api<Me>('/me') });
}

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: () => api<EmployerDashboard>('/employer/dashboard') });
}

export function useChallenge(id: string | undefined) {
  return useQuery({
    queryKey: qk.challenge(id ?? ''),
    queryFn: () => api<ChallengeView>(`/challenges/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useSubmissions(challengeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.submissions(challengeId ?? ''),
    queryFn: () => api<SubmissionView[]>(`/challenges/${encodeURIComponent(challengeId!)}/submissions`),
    enabled: !!challengeId && enabled,
  });
}

export function useLeaderboard(challengeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.leaderboard(challengeId ?? ''),
    queryFn: () => api<SubmissionView[]>(`/challenges/${encodeURIComponent(challengeId!)}/leaderboard`),
    enabled: !!challengeId && enabled,
  });
}

export function useSubmission(id: string | undefined) {
  return useQuery({
    queryKey: qk.submission(id ?? ''),
    queryFn: () => api<SubmissionView>(`/submissions/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useFilePreview(submissionId: string | undefined, path: string | null) {
  return useQuery({
    queryKey: qk.file(submissionId ?? '', path ?? ''),
    queryFn: () =>
      api<FilePreview>(`/submissions/${encodeURIComponent(submissionId!)}/file?path=${encodeURIComponent(path!)}`),
    enabled: !!submissionId && !!path,
    staleTime: Infinity,
  });
}

export interface StudentQuery {
  q?: string;
  type?: ChallengeType | '';
  minScore?: number;
  openToWork?: boolean;
  sort?: 'hours' | 'score' | 'placements';
}

export function useStudents(params: StudentQuery) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.type) search.set('type', params.type);
  if (params.minScore) search.set('minScore', String(params.minScore));
  if (params.openToWork) search.set('openToWork', 'true');
  if (params.sort) search.set('sort', params.sort);
  const qs = search.toString();
  return useQuery({
    queryKey: qk.students(params),
    queryFn: () => api<StudentListItem[]>(`/students${qs ? `?${qs}` : ''}`),
    placeholderData: keepPreviousData,
  });
}

export function useStudent(idOrHandle: string | undefined) {
  return useQuery({
    queryKey: qk.student(idOrHandle ?? ''),
    queryFn: () => api<StudentProfile>(`/students/${encodeURIComponent(idOrHandle!)}`),
    enabled: !!idOrHandle,
  });
}

export function useNotifications() {
  return useQuery({ queryKey: qk.notifications, queryFn: () => api<Notification[]>('/notifications') });
}

/** Sorts scored submissions like the server: total desc, ties to the earlier submission. */
export function rankSubmissions(subs: SubmissionView[]): SubmissionView[] {
  return [...subs]
    .filter((s) => s.totalScore != null)
    .sort((a, b) => {
      if (a.rank != null && b.rank != null && a.rank !== b.rank) return a.rank - b.rank;
      const diff = (b.totalScore ?? 0) - (a.totalScore ?? 0);
      if (diff !== 0) return diff;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });
}

export function isScored(s: Pick<SubmissionView, 'totalScore' | 'status'>): boolean {
  return s.totalScore != null || s.status !== 'submitted';
}
