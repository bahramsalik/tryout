/** An error that becomes `{ error: { code, message, issues? } }` with the given HTTP status. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: { path: string; message: string }[];

  constructor(status: number, code: string, message: string, issues?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

export const badRequest = (code: string, message: string, issues?: { path: string; message: string }[]) =>
  new HttpError(400, code, message, issues);
export const unauthorized = (code: string, message: string) => new HttpError(401, code, message);
export const forbidden = (code: string, message: string) => new HttpError(403, code, message);
export const notFound = (code: string, message: string) => new HttpError(404, code, message);
export const conflict = (code: string, message: string) => new HttpError(409, code, message);
