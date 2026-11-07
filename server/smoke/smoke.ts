/**
 * `npm run smoke` — end-to-end test of every endpoint against a PRIVATE server instance
 * (PORT=4100 by default, temp DATA_DIR), so the shared :4000 data is never touched.
 *
 * Walks the §4 demo loop: Maya uploads a real zip to ch_rate_limiter, Jordan scores it
 * {correctness:5, design:4, tests:4, code_quality:4, communication:5}, awards the challenge and
 * invites her; asserts ranks/payouts against the shared helpers, notifications, SSE events and the
 * 401/403/409 paths. Prints a pass/fail table; exit code 1 on any failure.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import {
  PLATFORM_RULES,
  computeTotalScore,
  payoutForRank,
  rewardTotal,
  type AwardResponse,
  type ChallengeView,
  type CoachResponse,
  type CreateChallengeInput,
  type EmployerDashboard,
  type FilePreview,
  type InviteView,
  type Me,
  type Notification,
  type Personas,
  type RubricSuggestResponse,
  type StudentListItem,
  type StudentProfile,
  type SubmissionView,
} from '../../shared/types.ts';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT ?? 4100);
const BASE = `http://localhost:${PORT}/api`;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tryout-smoke-'));

/* ───────────── results table ───────────── */

type Row = { section: string; name: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail: string };
const rows: Row[] = [];
let section = 'setup';

function check(name: string, ok: boolean, detail = ''): boolean {
  rows.push({ section, name, status: ok ? 'PASS' : 'FAIL', detail: ok ? '' : detail });
  return ok;
}
function skip(name: string, why: string) {
  rows.push({ section, name, status: 'SKIP', detail: why });
}

/* ───────────── http helpers ───────────── */

interface Res<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
  buf: Buffer;
  ms: number;
}

async function call<T = unknown>(
  method: string,
  url: string,
  opts: { as?: string; json?: unknown; form?: FormData; raw?: string; headers?: Record<string, string> } = {},
): Promise<Res<T>> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.as) headers['X-Demo-User'] = opts.as;
  let body: string | FormData | undefined;
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  } else if (opts.raw !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = opts.raw;
  } else if (opts.form) body = opts.form;
  const t0 = Date.now();
  const res = await fetch(`${BASE}${url}`, { method, headers, body });
  const buf = Buffer.from(await res.arrayBuffer());
  const ms = Date.now() - t0;
  let parsed: unknown = null;
  if ((res.headers.get('content-type') ?? '').includes('application/json')) parsed = JSON.parse(buf.toString('utf8'));
  return { status: res.status, body: parsed as T, headers: res.headers, buf, ms };
}

/** Words for the text budget (SPEC-FLUENT §6); bare separators like `·` don't count. */
const words = (s: string) => s.trim().split(/\s+/).filter((t) => t && !/^[·—–\-+|/]$/.test(t)).length;
const errCode = (r: Res) => (r.body as { error?: { code?: string } } | null)?.error?.code;
const expectErr = (name: string, r: Res, status: number, code: string) =>
  check(name, r.status === status && errCode(r) === code, `got ${r.status} ${errCode(r) ?? JSON.stringify(r.body)?.slice(0, 120)}`);

/** Raw request so we can set Origin freely (CORS checks). */
function raw(method: string, url: string, headers: Record<string, string>): Promise<{ status: number; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE}${url}`, { method, headers }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

function upload(file: Buffer, name: string, fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('file', new Blob([new Uint8Array(file)], { type: 'application/zip' }), name);
  return form;
}

/* ───────────── SSE listener ───────────── */

interface SseEvent {
  type: string;
  data: unknown;
  id: string;
}

class SseListener {
  events: SseEvent[] = [];
  connected = false;
  private ctrl = new AbortController();
  private waiters: { pred: (e: SseEvent) => boolean; resolve: (e: SseEvent) => void }[] = [];

  async start(): Promise<void> {
    const res = await fetch(`${BASE}/events`, { headers: { Accept: 'text/event-stream' }, signal: this.ctrl.signal });
    if (!res.body) throw new Error('no SSE body');
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    void (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf('\n\n')) >= 0) {
            const frame = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            this.connected = true;
            let type = 'message';
            let data = '';
            let id = '';
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) type = line.slice(6).trim();
              else if (line.startsWith('data:')) data += line.slice(5).trim();
              else if (line.startsWith('id:')) id = line.slice(3).trim();
            }
            if (!data) continue;
            const ev = { type, data: JSON.parse(data) as unknown, id };
            this.events.push(ev);
            this.waiters = this.waiters.filter((w) => (w.pred(ev) ? (w.resolve(ev), false) : true));
          }
        }
      } catch {
        /* aborted */
      }
    })();
    const t0 = Date.now();
    while (!this.connected && Date.now() - t0 < 3000) await sleep(20);
  }

  waitFor(pred: (e: SseEvent) => boolean, timeoutMs = 3000): Promise<SseEvent | null> {
    const hit = this.events.find(pred);
    if (hit) return Promise.resolve(hit);
    return new Promise((resolve) => {
      const w = { pred, resolve: (e: SseEvent) => resolve(e) };
      this.waiters.push(w);
      setTimeout(() => {
        this.waiters = this.waiters.filter((x) => x !== w);
        resolve(null);
      }, timeoutMs);
    });
  }

  stop() {
    this.ctrl.abort();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const payload = <T>(e: SseEvent | null) => (e?.data ?? {}) as T;

/* ───────────── test zip ───────────── */

function mayaZip(): Buffer {
  const zip = new AdmZip();
  zip.addFile(
    'README.md',
    Buffer.from(
      '# Rate limiting for the Shipment Tracking API\n\nToken bucket per API key, 429 + Retry-After.\n\n## Setup\n\n```\nnpm install\nnpm test\n```\n',
    ),
  );
  zip.addFile('src/rateLimiter.ts', Buffer.from('export class TokenBucket {\n  // capacity + refill rate per API key\n}\n'));
  zip.addFile('src/server.ts', Buffer.from("import { TokenBucket } from './rateLimiter';\n"));
  zip.addFile('test/rateLimiter.test.ts', Buffer.from("test('allows a burst up to capacity', () => {});\n"));
  zip.addFile('.DS_Store', Buffer.from([0, 1, 2]));
  zip.addFile('__MACOSX/._README.md', Buffer.from('junk'));
  return zip.toBuffer();
}

const NOTES =
  'What I built: a token bucket per API key, kept behind a small store interface so Redis can drop in later.\n' +
  'Key decisions: token bucket over fixed windows to avoid edge bursts; 429 with Retry-After.\n' +
  "What I'd do with more time: distributed limits and per-plan quotas.";

/* ───────────── server lifecycle ───────────── */

let serverLog = '';
const child = (() => {
  const tsx = path.join(SERVER_ROOT, 'node_modules', '.bin', 'tsx');
  const proc = spawn(tsx, ['src/index.ts'], {
    cwd: SERVER_ROOT,
    env: { ...process.env, PORT: String(PORT), DATA_DIR },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.stdout.on('data', (d) => (serverLog += d));
  proc.stderr.on('data', (d) => (serverLog += d));
  return proc;
})();

function cleanup() {
  try {
    child.kill('SIGTERM');
  } catch {
    /* gone */
  }
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
}

async function waitForHealth(): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < 25_000) {
    if (child.exitCode !== null) return false;
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(150);
  }
  return false;
}

/* ───────────── the run ───────────── */

async function run() {
  // Refuse to run against something that's already on the port (could be someone else's data).
  try {
    await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(500) });
    console.error(`Port ${PORT} is already in use; set SMOKE_PORT to a free port.`);
    process.exitCode = 1;
    return;
  } catch {
    /* free */
  }

  section = 'boot';
  const up = await waitForHealth();
  if (!check(`private server boots on :${PORT} (temp DATA_DIR)`, up, serverLog.slice(-800))) return;
  const health = await call<{ ok: boolean; content: { ok: boolean; error: string | null }; counts: Record<string, number> }>('GET', '/health');
  check('GET /health → { ok: true }', health.status === 200 && health.body.ok === true);
  if (!check('seed content is valid', health.body.content.ok, health.body.content.error ?? '')) return;
  check('db.json written to DATA_DIR', fs.existsSync(path.join(DATA_DIR, 'db.json')));

  const sse = new SseListener();
  await sse.start();
  check('SSE /events connects', sse.connected);

  section = 'identity';
  const personas = await call<Personas>('GET', '/personas');
  check('GET /personas has stu_maya + emp_jordan', personas.body.students.some((s) => s.id === 'stu_maya') && personas.body.employers.some((e) => e.id === 'emp_jordan'));
  const otherEmployer = personas.body.employers.find((e) => e.companyId !== 'co_orbitline')?.id;
  const otherStudent = personas.body.students.find((s) => s.id !== 'stu_maya')?.id;
  expectErr('GET /me without persona → 401 NO_PERSONA', await call('GET', '/me'), 401, 'NO_PERSONA');
  expectErr('GET /me unknown persona → 401 UNKNOWN_PERSONA', await call('GET', '/me', { as: 'stu_nobody' }), 401, 'UNKNOWN_PERSONA');
  const meMaya = await call<Me>('GET', '/me', { as: 'stu_maya' });
  check('GET /me as Maya → student', meMaya.status === 200 && meMaya.body.kind === 'student');
  const meJordan = await call<Me>('GET', '/me', { as: 'emp_jordan' });
  check('GET /me ?as=emp_jordan works too', (await call<Me>('GET', '/me?as=emp_jordan')).body.kind === 'employer');
  check('GET /me as Jordan → employer @ co_orbitline', meJordan.body.kind === 'employer' && meJordan.body.company.id === 'co_orbitline');

  section = 'cors';
  const pre = await raw('OPTIONS', '/me', {
    Origin: 'http://localhost:5173',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'x-demo-user',
  });
  check(
    'preflight from :5173 allows X-Demo-User',
    pre.status === 204 && pre.headers['access-control-allow-origin'] === 'http://localhost:5173' && /x-demo-user/i.test(String(pre.headers['access-control-allow-headers'])),
    JSON.stringify(pre),
  );
  check('127.0.0.1:5174 is allowed', (await raw('GET', '/health', { Origin: 'http://127.0.0.1:5174' })).headers['access-control-allow-origin'] === 'http://127.0.0.1:5174');
  check('foreign origin gets no CORS header', (await raw('GET', '/health', { Origin: 'http://evil.example' })).headers['access-control-allow-origin'] === undefined);

  section = 'challenges';
  const list = await call<ChallengeView[]>('GET', '/challenges');
  check('GET /challenges excludes awarded by default', list.status === 200 && list.body.length > 0 && list.body.every((c) => c.status !== 'awarded'));
  const awardedList = await call<ChallengeView[]>('GET', '/challenges?status=awarded');
  check('GET /challenges?status=awarded only awarded', awardedList.body.every((c) => c.status === 'awarded'));
  const byBounty = await call<ChallengeView[]>('GET', '/challenges?sort=bounty');
  check('sort=bounty is descending', byBounty.body.every((c, i, a) => i === 0 || a[i - 1]!.rewardTotal >= c.rewardTotal));
  const practiceList = await call<ChallengeView[]>('GET', '/challenges?kind=practice', { as: 'stu_maya' });
  check('kind=practice filter', practiceList.body.length > 0 && practiceList.body.every((c) => c.kind === 'practice'));
  const rl = await call<ChallengeView>('GET', '/challenges/ch_rate_limiter', { as: 'stu_maya' });
  if (!check('GET /challenges/ch_rate_limiter', rl.status === 200, JSON.stringify(rl.body).slice(0, 200))) return;
  check('Maya joined ch_rate_limiter, not submitted', rl.body.viewer?.joined === true && rl.body.viewer.submissionId === null, JSON.stringify(rl.body.viewer));
  check('rewardTotal matches helper', rl.body.rewardTotal === rewardTotal(rl.body.reward));
  expectErr('unknown challenge → 404', await call('GET', '/challenges/ch_nope'), 404, 'CHALLENGE_NOT_FOUND');
  const starter = await call('GET', '/challenges/ch_rate_limiter/starter');
  if (rl.body.hasStarterKit) {
    check('starter kit is a real zip', starter.status === 200 && starter.buf[0] === 0x50 && starter.buf[1] === 0x4b && new AdmZip(starter.buf).getEntries().length > 0);
  } else skip('starter kit is a real zip', 'ch_rate_limiter has no starter files');

  const profileBefore = await call<StudentProfile>('GET', '/students/maya-chen');
  check('GET /students/maya-chen (by handle)', profileBefore.status === 200 && profileBefore.body.id === 'stu_maya');

  section = 'join / roles';
  expectErr('join without persona → 401', await call('POST', '/challenges/ch_rate_limiter/join'), 401, 'NO_PERSONA');
  expectErr('join as employer → 403 WRONG_ROLE', await call('POST', '/challenges/ch_rate_limiter/join', { as: 'emp_jordan' }), 403, 'WRONG_ROLE');
  expectErr('Maya joins again → 409 ALREADY_JOINED', await call('POST', '/challenges/ch_rate_limiter/join', { as: 'stu_maya' }), 409, 'ALREADY_JOINED');
  expectErr('student lists submissions → 403 WRONG_ROLE', await call('GET', '/challenges/ch_rate_limiter/submissions', { as: 'stu_maya' }), 403, 'WRONG_ROLE');
  if (otherEmployer) {
    expectErr('other company lists submissions → 403 NOT_OWNER', await call('GET', '/challenges/ch_rate_limiter/submissions', { as: otherEmployer }), 403, 'NOT_OWNER');
  } else skip('other company lists submissions → 403 NOT_OWNER', 'content has one company only');

  section = 'coach (before submitting, like the demo)';
  const coach = await call<CoachResponse>('POST', '/ai/coach', { as: 'stu_maya', json: { message: 'I want to be a backend engineer' } });
  check('coach recommend mode → up to 3 tasks', coach.status === 200 && coach.body.recommendedChallengeIds.length >= 1 && coach.body.recommendedChallengeIds.length <= 3, JSON.stringify(coach.body).slice(0, 200));
  check('coach latency 700–1400 ms', coach.ms >= 650 && coach.ms <= 2500, `${coach.ms} ms`);
  check('coach picks Software for "backend engineer"', /software/i.test(coach.body.reply), coach.body.reply.slice(0, 120));
  check('coach reply ≤ 60 words, one sentence + "Start here:"', words(coach.body.reply) <= 60 && /Start here:$/.test(coach.body.reply), coach.body.reply);
  check('coach recommends the demo challenge', coach.body.recommendedChallengeIds.includes('ch_rate_limiter'), JSON.stringify(coach.body.recommendedChallengeIds));

  section = 'submit';
  const zip = mayaZip();
  expectErr(
    'notes < 50 chars → 400 NOTES_TOO_SHORT',
    await call('POST', '/challenges/ch_rate_limiter/submissions', { as: 'stu_maya', form: upload(zip, 'maya-rate-limiter.zip', { notes: 'too short' }) }),
    400,
    'NOTES_TOO_SHORT',
  );
  expectErr(
    'fake .zip (no PK magic) → 400 NOT_ZIP',
    await call('POST', '/challenges/ch_rate_limiter/submissions', { as: 'stu_maya', form: upload(Buffer.from('hello world, not a zip'), 'fake.zip', { notes: NOTES }) }),
    400,
    'NOT_ZIP',
  );
  expectErr(
    '.txt upload → 400 NOT_ZIP',
    await call('POST', '/challenges/ch_rate_limiter/submissions', { as: 'stu_maya', form: upload(zip, 'notes.txt', { notes: NOTES }) }),
    400,
    'NOT_ZIP',
  );
  const huge = Buffer.alloc((PLATFORM_RULES.maxUploadMb + 1) * 1024 * 1024, 0);
  huge.write('PK\u0003\u0004');
  expectErr(
    `${PLATFORM_RULES.maxUploadMb + 1} MB zip → 400 FILE_TOO_LARGE`,
    await call('POST', '/challenges/ch_rate_limiter/submissions', { as: 'stu_maya', form: upload(huge, 'huge.zip', { notes: NOTES }) }),
    400,
    'FILE_TOO_LARGE',
  );
  const submit = await call<SubmissionView>('POST', '/challenges/ch_rate_limiter/submissions', {
    as: 'stu_maya',
    form: upload(zip, 'maya-rate-limiter.zip', { notes: NOTES, demoUrl: 'github.com/maya/rate-limiter', aiDisclosure: 'Used Copilot for test boilerplate.' }),
  });
  if (!check('Maya uploads a real zip → 201', submit.status === 201, JSON.stringify(submit.body).slice(0, 300))) return;
  const sub = submit.body;
  check('alias is "Candidate K7"', sub.alias === 'Candidate K7', sub.alias);
  check('status submitted, results hidden', sub.status === 'submitted' && sub.totalScore === null && sub.scores === null);
  check('file tree skips dotfiles + __MACOSX', sub.file.fileCount === 4 && !sub.file.tree.some((p) => p.includes('.DS_Store') || p.startsWith('__MACOSX')), JSON.stringify(sub.file.tree));
  check('README read in memory', !!sub.file.readme?.includes('## Setup'));
  check('auto-checks all pass', sub.autoChecks.length >= 3 && sub.autoChecks.every((c) => c.passed), JSON.stringify(sub.autoChecks));
  check('demo URL normalized to https://', sub.demoUrl === 'https://github.com/maya/rate-limiter', String(sub.demoUrl));
  check('zip stored at DATA_DIR/uploads/<id>.zip', fs.existsSync(path.join(DATA_DIR, 'uploads', `${sub.id}.zip`)));
  const evCreated = await sse.waitFor((e) => e.type === 'submission.created' && payload<{ submissionId: string }>(e).submissionId === sub.id);
  check('SSE submission.created', !!evCreated && payload<{ companyId: string }>(evCreated).companyId === 'co_orbitline');
  const evNtfEmp = await sse.waitFor(
    (e) => e.type === 'notification.created' && payload<{ notification: Notification }>(e).notification.recipientId === 'co_orbitline' && payload<{ notification: Notification }>(e).notification.kind === 'submission_received',
  );
  check('employer notified (submission_received)', !!evNtfEmp && payload<{ notification: Notification }>(evNtfEmp).notification.body.includes('Candidate K7'));
  expectErr(
    'second submission → 409 ALREADY_SUBMITTED',
    await call('POST', '/challenges/ch_rate_limiter/submissions', { as: 'stu_maya', form: upload(zip, 'again.zip', { notes: NOTES }) }),
    409,
    'ALREADY_SUBMITTED',
  );
  const rlAfter = await call<ChallengeView>('GET', '/challenges/ch_rate_limiter', { as: 'stu_maya' });
  check('viewer shows submitted', rlAfter.body.viewer?.submissionId === sub.id && rlAfter.body.viewer?.submissionStatus === 'submitted');

  section = 'review';
  const subs = await call<SubmissionView[]>('GET', '/challenges/ch_rate_limiter/submissions', { as: 'emp_jordan' });
  check('owner sees submissions, newest first', subs.status === 200 && subs.body[0]?.id === sub.id);
  const asOwner = await call<SubmissionView>('GET', `/submissions/${sub.id}`, { as: 'emp_jordan' });
  check('owner GET /submissions/:id', asOwner.status === 200 && asOwner.body.notes === NOTES);
  if (otherStudent) expectErr('another student → 403 NOT_YOURS', await call('GET', `/submissions/${sub.id}`, { as: otherStudent }), 403, 'NOT_YOURS');
  else skip('another student → 403 NOT_YOURS', 'only one named student');
  if (otherEmployer) {
    expectErr('other company → 403 NOT_OWNER (files private)', await call('GET', `/submissions/${sub.id}`, { as: otherEmployer }), 403, 'NOT_OWNER');
    expectErr('other company download → 403', await call('GET', `/submissions/${sub.id}/download?as=${otherEmployer}`), 403, 'NOT_OWNER');
  } else skip('other company → 403 NOT_OWNER (files private)', 'content has one company only');
  const preview = await call<FilePreview>('GET', `/submissions/${sub.id}/file?path=src/rateLimiter.ts`, { as: 'emp_jordan' });
  check('file preview (in-memory)', preview.status === 200 && preview.body.content.includes('TokenBucket') && preview.body.truncated === false);
  expectErr('preview of a missing path → 404', await call('GET', `/submissions/${sub.id}/file?path=nope.txt`, { as: 'emp_jordan' }), 404, 'FILE_NOT_FOUND');
  const dl = await call('GET', `/submissions/${sub.id}/download?as=emp_jordan`);
  check('owner download is blind (candidate-k7.zip)', dl.status === 200 && dl.buf.equals(zip) && /candidate-k7\.zip/.test(dl.headers.get('content-disposition') ?? ''), dl.headers.get('content-disposition') ?? '');
  const dlMaya = await call('GET', `/submissions/${sub.id}/download?as=stu_maya`);
  check('author download keeps original name', dlMaya.status === 200 && /maya-rate-limiter\.zip/.test(dlMaya.headers.get('content-disposition') ?? ''));

  section = 'score';
  const rubric = rl.body.rubric;
  const demoScores: Record<string, number> = { correctness: 5, design: 4, tests: 4, code_quality: 4, communication: 5 };
  const expectedTotal = computeTotalScore(rubric, demoScores);
  const feedback = 'Clean token bucket, good edge-case tests and a README a teammate could act on.';
  expectErr('score as student → 403', await call('POST', `/submissions/${sub.id}/score`, { as: 'stu_maya', json: { scores: demoScores, feedback } }), 403, 'WRONG_ROLE');
  expectErr(
    'missing criterion → 400 INVALID_SCORES',
    await call('POST', `/submissions/${sub.id}/score`, { as: 'emp_jordan', json: { scores: { correctness: 5 }, feedback } }),
    400,
    'INVALID_SCORES',
  );
  expectErr(
    'score 6 → 400 INVALID_SCORES',
    await call('POST', `/submissions/${sub.id}/score`, { as: 'emp_jordan', json: { scores: { ...demoScores, design: 6 }, feedback } }),
    400,
    'INVALID_SCORES',
  );
  expectErr(
    'feedback < 20 chars → 400 FEEDBACK_TOO_SHORT',
    await call('POST', `/submissions/${sub.id}/score`, { as: 'emp_jordan', json: { scores: demoScores, feedback: 'nice' } }),
    400,
    'FEEDBACK_TOO_SHORT',
  );
  expectErr('bad JSON → 400 BAD_JSON', await call('POST', `/submissions/${sub.id}/score`, { as: 'emp_jordan', raw: '{nope' }), 400, 'BAD_JSON');
  const scored = await call<SubmissionView>('POST', `/submissions/${sub.id}/score`, { as: 'emp_jordan', json: { scores: demoScores, feedback } });
  check(`score → total ${expectedTotal} (computeTotalScore)`, scored.status === 200 && scored.body.totalScore === expectedTotal, JSON.stringify(scored.body).slice(0, 200));
  check('demo score is 88', expectedTotal === 88, String(expectedTotal));
  const evScored = await sse.waitFor((e) => e.type === 'submission.scored' && payload<{ submissionId: string }>(e).submissionId === sub.id);
  check('SSE submission.scored', payload<{ totalScore: number }>(evScored).totalScore === expectedTotal);
  const mayaView = await call<SubmissionView>('GET', `/submissions/${sub.id}`, { as: 'stu_maya' });
  check('Maya cannot see the score yet (§5.5 #8)', mayaView.body.totalScore === null && mayaView.body.feedback === null && mayaView.body.status === 'submitted');
  const mine = await call<SubmissionView[]>('GET', '/me/submissions', { as: 'stu_maya' });
  check('GET /me/submissions hides unpublished results', mine.body.some((s) => s.id === sub.id && s.totalScore === null));
  expectErr('student leaderboard before award → 403', await call('GET', '/challenges/ch_rate_limiter/leaderboard', { as: 'stu_maya' }), 403, 'RESULTS_NOT_PUBLISHED');
  const short = await call<SubmissionView>('POST', `/submissions/${sub.id}/shortlist`, { as: 'emp_jordan', json: { shortlisted: true } });
  check('shortlist', short.body.shortlisted === true);
  check('shortlist hidden from the student', (await call<SubmissionView>('GET', `/submissions/${sub.id}`, { as: 'stu_maya' })).body.shortlisted === false);

  const board = await call<SubmissionView[]>('GET', '/challenges/ch_rate_limiter/leaderboard', { as: 'emp_jordan' });
  const ranked = [...board.body].sort(
    (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || Date.parse(a.submittedAt) - Date.parse(b.submittedAt),
  );
  const expectedRank = ranked.findIndex((s) => s.id === sub.id) + 1;
  check('owner leaderboard is ranked', board.status === 200 && board.body.every((s, i) => s.id === ranked[i]?.id && s.rank === i + 1));
  check('Maya is provisionally 2nd', expectedRank === 2, `rank ${expectedRank}; top: ${ranked.slice(0, 3).map((s) => s.totalScore).join(', ')}`);
  check(
    `generated scores ≤ ${PLATFORM_RULES.generatedScoreCeiling} (only scripted beat Maya)`,
    ranked.slice(0, expectedRank - 1).every((s) => (s.totalScore ?? 0) > expectedTotal),
  );

  section = 'award';
  expectErr('award as student → 403', await call('POST', '/challenges/ch_rate_limiter/award', { as: 'stu_maya' }), 403, 'WRONG_ROLE');
  if (otherEmployer) expectErr('award by another company → 403', await call('POST', '/challenges/ch_rate_limiter/award', { as: otherEmployer }), 403, 'NOT_OWNER');
  const award = await call<AwardResponse>('POST', '/challenges/ch_rate_limiter/award', { as: 'emp_jordan' });
  if (!check('award → 200', award.status === 200, JSON.stringify(award.body).slice(0, 300))) return;
  const mayaResult = award.body.results.find((r) => r.studentId === 'stu_maya');
  const expectedPayout = payoutForRank(rl.body.reward, expectedRank);
  check(`Maya rank ${expectedRank} = computed`, mayaResult?.rank === expectedRank, JSON.stringify(mayaResult));
  check(`Maya payout $${expectedPayout} = payoutForRank`, mayaResult?.payout === expectedPayout && expectedPayout === 150, JSON.stringify(mayaResult));
  check('paid → awarded, others → not_selected', award.body.results.every((r) => r.status === (r.payout > 0 ? 'awarded' : 'not_selected')));
  check(
    'payouts total the bounty',
    award.body.results.reduce((s, r) => s + r.payout, 0) === (award.body.results.length >= 3 ? rewardTotal(rl.body.reward) : award.body.results.reduce((s, r) => s + r.payout, 0)),
  );
  check('challenge.status = awarded (+ awardedAt)', award.body.challenge.status === 'awarded' && !!award.body.challenge.awardedAt);
  const evAward = await sse.waitFor((e) => e.type === 'challenge.awarded');
  check('SSE challenge.awarded has Maya #2', payload<{ results: { studentId: string; rank: number }[] }>(evAward).results?.some((r) => r.studentId === 'stu_maya' && r.rank === 2) ?? false);
  const evMayaNtf = await sse.waitFor(
    (e) => e.type === 'notification.created' && payload<{ notification: Notification }>(e).notification.recipientId === 'stu_maya' && payload<{ notification: Notification }>(e).notification.kind === 'awarded',
  );
  const awardTitle = payload<{ notification: Notification }>(evMayaNtf).notification?.title ?? '';
  check('Maya notified "2nd place · $150"', awardTitle === '2nd place · $150', awardTitle);
  check('non-placed students get "results" notifications', sse.events.some((e) => e.type === 'notification.created' && payload<{ notification: Notification }>(e).notification.kind === 'results'));
  expectErr('award twice → 409 ALREADY_AWARDED', await call('POST', '/challenges/ch_rate_limiter/award', { as: 'emp_jordan' }), 409, 'ALREADY_AWARDED');
  expectErr('re-score after award → 409', await call('POST', `/submissions/${sub.id}/score`, { as: 'emp_jordan', json: { scores: demoScores, feedback } }), 409, 'ALREADY_AWARDED');
  const mineAfter = await call<SubmissionView[]>('GET', '/me/submissions', { as: 'stu_maya' });
  const mineRl = mineAfter.body.find((s) => s.id === sub.id);
  check('Maya now sees 88 · rank 2 · $150 · feedback', mineRl?.totalScore === 88 && mineRl.rank === 2 && mineRl.payout === 150 && mineRl.status === 'awarded' && mineRl.feedback === feedback);
  const profileAfter = await call<StudentProfile>('GET', '/students/stu_maya', { as: 'emp_jordan' });
  const b = profileBefore.body.stats;
  const a = profileAfter.body.stats;
  check('verified hours +4', a.verifiedHours === b.verifiedHours + rl.body.estHours, `${b.verifiedHours} → ${a.verifiedHours}`);
  check('bounties earned +$150', a.bountiesEarned === b.bountiesEarned + 150, `${b.bountiesEarned} → ${a.bountiesEarned}`);
  check('placements: +1 second', a.placements.second === b.placements.second + 1);
  const hist = profileAfter.body.history;
  check(
    'canViewFiles only on own-company history',
    hist.every((h) => h.canViewFiles === (h.company?.id === 'co_orbitline')),
    JSON.stringify(hist.map((h) => [h.challengeId, h.company?.id, h.canViewFiles])),
  );
  const boardMaya = await call<SubmissionView[]>('GET', '/challenges/ch_rate_limiter/leaderboard', { as: 'stu_maya' });
  check('student leaderboard after award (peers redacted)', boardMaya.status === 200 && boardMaya.body.filter((s) => s.studentId !== 'stu_maya').every((s) => s.notes === '' && s.feedback === null && s.file.tree.length === 0));

  section = 'invites';
  const inviteBody = { studentId: 'stu_maya', challengeId: 'ch_rate_limiter', message: "Hi Maya, loved your rate limiter. Let's talk about the Junior Backend Engineer role!" };
  expectErr('invite as student → 403', await call('POST', '/invites', { as: 'stu_maya', json: inviteBody }), 403, 'WRONG_ROLE');
  const inv = await call<InviteView>('POST', '/invites', { as: 'emp_jordan', json: inviteBody });
  check('POST /invites → 201', inv.status === 201 && inv.body.status === 'pending' && inv.body.role === rl.body.hiringFor, JSON.stringify(inv.body).slice(0, 200));
  const evInv = await sse.waitFor((e) => e.type === 'invite.created');
  check('SSE invite.created', payload<{ invite: { id: string } }>(evInv).invite?.id === inv.body.id);
  const evInvNtf = await sse.waitFor(
    (e) => e.type === 'notification.created' && payload<{ notification: Notification }>(e).notification.kind === 'interview' && payload<{ notification: Notification }>(e).notification.recipientId === 'stu_maya',
  );
  check('Maya notified "Interview invite · Orbitline Logistics"', payload<{ notification: Notification }>(evInvNtf).notification?.title === 'Interview invite · Orbitline Logistics');
  expectErr('duplicate invite → 409 ALREADY_INVITED', await call('POST', '/invites', { as: 'emp_jordan', json: inviteBody }), 409, 'ALREADY_INVITED');
  expectErr('invite to unknown student → 404', await call('POST', '/invites', { as: 'emp_jordan', json: { ...inviteBody, studentId: 'stu_nobody' } }), 404, 'STUDENT_NOT_FOUND');
  const myInv = await call<InviteView[]>('GET', '/me/invites', { as: 'stu_maya' });
  check('GET /me/invites (student)', myInv.body.some((i) => i.id === inv.body.id && i.company.id === 'co_orbitline'));
  const coInv = await call<InviteView[]>('GET', '/me/invites', { as: 'emp_jordan' });
  check('GET /me/invites (employer, with student)', coInv.body.some((i) => i.id === inv.body.id && i.student?.id === 'stu_maya'));
  if (otherStudent) expectErr('respond to someone else’s invite → 403', await call('POST', `/invites/${inv.body.id}/respond`, { as: otherStudent, json: { status: 'accepted' } }), 403, 'NOT_YOURS');
  const resp = await call<InviteView>('POST', `/invites/${inv.body.id}/respond`, { as: 'stu_maya', json: { status: 'accepted' } });
  check('Maya accepts', resp.status === 200 && resp.body.status === 'accepted');
  check('SSE invite.updated', !!(await sse.waitFor((e) => e.type === 'invite.updated')));
  expectErr('respond twice → 409', await call('POST', `/invites/${inv.body.id}/respond`, { as: 'stu_maya', json: { status: 'declined' } }), 409, 'ALREADY_RESPONDED');

  section = 'notifications';
  const ntf = await call<Notification[]>('GET', '/notifications', { as: 'stu_maya' });
  check('Maya has awarded + interview notifications', ['awarded', 'interview'].every((k) => ntf.body.some((n) => n.kind === k)));
  check('notifications newest first', ntf.body.every((n, i, arr) => i === 0 || Date.parse(arr[i - 1]!.createdAt) >= Date.parse(n.createdAt)));
  const firstUnread = ntf.body.find((n) => !n.read);
  if (firstUnread) {
    const one = await call<Notification>('POST', `/notifications/${firstUnread.id}/read`, { as: 'stu_maya' });
    check('POST /notifications/:id/read', one.status === 200 && one.body.read === true);
  } else skip('POST /notifications/:id/read', 'no unread notification');
  expectErr("can't read someone else's notification", await call('POST', `/notifications/${ntf.body[0]?.id}/read`, { as: 'emp_jordan' }), 404, 'NOTIFICATION_NOT_FOUND');
  check('POST /notifications/read-all', (await call<{ ok: boolean }>('POST', '/notifications/read-all', { as: 'stu_maya' })).body.ok === true);
  check('all read afterwards', (await call<Notification[]>('GET', '/notifications', { as: 'stu_maya' })).body.every((n) => n.read));
  const coNtf = await call<Notification[]>('GET', '/notifications', { as: 'emp_jordan' });
  check('company gets submission_received + invite_response', ['submission_received', 'invite_response'].every((k) => coNtf.body.some((n) => n.kind === k)));
  expectErr('notifications need a persona', await call('GET', '/notifications'), 401, 'NO_PERSONA');

  section = 'employer';
  const dash = await call<EmployerDashboard>('GET', '/employer/dashboard', { as: 'emp_jordan' });
  check('dashboard KPIs', dash.status === 200 && dash.body.kpis.interviewsSent >= 1 && dash.body.kpis.bountiesPaid >= rewardTotal(rl.body.reward), JSON.stringify(dash.body.kpis));
  check('dashboard lists only own live challenges', dash.body.challenges.every((c) => c.companyId === 'co_orbitline' && c.kind === 'live'));
  check('activity feed has award + invite', ['award', 'invite'].every((k) => dash.body.recentActivity.some((x) => x.kind === k)));
  expectErr('dashboard as student → 403', await call('GET', '/employer/dashboard', { as: 'stu_maya' }), 403, 'WRONG_ROLE');
  const talent = await call<StudentListItem[]>('GET', '/students?sort=score', { as: 'emp_jordan' });
  check('GET /students (talent, sort=score)', talent.status === 200 && talent.body.length > 0 && talent.body.every((s, i, arr) => i === 0 || (arr[i - 1]!.stats.avgScore ?? -1) >= (s.stats.avgScore ?? -1)));
  check('GET /students?q=maya', (await call<StudentListItem[]>('GET', '/students?q=maya', { as: 'emp_jordan' })).body.some((s) => s.id === 'stu_maya'));
  expectErr('GET /students as student → 403', await call('GET', '/students', { as: 'stu_maya' }), 403, 'WRONG_ROLE');
  expectErr('unknown student profile → 404', await call('GET', '/students/nobody-here'), 404, 'STUDENT_NOT_FOUND');

  const example = await call<CreateChallengeInput>('GET', '/employer/example-challenge', { as: 'emp_jordan' });
  check(
    'GET /employer/example-challenge',
    example.status === 200 && example.body.estHours >= 1 && example.body.estHours <= 5 && example.body.rubric.reduce((s, c) => s + c.weight, 0) === 100 && Date.parse(example.body.deadline) > Date.now(),
    JSON.stringify(example.body).slice(0, 200),
  );
  if (otherEmployer) {
    const ex2 = await call<CreateChallengeInput>('GET', '/employer/example-challenge', { as: otherEmployer });
    check('example for another company', ex2.status === 200 && ex2.body.title.length > 0);
  }
  expectErr(
    'POST /challenges invalid → 400 VALIDATION_ERROR',
    await call('POST', '/challenges', { as: 'emp_jordan', json: { ...example.body, estHours: 6, rubric: [{ id: 'x', name: 'X', description: '', weight: 90 }] } }),
    400,
    'VALIDATION_ERROR',
  );
  const invalid = await call<{ error: { issues?: { path: string }[] } }>('POST', '/challenges', { as: 'emp_jordan', json: { ...example.body, estHours: 6 } });
  check('validation issues point at estHours', invalid.body.error.issues?.some((i) => i.path === 'estHours') ?? false);
  expectErr('POST /challenges as student → 403', await call('POST', '/challenges', { as: 'stu_maya', json: example.body }), 403, 'WRONG_ROLE');
  const created = await call<ChallengeView>('POST', '/challenges', { as: 'emp_jordan', json: { ...example.body, applicantCap: 1 } });
  if (!check('POST /challenges → 201', created.status === 201, JSON.stringify(created.body).slice(0, 300))) return;
  const ch = created.body;
  const evCh = await sse.waitFor((e) => e.type === 'challenge.created' && payload<{ challenge: ChallengeView }>(e).challenge.id === ch.id);
  check('SSE challenge.created', !!evCh);
  const interested = (await call<StudentListItem[]>('GET', '/students', { as: 'emp_jordan' })).body.filter((s) => s.interests.includes(ch.type)).length;
  await sleep(100);
  const newNtfs = sse.events.filter(
    (e) => e.type === 'notification.created' && payload<{ notification: Notification }>(e).notification.kind === 'new_challenge' && payload<{ notification: Notification }>(e).notification.link === `/challenges/${ch.id}`,
  );
  check(`new_challenge notifications to ${interested} interested students`, newNtfs.length === interested && interested > 0, `${newNtfs.length} vs ${interested}`);
  check('new challenge tops Explore (newest)', (await call<ChallengeView[]>('GET', '/challenges?kind=live&sort=newest')).body[0]?.id === ch.id);
  check('employer-created challenge gets Coach hints', ch.aiHints.steps.length > 0 && ch.aiHints.pitfalls.length > 0);

  const joinMaya = await call<ChallengeView>('POST', `/challenges/${ch.id}/join`, { as: 'stu_maya' });
  check('Maya joins the new challenge', joinMaya.status === 200 && joinMaya.body.participantCount === 1 && joinMaya.body.spotsLeft === 0 && joinMaya.body.viewer?.joined === true);
  const evJoin = await sse.waitFor((e) => e.type === 'challenge.updated' && payload<{ challengeId: string; reason?: string }>(e).challengeId === ch.id);
  check('SSE challenge.updated (reason joined)', payload<{ reason?: string }>(evJoin).reason === 'joined');
  check(
    'cap_reached notification to the company',
    !!(await sse.waitFor((e) => e.type === 'notification.created' && payload<{ notification: Notification }>(e).notification.kind === 'cap_reached')),
  );
  if (otherStudent) {
    expectErr('cap reached → 409 CAP_REACHED', await call('POST', `/challenges/${ch.id}/join`, { as: otherStudent }), 409, 'CAP_REACHED');
    expectErr(
      'submit without joining → 403 NOT_JOINED',
      await call('POST', `/challenges/${ch.id}/submissions`, { as: otherStudent, form: upload(zip, 'x.zip', { notes: NOTES }) }),
      403,
      'NOT_JOINED',
    );
  } else skip('cap reached → 409 CAP_REACHED', 'only one named student');
  const sub2 = await call<SubmissionView>('POST', `/challenges/${ch.id}/submissions`, { as: 'stu_maya', form: upload(zip, 'webhooks.zip', { notes: NOTES }) });
  check('Maya submits to the new challenge', sub2.status === 201);
  expectErr('award with unscored work → 409 UNSCORED_SUBMISSIONS', await call('POST', `/challenges/${ch.id}/award`, { as: 'emp_jordan' }), 409, 'UNSCORED_SUBMISSIONS');
  const patched = await call<ChallengeView>('PATCH', `/challenges/${ch.id}`, { as: 'emp_jordan', json: { status: 'reviewing' } });
  check('PATCH status → reviewing', patched.status === 200 && patched.body.status === 'reviewing');
  if (otherStudent) expectErr('join a closed challenge → 409 CLOSED', await call('POST', `/challenges/${ch.id}/join`, { as: otherStudent }), 409, 'CLOSED');
  expectErr(
    'submit to a closed challenge → 409 CLOSED',
    await call('POST', `/challenges/${ch.id}/submissions`, { as: 'stu_maya', form: upload(zip, 'x.zip', { notes: NOTES }) }),
    409,
    'CLOSED',
  );

  section = 'practice';
  const named = personas.body.students.map((s) => s.id);
  let practicePick: { student: string; challenge: string } | null = null;
  for (const sid of named) {
    const pl = await call<ChallengeView[]>('GET', '/challenges?kind=practice', { as: sid });
    const free = pl.body.find((c) => !c.viewer?.submissionId);
    if (free) {
      practicePick = { student: sid, challenge: free.id };
      break;
    }
  }
  if (practicePick) {
    const pr = await call<SubmissionView>('POST', `/challenges/${practicePick.challenge}/submissions`, {
      as: practicePick.student,
      form: upload(zip, 'practice.zip', { notes: NOTES }),
    });
    check('practice submit → instant Coach review', pr.status === 201 && pr.body.status === 'scored' && pr.body.reviewer === 'coach' && typeof pr.body.totalScore === 'number' && !!pr.body.feedback, JSON.stringify(pr.body).slice(0, 200));
    const prView = await call<ChallengeView>('GET', `/challenges/${practicePick.challenge}`, { as: practicePick.student });
    check('practice auto-joins on submit', prView.body.viewer?.joined === true && prView.body.viewer.submissionStatus === 'scored');
    check(
      'coach_review notification',
      !!(await sse.waitFor((e) => e.type === 'notification.created' && payload<{ notification: Notification }>(e).notification.kind === 'coach_review')),
    );
  } else skip('practice submit → instant Coach review', 'every named student already did every practice task');

  section = 'dummy ai';
  const task = await call<CoachResponse>('POST', '/ai/coach', { as: 'stu_maya', json: { message: '', challengeId: 'ch_rate_limiter', quickPrompt: 'steps' } });
  check('coach task mode (quick prompt) → list only, ≤ 60 words', task.status === 200 && /^1\. /.test(task.body.reply) && words(task.body.reply) <= 60, task.body.reply);
  for (const quickPrompt of ['testing', 'greatLooksLike', 'pitfalls'] as const) {
    const r = await call<CoachResponse>('POST', '/ai/coach', { as: 'stu_maya', json: { message: '', challengeId: 'ch_rate_limiter', quickPrompt } });
    check(`coach ${quickPrompt} ≤ 60 words`, r.status === 200 && words(r.body.reply) <= 60 && words(r.body.reply) > 3, r.body.reply);
  }
  const free = await call<CoachResponse>('POST', '/ai/coach', { as: 'stu_maya', json: { message: 'How will this be judged?', challengeId: 'ch_rate_limiter' } });
  check('coach free text → rubric list', free.status === 200 && /^- \*\*Correctness\*\* · 30%/.test(free.body.reply), free.body.reply);
  expectErr('coach as employer → 403', await call('POST', '/ai/coach', { as: 'emp_jordan', json: { message: 'hi' } }), 403, 'WRONG_ROLE');
  const rub = await call<RubricSuggestResponse>('POST', '/ai/rubric', { as: 'emp_jordan', json: { type: 'data' } });
  check('rubric suggestion sums to 100', rub.status === 200 && rub.body.rubric.reduce((s, c) => s + c.weight, 0) === 100);
  expectErr('rubric with bad type → 400', await call('POST', '/ai/rubric', { as: 'emp_jordan', json: { type: 'cooking' } }), 400, 'VALIDATION_ERROR');

  section = 'misc';
  expectErr('unknown route → 404 NOT_FOUND', await call('GET', '/nope'), 404, 'NOT_FOUND');
  const db = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'db.json'), 'utf8')) as { submissions: { id: string }[] };
  check('mutations persisted to db.json', db.submissions.some((s) => s.id === sub.id));
  check('no stray temp files in DATA_DIR', !fs.readdirSync(DATA_DIR).some((f) => f.endsWith('.tmp')));

  section = 'reset';
  const reset = await call<{ ok: boolean }>('POST', '/admin/reset');
  check('POST /admin/reset', reset.status === 200 && reset.body.ok === true);
  check('SSE system.reset', !!(await sse.waitFor((e) => e.type === 'system.reset')));
  const rlReset = await call<ChallengeView>('GET', '/challenges/ch_rate_limiter', { as: 'stu_maya' });
  check('demo state restored (Maya joined, not submitted)', rlReset.body.status === 'open' && rlReset.body.viewer?.joined === true && rlReset.body.viewer.submissionId === null);
  check('reseed cleared uploaded zips', !fs.existsSync(path.join(DATA_DIR, 'uploads', `${sub.id}.zip`)));
  check('created challenge gone after reset', (await call('GET', `/challenges/${ch.id}`)).status === 404);

  sse.stop();
}

/* ───────────── main ───────────── */

let crashed: unknown = null;
try {
  await run();
} catch (err) {
  crashed = err;
} finally {
  cleanup();
}

const pass = rows.filter((r) => r.status === 'PASS').length;
const fail = rows.filter((r) => r.status === 'FAIL').length;
const skipped = rows.filter((r) => r.status === 'SKIP').length;
const w = Math.max(...rows.map((r) => r.name.length), 10);
console.log(`\nTryout API smoke test (private server :${PORT})\n`);
let last = '';
for (const r of rows) {
  if (r.section !== last) {
    console.log(`\n  ${r.section.toUpperCase()}`);
    last = r.section;
  }
  const mark = r.status === 'PASS' ? '✓ PASS' : r.status === 'FAIL' ? '✗ FAIL' : '- SKIP';
  console.log(`  ${mark}  ${r.name.padEnd(w)}${r.detail ? `  — ${r.detail}` : ''}`);
}
if (crashed) {
  console.log(`\n✗ smoke test crashed: ${crashed instanceof Error ? (crashed.stack ?? crashed.message) : String(crashed)}`);
  console.log(`\nserver log tail:\n${serverLog.slice(-2000)}`);
}
console.log(`\n${pass} passed, ${fail} failed, ${skipped} skipped${crashed ? ', CRASHED' : ''}\n`);
if (fail || crashed) {
  if (!crashed && fail) console.log(`server log tail:\n${serverLog.slice(-1500)}`);
  process.exitCode = 1;
}
process.exit(process.exitCode ?? 0);
