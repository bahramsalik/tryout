/**
 * Loads shared/content (S2's seed content), validates it and hashes it.
 *
 * The import is dynamic and wrapped so a half-written content file never takes the API down:
 * callers keep serving the previous data and log the error instead.
 */
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { CHALLENGE_TYPES, PLATFORM_RULES, type SeedContent } from '../../shared/types.ts';
import { CONTENT_ENTRY, SEED_VERSION } from './config.ts';
import { sha256 } from './rng.ts';

/* ───────────── zod schema mirroring SeedContent (shape only; cross-checks below) ───────────── */

const str = z.string();
const typeEnum = z.enum(CHALLENGE_TYPES as unknown as [string, ...string[]]);
const starterFile = z.object({ path: str.min(1), content: str });
const criterion = z.object({ id: str.min(1), name: str.min(1), description: str, weight: z.number() });
const concept = z.object({ concept: str, course: str });

const company = z.object({
  id: str.min(1),
  name: str.min(1),
  industry: str,
  tagline: str,
  about: str,
  logoColor: str,
  logoInitials: str,
  location: str,
  size: str,
  hiringFor: z.array(str),
});
const employer = z.object({ id: str.regex(/^emp_/, 'employer ids start with emp_'), companyId: str, name: str, title: str });
const student = z.object({
  id: str.regex(/^stu_/, 'student ids start with stu_'),
  handle: str.min(1),
  name: str.min(1),
  pronouns: str.optional(),
  university: str,
  major: str,
  gradYear: z.number().int(),
  location: str,
  bio: str,
  skills: z.array(str),
  interests: z.array(typeEnum),
  avatarColor: str,
  openToWork: z.boolean(),
  links: z.object({ github: str.optional(), linkedin: str.optional(), portfolio: str.optional() }),
});
const challengeSeed = z.object({
  id: str.regex(/^(ch|pr|past)_/, 'challenge ids start with ch_, pr_ or past_'),
  kind: z.enum(['live', 'practice']),
  companyId: str.nullable(),
  title: str.min(1),
  summary: str,
  type: typeEnum,
  skills: z.array(str),
  classroomConcepts: z.array(concept),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estHours: z.number().int().min(PLATFORM_RULES.minEstHours).max(PLATFORM_RULES.maxEstHours),
  brief: str,
  deliverables: z.array(str),
  rubric: z.array(criterion).min(1),
  applicantCap: z.number().int().positive().nullable(),
  status: z.enum(['open', 'reviewing', 'awarded']),
  hiringFor: str.nullable(),
  starterFiles: z.array(starterFile),
  aiHints: z.object({ testing: str, steps: z.array(str), greatLooksLike: str, pitfalls: z.array(str) }),
  deadlineInDays: z.number().nullable(),
  createdDaysAgo: z.number(),
  seed: z.object({
    participants: z.number().int().nonnegative(),
    submissions: z.number().int().nonnegative(),
    scored: z.number().int().nonnegative(),
  }),
});
const template = z.object({
  quality: z.enum(['strong', 'solid', 'weak']),
  notes: str,
  files: z.array(starterFile),
  feedback: str,
  aiDisclosure: str.optional(),
});
const scripted = z.object({
  challengeId: str,
  studentId: str,
  scores: z.record(str, z.number()).nullable(),
  feedback: str.nullable(),
  templateIndex: z.number().int().min(0).max(2),
  submittedDaysAgo: z.number(),
});
const notificationSeed = z.object({
  recipientId: str,
  kind: z.enum(['new_challenge', 'submission_received', 'results', 'awarded', 'interview', 'invite_response', 'coach_review', 'cap_reached']),
  title: str,
  body: str,
  link: str.nullable(),
  read: z.boolean(),
  daysAgo: z.number(),
});
const coachPack = z.object({ fieldIntro: str, learningPath: z.array(str), keywords: z.array(str) });
const wizardExample = z.object({
  title: str.min(1),
  summary: str,
  type: typeEnum,
  skills: z.array(str),
  classroomConcepts: z.array(concept).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estHours: z.number().int().min(PLATFORM_RULES.minEstHours).max(PLATFORM_RULES.maxEstHours),
  brief: str,
  deliverables: z.array(str),
  rubric: z.array(criterion).min(1),
  applicantCap: z.number().int().positive().nullable(),
  hiringFor: str.nullable().optional(),
  deadlineInDays: z.number(),
});
const seedContentSchema = z.object({
  companies: z.array(company).min(1),
  employers: z.array(employer).min(1),
  students: z.array(student).min(1),
  background: z.object({
    firstNames: z.array(str).min(1),
    lastNames: z.array(str).min(1),
    universities: z.array(str).min(1),
    majors: z.array(z.object({ major: str, type: typeEnum })).min(1),
    bioTemplates: z.array(str).min(1),
    count: z.number().int().min(0).max(500),
  }),
  challenges: z.array(challengeSeed).min(1),
  submissionTemplates: z.record(str, z.array(template)),
  scriptedResults: z.array(scripted),
  joinedNotSubmitted: z.array(z.object({ challengeId: str, studentId: str })),
  seedNotifications: z.array(notificationSeed),
  coachPacks: z.record(typeEnum, coachPack),
  rubricTemplates: z.record(typeEnum, z.array(criterion)),
  wizardExamples: z.record(str, wizardExample),
});

/* ───────────── cross-reference checks ───────────── */

export interface ContentReport {
  errors: string[];
  warnings: string[];
}

function dupes(values: string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const v of values) (seen.has(v) ? out : seen).add(v);
  return [...out];
}

export function validateContent(raw: unknown): ContentReport & { content: SeedContent | null } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed = seedContentSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues.slice(0, 25)) {
      errors.push(`shape: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    if (parsed.error.issues.length > 25) errors.push(`…and ${parsed.error.issues.length - 25} more shape issues`);
    return { errors, warnings, content: null };
  }
  const c = raw as SeedContent;

  for (const [what, ids] of [
    ['company id', c.companies.map((x) => x.id)],
    ['employer id', c.employers.map((x) => x.id)],
    ['student id', c.students.map((x) => x.id)],
    ['student handle', c.students.map((x) => x.handle)],
    ['challenge id', c.challenges.map((x) => x.id)],
  ] as const) {
    for (const d of dupes([...ids])) errors.push(`duplicate ${what}: ${d}`);
  }

  const companyIds = new Set(c.companies.map((x) => x.id));
  const studentIds = new Set(c.students.map((x) => x.id));
  const challengeById = new Map(c.challenges.map((x) => [x.id, x]));

  for (const e of c.employers) if (!companyIds.has(e.companyId)) errors.push(`employer ${e.id}: unknown companyId ${e.companyId}`);

  for (const ch of c.challenges) {
    const where = `challenge ${ch.id}`;
    if (ch.companyId !== null && !companyIds.has(ch.companyId)) errors.push(`${where}: unknown companyId ${ch.companyId}`);
    if (ch.kind === 'live' && ch.companyId === null) errors.push(`${where}: live challenges need a companyId`);
    const weightSum = ch.rubric.reduce((s, r) => s + r.weight, 0);
    if (weightSum !== 100) errors.push(`${where}: rubric weights sum to ${weightSum}, not 100`);
    for (const d of dupes(ch.rubric.map((r) => r.id))) errors.push(`${where}: duplicate rubric criterion id ${d}`);
    const { participants, submissions, scored } = ch.seed;
    if (!(participants >= submissions && submissions >= scored)) {
      errors.push(`${where}: seed totals must satisfy participants ≥ submissions ≥ scored (got ${participants}/${submissions}/${scored})`);
    }
    if (ch.summary.length > 140) warnings.push(`${where}: summary is ${ch.summary.length} chars (cards expect ≤ 140)`);
    if (ch.kind === 'practice' && (ch.deadlineInDays !== null || ch.applicantCap !== null)) {
      warnings.push(`${where}: practice tasks are evergreen and uncapped (deadlineInDays/applicantCap should be null)`);
    }
    if (ch.status === 'awarded' && (ch.deadlineInDays === null || ch.deadlineInDays >= 0)) {
      warnings.push(`${where}: awarded challenges should have a negative deadlineInDays`);
    }
    if (ch.kind === 'live' && ch.status === 'open' && ch.deadlineInDays !== null && ch.deadlineInDays <= 0) {
      warnings.push(`${where}: open live challenge has a deadline in the past (joins/submissions will be CLOSED)`);
    }
    if ((ch.kind === 'practice' || ch.status === 'awarded') && scored !== submissions) {
      warnings.push(`${where}: ${ch.kind === 'practice' ? 'practice' : 'awarded'} challenges have every submission scored; seeding ${submissions} scored instead of ${scored}`);
    }
    const templates = c.submissionTemplates[ch.id];
    const scriptedHere = c.scriptedResults.filter((r) => r.challengeId === ch.id);
    const needsGenerated = submissions - scriptedHere.length > 0;
    if (!templates || templates.length === 0) {
      (needsGenerated || scriptedHere.length > 0 ? errors : warnings).push(`${where}: no submissionTemplates (need exactly 3: strong, solid, weak)`);
    } else {
      if (templates.length !== 3) warnings.push(`${where}: ${templates.length} submission templates (expected 3)`);
      templates.forEach((t, i) => {
        if (!t.files.some((f) => /^readme(\.[a-z0-9]+)?$/i.test(f.path.split('/').pop() ?? ''))) {
          warnings.push(`${where}: template ${i} (${t.quality}) has no README file`);
        }
        if (t.notes.trim().length < PLATFORM_RULES.minNotesChars) {
          warnings.push(`${where}: template ${i} (${t.quality}) notes are shorter than ${PLATFORM_RULES.minNotesChars} chars`);
        }
        if (t.feedback.trim().length < PLATFORM_RULES.minFeedbackChars) {
          warnings.push(`${where}: template ${i} (${t.quality}) feedback is shorter than ${PLATFORM_RULES.minFeedbackChars} chars (padded at seed time)`);
        }
      });
    }
  }

  for (const key of Object.keys(c.submissionTemplates)) {
    if (!challengeById.has(key)) warnings.push(`submissionTemplates.${key}: no challenge with that id`);
  }

  const pairs = new Set<string>();
  for (const r of c.scriptedResults) {
    const where = `scriptedResult ${r.challengeId}/${r.studentId}`;
    const ch = challengeById.get(r.challengeId);
    if (!ch) {
      errors.push(`${where}: unknown challenge`);
      continue;
    }
    if (!studentIds.has(r.studentId)) errors.push(`${where}: unknown student (scripted results are for named students)`);
    const key = `${r.challengeId}:${r.studentId}`;
    if (pairs.has(key)) errors.push(`${where}: duplicate`);
    pairs.add(key);
    if (r.scores) {
      const ids = new Set(ch.rubric.map((x) => x.id));
      for (const k of Object.keys(r.scores)) if (!ids.has(k)) errors.push(`${where}: score for unknown criterion "${k}"`);
      for (const x of ch.rubric) {
        const v = r.scores[x.id];
        if (v === undefined) errors.push(`${where}: missing score for criterion "${x.id}"`);
        else if (!Number.isInteger(v) || v < PLATFORM_RULES.scoreMin || v > PLATFORM_RULES.scoreMax) {
          errors.push(`${where}: score ${x.id}=${v} must be an integer 1–5`);
        }
      }
      if (r.feedback !== null && r.feedback.trim().length < PLATFORM_RULES.minFeedbackChars) {
        warnings.push(`${where}: feedback shorter than ${PLATFORM_RULES.minFeedbackChars} chars`);
      }
    }
    const templates = c.submissionTemplates[r.challengeId];
    if (templates && !templates[r.templateIndex]) errors.push(`${where}: templateIndex ${r.templateIndex} out of range`);
    if (ch.deadlineInDays !== null && -r.submittedDaysAgo > ch.deadlineInDays) {
      warnings.push(`${where}: submittedDaysAgo ${r.submittedDaysAgo} is after the deadline; clamped`);
    }
    if (r.submittedDaysAgo > ch.createdDaysAgo) warnings.push(`${where}: submitted before the challenge was created; clamped`);
  }

  for (const j of c.joinedNotSubmitted) {
    const where = `joinedNotSubmitted ${j.challengeId}/${j.studentId}`;
    if (!challengeById.has(j.challengeId)) errors.push(`${where}: unknown challenge`);
    if (!studentIds.has(j.studentId)) errors.push(`${where}: unknown student`);
    const key = `${j.challengeId}:${j.studentId}`;
    if (pairs.has(key)) errors.push(`${where}: also listed in scriptedResults (or duplicated)`);
    pairs.add(key);
  }

  // Totals INCLUDE scripted results and joined-not-submitted students.
  for (const ch of c.challenges) {
    const scriptedHere = c.scriptedResults.filter((r) => r.challengeId === ch.id);
    const jns = c.joinedNotSubmitted.filter((j) => j.challengeId === ch.id).length;
    const scriptedScored = scriptedHere.filter((r) => r.scores).length;
    const { participants, submissions, scored } = ch.seed;
    if (scriptedHere.length + jns > participants) {
      warnings.push(`challenge ${ch.id}: ${scriptedHere.length} scripted + ${jns} joined > participants ${participants}; seeding ${scriptedHere.length + jns}`);
    }
    if (scriptedHere.length > submissions) warnings.push(`challenge ${ch.id}: ${scriptedHere.length} scripted > submissions ${submissions}`);
    if (ch.kind === 'live' && ch.status !== 'awarded' && scriptedScored > scored) {
      warnings.push(`challenge ${ch.id}: ${scriptedScored} scripted scored > scored ${scored}`);
    }
    const generated = participants - scriptedHere.length - jns;
    if (generated > c.background.count) {
      warnings.push(`challenge ${ch.id}: needs ${generated} background participants but background.count is ${c.background.count}; capped`);
    }
    if (ch.applicantCap !== null && participants > ch.applicantCap) {
      warnings.push(`challenge ${ch.id}: ${participants} participants exceed applicantCap ${ch.applicantCap}`);
    }
  }

  const recipients = new Set([...studentIds, ...companyIds]);
  c.seedNotifications.forEach((n, i) => {
    if (!recipients.has(n.recipientId)) warnings.push(`seedNotifications[${i}]: unknown recipient ${n.recipientId}; skipped`);
  });

  for (const [key, ex] of Object.entries(c.wizardExamples)) {
    if (!companyIds.has(key)) warnings.push(`wizardExamples.${key}: no company with that id`);
    const sum = ex.rubric.reduce((s, r) => s + r.weight, 0);
    if (sum !== 100) warnings.push(`wizardExamples.${key}: rubric weights sum to ${sum}, not 100`);
  }
  for (const t of CHALLENGE_TYPES) {
    const sum = (c.rubricTemplates[t] ?? []).reduce((s, r) => s + r.weight, 0);
    if (sum !== 100) warnings.push(`rubricTemplates.${t}: weights sum to ${sum}, not 100`);
  }

  // Demo-critical ids (SPEC §4). Missing ones don't block seeding, but the demo and smoke test need them.
  if (!studentIds.has('stu_maya')) warnings.push('demo: student stu_maya is missing');
  if (!c.employers.some((e) => e.id === 'emp_jordan')) warnings.push('demo: employer emp_jordan is missing');
  if (!challengeById.has('ch_rate_limiter')) warnings.push('demo: challenge ch_rate_limiter is missing');

  return { errors, warnings, content: errors.length ? null : c };
}

/* ───────────── loading ───────────── */

export type ContentLoad =
  | { ok: true; content: SeedContent; hash: string; warnings: string[] }
  | { ok: false; error: string; details: string[] };

export function hashContent(content: SeedContent): string {
  return sha256(JSON.stringify({ seedVersion: SEED_VERSION, content }));
}

export async function loadContent(): Promise<ContentLoad> {
  let mod: Record<string, unknown>;
  try {
    // Cache-bust so a reload in the same process picks up edits to index.ts.
    mod = (await import(`${pathToFileURL(CONTENT_ENTRY).href}?t=${Date.now()}`)) as Record<string, unknown>;
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return { ok: false, error: `could not import shared/content/index.ts — ${msg}`, details: [] };
  }
  const raw = mod.seedContent ?? mod.default;
  if (!raw) return { ok: false, error: 'shared/content/index.ts does not export `seedContent`', details: [] };
  const report = validateContent(raw);
  if (!report.content) {
    return { ok: false, error: `seed content failed validation (${report.errors.length} error(s))`, details: report.errors };
  }
  return { ok: true, content: report.content, hash: hashContent(report.content), warnings: report.warnings };
}
