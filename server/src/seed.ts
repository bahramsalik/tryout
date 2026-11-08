/**
 * Deterministic seeder: SeedContent → Db + real zip files.
 *
 * Every random choice comes from a string-seeded PRNG (per challenge / per pool), so the same content
 * always produces the same people, scores and ids. Only timestamps move: they are relative to seed time.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  CHALLENGE_TYPES,
  PLATFORM_RULES,
  placementsFor,
  prizeForPlace,
  TYPE_META,
  computeTotalScore,
  type Challenge,
  type ChallengeType,
  type Notification,
  type RubricCriterion,
  type SeedContent,
  type Student,
  type SubmissionTemplate,
} from '../../shared/types.ts';
import { DB_SCHEMA, SEED_VERSION, STARTERS_DIR, UPLOADS_DIR } from './config.ts';
import type { Db, Participation, SubmissionRecord } from './db.ts';
import { aliasCode, applyAward, assignAlias, computeAward, slugify } from './logic.ts';
import { makeRng, shortHash, type Rng } from './rng.ts';
import { buildZip, computeAutoChecks, inspectZip, type ZipInspection } from './zip.ts';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const FIELD_PHRASE: Record<ChallengeType, string> = {
  software: 'software engineering',
  data: 'data analytics',
  design: 'product design',
  product: 'product management',
  marketing: 'marketing',
  finance: 'finance',
  security: 'cybersecurity',
};

const CITIES = [
  'Boston, MA', 'Chicago, IL', 'Austin, TX', 'Seattle, WA', 'Atlanta, GA', 'Denver, CO', 'Philadelphia, PA',
  'Minneapolis, MN', 'Phoenix, AZ', 'Raleigh, NC', 'Columbus, OH', 'San Diego, CA', 'Pittsburgh, PA',
  'Detroit, MI', 'Portland, OR', 'Nashville, TN', 'Baltimore, MD', 'Madison, WI',
];

const AVATAR_COLORS = [
  '#6366F1', '#F43F5E', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6',
  '#EF4444', '#84CC16', '#06B6D4', '#A855F7', '#F97316', '#22C55E', '#3B82F6',
];

type Quality = SubmissionTemplate['quality'];
const TIER_MEAN: Record<Quality, number> = { strong: 4.2, solid: 3.4, weak: 2.4 };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Seeded feedback must meet the feedback guarantee, or "Publish results" would be blocked. */
const ensureFeedback = (text: string) =>
  text.trim().length >= PLATFORM_RULES.minFeedbackChars ? text : `${text.trim()} See the rubric scores for details.`.trim();

/** Rubric scores for a quality tier, lowered until the total is ≤ ceiling. */
export function generateScores(rubric: RubricCriterion[], quality: Quality, r: Rng, ceiling: number): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const c of rubric) scores[c.id] = clamp(Math.round(TIER_MEAN[quality] + r.range(-0.9, 0.9)), 1, 5);
  for (let guard = 0; guard < 100 && computeTotalScore(rubric, scores) > ceiling; guard++) {
    // Lower the highest score, lightest criterion first, so totals land just under the ceiling.
    const target = rubric
      .filter((c) => (scores[c.id] ?? 0) > 1)
      .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0) || a.weight - b.weight)[0];
    if (!target) break;
    scores[target.id] = (scores[target.id] ?? 1) - 1;
  }
  return scores;
}

function qualityMix(n: number, r: Rng): Quality[] {
  const strong = Math.round(n * 0.25);
  const weak = Math.round(n * 0.3);
  const solid = Math.max(0, n - strong - weak);
  const list: Quality[] = [
    ...Array<Quality>(strong).fill('strong'),
    ...Array<Quality>(solid).fill('solid'),
    ...Array<Quality>(weak).fill('weak'),
  ];
  return r.shuffle(list).slice(0, n);
}

function generateBackground(content: SeedContent, named: Student[]): Student[] {
  const r = makeRng('tryout:background');
  const { firstNames, lastNames, universities, majors, bioTemplates, count } = content.background;
  const usedNames = new Set(named.map((s) => s.name.toLowerCase()));
  const usedHandles = new Set(named.map((s) => s.handle));
  const usedIds = new Set(named.map((s) => s.id));
  const skillsByType = new Map<ChallengeType, string[]>();
  for (const ch of content.challenges) {
    const list = skillsByType.get(ch.type) ?? [];
    for (const s of ch.skills) if (!list.includes(s)) list.push(s);
    skillsByType.set(ch.type, list);
  }
  const majorOrder = r.shuffle(majors);
  const out: Student[] = [];
  for (let i = 0; i < count; i++) {
    let name = '';
    for (let tries = 0; tries < 80 && !name; tries++) {
      const candidate = `${r.pick(firstNames)} ${r.pick(lastNames)}`;
      if (!usedNames.has(candidate.toLowerCase())) name = candidate;
    }
    if (!name) name = `${r.pick(firstNames)} ${String.fromCharCode(65 + (i % 26))}. ${r.pick(lastNames)}`;
    usedNames.add(name.toLowerCase());

    const m = majorOrder[i % majorOrder.length]!;
    const type = m.type;
    const interests: ChallengeType[] = [type];
    if (r.chance(0.35)) interests.push(r.pick(CHALLENGE_TYPES.filter((t) => t !== type)));
    const pool = skillsByType.get(type) ?? [];
    const skills = pool.length ? r.sample(pool, r.int(3, 5)) : [TYPE_META[type].label];
    const university = r.pick(universities);
    const bio = r
      .pick(bioTemplates)
      .replaceAll('{major}', m.major)
      .replaceAll('{university}', university)
      .replaceAll('{field}', FIELD_PHRASE[type]);

    const baseHandle = slugify(name) || `student-${i + 1}`;
    let handle = baseHandle;
    for (let n = 2; usedHandles.has(handle); n++) handle = `${baseHandle}-${n}`;
    usedHandles.add(handle);
    let id = `stu_bg${String(i + 1).padStart(2, '0')}`;
    while (usedIds.has(id)) id = `${id}x`;
    usedIds.add(id);

    out.push({
      id,
      handle,
      name,
      university,
      major: m.major,
      gradYear: r.int(2027, 2029),
      location: r.pick(CITIES),
      bio,
      skills,
      interests,
      avatarColor: r.pick(AVATAR_COLORS),
      openToWork: r.chance(0.8),
      links: {},
    });
  }
  return out;
}

export interface SeedSummary {
  companies: number;
  employers: number;
  students: number;
  backgroundStudents: number;
  challenges: number;
  participations: number;
  submissions: number;
  scored: number;
  notifications: number;
  zips: number;
  perChallenge: { id: string; participants: number; submissions: number; scored: number; topScore: number | null }[];
}

export interface SeedOutput {
  db: Db;
  /** Path relative to UPLOADS_DIR → zip bytes. */
  files: Map<string, Buffer>;
  summary: SeedSummary;
}

export function buildSeed(content: SeedContent, contentHash: string, now = Date.now()): SeedOutput {
  const iso = (ms: number) => new Date(Math.round(ms)).toISOString();
  const companies = structuredClone(content.companies);
  const employers = structuredClone(content.employers);
  const named = structuredClone(content.students);
  const background = generateBackground(content, named);
  const students = [...named, ...background];
  const studentIds = new Set(students.map((s) => s.id));

  const challenges: Challenge[] = [];
  const participations: Participation[] = [];
  const submissions: SubmissionRecord[] = [];
  const files = new Map<string, Buffer>();
  const zipCache = new Map<string, { buf: Buffer; info: ZipInspection }>();
  const subIds = new Set<string>();
  const perChallenge: SeedSummary['perChallenge'] = [];

  const templateZip = (challengeId: string, idx: number, tpl: SubmissionTemplate) => {
    const key = `${challengeId}:${idx}`;
    let hit = zipCache.get(key);
    if (!hit) {
      const buf = buildZip(tpl.files);
      hit = { buf, info: inspectZip(buf) };
      zipCache.set(key, hit);
    }
    return hit;
  };

  for (const cs of content.challenges) {
    const r = makeRng(`tryout:challenge:${cs.id}`);
    const { deadlineInDays, createdDaysAgo, seed, ...base } = cs;
    const isPractice = cs.kind === 'practice';
    const isAwarded = cs.status === 'awarded';
    const allScored = isPractice || isAwarded;

    const createdAt = now - createdDaysAgo * DAY - r.int(1, 9) * HOUR - r.int(0, 59) * MIN;
    const deadline = deadlineInDays === null ? null : now + deadlineInDays * DAY;
    const windowStart = createdAt + 30 * MIN;
    let windowEnd = isAwarded ? (deadline ?? now - 2 * DAY) : Math.min(now - 15 * MIN, deadline ?? Number.POSITIVE_INFINITY);
    if (windowEnd < windowStart + HOUR) windowEnd = Math.min(now - MIN, windowStart + HOUR);
    const span = Math.max(MIN, windowEnd - windowStart);
    const awardedAt = isAwarded ? Math.min((deadline ?? now - 2 * DAY) + r.range(1, 3) * DAY, now - HOUR) : null;
    const owner = cs.companyId ? employers.find((e) => e.companyId === cs.companyId) : undefined;

    const challenge: Challenge = {
      ...base,
      deadline: deadline === null ? null : iso(deadline),
      createdAt: iso(createdAt),
      createdBy: owner?.id ?? null,
      awardedAt: awardedAt === null ? null : iso(awardedAt),
    };
    challenges.push(challenge);

    const templates = content.submissionTemplates[cs.id] ?? [];
    const templateIndexFor = (q: Quality) => {
      const i = templates.findIndex((t) => t.quality === q);
      return i >= 0 ? i : Math.min(templates.length - 1, ({ strong: 0, solid: 1, weak: 2 } as const)[q]);
    };

    const scripted = content.scriptedResults.filter((x) => x.challengeId === cs.id && studentIds.has(x.studentId));
    const jns = content.joinedNotSubmitted.filter((x) => x.challengeId === cs.id && studentIds.has(x.studentId));
    const totalSubs = Math.max(seed.submissions, scripted.length);
    const scriptedScored = allScored ? scripted.length : scripted.filter((s) => s.scores).length;
    const genSubsWanted = totalSubs - scripted.length;
    const genScoredWanted = allScored ? genSubsWanted : clamp(seed.scored - scriptedScored, 0, genSubsWanted);
    const genJoinOnlyWanted = Math.max(0, Math.max(seed.participants, totalSubs + jns.length) - totalSubs - jns.length);

    // Background students, weighted toward those interested in this field.
    const excluded = new Set([...scripted.map((s) => s.studentId), ...jns.map((j) => j.studentId)]);
    const chosen = background
      .filter((s) => !excluded.has(s.id))
      .map((s) => ({ s, key: -Math.log(1 - r.next()) / (s.interests.includes(cs.type) ? 4 : 1) }))
      .sort((a, b) => a.key - b.key)
      .slice(0, genSubsWanted + genJoinOnlyWanted)
      .map((x) => x.s);
    const genSubmitters = chosen.slice(0, Math.min(genSubsWanted, chosen.length));
    const genJoiners = chosen.slice(genSubmitters.length);

    const takenCodes = new Set<string>();
    const join = (studentId: string, joinedAt: number) => {
      const alias = assignAlias(cs.id, studentId, takenCodes);
      takenCodes.add(aliasCode(alias));
      const p: Participation = { challengeId: cs.id, studentId, joinedAt: iso(joinedAt), alias };
      participations.push(p);
      return p;
    };

    const est = cs.estHours * HOUR;
    const submitTime = () => windowStart + Math.min(est, span / 2) + Math.pow(r.next(), 0.75) * Math.max(0, span - Math.min(est, span / 2));
    const joinTimeBefore = (submitAt: number) => {
      const latest = Math.max(windowStart, submitAt - Math.min(est, (submitAt - windowStart) / 2) - 20 * MIN);
      return windowStart + Math.pow(r.next(), 1.8) * Math.max(0, latest - windowStart);
    };
    const scoreEnd = isAwarded ? (awardedAt ?? now) - HOUR : now - 10 * MIN;
    const scoreTime = (submitAt: number) => {
      if (isPractice) return submitAt + r.int(15, 90) * 1000;
      const lo = Math.max(submitAt + HOUR, isAwarded && deadline !== null ? deadline : submitAt + HOUR);
      if (lo >= scoreEnd) return Math.max(submitAt + MIN, Math.min(scoreEnd, submitAt + (scoreEnd - submitAt) / 2));
      return lo + r.next() * (scoreEnd - lo);
    };

    const makeSubmission = (args: {
      studentId: string;
      alias: string;
      submittedAt: number;
      templateIdx: number;
      scores: Record<string, number> | null;
      feedback: string | null;
    }) => {
      const tpl = templates[args.templateIdx] ?? templates[0];
      if (!tpl) return;
      let id = `sub_${shortHash(`${cs.id}:${args.studentId}`)}`;
      for (let salt = 1; subIds.has(id); salt++) id = `sub_${shortHash(`${cs.id}:${args.studentId}:${salt}`)}`;
      subIds.add(id);
      const { buf, info } = templateZip(cs.id, args.templateIdx, tpl);
      files.set(`${id}.zip`, buf);
      const totalScore = args.scores ? computeTotalScore(cs.rubric, args.scores) : null;
      submissions.push({
        id,
        challengeId: cs.id,
        studentId: args.studentId,
        submittedAt: iso(args.submittedAt),
        notes: tpl.notes,
        demoUrl: null,
        aiDisclosure: tpl.aiDisclosure ?? null,
        file: {
          originalName: `${cs.id.replace(/^(ch|pr|past)_/, '').replace(/_/g, '-')}-submission.zip`,
          sizeBytes: buf.length,
          fileCount: info.fileCount,
          tree: info.tree,
          readme: info.readme,
        },
        autoChecks: computeAutoChecks(cs.type, info, buf.length),
        status: args.scores ? 'scored' : 'submitted',
        reviewer: args.scores ? (isPractice ? 'coach' : 'employer') : null,
        scores: args.scores,
        totalScore,
        feedback: args.scores ? ensureFeedback(args.feedback ?? tpl.feedback) : null,
        scoredAt: args.scores ? iso(scoreTime(args.submittedAt)) : null,
        rank: null,
        shortlisted: false,
        alias: args.alias,
        scoredBy: args.scores ? (isPractice ? 'coach' : (owner?.id ?? null)) : null,
      });
    };

    // 1) Scripted results for named students.
    for (const s of scripted) {
      const submittedAt = clamp(
        now - s.submittedDaysAgo * DAY - r.int(0, 5) * HOUR - r.int(0, 59) * MIN,
        windowStart + 20 * MIN,
        windowEnd,
      );
      const p = join(s.studentId, joinTimeBefore(submittedAt));
      const tplIdx = templates[s.templateIndex] ? s.templateIndex : 0;
      const tplQuality = templates[tplIdx]?.quality ?? 'solid';
      const scores = s.scores ?? (allScored ? generateScores(cs.rubric, tplQuality, r, PLATFORM_RULES.generatedScoreCeiling) : null);
      makeSubmission({ studentId: s.studentId, alias: p.alias, submittedAt, templateIdx: tplIdx, scores, feedback: s.feedback });
    }

    // 2) Named students who joined but haven't submitted (e.g. Maya on the demo challenge).
    for (const j of jns) join(j.studentId, windowStart + Math.pow(r.next(), 1.2) * span);

    // 3) Generated background submissions; the earliest ones are the scored ones.
    const qualities = qualityMix(genSubmitters.length, r);
    const drafts = genSubmitters
      .map((s, i) => ({ s, quality: qualities[i] ?? 'solid', submittedAt: submitTime() }))
      .sort((a, b) => a.submittedAt - b.submittedAt);
    drafts.forEach((d, i) => {
      const p = join(d.s.id, joinTimeBefore(d.submittedAt));
      const scored = i < genScoredWanted;
      const scores = scored ? generateScores(cs.rubric, d.quality, r, PLATFORM_RULES.generatedScoreCeiling) : null;
      makeSubmission({ studentId: d.s.id, alias: p.alias, submittedAt: d.submittedAt, templateIdx: templateIndexFor(d.quality), scores, feedback: null });
    });

    // 4) Background students who joined and haven't submitted.
    for (const s of genJoiners) join(s.id, windowStart + Math.pow(r.next(), 1.4) * span);

    const mine = submissions.filter((s) => s.challengeId === cs.id);
    if (isAwarded) applyAward(computeAward(challenge, mine), placementsFor(challenge) > 0);
    if (isAwarded && (challenge.prizePool ?? 0) > 0) {
      for (const s of mine) if (s.status === 'awarded' && s.rank) s.prize = prizeForPlace(challenge, s.rank);
    }

    if (cs.starterFiles.length > 0) files.set(`starters/${cs.id}.zip`, buildZip(cs.starterFiles));

    const scoredHere = mine.filter((s) => s.totalScore !== null);
    perChallenge.push({
      id: cs.id,
      participants: participations.filter((p) => p.challengeId === cs.id).length,
      submissions: mine.length,
      scored: scoredHere.length,
      topScore: scoredHere.length ? Math.max(...scoredHere.map((s) => s.totalScore ?? 0)) : null,
    });
  }

  const recipients = new Set([...students.map((s) => s.id), ...companies.map((c) => c.id)]);
  const notifications: Notification[] = [];
  content.seedNotifications.forEach((n, i) => {
    if (!recipients.has(n.recipientId)) return;
    const { daysAgo, ...rest } = n;
    notifications.push({
      ...rest,
      id: `ntf_${shortHash(`seed:${i}:${n.recipientId}:${n.title}`)}`,
      createdAt: iso(now - daysAgo * DAY - (i % 7) * 13 * MIN),
    });
  });

  const db: Db = {
    meta: {
      schema: DB_SCHEMA,
      seedVersion: SEED_VERSION,
      contentHash,
      seedId: shortHash(`${contentHash}:${now}`, 10),
      seededAt: iso(now),
    },
    companies,
    employers,
    students,
    namedStudentIds: named.map((s) => s.id),
    challenges,
    participations,
    submissions,
    notifications,
    content: {
      coachPacks: structuredClone(content.coachPacks),
      rubricTemplates: structuredClone(content.rubricTemplates),
      wizardExamples: structuredClone(content.wizardExamples),
      templateFeedback: Object.fromEntries(
        Object.entries(content.submissionTemplates).map(([id, list]) => [id, list.map((t) => ({ quality: t.quality, feedback: t.feedback }))]),
      ),
    },
  };

  return {
    db,
    files,
    summary: {
      companies: companies.length,
      employers: employers.length,
      students: students.length,
      backgroundStudents: background.length,
      challenges: challenges.length,
      participations: participations.length,
      submissions: submissions.length,
      scored: submissions.filter((s) => s.totalScore !== null).length,
      notifications: notifications.length,
      zips: files.size,
      perChallenge,
    },
  };
}

/** Replaces DATA_DIR/uploads with the seed's zips (submissions + starter kits). */
export function writeSeedFiles(files: Map<string, Buffer>): void {
  fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
  fs.mkdirSync(STARTERS_DIR, { recursive: true });
  for (const [rel, buf] of files) fs.writeFileSync(path.join(UPLOADS_DIR, rel), buf);
}
