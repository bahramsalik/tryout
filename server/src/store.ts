/**
 * In-memory state, persisted atomically (temp file + rename) to DATA_DIR/db.json after each mutation.
 * In cloud mode (TRYOUT_S3_BUCKET set) S3 is the source of truth instead; see cloud.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cloud from './cloud.ts';
import { DATA_DIR, DB_FILE, DB_SCHEMA, UPLOADS_DIR } from './config.ts';
import { emptyDb, type Db } from './db.ts';
import { log } from './log.ts';

let db: Db = emptyDb();

export function getDb(): Db {
  return db;
}

export function replaceDb(next: Db): void {
  db = next;
}

export function persist(): void {
  if (cloud.cloudMode) {
    cloud.markDirty();
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = path.join(DATA_DIR, `.db.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

function parseDb(text: string): Db | null {
  try {
    const parsed = JSON.parse(text) as Db;
    if (parsed?.meta?.schema !== DB_SCHEMA || !Array.isArray(parsed.challenges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Returns null when there is no usable db.json (missing, unreadable, or an older schema). */
export function readDbFile(): Db | null {
  try {
    return parseDb(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return null;
  }
}

export const uploadPath = (submissionId: string) => path.join(UPLOADS_DIR, `${submissionId}.zip`);
export const starterPath = (challengeId: string) => path.join(UPLOADS_DIR, 'starters', `${challengeId}.zip`);

function writeLocal(dest: string, buf: Buffer): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, dest);
}

/** Atomic write of an uploaded zip (and, in cloud mode, queued for S3). */
export function writeUpload(submissionId: string, buf: Buffer): void {
  writeLocal(uploadPath(submissionId), buf);
  if (cloud.cloudMode) cloud.queueUpload(`${submissionId}.zip`, buf);
}

/** A submission's zip: from local disk, else (cloud mode) from S3, cached locally. Null when missing. */
export async function loadUpload(submissionId: string): Promise<Buffer | null> {
  const dest = uploadPath(submissionId);
  try {
    return fs.readFileSync(dest);
  } catch {
    if (!cloud.cloudMode) return null;
  }
  const buf = await cloud.fetchUpload(`${submissionId}.zip`);
  if (buf) writeLocal(dest, buf);
  return buf;
}

/* ───────────── cloud mode ───────────── */

/** Loads the remote db when it changed. Returns the remote db on first load, or null when S3 has none. */
export async function pullFromCloud(force = false): Promise<Db | null | 'unchanged'> {
  const text = await cloud.pullDbText(force);
  if (text === 'unchanged') return 'unchanged';
  if (text === null) return null;
  const next = parseDb(text);
  if (!next) return null;
  if (next.meta.seedId !== db.meta.seedId) {
    // Reseeded elsewhere: cached zips belong to the old data.
    fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
  }
  db = next;
  return next;
}

/** Writes pending changes to S3. False when another instance won the race (the change was dropped). */
export async function flushToCloud(): Promise<boolean> {
  if (!cloud.hasPendingWrites()) return true;
  const ok = await cloud.flush(() => JSON.stringify(db));
  if (!ok) log.warn('Reloading the latest data from S3 on the next request.');
  return ok;
}

export const hasPendingCloudWrites = () => cloud.cloudMode && cloud.hasPendingWrites();
