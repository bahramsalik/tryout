import type {
  ChallengeView,
  CoachRequest,
  CoachResponse,
  Me,
  Notification,
  Personas,
  StudentProfile,
  SubmissionView,
} from '@shared/types';

export const API_URL = String(import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
export const API_BASE = `${API_URL}/api`;

export const PERSONA_STORAGE_KEY = 'tryout.student.persona';
export const DEFAULT_PERSONA = 'stu_maya';

/* ───────────── Current persona (module-level so non-React code can read it) ───────────── */

function readStoredPersona(): string {
  try {
    const stored = localStorage.getItem(PERSONA_STORAGE_KEY);
    if (stored && stored.startsWith('stu_')) return stored;
  } catch {
    /* private mode etc. */
  }
  return DEFAULT_PERSONA;
}

let currentPersona = readStoredPersona();

export function getPersona(): string {
  return currentPersona;
}

export function setPersona(id: string) {
  currentPersona = id;
  try {
    localStorage.setItem(PERSONA_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/* ─────────────────────────────── Errors ─────────────────────────────── */

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** Friendly copy for known error codes (falls back to the server message). */
const FRIENDLY: Record<string, string> = {
  NETWORK: "Can't reach the Tryout API. Is it running on :4000?",
  CAP_REACHED: 'All spots for this challenge are taken.',
  ALREADY_JOINED: "You've already joined this challenge.",
  CLOSED: 'This challenge is closed to new work.',
  NOT_ZIP: 'That file is not a valid .zip archive.',
  NOTES_TOO_SHORT: 'Approach notes need at least 50 characters.',
  FILE_TOO_LARGE: 'That zip is larger than 50 MB.',
  NOT_JOINED: 'Join the challenge before submitting.',
  ALREADY_SUBMITTED: "You've already submitted to this challenge.",
  NO_PERSONA: 'Pick a student persona first.',
  WRONG_ROLE: 'That action is for a different kind of account.',
  NOT_FOUND: "We couldn't find that.",
};

export function errorMessage(err: unknown): string {
  if (isApiError(err)) return FRIENDLY[err.code] ?? err.message ?? 'Something went wrong.';
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

export async function parseError(res: Response): Promise<ApiError> {
  let code = `HTTP_${res.status}`;
  let message = res.statusText || 'Request failed';
  try {
    const body = await res.json();
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
    }
  } catch {
    /* not JSON */
  }
  if (res.status === 404 && code.startsWith('HTTP_')) code = 'NOT_FOUND';
  return new ApiError(code, message, res.status);
}

/* ─────────────────────────────── Fetch ─────────────────────────────── */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Demo-User': currentPersona, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ApiError('NETWORK', "Can't reach the Tryout API", 0);
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

/** URL for things fetched without headers (downloads, <a href>): identity goes in `?as=`. */
export function downloadUrl(path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${API_BASE}${path}${sep}as=${encodeURIComponent(currentPersona)}`;
}

/* ─────────────────────────────── Endpoints ─────────────────────────────── */

export const api = {
  personas: (signal?: AbortSignal) => request<Personas>('/personas', { signal }),
  me: (signal?: AbortSignal) => request<Me>('/me', { signal }),
  challenges: (params: { kind?: string; type?: string; status?: string; q?: string; sort?: string } = {}, signal?: AbortSignal) =>
    request<ChallengeView[]>(`/challenges${qs(params)}`, { signal }),
  challenge: (id: string, signal?: AbortSignal) => request<ChallengeView>(`/challenges/${encodeURIComponent(id)}`, { signal }),
  join: (id: string) => request<ChallengeView>(`/challenges/${encodeURIComponent(id)}/join`, { method: 'POST' }),
  leaderboard: (id: string, signal?: AbortSignal) =>
    request<SubmissionView[]>(`/challenges/${encodeURIComponent(id)}/leaderboard`, { signal }),
  submission: (id: string, signal?: AbortSignal) => request<SubmissionView>(`/submissions/${encodeURIComponent(id)}`, { signal }),
  mySubmissions: (signal?: AbortSignal) => request<SubmissionView[]>('/me/submissions', { signal }),
  student: (idOrHandle: string, signal?: AbortSignal) =>
    request<StudentProfile>(`/students/${encodeURIComponent(idOrHandle)}`, { signal }),
  notifications: (signal?: AbortSignal) => request<Notification[]>('/notifications', { signal }),
  readAllNotifications: () => request<{ ok: true }>('/notifications/read-all', { method: 'POST' }),
  coach: (input: CoachRequest) => request<CoachResponse>('/ai/coach', { method: 'POST', body: input }),
};

export const starterKitUrl = (challengeId: string) => downloadUrl(`/challenges/${encodeURIComponent(challengeId)}/starter`);
export const submissionDownloadUrl = (submissionId: string) =>
  downloadUrl(`/submissions/${encodeURIComponent(submissionId)}/download`);
export const eventsUrl = () => `${API_BASE}/events?as=${encodeURIComponent(currentPersona)}`;
