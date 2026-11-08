import {
  PLATFORM_RULES,
  type ChallengeType,
  type ClassroomConcept,
  type Company,
  type CreateChallengeInput,
  type Difficulty,
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
  capped: boolean;
  cap: number;
  /** Medals for the top N finishers; 0 = none. */
  placements: number;
  deadline: string;
}

let seq = 0;
export const newKey = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;

export function emptyDraft(): Draft {
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
    capped: true,
    cap: 50,
    placements: 0, // awards are optional: off unless the employer adds one
    deadline: daysFromNow(PLATFORM_RULES.defaultDeadlineDays),
  };
}

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
    | 'cap'
    | 'deadline',
    string
  >
>;

export function weightTotal(rows: RubricRow[]): number {
  return rows.reduce((s, r) => s + (Number.isFinite(r.weight) ? r.weight : 0), 0);
}

export function validateStep(step: number, d: Draft): StepErrors {
  const e: StepErrors = {};
  if (step === 0) {
    const title = d.title.trim();
    if (!title) e.title = 'Required';
    else if (title.length < 8) e.title = 'At least 8 characters';
    else if (title.length > TITLE_MAX) e.title = `At most ${TITLE_MAX} characters`;
    if (!d.type) e.type = 'Required';
    const summary = d.summary.trim();
    if (!summary) e.summary = 'Required';
    else if (summary.length > SUMMARY_MAX) e.summary = `At most ${SUMMARY_MAX} characters`;
    if (d.brief.trim().length < BRIEF_MIN) e.brief = `At least ${BRIEF_MIN} characters`;
    if (!d.deliverables.some((x) => x.trim())) e.deliverables = 'Add at least one';
    if (
      !Number.isInteger(d.estHours) ||
      d.estHours < PLATFORM_RULES.minEstHours ||
      d.estHours > PLATFORM_RULES.maxEstHours
    ) {
      e.estHours = `${PLATFORM_RULES.minEstHours}–${PLATFORM_RULES.maxEstHours} hours`;
    }
  }
  if (step === 1) {
    if (d.rubric.length === 0) e.rubric = 'Add at least one criterion';
    else if (d.rubric.some((r) => !r.name.trim())) e.rubric = 'Every criterion needs a name';
    else if (d.rubric.some((r) => !Number.isInteger(r.weight) || r.weight < 1)) e.rubric = 'Weights must be whole numbers ≥ 1';
    const total = weightTotal(d.rubric);
    if (d.rubric.length > 0 && total !== 100) e.weights = `Weights total ${total}%, not 100%`;
  }
  if (step === 2) {
    if (d.capped && (!Number.isInteger(d.cap) || d.cap < 1)) e.cap = 'Whole number ≥ 1';
    const t = new Date(d.deadline).getTime();
    if (!d.deadline || Number.isNaN(t)) e.deadline = 'Required';
    else if (t < Date.now() + 60 * 60 * 1000) e.deadline = 'At least 1 hour from now';
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
    applicantCap: d.capped ? d.cap : null,
    placements: d.placements ?? 0,
    deadline: new Date(d.deadline).toISOString(),
    hiringFor: d.hiringFor.trim() || null,
  };
}

/** Accepts a CreateChallengeInput (or a WizardExample with `deadlineInDays`) from GET /employer/example-challenge. */
export function inputToDraft(input: Partial<CreateChallengeInput> & { deadlineInDays?: number }): Draft {
  const base = emptyDraft();
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
    capped: input.applicantCap !== null,
    cap: input.applicantCap ?? base.cap,
    placements: input.placements ?? base.placements,
    deadline,
  };
}

export function clampHours(h: number): number {
  return Math.min(PLATFORM_RULES.maxEstHours, Math.max(PLATFORM_RULES.minEstHours, Math.round(h)));
}

export function draftToPreview(d: Draft, company: Company | null): PreviewChallenge {
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
    applicantCap: d.capped ? d.cap || null : null,
    deadline: d.deadline,
    hiringFor: d.hiringFor.trim() || null,
    company,
    participantCount: 0,
    status: 'open',
  };
}
