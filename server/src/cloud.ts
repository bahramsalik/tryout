/**
 * Cloud mode (AWS Lambda): set TRYOUT_S3_BUCKET and the API keeps db.json and uploaded zips in S3
 * instead of on local disk, so every Lambda instance serves the same data.
 *
 * - Each request first pulls db.json if it changed (conditional GET on the ETag, usually a 304).
 * - Mutations mark the db dirty; the write happens before the response is sent (see app.ts), with
 *   If-Match on the ETag so two instances can never silently overwrite each other.
 * - Live events are appended to db.events and the SSE endpoint replays them (see events.ts).
 *
 * Local dev never imports the AWS SDK: everything here is a no-op unless cloudMode is true.
 */
import type { S3Client } from '@aws-sdk/client-s3';
import { log } from './log.ts';

export const CLOUD_BUCKET = process.env.TRYOUT_S3_BUCKET ?? '';
export const cloudMode = CLOUD_BUCKET !== '';

const DB_KEY = 'db.json';
const uploadKey = (rel: string) => `uploads/${rel}`;

let client: Promise<{ s3: S3Client; sdk: typeof import('@aws-sdk/client-s3') }> | null = null;
function s3() {
  client ??= import('@aws-sdk/client-s3').then((sdk) => ({ sdk, s3: new sdk.S3Client({}) }));
  return client;
}

let etag: string | null = null;
let dirty = false;
const pendingUploads = new Map<string, Buffer>();

const status = (err: unknown) => (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;

/** Returns the remote db text when it changed since the last pull, 'unchanged', or null when missing. */
export async function pullDbText(force = false): Promise<string | 'unchanged' | null> {
  const { s3: c, sdk } = await s3();
  try {
    const out = await c.send(new sdk.GetObjectCommand({ Bucket: CLOUD_BUCKET, Key: DB_KEY, IfNoneMatch: force ? undefined : (etag ?? undefined) }));
    const text = await out.Body!.transformToString('utf8');
    etag = out.ETag ?? null;
    return text;
  } catch (err) {
    const code = status(err);
    if (code === 304) return 'unchanged';
    if (code === 404 || (err as { name?: string }).name === 'NoSuchKey') {
      etag = null;
      return null;
    }
    throw err;
  }
}

export function markDirty(): void {
  dirty = true;
}

export function queueUpload(rel: string, buf: Buffer): void {
  pendingUploads.set(rel, buf);
}

export const hasPendingWrites = () => dirty || pendingUploads.size > 0;

/** Forget the cached ETag so the next pull downloads db.json in full (after a lost write). */
export function forgetEtag(): void {
  etag = null;
  dirty = false;
}

/**
 * Writes queued uploads, then db.json. Returns false when another instance saved first (412), in which
 * case this instance's in-memory db is stale and the next pull replaces it.
 */
export async function flush(serialize: () => string): Promise<boolean> {
  const { s3: c, sdk } = await s3();
  const uploads = [...pendingUploads];
  pendingUploads.clear();
  for (let i = 0; i < uploads.length; i += 16) {
    await Promise.all(
      uploads.slice(i, i + 16).map(([rel, buf]) =>
        c.send(new sdk.PutObjectCommand({ Bucket: CLOUD_BUCKET, Key: uploadKey(rel), Body: buf, ContentType: 'application/zip' })),
      ),
    );
  }
  if (!dirty) return true;
  dirty = false;
  try {
    const out = await c.send(
      new sdk.PutObjectCommand({
        Bucket: CLOUD_BUCKET,
        Key: DB_KEY,
        Body: serialize(),
        ContentType: 'application/json',
        ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
      }),
    );
    etag = out.ETag ?? null;
    return true;
  } catch (err) {
    const code = status(err);
    if (code === 412 || code === 409) {
      log.warn('db.json was saved by another instance at the same moment; this write was dropped.');
      forgetEtag();
      return false;
    }
    throw err;
  }
}

export async function fetchUpload(rel: string): Promise<Buffer | null> {
  const { s3: c, sdk } = await s3();
  try {
    const out = await c.send(new sdk.GetObjectCommand({ Bucket: CLOUD_BUCKET, Key: uploadKey(rel) }));
    return Buffer.from(await out.Body!.transformToByteArray());
  } catch (err) {
    if (status(err) === 404 || (err as { name?: string }).name === 'NoSuchKey') return null;
    throw err;
  }
}
