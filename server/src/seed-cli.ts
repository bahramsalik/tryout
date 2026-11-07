/**
 * `npm run seed` — reseed from shared/content.
 *
 * If an API is already running on PORT with this DATA_DIR, it is asked to reset (POST /api/admin/reset)
 * so its in-memory state and connected tabs stay in sync; otherwise db.json + uploads are written directly.
 * `--offline` always writes the files directly.
 */
import { DATA_DIR, PORT } from './config.ts';
import { contentStatus, initData } from './boot.ts';

const offline = process.argv.includes('--offline');

async function tryRunningServer(): Promise<boolean> {
  try {
    const health = (await (await fetch(`http://localhost:${PORT}/api/health`, { signal: AbortSignal.timeout(1500) })).json()) as {
      dataDir?: string;
    };
    if (health.dataDir && health.dataDir !== DATA_DIR) return false;
    const res = await fetch(`http://localhost:${PORT}/api/admin/reset`, { method: 'POST' });
    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      console.error(`✗ The running API refused to reseed: ${JSON.stringify(body)}`);
      process.exit(1);
    }
    console.log(`✓ Reseeded the running API on :${PORT} (seed ${String(body.seedId)}, ${JSON.stringify(body.counts)})`);
    return true;
  } catch {
    return false;
  }
}

if (offline || !(await tryRunningServer())) {
  await initData({ forceReseed: true });
  if (!contentStatus().ok) {
    console.error('✗ Not reseeded: the seed content is invalid (see above). The previous data was left in place.');
    process.exit(1);
  }
  console.log(`✓ Seeded ${DATA_DIR}`);
}
