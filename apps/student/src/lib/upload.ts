import type { SubmissionView } from '@shared/types';
import { API_BASE, ApiError, getPersona } from './api';

export interface SubmitInput {
  file: File;
  notes: string;
  demoUrl?: string;
  aiDisclosure?: string;
}

export interface UploadHandle {
  promise: Promise<SubmissionView>;
  abort: () => void;
}

/**
 * Multipart upload with XMLHttpRequest so we get real upload progress events.
 * `onProgress` receives 0..1 for the request body; the server still has to parse the zip afterwards.
 */
export function uploadSubmission(challengeId: string, input: SubmitInput, onProgress: (fraction: number) => void): UploadHandle {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<SubmissionView>((resolve, reject) => {
    const form = new FormData();
    form.append('file', input.file, input.file.name);
    form.append('notes', input.notes);
    if (input.demoUrl) form.append('demoUrl', input.demoUrl);
    if (input.aiDisclosure) form.append('aiDisclosure', input.aiDisclosure);

    xhr.open('POST', `${API_BASE}/challenges/${encodeURIComponent(challengeId)}/submissions`);
    xhr.setRequestHeader('X-Demo-User', getPersona());
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.responseType = 'text';

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(Math.min(1, e.loaded / e.total));
    };
    xhr.upload.onload = () => onProgress(1);

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as SubmissionView);
        return;
      }
      const err = (body as { error?: { code?: string; message?: string } } | null)?.error;
      reject(new ApiError(err?.code ?? `HTTP_${xhr.status}`, err?.message ?? xhr.statusText ?? 'Upload failed', xhr.status));
    };
    xhr.onerror = () => reject(new ApiError('NETWORK', "Can't reach the Tryout API", 0));
    xhr.onabort = () => reject(new ApiError('ABORTED', 'Upload cancelled', 0));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

/** Client-side zip check: extension + `PK` magic bytes (local file header, empty archive or spanned marker). */
export async function looksLikeZip(file: File): Promise<boolean> {
  if (!/\.zip$/i.test(file.name)) return false;
  try {
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (head.length < 4) return false;
    if (head[0] !== 0x50 || head[1] !== 0x4b) return false;
    const sig = (head[2] << 8) | head[3];
    return sig === 0x0304 || sig === 0x0506 || sig === 0x0708;
  } catch {
    return false;
  }
}
