import type { ApiError as ApiErrorBody } from '@shared/types';

/** API origin, e.g. http://localhost:4000 (SPEC §7.3). */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000').replace(/\/+$/, '');
export const API_BASE = `${API_URL}/api`;
export const STUDENT_SITE_URL = ((import.meta.env.VITE_STUDENT_URL as string | undefined) || 'http://localhost:5173').replace(/\/+$/, '');

export const DEFAULT_PERSONA = 'emp_jordan';
const PERSONA_KEY = 'tryout.employer.persona';

function readStoredPersona(): string {
  try {
    const value = localStorage.getItem(PERSONA_KEY);
    return value && value.startsWith('emp_') ? value : DEFAULT_PERSONA;
  } catch {
    return DEFAULT_PERSONA;
  }
}

let currentPersona = readStoredPersona();

export function getPersona(): string {
  return currentPersona;
}

export function storePersona(id: string): void {
  currentPersona = id;
  try {
    localStorage.setItem(PERSONA_KEY, id);
  } catch {
    /* private mode — keep in memory only */
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Field-level details on 400 VALIDATION_ERROR / INVALID_SCORES. */
  readonly issues: { path: string; message: string }[];
  constructor(status: number, code: string, message: string, issues: { path: string; message: string }[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

type ApiInit = Omit<RequestInit, 'body'> & { json?: unknown; body?: BodyInit | null };

/** fetch wrapper: base URL, `X-Demo-User` on every request, typed JSON, `{ error: { code, message } }` → ApiError. */
export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, headers: initHeaders, body: initBody, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set('X-Demo-User', currentPersona);
  headers.set('Accept', 'application/json');
  let body: BodyInit | null | undefined = initBody;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...rest, headers, body });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK', 'Can’t reach the Tryout API. Is it running on port 4000?');
  }

  if (!res.ok) {
    let code = `HTTP_${res.status}`;
    let message = res.statusText || 'Something went wrong.';
    let issues: { path: string; message: string }[] = [];
    try {
      const data = (await res.json()) as Partial<ApiErrorBody>;
      if (data?.error) {
        code = data.error.code || code;
        message = data.error.message || message;
        issues = Array.isArray(data.error.issues) ? data.error.issues : [];
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message, issues);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Absolute URL for links that can't send headers (downloads): appends `?as=<persona>` (SPEC §7.4). */
export function urlWithPersona(path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${API_BASE}${path}${sep}as=${encodeURIComponent(currentPersona)}`;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const first = err.issues[0];
    return first && !err.message.includes(first.message) ? `${err.message} — ${first.message}` : err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
