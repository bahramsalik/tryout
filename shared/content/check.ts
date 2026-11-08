/**
 * Sanity checks for the seed content (S2). Run from the repo root:
 *
 *   npx -y tsx shared/content/check.ts              # checks shared/content/index.ts
 *   npx -y tsx shared/content/check.ts ./other.ts   # checks another module (path relative to this file)
 *
 * Exits non-zero when a check fails. Warnings are printed but don't fail the run.
 */
import {
  CHALLENGE_TYPES,
  PLATFORM_RULES,
  computeTotalScore,
  type ChallengeSeed,
  type ChallengeType,
  type RubricCriterion,
  type ScriptedResult,
  type SeedContent,
} from '../types.ts';

const proc = (globalThis as unknown as { process: { argv: string[]; exitCode?: number } }).process;

/* ───────────────────────── Expected values (SPEC.md §6) ───────────────────────── */

interface Expected {
  kind: 'live' | 'practice';
  companyId: string | null;
  type: ChallengeType;
  title: string;
  estHours: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cap: number | null;
  status: 'open' | 'awarded';
  deadlineInDays: number | null;
  seed: [number, number, number];
}

const EXPECTED: Record<string, Expected> = {
  ch_rate_limiter: { kind: 'live', companyId: 'co_orbitline', type: 'software', title: 'Add rate limiting to our Shipment Tracking API', estHours: 4, difficulty: 'intermediate', cap: 40, status: 'open', deadlineInDays: 1, seed: [15, 14, 14] },
  ch_churn: { kind: 'live', companyId: 'co_fernhill', type: 'data', title: 'Why are patients cancelling their telehealth plans?', estHours: 4, difficulty: 'intermediate', cap: 50, status: 'open', deadlineInDays: 5, seed: [31, 9, 4] },
  ch_onboarding: { kind: 'live', companyId: 'co_kitebird', type: 'design', title: 'Redesign first-run onboarding to get new users to a first post', estHours: 4, difficulty: 'intermediate', cap: 30, status: 'open', deadlineInDays: 6, seed: [19, 6, 0] },
  ch_variance: { kind: 'live', companyId: 'co_cobalt', type: 'finance', title: 'Explain the Q3 budget miss to the CFO', estHours: 3, difficulty: 'beginner', cap: 40, status: 'open', deadlineInDays: 4, seed: [12, 3, 0] },
  ch_launch: { kind: 'live', companyId: 'co_sproutly', type: 'marketing', title: 'Launch plan for chickpea crisps on a $10k budget', estHours: 3, difficulty: 'beginner', cap: 60, status: 'open', deadlineInDays: 9, seed: [27, 5, 0] },
  ch_soc_triage: { kind: 'live', companyId: 'co_ironvale', type: 'security', title: 'Triage a night of SIEM alerts', estHours: 3, difficulty: 'intermediate', cap: 35, status: 'open', deadlineInDays: 3, seed: [22, 11, 6] },
  ch_eta_prd: { kind: 'live', companyId: 'co_orbitline', type: 'product', title: 'Write the PRD for live delivery-ETA notifications', estHours: 3, difficulty: 'beginner', cap: 25, status: 'open', deadlineInDays: 7, seed: [8, 2, 0] },
  pr_flaky_tests: { kind: 'practice', companyId: null, type: 'software', title: 'Fix a flaky test suite', estHours: 3, difficulty: 'beginner', cap: null, status: 'open', deadlineInDays: null, seed: [38, 24, 24] },
  pr_messy_data: { kind: 'practice', companyId: 'co_fernhill', type: 'data', title: 'Reconcile two messy clinic-visit exports', estHours: 3, difficulty: 'beginner', cap: null, status: 'open', deadlineInDays: null, seed: [29, 17, 17] },
  pr_a11y_audit: { kind: 'practice', companyId: null, type: 'design', title: 'Accessibility audit of a checkout page', estHours: 3, difficulty: 'beginner', cap: null, status: 'open', deadlineInDays: null, seed: [21, 12, 12] },
  pr_interviews: { kind: 'practice', companyId: null, type: 'product', title: 'Synthesize six user-interview transcripts into insights', estHours: 4, difficulty: 'intermediate', cap: null, status: 'open', deadlineInDays: null, seed: [14, 7, 7] },
  pr_ab_test: { kind: 'practice', companyId: null, type: 'marketing', title: 'Design and size an email A/B test', estHours: 3, difficulty: 'intermediate', cap: null, status: 'open', deadlineInDays: null, seed: [18, 9, 9] },
  pr_3_statement: { kind: 'practice', companyId: 'co_cobalt', type: 'finance', title: 'Build a 3-statement model for a coffee subscription startup', estHours: 5, difficulty: 'advanced', cap: null, status: 'open', deadlineInDays: null, seed: [11, 4, 4] },
  pr_phishing: { kind: 'practice', companyId: 'co_ironvale', type: 'security', title: 'Dissect a phishing email and write the staff advisory', estHours: 3, difficulty: 'beginner', cap: null, status: 'open', deadlineInDays: null, seed: [33, 20, 20] },
  past_csv_import: { kind: 'live', companyId: 'co_orbitline', type: 'software', title: 'Build a CSV shipment-import validator', estHours: 4, cap: 30, status: 'awarded', deadlineInDays: -20, seed: [30, 22, 22] },
  past_wait_dashboard: { kind: 'live', companyId: 'co_fernhill', type: 'data', title: 'Build a clinic wait-time dashboard', estHours: 4, cap: 30, status: 'awarded', deadlineInDays: -35, seed: [28, 18, 18] },
  past_release_notes: { kind: 'live', companyId: 'co_kitebird', type: 'product', title: 'Write release notes + an in-app announcement for Groups', estHours: 3, cap: 25, status: 'awarded', deadlineInDays: -50, seed: [20, 12, 12] },
};

/** challengeId:studentId → expected computeTotalScore (null = submitted, not scored yet). */
const EXPECTED_TOTALS: Record<string, number | null> = {
  'ch_rate_limiter:stu_hana': 91,
  'ch_rate_limiter:stu_arjun': 84,
  'ch_churn:stu_diego': 88,
  'ch_churn:stu_malik': null,
  'ch_onboarding:stu_amara': null,
  'ch_onboarding:stu_riley': null,
  'ch_variance:stu_kwame': null,
  'ch_launch:stu_sofia': null,
  'ch_launch:stu_malik': null,
  'ch_soc_triage:stu_zara': 93,
  'ch_eta_prd:stu_riley': null,
  'pr_flaky_tests:stu_maya': 86,
  'pr_flaky_tests:stu_hana': 93,
  'pr_messy_data:stu_maya': 84,
  'pr_a11y_audit:stu_amara': 92,
  'pr_interviews:stu_riley': 90,
  'pr_ab_test:stu_malik': 90,
  'pr_ab_test:stu_sofia': 81,
  'pr_3_statement:stu_kwame': 91,
  'pr_3_statement:stu_diego': 82,
  'pr_phishing:stu_zara': 95,
  'pr_phishing:stu_arjun': 85,
  'past_csv_import:stu_maya': 92,
  'past_csv_import:stu_hana': 90,
  'past_csv_import:stu_arjun': 87,
  'past_csv_import:stu_zara': 80,
  'past_wait_dashboard:stu_diego': 94,
  'past_wait_dashboard:stu_kwame': 90,
  'past_wait_dashboard:stu_maya': 86,
  'past_wait_dashboard:stu_malik': 75,
  'past_release_notes:stu_riley': 95,
  'past_release_notes:stu_sofia': 89,
  'past_release_notes:stu_amara': 87,
  'past_release_notes:stu_maya': 74,
};

/** Past challenges: who must hold places 1–3 (generated scores never beat a scripted one > 85). */
const EXPECTED_PODIUM: Record<string, string[]> = {
  past_csv_import: ['stu_maya', 'stu_hana', 'stu_arjun'],
  past_wait_dashboard: ['stu_diego', 'stu_kwame', 'stu_maya'],
  past_release_notes: ['stu_riley', 'stu_sofia', 'stu_amara'],
};

/** The rubric clicks the employer gives Maya live in the demo (SPEC §4: ≈ 88 → 2nd place). */
const MAYA_DEMO_CLICKS = { correctness: 5, design: 4, tests: 4, code_quality: 4, communication: 5 };

const COMPANY_IDS = ['co_orbitline', 'co_fernhill', 'co_kitebird', 'co_cobalt', 'co_sproutly', 'co_ironvale'];
const EMPLOYERS: [string, string, string, string][] = [
  ['emp_jordan', 'co_orbitline', 'Jordan Park', 'Talent Lead'],
  ['emp_priya', 'co_fernhill', 'Priya Nair', 'Analytics Manager'],
  ['emp_sam', 'co_kitebird', 'Sam Ortiz', 'Design Director'],
  ['emp_grace', 'co_cobalt', 'Grace Liu', 'FP&A Manager'],
  ['emp_marcus', 'co_sproutly', 'Marcus Bell', 'Brand Manager'],
  ['emp_tomas', 'co_ironvale', 'Tomás Reyes', 'SOC Lead'],
];
const BRIEF_SECTIONS = ['## Context', '## The task', '## Constraints', '## What we provide'];
const MAX_FILE_BYTES = 15 * 1024;

/** Text budget (SPEC-FLUENT §6). */
const TEXT = { summaryChars: 90, criterionWords: 12, notificationTitleWords: 6, notificationBodyWords: 8 };

/* ───────────────────────────── Helpers ───────────────────────────── */

const errors: string[] = [];
const warnings: string[] = [];
const check = (ok: unknown, msg: string): void => {
  if (!ok) errors.push(msg);
};
const warnIf = (bad: unknown, msg: string): void => {
  if (bad) warnings.push(msg);
};
const words = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;
const sentences = (s: string): number => (s.trim().match(/[.!?](?=\s|$)/g) ?? []).length;
/** Words for the text budget: like `words`, but bare separators (`·`, `—`, `+`) don't count. */
const budgetWords = (s: string): number => s.trim().split(/\s+/).filter((t) => t && !/^[·—–\-+|/]$/.test(t)).length;
const NO_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const bytes = (s: string): number => new TextEncoder().encode(s).length;
const between = (n: number, lo: number, hi: number): boolean => n >= lo && n <= hi;
const dupes = (xs: string[]): string[] => xs.filter((x, i) => xs.indexOf(x) !== i);
const key = (challengeId: string, studentId: string): string => `${challengeId}:${studentId}`;

function checkRubric(where: string, rubric: RubricCriterion[], min = 4, max = 5, maxDescWords = Infinity): void {
  check(between(rubric.length, min, max), `${where}: rubric has ${rubric.length} criteria (want ${min}–${max})`);
  const sum = rubric.reduce((s, c) => s + c.weight, 0);
  check(sum === 100, `${where}: rubric weights sum to ${sum}, not 100`);
  check(dupes(rubric.map((c) => c.id)).length === 0, `${where}: duplicate criterion ids`);
  for (const c of rubric) {
    check(/^[a-z][a-z0-9_]*$/.test(c.id), `${where}: criterion id "${c.id}" should be snake_case`);
    check(Number.isInteger(c.weight) && c.weight > 0, `${where}: criterion ${c.id} weight ${c.weight} must be a positive integer`);
    check(c.name.trim().length > 0 && c.description.trim().length >= 15, `${where}: criterion ${c.id} needs a name and description`);
    check(budgetWords(c.description) <= maxDescWords, `${where}: criterion ${c.id} description is ${budgetWords(c.description)} words (max ${maxDescWords})`);
  }
}

function checkBrief(where: string, brief: string, lo: number, hi: number): number {
  const n = words(brief);
  check(between(n, lo, hi), `${where}: brief is ${n} words (want ${lo}–${hi})`);
  let last = -1;
  for (const s of BRIEF_SECTIONS) {
    const at = brief.indexOf(`${s}\n`);
    check(at > last, `${where}: brief is missing "${s}" or it's out of order`);
    last = at;
  }
  return n;
}

function walkStrings(value: unknown, path: string, visit: (s: string, path: string) => void): void {
  if (typeof value === 'string') visit(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, visit));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, `${path}.${k}`, visit);
  }
}

function inSafeRange(ip: string): boolean {
  const [a = -1, b = -1, c = -1] = ip.split('.').map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

/* ───────────────────────────── Checks ───────────────────────────── */

function run(content: SeedContent): void {
  const { companies, employers, students, background, challenges, submissionTemplates, scriptedResults } = content;

  // Companies and employers
  check(companies.length === 6, `want 6 companies, have ${companies.length}`);
  check(dupes(companies.map((c) => c.id)).length === 0, 'duplicate company ids');
  for (const id of COMPANY_IDS) check(companies.some((c) => c.id === id), `missing company ${id}`);
  for (const c of companies) {
    check(c.hiringFor.length > 0, `${c.id}: hiringFor is empty`);
    check(/^#[0-9A-Fa-f]{6}$/.test(c.logoColor), `${c.id}: logoColor must be a hex color`);
    check(between(c.logoInitials.length, 1, 3), `${c.id}: logoInitials should be 1–3 chars`);
    check(between(sentences(c.about), 2, 3), `${c.id}: about should be 2–3 sentences`);
  }
  check(employers.length === 6, `want 6 employers, have ${employers.length}`);
  check(dupes(employers.map((e) => e.id)).length === 0, 'duplicate employer ids');
  for (const [id, companyId, name, title] of EMPLOYERS) {
    const e = employers.find((x) => x.id === id);
    check(e && e.companyId === companyId && e.name === name && e.title === title, `employer ${id} should be ${name}, ${title} at ${companyId}`);
  }

  // Students
  const studentIds = new Set(students.map((s) => s.id));
  check(students.length === 10, `want 10 named students, have ${students.length}`);
  check(dupes(students.map((s) => s.id)).length === 0, 'duplicate student ids');
  check(dupes(students.map((s) => s.handle)).length === 0, 'duplicate student handles');
  for (const s of students) {
    check(/^stu_[a-z]+$/.test(s.id), `${s.id}: id should look like stu_name`);
    check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.handle), `${s.id}: handle "${s.handle}" should be kebab-case`);
    check(s.interests.length > 0 && s.interests.every((t) => CHALLENGE_TYPES.includes(t)), `${s.id}: interests must be valid types`);
    check(s.skills.length >= 3, `${s.id}: needs at least 3 skills`);
    check(/^#[0-9A-Fa-f]{6}$/.test(s.avatarColor), `${s.id}: avatarColor must be a hex color`);
  }
  const covered = new Set(students.flatMap((s) => s.interests));
  for (const t of CHALLENGE_TYPES) check(covered.has(t), `no named student is interested in ${t}`);
  const maya = students.find((s) => s.id === 'stu_maya');
  check(
    maya &&
      maya.handle === 'maya-chen' &&
      maya.name === 'Maya Chen' &&
      maya.university === 'Northbridge University' &&
      /Computer Science/.test(maya.major) &&
      /Data Science/.test(maya.major) &&
      maya.interests.includes('software') &&
      maya.interests.includes('data'),
    'stu_maya must be Maya Chen (maya-chen), CS with a Data Science minor at Northbridge University, interests software + data',
  );
  const hana = students.find((s) => s.id === 'stu_hana');
  check(hana && hana.name === 'Hana Sato' && hana.interests.includes('software'), 'stu_hana must be Hana Sato (software)');

  // Background pools
  check(background.firstNames.length >= 25 && dupes(background.firstNames).length === 0, 'background.firstNames: want ≥ 25 unique');
  check(background.lastNames.length >= 25 && dupes(background.lastNames).length === 0, 'background.lastNames: want ≥ 25 unique');
  check(background.universities.length === 8 && dupes(background.universities).length === 0, 'background.universities: want 8 unique');
  check(background.majors.length === 14, `background.majors: want 14, have ${background.majors.length}`);
  for (const t of CHALLENGE_TYPES) check(background.majors.some((m) => m.type === t), `background.majors: no major for ${t}`);
  check(background.bioTemplates.length === 4, 'background.bioTemplates: want 4');
  for (const b of background.bioTemplates) check(b.includes('{major}') && b.includes('{university}') && b.includes('{field}'), `bio template lacks a placeholder: ${b}`);
  check(background.count === 40, `background.count should be 40, is ${background.count}`);
  for (const s of students) check(background.universities.includes(s.university), `${s.id}: university "${s.university}" isn't in the background pool`);
  const reserved = new Set([...employers.map((e) => e.name.split(' ')[0]), ...students.map((s) => s.name.split(' ')[0])]);
  warnIf(background.firstNames.some((n) => reserved.has(n)), 'background.firstNames reuses a persona first name');

  // Challenges
  check(challenges.length === 17, `want 17 challenges, have ${challenges.length}`);
  check(dupes(challenges.map((c) => c.id)).length === 0, 'duplicate challenge ids');
  const byId = new Map<string, ChallengeSeed>(challenges.map((c) => [c.id, c]));
  for (const id of Object.keys(EXPECTED)) check(byId.has(id), `missing challenge ${id}`);
  const companyById = new Map(companies.map((c) => [c.id, c]));

  for (const c of challenges) {
    const w = c.id;
    const exp = EXPECTED[w];
    check(exp, `${w}: not in SPEC §6`);
    if (exp) {
      check(c.kind === exp.kind, `${w}: kind ${c.kind} ≠ ${exp.kind}`);
      check(c.companyId === exp.companyId, `${w}: companyId ${c.companyId} ≠ ${exp.companyId}`);
      check(c.type === exp.type, `${w}: type ${c.type} ≠ ${exp.type}`);
      check(c.title === exp.title, `${w}: title "${c.title}" ≠ "${exp.title}"`);
      check(c.estHours === exp.estHours, `${w}: estHours ${c.estHours} ≠ ${exp.estHours}`);
      if (exp.difficulty) check(c.difficulty === exp.difficulty, `${w}: difficulty ${c.difficulty} ≠ ${exp.difficulty}`);
      check(c.applicantCap === exp.cap, `${w}: applicantCap ${c.applicantCap} ≠ ${exp.cap}`);
      check(c.status === exp.status, `${w}: status ${c.status} ≠ ${exp.status}`);
      check(c.deadlineInDays === exp.deadlineInDays, `${w}: deadlineInDays ${c.deadlineInDays} ≠ ${exp.deadlineInDays}`);
      const [p, s, sc] = exp.seed;
      check(c.seed.participants === p && c.seed.submissions === s && c.seed.scored === sc, `${w}: seed ${JSON.stringify(c.seed)} ≠ ${p}/${s}/${sc}`);
    }
    check(Number.isInteger(c.estHours) && between(c.estHours, PLATFORM_RULES.minEstHours, PLATFORM_RULES.maxEstHours), `${w}: estHours must be an integer 1–5`);
    check(c.summary.length <= TEXT.summaryChars && c.summary.length >= 30, `${w}: summary is ${c.summary.length} chars (want 30–${TEXT.summaryChars})`);
    checkBrief(w, c.brief, 250, 450);
    check(between(c.deliverables.length, 3, 5), `${w}: ${c.deliverables.length} deliverables (want 3–5)`);
    check(between(c.skills.length, 3, 6), `${w}: ${c.skills.length} skills (want 3–6)`);
    check(between(c.classroomConcepts.length, 2, 4), `${w}: ${c.classroomConcepts.length} classroom concepts (want 2–4)`);
    for (const cc of c.classroomConcepts) check(cc.concept.trim() && cc.course.trim(), `${w}: empty classroom concept`);
    checkRubric(w, c.rubric);
    check(c.aiHints.testing.trim().length >= 40, `${w}: aiHints.testing is too short`);
    check(between(c.aiHints.steps.length, 4, 6), `${w}: aiHints.steps has ${c.aiHints.steps.length} (want 4–6)`);
    check(c.aiHints.greatLooksLike.trim().length >= 40, `${w}: aiHints.greatLooksLike is too short`);
    check(between(c.aiHints.pitfalls.length, 3, 5), `${w}: aiHints.pitfalls has ${c.aiHints.pitfalls.length} (want 3–5)`);
    check(c.createdDaysAgo > 0, `${w}: createdDaysAgo must be > 0`);

    // Kind-specific rules
    if (c.kind === 'practice') {
      check(c.hiringFor === null, `${w}: practice tasks have hiringFor null`);
      check(c.applicantCap === null && c.deadlineInDays === null, `${w}: practice is uncapped and evergreen`);
      check(c.seed.submissions === c.seed.scored, `${w}: practice submissions are all Coach-reviewed (submissions = scored)`);
    } else {
      check(c.companyId && companyById.has(c.companyId), `${w}: live challenges need a valid companyId`);
      check(c.hiringFor, `${w}: live and past challenges need hiringFor`);
      const roles = (c.companyId && companyById.get(c.companyId)?.hiringFor) || [];
      check(c.hiringFor && roles.some((r) => c.hiringFor!.startsWith(r)), `${w}: hiringFor "${c.hiringFor}" should start with one of ${c.companyId}'s roles`);
      if (c.status === 'awarded') {
        check(c.deadlineInDays !== null && c.deadlineInDays < 0, `${w}: awarded challenges ended in the past`);
        check(c.createdDaysAgo > -(c.deadlineInDays ?? 0), `${w}: created after its deadline`);
        check(c.seed.submissions === c.seed.scored, `${w}: awarded challenges have every submission scored`);
      } else {
        check(c.deadlineInDays !== null && c.deadlineInDays > 0, `${w}: open live challenges need a future deadline`);
      }
    }

    // Starter files
    check(c.starterFiles.length >= 2, `${w}: needs starter files`);
    check(c.starterFiles.some((f) => f.path === 'README.md'), `${w}: starter kit needs a README.md`);
    check(dupes(c.starterFiles.map((f) => f.path)).length === 0, `${w}: duplicate starter paths`);
    for (const f of c.starterFiles) {
      check(!f.path.startsWith('/') && !f.path.includes('..') && !f.path.includes('\\'), `${w}: bad starter path ${f.path}`);
      check(bytes(f.content) < MAX_FILE_BYTES, `${w}: starter ${f.path} is ${bytes(f.content)} B (limit 15 KB)`);
      check(f.content.trim().length > 0, `${w}: starter ${f.path} is empty`);
      if (f.path.endsWith('.json')) {
        try {
          JSON.parse(f.content);
        } catch {
          errors.push(`${w}: starter ${f.path} is not valid JSON`);
        }
      }
    }

    // Templates
    const ts = submissionTemplates[c.id];
    check(ts && ts.length === 3, `${w}: needs exactly 3 submission templates`);
    if (ts) {
      check(ts.map((t) => t.quality).join() === 'strong,solid,weak', `${w}: templates must be ordered strong, solid, weak`);
      ts.forEach((t, i) => {
        const tw = `${w} template ${i} (${t.quality})`;
        check(between(words(t.notes), 120, 250), `${tw}: notes are ${words(t.notes)} words (want 120–250)`);
        check(between(t.files.length, 3, 6), `${tw}: ${t.files.length} files (want 3–6)`);
        check(t.files.some((f) => f.path === 'README.md'), `${tw}: needs README.md`);
        check(dupes(t.files.map((f) => f.path)).length === 0, `${tw}: duplicate file paths`);
        for (const f of t.files) {
          check(bytes(f.content) < MAX_FILE_BYTES, `${tw}: ${f.path} is ${bytes(f.content)} B (limit 15 KB)`);
          check(f.content.trim().length > 0, `${tw}: ${f.path} is empty`);
          warnIf(bytes(f.content) > 6 * 1024, `${tw}: ${f.path} is ${bytes(f.content)} B (aim ≤ ~4 KB)`);
          if (f.path.endsWith('.json')) {
            try {
              JSON.parse(f.content);
            } catch {
              errors.push(`${tw}: ${f.path} is not valid JSON`);
            }
          }
        }
        check(t.feedback.length >= PLATFORM_RULES.minFeedbackChars, `${tw}: feedback too short`);
        warnIf(!between(sentences(t.feedback), 2, 4), `${tw}: feedback has ~${sentences(t.feedback)} sentences (want 2–4)`);
      });
      warnIf(ts.filter((t) => t.aiDisclosure).length < 2, `${w}: fewer than 2 templates have an aiDisclosure`);
    }
  }
  for (const id of Object.keys(submissionTemplates)) check(byId.has(id), `submissionTemplates has unknown challenge ${id}`);

  // Scripted results
  const seenPairs = new Set<string>();
  for (const r of scriptedResults) {
    const w = `scripted ${key(r.challengeId, r.studentId)}`;
    const c = byId.get(r.challengeId);
    check(c, `${w}: unknown challenge`);
    check(studentIds.has(r.studentId), `${w}: unknown (non-named) student`);
    check(!seenPairs.has(key(r.challengeId, r.studentId)), `${w}: duplicate`);
    seenPairs.add(key(r.challengeId, r.studentId));
    check(Number.isInteger(r.templateIndex) && between(r.templateIndex, 0, 2), `${w}: templateIndex must be 0–2`);
    check(r.submittedDaysAgo >= 0, `${w}: submittedDaysAgo must be ≥ 0`);
    if (!c) continue;
    check(r.submittedDaysAgo <= c.createdDaysAgo, `${w}: submitted before the challenge was created`);
    if (c.deadlineInDays !== null && c.deadlineInDays < 0) check(r.submittedDaysAgo >= -c.deadlineInDays, `${w}: submitted after the deadline`);
    if (r.scores === null) {
      check(r.feedback === null, `${w}: unscored results have feedback null`);
      check(c.kind === 'live' && c.status === 'open', `${w}: only open live challenges can have unscored submissions`);
    } else {
      const ids = c.rubric.map((x) => x.id).sort().join();
      check(Object.keys(r.scores).sort().join() === ids, `${w}: scores must cover exactly the rubric ids (${ids})`);
      for (const [k, v] of Object.entries(r.scores)) check(Number.isInteger(v) && between(v, PLATFORM_RULES.scoreMin, PLATFORM_RULES.scoreMax), `${w}: score ${k}=${v} must be an integer 1–5`);
      check(r.feedback && r.feedback.length >= PLATFORM_RULES.minFeedbackChars, `${w}: scored results need feedback ≥ ${PLATFORM_RULES.minFeedbackChars} chars`);
      warnIf(r.feedback && !between(sentences(r.feedback), 2, 4), `${w}: feedback has ~${sentences(r.feedback ?? '')} sentences (want 2–4)`);
    }
    const want = EXPECTED_TOTALS[key(r.challengeId, r.studentId)];
    check(want !== undefined, `${w}: not in the expected results table`);
    const got = r.scores ? computeTotalScore(c.rubric, r.scores) : null;
    if (want !== undefined) check(got === want, `${w}: total ${got} ≠ expected ${want}`);
  }
  for (const k of Object.keys(EXPECTED_TOTALS)) check(seenPairs.has(k), `missing scripted result ${k}`);

  // Joined, not submitted
  check(content.joinedNotSubmitted.some((j) => j.challengeId === 'ch_rate_limiter' && j.studentId === 'stu_maya'), 'Maya must have joined ch_rate_limiter without submitting');
  for (const j of content.joinedNotSubmitted) {
    const w = `joinedNotSubmitted ${key(j.challengeId, j.studentId)}`;
    const c = byId.get(j.challengeId);
    check(c && c.kind === 'live' && c.status === 'open', `${w}: must be an open live challenge`);
    check(studentIds.has(j.studentId), `${w}: unknown student`);
    check(!seenPairs.has(key(j.challengeId, j.studentId)), `${w}: also has a scripted submission`);
    seenPairs.add(key(j.challengeId, j.studentId));
  }

  // Seed counts vs scripted
  const total = (r: ScriptedResult): number | null => {
    const c = byId.get(r.challengeId);
    return c && r.scores ? computeTotalScore(c.rubric, r.scores) : null;
  };
  for (const c of challenges) {
    const rs = scriptedResults.filter((r) => r.challengeId === c.id);
    const scored = rs.filter((r) => r.scores !== null).length;
    const unscored = rs.length - scored;
    const joined = content.joinedNotSubmitted.filter((j) => j.challengeId === c.id).length;
    const { participants, submissions, scored: seedScored } = c.seed;
    check(participants >= submissions && submissions >= seedScored, `${c.id}: seed must satisfy participants ≥ submissions ≥ scored`);
    check(seedScored >= scored, `${c.id}: seed.scored ${seedScored} < scripted scored ${scored}`);
    check(submissions >= rs.length, `${c.id}: seed.submissions ${submissions} < scripted ${rs.length}`);
    check(submissions - seedScored >= unscored, `${c.id}: not enough unscored slots for ${unscored} unscored scripted results`);
    check(participants >= submissions + joined, `${c.id}: participants ${participants} < submissions ${submissions} + joined-not-submitted ${joined}`);
    if (c.applicantCap !== null) check(participants <= c.applicantCap, `${c.id}: participants exceed the cap`);
    for (const r of rs) {
      const t = total(r);
      if (t !== null && c.kind === 'live') warnIf(t <= PLATFORM_RULES.generatedScoreCeiling && c.status === 'awarded' && EXPECTED_PODIUM[c.id]?.includes(r.studentId), `${c.id}: podium result ${r.studentId} at ${t} could tie generated scores`);
    }
  }

  // Past podiums
  const podiumKeys = new Set<string>();
  for (const [cid, podium] of Object.entries(EXPECTED_PODIUM)) {
    const c = byId.get(cid);
    if (!c) continue;
    const ranked = scriptedResults
      .filter((r) => r.challengeId === cid && r.scores)
      .map((r) => ({ studentId: r.studentId, total: total(r) ?? 0 }))
      .sort((a, b) => b.total - a.total);
    const top = ranked.slice(0, 3);
    check(top.map((x) => x.studentId).join() === podium.join(), `${cid}: podium is ${top.map((x) => `${x.studentId}(${x.total})`).join(', ')}, want ${podium.join(', ')}`);
    check(top.every((x) => x.total > PLATFORM_RULES.generatedScoreCeiling), `${cid}: every podium score must be > ${PLATFORM_RULES.generatedScoreCeiling}`);
    check(dupes(top.map((x) => String(x.total))).length === 0, `${cid}: podium scores must be distinct`);
    for (const x of top) podiumKeys.add(key(cid, x.studentId));
  }

  // The demo challenge
  const rl = byId.get('ch_rate_limiter');
  if (rl) {
    const rs = scriptedResults.filter((r) => r.challengeId === rl.id);
    check(rs.length === 2, `ch_rate_limiter: want exactly 2 scripted results (Hana + one more), have ${rs.length}`);
    const totals = rs.map((r) => ({ id: r.studentId, t: total(r) ?? 0 })).sort((a, b) => b.t - a.t);
    check(totals[0]?.id === 'stu_hana' && between(totals[0].t, 90, 92), 'ch_rate_limiter: Hana must hold the top seeded score (≈ 91)');
    check(totals[1] && totals[1].t <= PLATFORM_RULES.generatedScoreCeiling && between(totals[1].t, 83, 85), 'ch_rate_limiter: the second named score should be ≈ 84');
    check(rs.every((r) => r.scores !== null), 'ch_rate_limiter: all seeded submissions are scored (14/14)');
    const mayaLive = computeTotalScore(rl.rubric, MAYA_DEMO_CLICKS);
    check(between(mayaLive, 86, 90), `ch_rate_limiter: Maya's demo clicks give ${mayaLive}, want 86–90`);
    const ahead = totals.filter((x) => x.t >= mayaLive).length + (PLATFORM_RULES.generatedScoreCeiling >= mayaLive ? 1 : 0);
    check(ahead === 1, `ch_rate_limiter: Maya at ${mayaLive} would not place 2nd`);
  }

  // Maya's starting state: 🥇🥉, 11 verified hours, 2 coach-reviewed practice tasks
  const mine = scriptedResults.filter((r) => r.studentId === 'stu_maya');
  let verified = 0;
  const places: number[] = [];
  for (const r of mine) {
    const c = byId.get(r.challengeId);
    const t = total(r);
    if (!c || t === null) continue;
    if (c.kind === 'live' && t >= PLATFORM_RULES.verifiedPassScore) verified += c.estHours;
    if (podiumKeys.has(key(r.challengeId, r.studentId))) {
      places.push(EXPECTED_PODIUM[r.challengeId]!.indexOf('stu_maya') + 1);
    }
  }
  const practice = mine.filter((r) => byId.get(r.challengeId)?.kind === 'practice');
  check(verified === 11, `Maya: ${verified} verified hours, want 11`);
  check(places.sort().join() === '1,3', `Maya: placements ${places.join()} , want 1st and 3rd`);
  check(practice.length === 2 && practice.every((r) => between(total(r) ?? 0, 83, 87)), 'Maya: 2 Coach-reviewed practice tasks in the mid-80s');
  const relNotes = mine.find((r) => r.challengeId === 'past_release_notes');
  check(relNotes && between(total(relNotes) ?? 0, 72, 76), 'Maya: past_release_notes ≈ 74, not placed');
  check(rl && verified + rl.estHours === 15, 'Maya after the demo: 15 verified hours');

  // Everyone else: 2–4 results each so their profiles look real
  for (const s of students) {
    if (s.id === 'stu_maya') continue;
    const n = scriptedResults.filter((r) => r.studentId === s.id).length;
    check(between(n, 2, 4), `${s.id}: ${n} scripted results (want 2–4)`);
  }

  // Notifications
  const recipients = new Set([...studentIds, ...companies.map((c) => c.id)]);
  const mayaN = content.seedNotifications.filter((n) => n.recipientId === 'stu_maya');
  check(between(mayaN.length, 3, 5), `Maya has ${mayaN.length} notifications (want 3–5)`);
  check(
    mayaN.some((n) => n.kind === 'results' && !n.read && n.link === '/challenges/past_release_notes' && /results are in/i.test(n.title)),
    'Maya needs an unread "Results are in" notification for past_release_notes',
  );
  for (const c of companies) {
    const n = content.seedNotifications.filter((x) => x.recipientId === c.id).length;
    check(between(n, 2, 3), `${c.id}: ${n} notifications (want 2–3)`);
  }
  for (const n of content.seedNotifications) {
    check(recipients.has(n.recipientId), `notification for unknown recipient ${n.recipientId}`);
    check(n.daysAgo >= 0, `notification "${n.title}" has negative daysAgo`);
    check(budgetWords(n.title) <= TEXT.notificationTitleWords, `notification title "${n.title}" is over ${TEXT.notificationTitleWords} words`);
    check(budgetWords(n.body) <= TEXT.notificationBodyWords, `notification body "${n.body}" is over ${TEXT.notificationBodyWords} words`);
    check(!NO_EMOJI.test(n.title + n.body) && !/!/.test(n.title + n.body), `notification "${n.title}" has an emoji or exclamation mark`);
    const m = n.link?.match(/^\/challenges\/([a-z0-9_]+)/);
    if (m) check(byId.has(m[1]!), `notification links to unknown challenge ${m[1]}`);
  }

  // Coach packs and rubric templates
  for (const t of CHALLENGE_TYPES) {
    const p = content.coachPacks[t];
    check(p, `coachPacks.${t} missing`);
    if (p) {
      check(sentences(p.fieldIntro) === 1 && budgetWords(p.fieldIntro) <= 20, `coachPacks.${t}: fieldIntro should be 1 sentence of ≤ 20 words (has ~${sentences(p.fieldIntro)})`);
      check(p.learningPath.length === 4, `coachPacks.${t}: learning path should have 4 steps`);
      check(between(p.keywords.length, 8, 15), `coachPacks.${t}: ${p.keywords.length} keywords (want 8–15)`);
      check(p.keywords.every((k) => k === k.toLowerCase()), `coachPacks.${t}: keywords should be lowercase`);
    }
    const r = content.rubricTemplates[t];
    check(r, `rubricTemplates.${t} missing`);
    if (r) checkRubric(`rubricTemplates.${t}`, r, 4, 5, TEXT.criterionWords);
  }
  const allKeywords = CHALLENGE_TYPES.flatMap((t) => content.coachPacks[t]?.keywords ?? []);
  warnIf(dupes(allKeywords).length > 0, `coach keywords shared across fields: ${[...new Set(dupes(allKeywords))].join(', ')}`);

  // Wizard examples
  const seededTitles = new Set(challenges.map((c) => c.title.toLowerCase()));
  for (const id of COMPANY_IDS) {
    const ex = content.wizardExamples[id];
    check(ex, `wizardExamples.${id} missing`);
    if (!ex) continue;
    const w = `wizardExamples.${id}`;
    check(ex.deadlineInDays === 7, `${w}: deadlineInDays should be 7`);
    check(!seededTitles.has(ex.title.toLowerCase()), `${w}: copies a seeded challenge`);
    check(ex.summary.length <= TEXT.summaryChars, `${w}: summary is ${ex.summary.length} chars (max ${TEXT.summaryChars})`);
    check(Number.isInteger(ex.estHours) && between(ex.estHours, 1, 5), `${w}: estHours must be 1–5`);
    check(CHALLENGE_TYPES.includes(ex.type), `${w}: bad type`);
    checkBrief(w, ex.brief, 200, 450);
    check(between(ex.deliverables.length, 3, 5), `${w}: want 3–5 deliverables`);
    check(between(ex.skills.length, 3, 6), `${w}: want 3–6 skills`);
    check(between(ex.classroomConcepts?.length ?? 0, 2, 4), `${w}: want 2–4 classroom concepts`);
    checkRubric(w, ex.rubric, 4, 5, TEXT.criterionWords);
    check(ex.applicantCap === null || (Number.isInteger(ex.applicantCap) && ex.applicantCap > 0), `${w}: bad applicantCap`);
    const roles = companyById.get(id)?.hiringFor ?? [];
    check(!ex.hiringFor || roles.some((r) => ex.hiringFor!.startsWith(r)), `${w}: hiringFor should use one of the company's roles`);
  }
  for (const id of Object.keys(content.wizardExamples)) check(companyById.has(id), `wizardExamples has unknown company ${id}`);

  // Fiction and leftovers: every URL/email on a reserved domain, every IP in a documentation/private range
  walkStrings(content, 'seedContent', (s, path) => {
    for (const m of s.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)) {
      const host = m[1]!.toLowerCase();
      warnIf(!/\.(example|test|invalid|localhost)$/.test(host) && host !== 'localhost' && host !== 'www.w3.org' && !host.startsWith('127.'), `${path}: URL host ${host} is not a reserved domain`);
    }
    for (const m of s.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g)) {
      const host = m[1]!.toLowerCase();
      warnIf(!/\.(example|test|invalid)$/.test(host) && !/^\d/.test(host), `${path}: email domain ${host} is not a reserved domain`);
    }
    for (const m of s.matchAll(/(?<![\d.])(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?![\d.])/g)) {
      const ip = m[1]!;
      if (ip.split('.').every((o) => Number(o) <= 255)) warnIf(!inSafeRange(ip), `${path}: IP ${ip} is outside documentation/private ranges`);
    }
    check(!/\bSTUB\b|lorem ipsum/i.test(s), `${path}: leftover stub or lorem ipsum text`);
    warnIf(/\bTODO\b|\bTBD\b|\bFIXME\b/.test(s), `${path}: contains TODO/TBD/FIXME`);
  });
}

/* ───────────────────────────── Report ───────────────────────────── */

function report(content: SeedContent): void {
  const rows = content.challenges.map((c) => {
    const ts = content.submissionTemplates[c.id] ?? [];
    const rs = content.scriptedResults.filter((r) => r.challengeId === c.id);
    const starterBytes = c.starterFiles.reduce((s, f) => s + bytes(f.content), 0);
    return [
      c.id.padEnd(20),
      `brief ${String(words(c.brief)).padStart(3)}w`,
      `notes ${ts.map((t) => words(t.notes)).join('/')}`,
      `starter ${c.starterFiles.length} files ${(starterBytes / 1024).toFixed(1)} KB`,
      `seed ${c.seed.participants}/${c.seed.submissions}/${c.seed.scored}`,
      `scripted ${rs.length} (${rs.map((r) => `${r.studentId.slice(4)}${r.scores ? ' ' + computeTotalScore(c.rubric, r.scores) : ''}`).join(', ')})`,
    ].join('  ');
  });
  const allFiles = content.challenges.flatMap((c) => [...c.starterFiles, ...(content.submissionTemplates[c.id] ?? []).flatMap((t) => t.files)]);
  const totalKb = allFiles.reduce((s, f) => s + bytes(f.content), 0) / 1024;
  console.log(rows.join('\n'));
  console.log(
    `\n${content.companies.length} companies · ${content.employers.length} employers · ${content.students.length} named + ${content.background.count} background students · ` +
      `${content.challenges.length} challenges · ${Object.values(content.submissionTemplates).flat().length} templates · ` +
      `${content.scriptedResults.length} scripted results · ${content.joinedNotSubmitted.length} joined-not-submitted · ` +
      `${content.seedNotifications.length} notifications · ${allFiles.length} files (${totalKb.toFixed(0)} KB)`,
  );
}

async function main(): Promise<void> {
  const target = proc.argv[2] ?? './index.ts';
  const mod = (await import(target)) as { seedContent?: SeedContent; default?: SeedContent };
  const content = mod.seedContent ?? mod.default;
  if (!content) throw new Error(`${target} exports no seedContent`);
  check(mod.seedContent && mod.default === mod.seedContent, `${target} should export seedContent as both a named and the default export`);
  run(content);
  report(content);
  for (const w of warnings) console.log(`⚠️  ${w}`);
  for (const e of errors) console.log(`❌ ${e}`);
  console.log(errors.length ? `\nFAILED: ${errors.length} error(s), ${warnings.length} warning(s)` : `\nOK: all checks passed (${warnings.length} warning(s))`);
  if (errors.length) proc.exitCode = 1;
}

main().catch((e: unknown) => {
  console.error(e);
  proc.exitCode = 1;
});
