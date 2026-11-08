import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)); // server/src

export const SERVER_ROOT = path.resolve(here, '..');
export const REPO_ROOT = path.resolve(SERVER_ROOT, '..');

export const PORT = Number(process.env.PORT ?? 4000);

/** Holds db.json and uploads/. Override with DATA_DIR (relative paths resolve against the cwd). */
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(SERVER_ROOT, 'data'));
export const DB_FILE = path.join(DATA_DIR, 'db.json');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const STARTERS_DIR = path.join(UPLOADS_DIR, 'starters');

export const CONTENT_DIR = path.join(REPO_ROOT, 'shared', 'content');
/** Override (tests only) with CONTENT_ENTRY=/abs/path/to/content.ts. */
export const CONTENT_ENTRY = process.env.CONTENT_ENTRY ? path.resolve(process.env.CONTENT_ENTRY) : path.join(CONTENT_DIR, 'index.ts');

/** Bump when the seeder's output changes in a way that should force a reseed (it is part of the content hash). */
export const SEED_VERSION = 1;
/** Bump when the db.json shape changes. */
export const DB_SCHEMA = 1;

export const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
];

/** DUMMY-AI artificial latency (ms). */
export const AI_LATENCY_MIN_MS = Number(process.env.AI_LATENCY_MIN_MS ?? 700);
export const AI_LATENCY_MAX_MS = Number(process.env.AI_LATENCY_MAX_MS ?? 1400);

/**
 * AI grading. Set these in server/.env (copy server/.env.example). With no key, grading stays on the placeholder.
 * The key is read only here and must never be logged, returned by the API or sent to the sites.
 */
export const GRADER = {
  apiKey: process.env.ANTHROPIC_API_KEY?.trim() ?? '',
  model: process.env.GRADER_MODEL?.trim() || 'claude-haiku-5-5',
  dailyLimit: Number(process.env.GRADER_DAILY_LIMIT ?? 200),
  get enabled() {
    return this.apiKey.length > 0;
  },
};

export const SSE_HEARTBEAT_MS = 15_000;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const README_MAX_BYTES = 20 * 1024;
export const PREVIEW_MAX_BYTES = 100 * 1024;
export const TREE_MAX_PATHS = 300;
