/** In-memory state, persisted atomically (temp file + rename) to DATA_DIR/db.json after each mutation. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, DB_FILE, DB_SCHEMA, UPLOADS_DIR } from './config.ts';
import { emptyDb, type Db } from './db.ts';

let db: Db = emptyDb();

export function getDb(): Db {
  return db;
}

export function replaceDb(next: Db): void {
  db = next;
}

export function persist(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = path.join(DATA_DIR, `.db.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

/** Returns null when there is no usable db.json (missing, unreadable, or an older schema). */
export function readDbFile(): Db | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as Db;
    if (parsed?.meta?.schema !== DB_SCHEMA || !Array.isArray(parsed.challenges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const uploadPath = (submissionId: string) => path.join(UPLOADS_DIR, `${submissionId}.zip`);
export const starterPath = (challengeId: string) => path.join(UPLOADS_DIR, 'starters', `${challengeId}.zip`);

/** Atomic write of an uploaded zip. */
export function writeUpload(submissionId: string, buf: Buffer): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const dest = uploadPath(submissionId);
  const tmp = `${dest}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, dest);
}
