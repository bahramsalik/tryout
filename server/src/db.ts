import type {
  Challenge,
  ChallengeType,
  CoachPack,
  Company,
  EmployerUser,
  InterviewInvite,
  Notification,
  RubricCriterion,
  Student,
  Submission,
  SubmissionTemplate,
  WizardExample,
} from '../../shared/types.ts';

/** A student's claim on a challenge spot (internal; surfaced as counts and `viewer.joined`). */
export interface Participation {
  challengeId: string;
  studentId: string;
  joinedAt: string;
  /** Stable blind-review label for this student on this challenge, e.g. "Candidate K7". */
  alias: string;
}

export interface SubmissionRecord extends Submission {
  alias: string;
  /** Employer user id that scored it, "coach" for practice reviews, null when unscored. */
  scoredBy: string | null;
}

/** Content the API needs at runtime (Coach, wizard), snapshotted at seed time so it matches the data. */
export interface RuntimeContent {
  coachPacks: Record<ChallengeType, CoachPack>;
  rubricTemplates: Record<ChallengeType, RubricCriterion[]>;
  wizardExamples: Record<string, WizardExample>;
  /** challengeId → templates without files (feedback + notes per quality tier). */
  templateFeedback: Record<string, Pick<SubmissionTemplate, 'quality' | 'feedback'>[]>;
}

export interface DbMeta {
  schema: number;
  seedVersion: number;
  contentHash: string;
  /** Changes on every reseed; part of SSE event ids so reconnecting clients can detect a reset. */
  seedId: string;
  seededAt: string;
}

export interface Db {
  meta: DbMeta;
  companies: Company[];
  employers: EmployerUser[];
  /** Named + generated background students. */
  students: Student[];
  /** Hand-written students from content, in content order (used for the persona switcher). */
  namedStudentIds: string[];
  challenges: Challenge[];
  participations: Participation[];
  submissions: SubmissionRecord[];
  notifications: Notification[];
  invites: InterviewInvite[];
  content: RuntimeContent;
  /** Cloud mode only: recent live events, replayed by /api/events to clients polling from other instances. */
  events?: StoredEvent[];
  eventSeq?: number;
}

export interface StoredEvent {
  seq: number;
  type: string;
  payload: unknown;
}

export function emptyDb(): Db {
  return {
    meta: { schema: 0, seedVersion: 0, contentHash: '', seedId: 'empty', seededAt: new Date(0).toISOString() },
    companies: [],
    employers: [],
    students: [],
    namedStudentIds: [],
    challenges: [],
    participations: [],
    submissions: [],
    notifications: [],
    invites: [],
    content: {
      coachPacks: {} as Record<ChallengeType, CoachPack>,
      rubricTemplates: {} as Record<ChallengeType, RubricCriterion[]>,
      wizardExamples: {},
      templateFeedback: {},
    },
  };
}
