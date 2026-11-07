import {
  PLATFORM_RULES,
  splitTop3,
  type ChallengeType,
  type ClassroomConcept,
  type Company,
  type CreateChallengeInput,
  type Difficulty,
  type Reward,
  type RewardMode,
  type RubricCriterion,
} from '@shared/types';
import { daysFromNow, slugify } from '@/lib/format';
import type { PreviewChallenge } from '@/components/StudentPreview';

export const TITLE_MAX = 100;
export const SUMMARY_MAX = 140;
export const BRIEF_MIN = 60;

export interface RubricRow {
  key: string;
  name: string;
  description: string;
  weight: number;
}

export interface Draft {
  title: string;
  type: ChallengeType | null;
  skills: string[];
  summary: string;
  brief: string;
  deliverables: string[];
  estHours: number;
  difficulty: Difficulty;
  classroomConcepts: ClassroomConcept[];
  hiringFor: string;
  rubric: RubricRow[];
  rewardMode: RewardMode;
  winnerAmount: number;
  top3: [number, number, number];
  capped: boolean;
  cap: number;
  deadline: string;
}

let seq = 0;
export const newKey = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;

export function emptyDraft(): Draft {
  const [a, b, c] = splitTop3(500);
  return {
    title: '',
    type: null,
    skills: [],
    summary: '',
    brief: '',
    deliverables: [''],
    estHours: 3,
    difficulty: 'intermediate',
    classroomConcepts: [],
    hiringFor: '',
    rubric: [],
    rewardMode: 'top3',
    winnerAmount: 400,
    top3: [a, b, c],
    capped: true,
    cap: 50,
    deadline: daysFromNow(PLATFORM_RULES.defaultDeadlineDays),
  };
}

export const BRIEF_TEMPLATE = `## Context
Who your team is, what you’re building and why this task matters this quarter.

## The task
What you want the student to build or produce, in a few concrete steps.

## Constraints
- Time-box: about 4 hours — we’re judging judgment, not polish
- Tools: anything you like; disclose any AI use

## What we provide
- A starter kit (repo, data or docs) and a short README
`;

export type StepErrors = Partial<
  Record<
    | 'title'
    | 'type'
    | 'summary'
    | 'brief'
    | 'deliverables'
    | 'estHours'
    | 'rubric'
    | 'weights'
    | 'reward'
    | 'cap'
    | 'deadline',
    string
  >
>;

export function weightTotal(rows: RubricRow[]): number {
  return rows.reduce((s, r) => s + (Number.isFinite(r.weight) ? r.weight : 0), 0);
}

export function draftReward(d: Draft): Reward {
  if (d.rewardMode === 'winner') return { mode: 'winner', amounts: [Math.max(0, Math.round(d.winnerAmount || 0))] };
  if (d.rewardMode === 'top3') return { mode: 'top3', amounts: d.top3.map((a) => Math.max(0, Math.round(a || 0))) };
  return { mode: 'none', amounts: [] };
}

export function validateStep(step: number, d: Draft): StepErrors {
  const e: StepErrors = {};
  if (step === 0) {
    const title = d.title.trim();
    if (!title) e.title = 'Give the challenge a title.';
    else if (title.length < 8) e.title = 'Make the title a little more specific (8+ characters).';
    else if (title.length > TITLE_MAX) e.title = `Keep the title under ${TITLE_MAX} characters.`;
    if (!d.type) e.type = 'Pick the field this task belongs to.';
    const summary = d.summary.trim();
    if (!summary) e.summary = 'Add a one-line summary for the card.';
    else if (summary.length > SUMMARY_MAX) e.summary = `The summary must be ${SUMMARY_MAX} characters or fewer.`;
    if (d.brief.trim().length < BRIEF_MIN) e.brief = `Write a brief students can act on (at least ${BRIEF_MIN} characters).`;
    if (!d.deliverables.some((x) => x.trim())) e.deliverables = 'List at least one deliverable.';
    if (
      !Number.isInteger(d.estHours) ||
      d.estHours < PLATFORM_RULES.minEstHours ||
      d.estHours > PLATFORM_RULES.maxEstHours
    ) {
      e.estHours = `Platform rule: tasks must fit in ${PLATFORM_RULES.maxEstHours} hours.`;
    }
  }
  if (step === 1) {
    if (d.rubric.length === 0) e.rubric = 'Add at least one criterion, or use ✨ Suggest rubric.';
    else if (d.rubric.some((r) => !r.name.trim())) e.rubric = 'Every criterion needs a name.';
    else if (d.rubric.some((r) => !Number.isInteger(r.weight) || r.weight < 1)) e.rubric = 'Weights must be whole numbers of at least 1%.';
    const total = weightTotal(d.rubric);
    if (d.rubric.length > 0 && total !== 100) e.weights = `Weights add up to ${total}% — they must total exactly 100%.`;
  }
  if (step === 2) {
    if (d.rewardMode === 'winner' && !(d.winnerAmount >= 1)) e.reward = 'Set the winner’s bounty.';
    if (d.rewardMode === 'top3' && d.top3.some((a) => !(a >= 1))) e.reward = 'Each of the top 3 places needs an amount.';
    if (d.capped && (!Number.isInteger(d.cap) || d.cap < 1)) e.cap = 'The cap must be a whole number of at least 1.';
    const t = new Date(d.deadline).getTime();
    if (!d.deadline || Number.isNaN(t)) e.deadline = 'Pick a deadline.';
    else if (t < Date.now() + 60 * 60 * 1000) e.deadline = 'Pick a deadline at least an hour from now.';
  }
  return e;
}

export function stepValid(step: number, d: Draft): boolean {
  return Object.keys(validateStep(step, d)).length === 0;
}

export function rubricWithIds(rows: RubricRow[]): RubricCriterion[] {
  const used = new Set<string>();
  return rows.map((r, i) => {
    const base = slugify(r.name) || `criterion_${i + 1}`;
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}_${n++}`;
    used.add(id);
    return { id, name: r.name.trim(), description: r.description.trim(), weight: Math.round(r.weight) };
  });
}

export function draftToInput(d: Draft): CreateChallengeInput {
  return {
    title: d.title.trim(),
    summary: d.summary.trim(),
    type: d.type ?? 'software',
    skills: d.skills.map((s) => s.trim()).filter(Boolean),
    classroomConcepts: d.classroomConcepts
      .map((c) => ({ concept: c.concept.trim(), course: c.course.trim() }))
      .filter((c) => c.concept),
    difficulty: d.difficulty,
    estHours: d.estHours,
    brief: d.brief.trim(),
    deliverables: d.deliverables.map((x) => x.trim()).filter(Boolean),
    rubric: rubricWithIds(d.rubric),
    reward: draftReward(d),
    applicantCap: d.capped ? d.cap : null,
    deadline: new Date(d.deadline).toISOString(),
    hiringFor: d.hiringFor.trim() || null,
  };
}

/** Accepts a CreateChallengeInput (or a WizardExample with `deadlineInDays`) from GET /employer/example-challenge. */
export function inputToDraft(input: Partial<CreateChallengeInput> & { deadlineInDays?: number }): Draft {
  const base = emptyDraft();
  const reward = input.reward;
  const deadline =
    input.deadline && !Number.isNaN(new Date(input.deadline).getTime())
      ? input.deadline
      : daysFromNow(input.deadlineInDays ?? PLATFORM_RULES.defaultDeadlineDays);
  return {
    ...base,
    title: input.title ?? '',
    type: input.type ?? null,
    skills: input.skills ?? [],
    summary: input.summary ?? '',
    brief: input.brief ?? '',
    deliverables: input.deliverables?.length ? [...input.deliverables] : [''],
    estHours: clampHours(input.estHours ?? base.estHours),
    difficulty: input.difficulty ?? base.difficulty,
    classroomConcepts: input.classroomConcepts ? input.classroomConcepts.map((c) => ({ ...c })) : [],
    hiringFor: input.hiringFor ?? '',
    rubric: (input.rubric ?? []).map((r) => ({ key: newKey(), name: r.name, description: r.description, weight: r.weight })),
    rewardMode: reward?.mode ?? base.rewardMode,
    winnerAmount: reward?.mode === 'winner' ? (reward.amounts[0] ?? base.winnerAmount) : base.winnerAmount,
    top3:
      reward?.mode === 'top3' && reward.amounts.length >= 3
        ? [reward.amounts[0], reward.amounts[1], reward.amounts[2]]
        : base.top3,
    capped: input.applicantCap !== null,
    cap: input.applicantCap ?? base.cap,
    deadline,
  };
}

export function clampHours(h: number): number {
  return Math.min(PLATFORM_RULES.maxEstHours, Math.max(PLATFORM_RULES.minEstHours, Math.round(h)));
}

export function draftToPreview(d: Draft, company: Company | null): PreviewChallenge {
  const reward = draftReward(d);
  return {
    title: d.title.trim(),
    summary: d.summary.trim(),
    type: d.type ?? 'software',
    skills: d.skills,
    classroomConcepts: d.classroomConcepts,
    difficulty: d.difficulty,
    estHours: d.estHours,
    brief: d.brief,
    deliverables: d.deliverables,
    rubric: d.rubric.map((r, i) => ({ id: r.key || String(i), name: r.name, description: r.description, weight: r.weight || 0 })),
    reward,
    applicantCap: d.capped ? d.cap || null : null,
    deadline: d.deadline,
    hiringFor: d.hiringFor.trim() || null,
    company,
    participantCount: 0,
    status: 'open',
  };
}

export const SKILL_SUGGESTIONS: Record<ChallengeType, string[]> = {
  software: ['Node.js', 'TypeScript', 'Python', 'API design', 'Testing', 'SQL', 'Git'],
  data: ['SQL', 'Python', 'pandas', 'Data visualization', 'Statistics', 'Excel'],
  design: ['Figma', 'UX research', 'Prototyping', 'Accessibility', 'Interaction design'],
  product: ['PRDs', 'User research', 'Prioritization', 'Metrics', 'Roadmapping'],
  marketing: ['Copywriting', 'Campaign planning', 'SEO', 'Analytics', 'Social media'],
  finance: ['Excel', 'Financial modeling', 'Variance analysis', 'Forecasting', 'Storytelling'],
  security: ['SIEM', 'Incident response', 'Log analysis', 'Threat intel', 'Networking'],
};
