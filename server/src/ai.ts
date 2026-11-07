/**
 * DUMMY-AI — "Coach". Everything here is canned logic over seed content, built to be swapped for a real
 * LLM behind the same /api/ai/* endpoints without touching either frontend (SPEC §5.6).
 */
import {
  CHALLENGE_TYPES,
  PLATFORM_RULES,
  TYPE_META,
  computeTotalScore,
  type AutoCheck,
  type Challenge,
  type ChallengeAiHints,
  type ChallengeType,
  type CoachQuickPrompt,
  type CoachRequest,
  type CoachResponse,
  type CreateChallengeInput,
  type RubricCriterion,
  type Student,
} from '../../shared/types.ts';
import { AI_LATENCY_MAX_MS, AI_LATENCY_MIN_MS } from './config.ts';
import { notFound } from './errors.ts';
import { makeRng } from './rng.ts';
import { getDb } from './store.ts';
import { isAcceptingWork, submissionOf } from './views.ts';

// DUMMY-AI: artificial "thinking" latency so the typing indicator has something to do.
export function aiLatency(): Promise<void> {
  const ms = AI_LATENCY_MIN_MS + Math.random() * Math.max(0, AI_LATENCY_MAX_MS - AI_LATENCY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function keywordHits(text: string, keyword: string): number {
  const k = keyword.trim().toLowerCase();
  if (!k) return 0;
  const re = /^[a-z0-9 ]+$/.test(k) ? new RegExp(`\\b${escapeRe(k)}s?\\b`, 'g') : new RegExp(escapeRe(k), 'g');
  return (text.match(re) ?? []).length;
}

// DUMMY-AI: rank fields by keyword matches, falling back to the student's interests.
function rankTypes(message: string, student: Student): ChallengeType[] {
  const text = message.toLowerCase();
  const packs = getDb().content.coachPacks;
  const score = new Map<ChallengeType, number>();
  for (const t of CHALLENGE_TYPES) {
    const keywords = [...(packs[t]?.keywords ?? []), TYPE_META[t].label];
    score.set(t, keywords.reduce((sum, k) => sum + keywordHits(text, k), 0));
  }
  const interestRank = (t: ChallengeType) => {
    const i = student.interests.indexOf(t);
    return i === -1 ? 99 : i;
  };
  return [...CHALLENGE_TYPES].sort(
    (a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0) || interestRank(a) - interestRank(b) || CHALLENGE_TYPES.indexOf(a) - CHALLENGE_TYPES.indexOf(b),
  ).filter((t, i) => i === 0 || (score.get(t) ?? 0) > 0 || student.interests.includes(t));
}

// DUMMY-AI: neighbouring fields, used to fill Coach's three picks with related work.
const RELATED_FIELDS: Record<ChallengeType, ChallengeType[]> = {
  software: ['security', 'data', 'product'],
  data: ['software', 'finance', 'product'],
  design: ['product', 'marketing', 'software'],
  product: ['design', 'data', 'marketing'],
  marketing: ['product', 'design', 'data'],
  finance: ['data', 'product', 'marketing'],
  security: ['software', 'data', 'product'],
};

function recommend(types: ChallengeType[], student: Student): string[] {
  const all = getDb().challenges.filter((c) => !submissionOf(c.id, student.id));
  const out: string[] = [];
  const add = (list: Challenge[]) => {
    for (const c of list) if (out.length < 3 && !out.includes(c.id)) out.push(c.id);
  };
  const liveOf = (t: ChallengeType) =>
    all
      .filter((c) => c.type === t && c.kind === 'live' && isAcceptingWork(c))
      .sort((a, b) => Date.parse(a.deadline ?? '9999-12-31') - Date.parse(b.deadline ?? '9999-12-31'));
  const practiceOf = (t: ChallengeType) => all.filter((c) => c.type === t && c.kind === 'practice' && c.status === 'open');
  const [primary, ...rest] = types;
  if (primary) {
    add(liveOf(primary));
    add(practiceOf(primary));
  }
  for (const t of rest) add(liveOf(t));
  for (const t of rest) add(practiceOf(t));
  // Then neighbouring fields (software → security, data, product…), so the third pick is related work.
  if (primary) for (const t of RELATED_FIELDS[primary]) add(liveOf(t));
  // Unrelated open challenges only as a last resort, when nothing matched at all.
  if (out.length === 0) {
    add(all.filter((c) => c.kind === 'live' && isAcceptingWork(c)).sort((a, b) => Date.parse(a.deadline ?? '') - Date.parse(b.deadline ?? '')));
  }
  return out;
}

const LEAD_INS = ['Good question!', 'Happy to help.', "Let's dig in.", 'Great thing to ask before you start.'];

function routeFreeText(message: string): CoachQuickPrompt | 'overview' {
  const m = message.toLowerCase();
  if (/\b(judged?|judging|scor(e|ed|es|ing)|grad(e|ed|es|ing)|rubric|evaluat\w*|win|winning|great)\b/.test(m)) return 'greatLooksLike';
  if (/\b(mistakes?|avoid|pitfalls?|wrong|traps?|gotchas?|careful)\b/.test(m)) return 'pitfalls';
  if (/\b(start|begin|how|first|steps?|plan|approach)\b/.test(m)) return 'steps';
  return 'overview';
}

const numbered = (items: string[]) => items.map((s, i) => `${i + 1}. ${s}`).join('\n');
const bullets = (items: string[]) => items.map((s) => `- ${s}`).join('\n');
const rubricSummary = (rubric: RubricCriterion[]) =>
  bullets([...rubric].sort((a, b) => b.weight - a.weight).map((c) => `**${c.name}** (${c.weight}%): ${c.description}`));

// DUMMY-AI: Coach chat (recommend mode without a challenge, task mode with one).
export function coachReply(req: CoachRequest, student: Student): CoachResponse {
  const message = (req.message ?? '').trim();
  const rng = makeRng(`${message}:${req.challengeId ?? ''}:${req.quickPrompt ?? ''}`);

  if (req.challengeId) {
    const ch = getDb().challenges.find((c) => c.id === req.challengeId);
    if (!ch) throw notFound('CHALLENGE_NOT_FOUND', `No challenge ${req.challengeId}.`);
    const hints: ChallengeAiHints = ch.aiHints;
    const mode = req.quickPrompt ?? (message ? routeFreeText(message) : 'overview');
    const lead = req.quickPrompt ? '' : `${rng.pick(LEAD_INS)} `;
    let reply: string;
    switch (mode) {
      case 'testing':
        reply = `${lead}Here's what **${ch.title}** is really testing:\n\n${hints.testing}`;
        break;
      case 'steps':
        reply = `${lead}Here's how I'd break it into steps (aim for about ${ch.estHours} h in total):\n\n${numbered(hints.steps)}`;
        break;
      case 'greatLooksLike':
        reply = `${lead}What a great submission looks like:\n\n${hints.greatLooksLike}\n\n**How you'll be judged**\n${rubricSummary(ch.rubric)}`;
        break;
      case 'pitfalls':
        reply = `${lead}Common pitfalls to avoid:\n\n${bullets(hints.pitfalls)}`;
        break;
      default:
        reply = `${lead}${hints.testing}\n\n**A good way to tackle it**\n${numbered(hints.steps)}`;
    }
    return { reply, recommendedChallengeIds: [] };
  }

  const types = rankTypes(message, student);
  const primary = types[0] ?? student.interests[0] ?? 'software';
  const pack = getDb().content.coachPacks[primary];
  const ids = recommend(types.length ? types : [primary], student);
  const joinedOpen = ids
    .map((id) => getDb().challenges.find((c) => c.id === id))
    .find((c) => c && getDb().participations.some((p) => p.challengeId === c.id && p.studentId === student.id));
  const parts = [
    `**${TYPE_META[primary].label}** looks like a great fit. ${pack?.fieldIntro ?? TYPE_META[primary].blurb}`,
    pack?.learningPath?.length ? `**Your learning path**\n${numbered(pack.learningPath)}` : '',
    joinedOpen ? `You've already joined **${joinedOpen.title}**, so finishing that one is the fastest way to add verified hours.` : '',
    ids.length ? `Here are ${ids.length} task${ids.length === 1 ? '' : 's'} that match:` : 'No open tasks match right now. Check back soon!',
  ].filter(Boolean);
  return { reply: parts.join('\n\n'), recommendedChallengeIds: ids };
}

// DUMMY-AI: "Suggest rubric" — the field's rubric template.
export function suggestRubric(type: ChallengeType): RubricCriterion[] {
  const tpl = getDb().content.rubricTemplates[type];
  return structuredClone(tpl?.length ? tpl : defaultRubric());
}

function defaultRubric(): RubricCriterion[] {
  return [
    { id: 'quality', name: 'Quality of work', description: 'The deliverable solves the problem in the brief.', weight: 40 },
    { id: 'judgment', name: 'Judgment & trade-offs', description: 'Decisions are sensible and explained.', weight: 30 },
    { id: 'communication', name: 'Communication', description: 'A README and notes a teammate could act on.', weight: 30 },
  ];
}

const GENERIC_PITFALLS: Record<ChallengeType, string[]> = {
  software: ['Skipping tests for the edge cases', 'No README explaining how to run it', 'Over-engineering beyond the time box'],
  data: ['Not documenting how you cleaned the data', 'Charts without a clear takeaway', 'Confusing correlation with causation'],
  design: ['Jumping to visuals before mapping the flow', 'Ignoring accessibility', 'Not explaining the why behind decisions'],
  product: ['Writing a solution without a clear problem statement', 'No success metrics', 'Scope that would never fit a sprint'],
  marketing: ['No clear target audience', 'A plan that ignores the budget', 'No way to measure results'],
  finance: ['Hard-coded numbers with no assumptions tab', 'Not reconciling totals', 'Burying the headline for the CFO'],
  security: ['Treating every alert as equally urgent', 'No evidence for your conclusions', 'Advice nobody outside security can follow'],
};

// DUMMY-AI: Coach hints for employer-created challenges (seeded ones ship hand-written hints).
export function synthesizeAiHints(input: CreateChallengeInput): ChallengeAiHints {
  const top = [...input.rubric].sort((a, b) => b.weight - a.weight);
  const [first, second] = top;
  const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  return {
    testing: `Whether you can ${lowerFirst(input.summary.replace(/\.$/, ''))}, the way a new ${TYPE_META[input.type].label.toLowerCase()} hire would in week one.${
      first ? ` It's judged most on **${first.name}** (${first.weight}%)${second ? ` and **${second.name}** (${second.weight}%)` : ''}.` : ''
    }`,
    steps: [
      'Read the brief twice and list exactly what you need to hand in',
      ...input.deliverables.slice(0, 4).map((d) => `Produce: ${d}`),
      'Check your work against each rubric criterion',
      "Write approach notes: what you built, key decisions and trade-offs, and what you'd do with more time",
    ],
    greatLooksLike: `A great submission covers every deliverable, stays inside the ${input.estHours}-hour time box and makes its trade-offs explicit. ${top
      .slice(0, 3)
      .map((c) => c.description)
      .join(' ')}`.trim(),
    pitfalls: [...GENERIC_PITFALLS[input.type], `Going well past the ${input.estHours}-hour time box`],
  };
}

// DUMMY-AI: instant "Coach review" for practice submissions (§5.5 #14).
export function practiceReview(
  ch: Challenge,
  signals: { submissionId: string; notes: string; autoChecks: AutoCheck[] },
): { scores: Record<string, number>; totalScore: number; feedback: string } {
  const rng = makeRng(`coach:${signals.submissionId}`);
  const passed = signals.autoChecks.filter((c) => c.passed).length;
  const notesLen = signals.notes.trim().length;
  const quality: 'strong' | 'solid' | 'weak' =
    passed >= signals.autoChecks.length && notesLen >= 300 ? 'strong' : passed <= 1 || notesLen < 100 ? 'weak' : 'solid';
  const mean = { strong: 4.3, solid: 3.5, weak: 2.6 }[quality];
  const scores: Record<string, number> = {};
  for (const c of ch.rubric) scores[c.id] = Math.min(5, Math.max(1, Math.round(mean + rng.range(-0.7, 0.7))));
  const totalScore = computeTotalScore(ch.rubric, scores);
  const template = getDb().content.templateFeedback[ch.id]?.find((t) => t.quality === quality);
  const checks = signals.autoChecks.map((c) => `${c.passed ? '✓' : '✗'} ${c.label}`).join(' · ');
  const strongest = [...ch.rubric].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0) || b.weight - a.weight)[0];
  const weakest = [...ch.rubric].sort((a, b) => (scores[a.id] ?? 0) - (scores[b.id] ?? 0) || b.weight - a.weight)[0];
  const feedback = [
    template?.feedback ??
      (quality === 'strong'
        ? 'Strong work: the deliverables are complete and your notes explain the reasoning clearly.'
        : quality === 'solid'
          ? 'Solid attempt that covers the core of the task. Tighten the weaker areas below to reach the top tier.'
          : 'A start, but key parts of the brief are missing. Re-read the deliverables and use the rubric as a checklist.'),
    strongest && weakest && strongest.id !== weakest.id
      ? `Strongest area: **${strongest.name}**. Biggest opportunity: **${weakest.name}**.`
      : '',
    `Quick checks: ${checks}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  return { scores, totalScore, feedback: feedback.length >= PLATFORM_RULES.minFeedbackChars ? feedback : `${feedback} Keep practicing!` };
}
