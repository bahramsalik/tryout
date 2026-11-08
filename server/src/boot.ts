/** Startup data flow: load + validate content, then reuse db.json or reseed when the content hash changed. */
import type { SeedContent } from '../../shared/types.ts';
import * as cloud from './cloud.ts';
import { DB_FILE, SEED_VERSION } from './config.ts';
import { loadContent } from './content.ts';
import { HttpError } from './errors.ts';
import { log } from './log.ts';
import { buildSeed, writeSeedFiles, type SeedSummary } from './seed.ts';
import { flushToCloud, getDb, persist, pullFromCloud, readDbFile, replaceDb } from './store.ts';

let current: { content: SeedContent; hash: string } | null = null;

export interface ContentStatus {
  ok: boolean;
  hash: string | null;
  error: string | null;
  details: string[];
  warnings: string[];
  checkedAt: string;
}

let status: ContentStatus = { ok: false, hash: null, error: 'not loaded yet', details: [], warnings: [], checkedAt: new Date().toISOString() };

export const contentStatus = () => status;

export function reseed(): SeedSummary {
  if (!current) {
    throw new HttpError(503, 'CONTENT_INVALID', `Seed content is not loadable, so the data can't be reseeded: ${status.error ?? 'unknown error'}`);
  }
  const t0 = Date.now();
  const out = buildSeed(current.content, current.hash);
  writeSeedFiles(out.files);
  if (cloud.cloudMode) {
    for (const [rel, buf] of out.files) if (!rel.startsWith('starters/')) cloud.queueUpload(rel, buf);
  }
  replaceDb(out.db);
  persist();
  const s = out.summary;
  log.info(
    `Seeded in ${Date.now() - t0} ms: ${s.companies} companies, ${s.students} students (${s.backgroundStudents} generated), ` +
      `${s.challenges} challenges, ${s.participations} joins, ${s.submissions} submissions (${s.scored} scored), ${s.zips} zips`,
  );
  return s;
}

export async function initData(opts: { forceReseed?: boolean } = {}): Promise<void> {
  const loaded = await loadContent();
  if (cloud.cloudMode) return initCloudData(loaded);
  const existing = readDbFile();
  if (loaded.ok) {
    current = { content: loaded.content, hash: loaded.hash };
    status = { ok: true, hash: loaded.hash, error: null, details: [], warnings: loaded.warnings, checkedAt: new Date().toISOString() };
    if (loaded.warnings.length) {
      log.warn(`Seed content has ${loaded.warnings.length} warning(s) (run \`npm run check-content\` for the full list):`);
      for (const w of loaded.warnings.slice(0, 12)) log.warn(`  · ${w}`);
      if (loaded.warnings.length > 12) log.warn(`  · …and ${loaded.warnings.length - 12} more`);
    }
    if (!opts.forceReseed && existing && existing.meta.contentHash === loaded.hash && existing.meta.seedVersion === SEED_VERSION) {
      replaceDb(existing);
      log.info(`Loaded ${DB_FILE} (seeded ${existing.meta.seededAt}, seed ${existing.meta.seedId})`);
      return;
    }
    log.info(
      opts.forceReseed ? 'Reseeding (requested)…' : existing ? 'Seed content changed → reseeding…' : 'No db.json yet → seeding…',
    );
    reseed();
    return;
  }

  status = { ok: false, hash: null, error: loaded.error, details: loaded.details, warnings: [], checkedAt: new Date().toISOString() };
  log.error('──────────────────────────────────────────────────────────────');
  log.error(`SEED CONTENT ERROR: ${loaded.error}`);
  for (const d of loaded.details.slice(0, 20)) log.error(`  · ${d}`);
  if (existing) {
    replaceDb(existing);
    log.error(`Keeping the previous data (seeded ${existing.meta.seededAt}). Fix shared/content and the API reloads on save.`);
  } else {
    log.error('No previous db.json either: serving an EMPTY dataset until shared/content is fixed.');
  }
  log.error('──────────────────────────────────────────────────────────────');
}

/** Cloud mode: S3 is the source of truth. Seed it only when it is empty or on older content. */
async function initCloudData(loaded: Awaited<ReturnType<typeof loadContent>>): Promise<void> {
  const remote = await pullFromCloud(true);
  if (!loaded.ok) {
    status = { ok: false, hash: null, error: loaded.error, details: loaded.details, warnings: [], checkedAt: new Date().toISOString() };
    log.error(`SEED CONTENT ERROR: ${loaded.error}`);
    return;
  }
  current = { content: loaded.content, hash: loaded.hash };
  status = { ok: true, hash: loaded.hash, error: null, details: [], warnings: loaded.warnings, checkedAt: new Date().toISOString() };
  if (remote && remote !== 'unchanged' && remote.meta.contentHash === loaded.hash && remote.meta.seedVersion === SEED_VERSION) {
    log.info(`Loaded s3://${cloud.CLOUD_BUCKET}/db.json (seeded ${remote.meta.seededAt}, seed ${remote.meta.seedId})`);
    return;
  }
  log.info(remote ? 'Seed content changed → reseeding S3…' : 'S3 is empty → seeding…');
  reseed();
  if (!(await flushToCloud())) {
    // Another instance seeded at the same moment: use theirs.
    await pullFromCloud(true);
    log.info('Another instance seeded first; using its data.');
  }
}

export function dataSummary() {
  const db = getDb();
  return {
    seededAt: db.meta.seededAt,
    seedId: db.meta.seedId,
    contentHash: db.meta.contentHash.slice(0, 12),
    counts: {
      companies: db.companies.length,
      employers: db.employers.length,
      students: db.students.length,
      challenges: db.challenges.length,
      participations: db.participations.length,
      submissions: db.submissions.length,
      notifications: db.notifications.length,
      invites: db.invites.length,
    },
  };
}
