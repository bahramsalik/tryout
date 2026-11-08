/** Express app: every endpoint in SPEC §7.6 under /api. */
import fs from 'node:fs';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  CHALLENGE_TYPES,
  PLATFORM_RULES,
  placementsFor,
  type Challenge,
  type ChallengeView,
  type CreateChallengeInput,
  type Personas,
  type StudentListItem,
} from '../../shared/types.ts';
import {
  assertCanSubmit,
  awardChallenge,
  createChallenge,
  joinChallenge,
  markAllRead,
  markRead,
  scoreSubmission,
  verifySubmission,
  setShortlisted,
  submitWork,
  updateChallenge,
} from './actions.ts';
import { aiLatency, coachReply, suggestRubric } from './ai.ts';
import { contentStatus, dataSummary, reseed } from './boot.ts';
import { CORS_ORIGINS, DATA_DIR, MAX_UPLOAD_BYTES } from './config.ts';
import { exampleChallengeFor } from './examples.ts';
import { HttpError, badRequest, forbidden, notFound } from './errors.ts';
import { clientCount, emit, sseHandler } from './events.ts';
import { log } from './log.ts';
import { rankScored, slugify } from './logic.ts';
import { optionalPersona, requireEmployer, requirePersona, requireStudent, type Persona } from './persona.ts';
import { cloudMode } from './cloud.ts';
import { flushToCloud, getDb, hasPendingCloudWrites, loadUpload, pullFromCloud, starterPath } from './store.ts';
import {
  challengeById,
  challengeView,
  employerDashboard,
  isOwner,
  resultsPublished,
  studentById,
  studentByIdOrHandle,
  studentListItem,
  studentProfile,
  submissionById,
  submissionView,
} from './views.ts';
import { buildZip, previewZipFile } from './zip.ts';

/* ───────────── helpers ───────────── */

const typeEnum = z.enum(CHALLENGE_TYPES as unknown as [string, ...string[]]);

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body ?? {});
  if (r.success) return r.data;
  const issues = r.error.issues.map((i) => ({ path: i.path.join('.') || '(body)', message: i.message }));
  throw badRequest('VALIDATION_ERROR', issues.map((i) => `${i.path}: ${i.message}`).join('; '), issues);
}

function q(req: Request, name: string): string | undefined {
  const v = req.query[name];
  if (typeof v === 'string') return v.trim() || undefined;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim() || undefined;
  return undefined;
}

function qList(req: Request, name: string): string[] {
  const v = req.query[name];
  const raw = typeof v === 'string' ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  return raw.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean);
}

const param = (req: Request, name: string) => String(req.params[name] ?? '');

function mustChallenge(id: string): Challenge {
  const ch = challengeById(id);
  if (!ch) throw notFound('CHALLENGE_NOT_FOUND', `No challenge ${id}.`);
  return ch;
}

function mustOwner(req: Request, ch: Challenge) {
  const p = requireEmployer(req);
  if (!isOwner(p, ch)) throw forbidden('NOT_OWNER', `Only ${ch.companyId ?? 'the owning company'} can do this.`);
  return p;
}

/** Owner employer or the submitting student. */
function mustSubmissionAccess(req: Request, id: string) {
  const p = requirePersona(req);
  const sub = submissionById(id);
  if (!sub) throw notFound('SUBMISSION_NOT_FOUND', `No submission ${id}.`);
  const ch = mustChallenge(sub.challengeId);
  if (p.kind === 'student' && p.id !== sub.studentId) throw forbidden('NOT_YOURS', 'You can only open your own submissions.');
  if (p.kind === 'employer' && !isOwner(p, ch)) {
    throw forbidden('NOT_OWNER', 'Only the posting company can see files.');
  }
  return { p, sub, ch };
}

async function readUpload(id: string): Promise<Buffer> {
  const buf = await loadUpload(id);
  if (!buf) throw notFound('FILE_MISSING', 'Zip missing on the server. Try reseeding.');
  return buf;
}

/**
 * Cloud mode: pull the latest db before each request, and save any change before the response leaves
 * (Lambda may freeze the instance right after). A write that lost a race becomes a 409 to retry.
 */
function cloudSync(req: Request, res: Response, next: NextFunction): void {
  pullFromCloud()
    .catch((err) => log.error(`S3 pull failed: ${err instanceof Error ? err.message : String(err)}`))
    .finally(() => {
      const end = res.end.bind(res) as (...a: unknown[]) => Response;
      let flushing = false;
      res.end = ((...args: unknown[]) => {
        if (flushing || !hasPendingCloudWrites()) return end(...args);
        flushing = true;
        flushToCloud()
          .then((ok) => {
            if (ok || req.method === 'GET') return end(...args);
            const body = JSON.stringify({ error: { code: 'CONFLICT', message: 'Someone saved at the same moment. Try again.' } });
            res.statusCode = 409;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Length', Buffer.byteLength(body));
            return end(body);
          })
          .catch((err) => {
            log.error(`S3 write failed: ${err instanceof Error ? err.message : String(err)}`);
            end(...args);
          });
        return res;
      }) as Response['end'];
      next();
    });
}

function sendZip(res: Response, buf: Buffer, filename: string) {
  res.attachment(filename);
  res.type('application/zip');
  res.send(buf);
}

const rankSort = (v: ChallengeView) => v.spotsLeft ?? Number.POSITIVE_INFINITY;

function sortChallenges(views: ChallengeView[], sort: string): ChallengeView[] {
  const newest = (a: ChallengeView, b: ChallengeView) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const deadline = (v: ChallengeView) => (v.deadline ? Date.parse(v.deadline) : Number.POSITIVE_INFINITY);
  const by: Record<string, (a: ChallengeView, b: ChallengeView) => number> = {
    newest,
    deadline: (a, b) => deadline(a) - deadline(b) || newest(a, b),
    spots: (a, b) => rankSort(b) - rankSort(a) || newest(a, b),
  };
  return [...views].sort(by[sort] ?? newest);
}

/* ───────────── request schemas ───────────── */

const criterionSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(80),
  description: z.string().max(400).default(''),
  weight: z.number().int().min(1).max(100),
});

const createChallengeSchema = z
  .object({
    title: z.string().trim().min(5).max(140),
    summary: z.string().trim().min(10).max(140),
    type: typeEnum,
    skills: z.array(z.string().max(40)).max(12).default([]),
    classroomConcepts: z.array(z.object({ concept: z.string().trim().min(1), course: z.string().trim().min(1) })).max(6).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estHours: z
      .number()
      .int(`estHours must be a whole number of hours`)
      .min(PLATFORM_RULES.minEstHours, `Platform rule: tasks must take at least ${PLATFORM_RULES.minEstHours} h`)
      .max(PLATFORM_RULES.maxEstHours, `Platform rule: tasks must fit in ${PLATFORM_RULES.maxEstHours} hours`),
    brief: z.string().trim().min(20).max(20_000),
    deliverables: z.array(z.string().trim().min(1).max(300)).min(1).max(10),
    rubric: z.array(criterionSchema).min(1).max(8),
    applicantCap: z.number().int().min(1).max(10_000).nullable(),
    placements: z.number().int().min(0).max(10).optional(),
    prizePool: z.number().int().min(0).max(100_000).optional(),
    deadline: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'deadline must be an ISO date'),
    hiringFor: z.string().max(200).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    const sum = v.rubric.reduce((s, c) => s + c.weight, 0);
    if (sum !== 100) ctx.addIssue({ code: 'custom', path: ['rubric'], message: `Rubric weights must total 100 (currently ${sum})` });
    const ids = v.rubric.map((c) => c.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['rubric'], message: 'Rubric criterion ids must be unique' });
    if ((v.prizePool ?? 0) > 0 && !((v.placements ?? 0) > 0)) {
      ctx.addIssue({ code: 'custom', path: ['prizePool'], message: 'A prize needs an award (Top 1 or Top 3)' });
    }
    if (Date.parse(v.deadline) <= Date.now()) ctx.addIssue({ code: 'custom', path: ['deadline'], message: 'Deadline must be in the future' });
  });

const patchChallengeSchema = z.object({
  status: z.enum(['open', 'reviewing']).optional(),
  deadline: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'deadline must be an ISO date').optional(),
});

const scoreSchema = z.object({
  scores: z.record(z.string(), z.number()),
  feedback: z.string().default(''),
  shortlisted: z.boolean().optional(),
});

const coachSchema = z.object({
  message: z.string().max(4000).default(''),
  challengeId: z.string().nullable().optional(),
  quickPrompt: z.enum(['testing', 'steps', 'greatLooksLike', 'pitfalls']).nullable().optional(),
});

const rubricSchema = z.object({ type: typeEnum, title: z.string().optional(), brief: z.string().optional() });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 10, fieldSize: 200 * 1024 },
});

/* ───────────── app ───────────── */

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);
  app.use(
    cors({
      origin: CORS_ORIGINS,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Demo-User', 'Last-Event-ID', 'Cache-Control'],
      exposedHeaders: ['Content-Disposition'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  if (cloudMode) app.use(cloudSync);
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const t0 = Date.now();
    res.on('finish', () => {
      if (req.method !== 'GET' || res.statusCode >= 400) {
        log.info(`${req.method} ${req.originalUrl.split('?')[0]} → ${res.statusCode} (${Date.now() - t0} ms) ${req.get('x-demo-user') ?? ''}`.trim());
      }
    });
    next();
  });

  const api = express.Router();

  /* meta */

  api.get('/health', (_req, res) => {
    const c = contentStatus();
    res.json({
      ok: true,
      ...dataSummary(),
      content: { ok: c.ok, error: c.error, details: c.details.slice(0, 10), warnings: c.warnings.length },
      sseClients: clientCount(),
      dataDir: DATA_DIR,
      uptimeSec: Math.round(process.uptime()),
    });
  });

  api.get('/events', sseHandler);

  api.get('/personas', (_req, res) => {
    const db = getDb();
    const body: Personas = {
      students: db.namedStudentIds.map((id) => studentById(id)).filter((s) => !!s),
      employers: db.employers.flatMap((e) => {
        const company = db.companies.find((c) => c.id === e.companyId);
        return company ? [{ ...e, company }] : [];
      }),
    };
    res.json(body);
  });

  api.get('/me', (req, res) => {
    const p = requirePersona(req);
    res.json(p.kind === 'student' ? { kind: 'student', student: p.student } : { kind: 'employer', employer: p.employer, company: p.company });
  });

  /* challenges */

  api.get('/challenges', (req, res) => {
    const viewer = optionalPersona(req);
    const kinds = qList(req, 'kind');
    const types = qList(req, 'type');
    const statuses = qList(req, 'status');
    const companyId = q(req, 'companyId');
    const text = q(req, 'q')?.toLowerCase();
    let list = getDb().challenges.filter(
      (c) =>
        (!kinds.length || kinds.includes(c.kind)) &&
        (!types.length || types.includes(c.type)) &&
        (!statuses.length || statuses.includes(c.status)) &&
        (!companyId || c.companyId === companyId) &&
        (statuses.length || companyId || c.status !== 'awarded'),
    );
    if (text) {
      list = list.filter((c) => {
        const company = c.companyId ? getDb().companies.find((x) => x.id === c.companyId)?.name : 'Tryout Practice';
        return [c.title, c.summary, c.type, company ?? '', c.hiringFor ?? '', ...c.skills].join(' ').toLowerCase().includes(text);
      });
    }
    res.json(sortChallenges(list.map((c) => challengeView(c, viewer)), q(req, 'sort') ?? 'newest'));
  });

  api.post('/challenges', (req, res) => {
    const p = requireEmployer(req);
    const input = parseBody(createChallengeSchema, req.body) as CreateChallengeInput;
    res.status(201).json(createChallenge(p, input));
  });

  api.get('/challenges/:id', (req, res) => {
    res.json(challengeView(mustChallenge(param(req, 'id')), optionalPersona(req)));
  });

  api.patch('/challenges/:id', (req, res) => {
    const ch = mustChallenge(param(req, 'id'));
    const p = mustOwner(req, ch);
    res.json(updateChallenge(p, ch, parseBody(patchChallengeSchema, req.body)));
  });

  api.get('/challenges/:id/starter', (req, res) => {
    const ch = mustChallenge(param(req, 'id'));
    if (!ch.starterFiles.length) throw notFound('NO_STARTER_KIT', 'This challenge has no starter kit.');
    let buf: Buffer;
    try {
      buf = fs.readFileSync(starterPath(ch.id));
    } catch {
      buf = buildZip(ch.starterFiles);
    }
    sendZip(res, buf, `${ch.id.replace(/_/g, '-')}-starter.zip`);
  });

  api.post('/challenges/:id/join', (req, res) => {
    const p = requireStudent(req);
    res.json(joinChallenge(p, mustChallenge(param(req, 'id'))));
  });

  api.post(
    '/challenges/:id/submissions',
    (req: Request, _res: Response, next: NextFunction) => {
      // Reject cheaply before streaming the upload.
      const p = requireStudent(req);
      assertCanSubmit(p, mustChallenge(param(req, 'id')));
      next();
    },
    upload.single('file'),
    (req, res) => {
      const p = requireStudent(req);
      const ch = mustChallenge(param(req, 'id'));
      res.status(201).json(submitWork(p, ch, req.file, (req.body ?? {}) as Record<string, unknown>));
    },
  );

  api.get('/challenges/:id/submissions', (req, res) => {
    const ch = mustChallenge(param(req, 'id'));
    const p = mustOwner(req, ch);
    const subs = getDb()
      .submissions.filter((s) => s.challengeId === ch.id)
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
    res.json(subs.map((s) => submissionView(s, p)));
  });

  api.get('/challenges/:id/leaderboard', (req, res) => {
    const ch = mustChallenge(param(req, 'id'));
    const p = requirePersona(req);
    const owner = isOwner(p, ch);
    if (p.kind === 'employer' && !owner) throw forbidden('NOT_OWNER', 'Only the posting company can see this.');
    if (p.kind === 'student' && !(ch.kind === 'live' && ch.status === 'awarded')) {
      throw forbidden('RESULTS_NOT_PUBLISHED', 'Leaderboard opens when results are out.');
    }
    if (p.kind === 'student' && placementsFor(ch) === 0) throw forbidden('NO_AWARD', 'This challenge has no award, so nobody is ranked.');
    const ranked = rankScored(getDb().submissions.filter((s) => s.challengeId === ch.id));
    res.json(
      ranked.map((s, i) => {
        const v = submissionView(s, p, { peer: p.kind === 'student' && p.id !== s.studentId });
        if (v.rank === null) v.rank = i + 1; // provisional until results are published
        return v;
      }),
    );
  });

  api.post('/challenges/:id/award', (req, res) => {
    const ch = mustChallenge(param(req, 'id'));
    const p = mustOwner(req, ch);
    res.json(awardChallenge(p, ch));
  });

  /* submissions */

  api.get('/submissions/:id', (req, res) => {
    const { p, sub } = mustSubmissionAccess(req, param(req, 'id'));
    res.json(submissionView(sub, p));
  });

  api.get('/submissions/:id/download', async (req, res) => {
    const { p, sub, ch } = mustSubmissionAccess(req, param(req, 'id'));
    const blind = p.kind === 'employer' && !resultsPublished(ch);
    sendZip(res, await readUpload(sub.id), blind ? `${slugify(sub.alias)}.zip` : sub.file.originalName);
  });

  api.get('/submissions/:id/file', async (req, res) => {
    const { sub } = mustSubmissionAccess(req, param(req, 'id'));
    res.json(previewZipFile(await readUpload(sub.id), q(req, 'path') ?? ''));
  });

  api.post('/submissions/:id/score', (req, res) => {
    const sub = submissionById(param(req, 'id'));
    if (!sub) throw notFound('SUBMISSION_NOT_FOUND', `No submission ${param(req, 'id')}.`);
    const p = mustOwner(req, mustChallenge(sub.challengeId));
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body.scores !== 'object' || body.scores === null) {
      throw badRequest('INVALID_SCORES', 'Send { scores: { <criterionId>: 1–5 }, feedback }.');
    }
    res.json(scoreSubmission(p, sub, parseBody(scoreSchema, body)));
  });

  api.post('/submissions/:id/verify', (req, res) => {
    const sub = submissionById(param(req, 'id'));
    if (!sub) throw notFound('SUBMISSION_NOT_FOUND', `No submission ${param(req, 'id')}.`);
    const p = mustOwner(req, mustChallenge(sub.challengeId));
    res.json(verifySubmission(p, sub));
  });

  api.post('/submissions/:id/shortlist', (req, res) => {
    const sub = submissionById(param(req, 'id'));
    if (!sub) throw notFound('SUBMISSION_NOT_FOUND', `No submission ${param(req, 'id')}.`);
    const p = mustOwner(req, mustChallenge(sub.challengeId));
    const { shortlisted } = parseBody(z.object({ shortlisted: z.boolean() }), req.body);
    res.json(setShortlisted(p, sub, shortlisted));
  });

  /* me */

  api.get('/me/submissions', (req, res) => {
    const p = requireStudent(req);
    const subs = getDb()
      .submissions.filter((s) => s.studentId === p.id && challengeById(s.challengeId))
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
    res.json(subs.map((s) => submissionView(s, p)));
  });

  /* students */

  api.get('/students', (req, res) => {
    requireEmployer(req);
    const text = q(req, 'q')?.toLowerCase();
    const type = q(req, 'type');
    const minScore = q(req, 'minScore') !== undefined ? Number(q(req, 'minScore')) : null;
    const openToWork = q(req, 'openToWork');
    let items: StudentListItem[] = getDb().students.map(studentListItem);
    if (text) {
      items = items.filter((s) =>
        [s.name, s.handle, s.university, s.major, s.bio, s.location, ...s.skills, ...s.stats.topSkills].join(' ').toLowerCase().includes(text),
      );
    }
    if (type) items = items.filter((s) => s.interests.includes(type as never) || s.stats.typeScores.some((t) => t.type === type));
    if (minScore !== null && !Number.isNaN(minScore)) items = items.filter((s) => (s.stats.avgScore ?? -1) >= minScore);
    if (openToWork === 'true' || openToWork === 'false') items = items.filter((s) => s.openToWork === (openToWork === 'true'));
    const placementsScore = (s: StudentListItem) => s.stats.placements.first * 3 + s.stats.placements.second * 2 + s.stats.placements.third;
    const sort = q(req, 'sort') ?? 'hours';
    const by: Record<string, (a: StudentListItem, b: StudentListItem) => number> = {
      hours: (a, b) => b.stats.verifiedHours - a.stats.verifiedHours || (b.stats.avgScore ?? -1) - (a.stats.avgScore ?? -1),
      score: (a, b) => (b.stats.avgScore ?? -1) - (a.stats.avgScore ?? -1) || b.stats.verifiedHours - a.stats.verifiedHours,
      placements: (a, b) => placementsScore(b) - placementsScore(a) || b.stats.verifiedHours - a.stats.verifiedHours,
    };
    res.json(items.sort((a, b) => (by[sort] ?? by.hours!)(a, b) || a.name.localeCompare(b.name)));
  });

  api.get('/students/:idOrHandle', (req, res) => {
    const s = studentByIdOrHandle(param(req, 'idOrHandle'));
    if (!s) throw notFound('STUDENT_NOT_FOUND', `No student ${param(req, 'idOrHandle')}.`);
    res.json(studentProfile(s, optionalPersona(req)));
  });

  /* notifications */

  const recipientOf = (p: Persona) => (p.kind === 'student' ? p.id : p.company.id);

  api.get('/notifications', (req, res) => {
    const p = requirePersona(req);
    const me = recipientOf(p);
    res.json(
      getDb()
        .notifications.filter((n) => n.recipientId === me)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 100),
    );
  });

  api.post('/notifications/read-all', (req, res) => {
    markAllRead(recipientOf(requirePersona(req)));
    res.json({ ok: true });
  });

  api.post('/notifications/:id/read', (req, res) => {
    res.json(markRead(recipientOf(requirePersona(req)), param(req, 'id')));
  });

  /* employer */

  api.get('/employer/dashboard', (req, res) => {
    res.json(employerDashboard(requireEmployer(req)));
  });

  api.get('/employer/example-challenge', (req, res) => {
    res.json(exampleChallengeFor(requireEmployer(req).company));
  });

  /* DUMMY-AI */

  api.post('/ai/coach', async (req, res) => {
    const p = requireStudent(req);
    const body = parseBody(coachSchema, req.body);
    if (body.challengeId) mustChallenge(body.challengeId);
    await aiLatency();
    res.json(coachReply(body, p.student));
  });

  api.post('/ai/rubric', async (req, res) => {
    requireEmployer(req);
    const body = parseBody(rubricSchema, req.body);
    await aiLatency();
    res.json({ rubric: suggestRubric(body.type as Challenge['type']) });
  });

  /* admin */

  api.post('/admin/reset', (_req, res) => {
    const summary = reseed();
    emit({ type: 'system.reset', payload: {} });
    res.json({ ok: true, ...dataSummary(), summary: { ...summary, perChallenge: undefined } });
  });

  app.use('/api', api);

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route ${req.method} ${req.path}` } });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    let status = 500;
    let error: { code: string; message: string; issues?: { path: string; message: string }[] } = {
      code: 'INTERNAL',
      message: 'Something went wrong on the server.',
    };
    const e = err as { type?: string };
    if (err instanceof HttpError) {
      status = err.status;
      error = { code: err.code, message: err.message, ...(err.issues ? { issues: err.issues } : {}) };
    } else if (err instanceof multer.MulterError) {
      status = 400;
      if (err.code === 'LIMIT_FILE_SIZE') error = { code: 'FILE_TOO_LARGE', message: `Zips can be at most ${PLATFORM_RULES.maxUploadMb} MB.` };
      else if (err.code === 'LIMIT_UNEXPECTED_FILE') error = { code: 'UNEXPECTED_FIELD', message: 'Send one zip in the "file" field.' };
      else error = { code: 'UPLOAD_ERROR', message: err.message };
    } else if (e?.type === 'entity.parse.failed') {
      status = 400;
      error = { code: 'BAD_JSON', message: 'Request body is not valid JSON.' };
    } else if (e?.type === 'entity.too.large') {
      status = 413;
      error = { code: 'BODY_TOO_LARGE', message: 'Request body is too large.' };
    } else {
      log.error(`${req.method} ${req.originalUrl} crashed: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`);
    }
    const send = () => {
      if (!res.headersSent) res.status(status).json({ error });
    };
    // An upload rejected mid-stream (too large, not joined, …): drain the rest of the body first so the
    // client reliably reads this response instead of seeing a reset connection.
    if (!req.complete && !req.readableEnded) {
      res.setHeader('Connection', 'close');
      const timer = setTimeout(send, 15_000);
      req.once('end', () => {
        clearTimeout(timer);
        send();
      });
      req.once('error', () => {
        clearTimeout(timer);
        send();
      });
      req.resume();
      return;
    }
    send();
  });

  return app;
}
