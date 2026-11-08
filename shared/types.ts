/**
 * Tryout — shared contract: domain types, API payloads, platform constants and pure helpers.
 *
 * Used by server/ (runtime + types), apps/student and apps/employer (via the `@shared` alias),
 * and shared/content/ (seed content). See SPEC.md §7.
 *
 * Rules
 * - Erasable TypeScript only (no enums, namespaces or parameter properties) and no imports,
 *   so every toolchain (tsx, Vite, tsc) can load this file as-is.
 * - Only the API session (S1) edits this file, and only additively (new optional fields, new types).
 *   Log every change in shared/CHANGELOG.md.
 */

/* ───────────────────────────── Unions ───────────────────────────── */

export type ChallengeType = 'software' | 'data' | 'design' | 'product' | 'marketing' | 'finance' | 'security';
export type ChallengeKind = 'live' | 'practice';
/** `open` accepts joins/submissions · `reviewing` closed to submissions · `awarded` results published. */
export type ChallengeStatus = 'open' | 'reviewing' | 'awarded';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type SubmissionStatus = 'submitted' | 'scored' | 'awarded' | 'not_selected';
/** `coach` = instant dummy-AI review used for practice tasks. */
export type ReviewerKind = 'employer' | 'coach' | 'ai';
export type CoachQuickPrompt = 'testing' | 'steps' | 'greatLooksLike' | 'pitfalls';
export type NotificationKind =
  | 'new_challenge' // student: a challenge matching their interests was published
  | 'submission_received' // employer: a student submitted
  | 'results' // student: results published, not placed (feedback is ready)
  | 'awarded' // student: placed
  | 'coach_review' // student: practice task reviewed by Coach
  | 'cap_reached'; // employer: applicant cap reached

/* ─────────────────────── Platform constants ─────────────────────── */

export const CHALLENGE_TYPES: readonly ChallengeType[] = [
  'software',
  'data',
  'design',
  'product',
  'marketing',
  'finance',
  'security',
];

export interface TypeMeta {
  label: string;
  /** Solid brand color for the type (chips, icons, radar). */
  color: string;
  /** Very light tint for chip/tile backgrounds. */
  softBg: string;
  /** lucide-react icon component name. */
  icon: 'Code' | 'Database' | 'Palette' | 'Compass' | 'Megaphone' | 'Calculator' | 'ShieldCheck';
  blurb: string;
}

/** Labels, colors and icons for the 7 fields. Use these on both sites so they match. */
export const TYPE_META: Record<ChallengeType, TypeMeta> = {
  software: { label: 'Software', color: '#0F6CBD', softBg: '#EBF3FC', icon: 'Code', blurb: 'Build, fix and test code' },
  data: { label: 'Data', color: '#00727C', softBg: '#E6F4F5', icon: 'Database', blurb: 'Turn data into decisions' },
  design: { label: 'Design', color: '#B4009E', softBg: '#FBF0F9', icon: 'Palette', blurb: 'Design flows people can use' },
  product: { label: 'Product', color: '#5C2E91', softBg: '#F7F4FB', icon: 'Compass', blurb: 'Decide what to build' },
  marketing: { label: 'Marketing', color: '#BC4B09', softBg: '#FDF6F3', icon: 'Megaphone', blurb: 'Reach the right people' },
  finance: { label: 'Finance', color: '#107C10', softBg: '#F1FAF1', icon: 'Calculator', blurb: 'Model and explain the numbers' },
  security: { label: 'Security', color: '#C50F1F', softBg: '#FDF3F4', icon: 'ShieldCheck', blurb: 'Find threats early' },
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const PLATFORM_RULES = {
  minEstHours: 1,
  /** Hard rule: every task must fit in 5 hours. */
  maxEstHours: 5,
  maxUploadMb: 50,
  minNotesChars: 50,
  minFeedbackChars: 20,
  scoreMin: 1,
  scoreMax: 5,
  /** Employer-scored submissions with total ≥ this count toward verified hours. */
  verifiedPassScore: 60,
  /** Seeded background (generated) submissions never total more than this. */
  generatedScoreCeiling: 85,
  /** Top finishers who get a placement medal when results are published. */
  placementCount: 3,
  defaultDeadlineDays: 7,
} as const;

/* ─────────────────────────── Entities ─────────────────────────── */

export interface Company {
  id: string; // "co_orbitline"
  name: string;
  industry: string;
  tagline: string;
  about: string; // 2–3 sentences
  logoColor: string; // hex, background of the monogram logo
  logoInitials: string; // "OL"
  location: string;
  size: string; // "200–500 employees"
  hiringFor: string[]; // open entry-level roles
}

export interface EmployerUser {
  id: string; // "emp_jordan"
  companyId: string;
  name: string;
  title: string; // "Talent Lead"
}

export interface Student {
  id: string; // "stu_maya"
  handle: string; // "maya-chen" → public profile /p/maya-chen
  name: string;
  pronouns?: string;
  university: string;
  major: string;
  gradYear: number;
  location: string;
  bio: string;
  skills: string[];
  interests: ChallengeType[];
  avatarColor: string; // hex
  openToWork: boolean;
  links: { github?: string; linkedin?: string; portfolio?: string };
}

export interface RubricCriterion {
  id: string; // "correctness" (unique within its rubric)
  name: string;
  description: string;
  /** Percent. A rubric's weights sum to 100. */
  weight: number;
}

/** "From the classroom": the theory a task applies. */
export interface ClassroomConcept {
  concept: string; // "Token bucket algorithm"
  course: string; // "Data Structures & Algorithms"
}

/** Canned answers for the dummy Coach on a specific challenge. */
export interface ChallengeAiHints {
  testing: string; // "What is this really testing?"
  steps: string[]; // "Break it into steps"
  greatLooksLike: string; // "What does a great submission look like?"
  pitfalls: string[]; // "Common pitfalls"
}

export interface StarterFile {
  path: string; // "data/visits.csv"
  content: string;
}

export interface Challenge {
  id: string; // "ch_rate_limiter" | "pr_flaky_tests" | "past_csv_import" | generated "ch_xxxxxxxx"
  kind: ChallengeKind;
  /** null = curated by Tryout (practice only). */
  companyId: string | null;
  title: string;
  /** ≤ 140 chars, shown on cards. */
  summary: string;
  type: ChallengeType;
  skills: string[];
  classroomConcepts: ClassroomConcept[];
  difficulty: Difficulty;
  /** Integer 1–5 (PLATFORM_RULES). */
  estHours: number;
  /** Markdown: Context · The task · Constraints · What we provide. */
  brief: string;
  deliverables: string[];
  rubric: RubricCriterion[];
  /** null = no cap. */
  applicantCap: number | null;
  /** How many top finishers get a medal when results are published. 0 = no medals. Omitted = PLATFORM_RULES.placementCount. */
  placements?: number;
  /** ISO. null = evergreen (practice). */
  deadline: string | null;
  status: ChallengeStatus;
  /** "Junior Backend Engineer · Full-time · Remote (US)". */
  hiringFor: string | null;
  /** Zipped on demand by GET /challenges/:id/starter. */
  starterFiles: StarterFile[];
  aiHints: ChallengeAiHints;
  createdAt: string; // ISO
  createdBy: string | null; // employer user id
  /** ISO time results were published (status → `awarded`); null/absent before. Added by S1. */
  awardedAt?: string | null;
}

export interface ChallengeViewer {
  joined: boolean;
  submissionId: string | null;
  submissionStatus: SubmissionStatus | null;
}

/** Challenge as returned by the API (list + detail). */
export interface ChallengeView extends Omit<Challenge, 'starterFiles'> {
  company: Company | null;
  participantCount: number; // students who joined (claimed a spot)
  submissionCount: number;
  scoredCount: number;
  /** null when uncapped. */
  spotsLeft: number | null;
  hasStarterKit: boolean;
  /** Present when the requesting persona is a student. */
  viewer?: ChallengeViewer;
  /** Average total of scored submissions. Only present for the owning company's employers. Added by S1. */
  avgScore?: number | null;
}

export type ChallengeSummary = Pick<
  ChallengeView,
  'id' | 'title' | 'type' | 'kind' | 'status' | 'estHours' | 'rubric' | 'company' | 'companyId' | 'deadline'
>;

export interface AutoCheck {
  label: string; // "README included"
  passed: boolean;
}

export interface SubmissionFileInfo {
  originalName: string;
  sizeBytes: number;
  fileCount: number;
  /** Paths inside the zip (≤ 300; __MACOSX/ and dotfiles skipped). */
  tree: string[];
  /** Contents of the first README* (≤ 20 KB), if any. */
  readme: string | null;
}

export interface Submission {
  id: string; // "sub_xxxxxxxx"
  challengeId: string;
  studentId: string;
  submittedAt: string; // ISO
  /** "Approach notes" (markdown, ≥ 50 chars). */
  notes: string;
  demoUrl: string | null;
  /** How AI tools were used (optional, encouraged). */
  aiDisclosure: string | null;
  file: SubmissionFileInfo;
  autoChecks: AutoCheck[];
  status: SubmissionStatus;
  reviewer: ReviewerKind | null;
  /** Id of the person who confirmed this result (a recruiter, or anyone who is not the AI). Absent = not confirmed. */
  verifiedBy?: string | null;
  /** AI grading only: criterionId → what in the work justified the score. */
  scoreNotes?: Record<string, string>;
  /** Live work waiting for its AI grade: `grading` = in progress, `delayed` = could not be graded yet (it is retried). Absent once graded. */
  gradingState?: 'grading' | 'delayed';
  /** criterionId → 1..5. Hidden (null) from students until results are published (live challenges). */
  scores: Record<string, number> | null;
  /** 0–100 weighted (computeTotalScore). Hidden from students until published. */
  totalScore: number | null;
  feedback: string | null;
  scoredAt: string | null;
  rank: number | null;
  shortlisted: boolean;
}

export interface SubmissionView extends Submission {
  /** Stable anonymous label for blind review, e.g. "Candidate K7". */
  alias: string;
  /** Always included; the employer UI hides it while blind review is on. */
  student: Student;
  challenge: ChallengeSummary;
  /** True when a person confirmed the result (see `isVerified`). Shown to the public as "Verified". */
  verified: boolean;
}

export interface StudentStats {
  /** Σ estHours of employer-scored submissions with totalScore ≥ verifiedPassScore. */
  verifiedHours: number;
  practiceHours: number;
  /** Employer-scored submissions (any score). */
  tasksCompleted: number;
  placements: { first: number; second: number; third: number };
  avgScore: number | null; // employer-scored only
  /** One entry per type the student has scored work in (radar chart; missing types = 0). */
  typeScores: { type: ChallengeType; avgScore: number; count: number }[];
  topSkills: string[];
}

export interface ProfileHistoryItem {
  submissionId: string;
  challengeId: string;
  challengeTitle: string;
  type: ChallengeType;
  kind: ChallengeKind;
  company: Pick<Company, 'id' | 'name' | 'logoColor' | 'logoInitials'> | null;
  submittedAt: string;
  status: SubmissionStatus;
  reviewer: ReviewerKind | null;
  /** True when a person confirmed the result (see `isVerified`). Shown to the public as "Verified". */
  verified: boolean;
  /** Visible only when results are published (or practice/coach). */
  totalScore: number | null;
  rank: number | null;
  feedbackExcerpt: string | null;
  estHours: number;
  /** True when the viewer may open the files (the student themself, or the challenge owner's employer users). */
  canViewFiles: boolean;
}

export interface StudentProfile extends Student {
  stats: StudentStats;
  history: ProfileHistoryItem[];
}

export interface StudentListItem extends Student {
  stats: StudentStats;
}

export interface Notification {
  id: string; // "ntf_xxxxxxxx"
  /** Student id, or company id for employer notifications. */
  recipientId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Path within the recipient's site, e.g. "/challenges/ch_rate_limiter". */
  link: string | null;
  createdAt: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  kind: 'join' | 'submission' | 'scored' | 'award';
  text: string; // "Candidate K7 submitted to Rate limiting…" — frontends may re-render with names
  challengeId: string | null;
  studentId: string | null;
  at: string;
}

export interface EmployerDashboard {
  company: Company;
  kpis: {
    activeChallenges: number;
    totalSubmissions: number;
    awaitingReview: number;
    avgScore: number | null;
  };
  /** All of the company's live challenges, any status, newest first. */
  challenges: ChallengeView[];
  recentActivity: ActivityItem[];
}

/* ─────────────────────── Requests / responses ─────────────────────── */

export interface Personas {
  students: Student[];
  employers: (EmployerUser & { company: Company })[];
}

export type Me =
  | { kind: 'student'; student: Student }
  | { kind: 'employer'; employer: EmployerUser; company: Company };

export interface CreateChallengeInput {
  title: string;
  summary: string;
  type: ChallengeType;
  skills: string[];
  classroomConcepts?: ClassroomConcept[];
  difficulty: Difficulty;
  estHours: number;
  brief: string;
  deliverables: string[];
  rubric: RubricCriterion[];
  applicantCap: number | null;
  /** 0 = no medals. Omitted = PLATFORM_RULES.placementCount. */
  placements?: number;
  deadline: string; // ISO
  hiringFor?: string | null;
}

export interface ScoreSubmissionInput {
  scores: Record<string, number>; // every rubric criterion id → 1..5
  feedback: string; // ≥ minFeedbackChars
  shortlisted?: boolean;
}

export interface AwardResponse {
  challenge: ChallengeView;
  results: { submissionId: string; studentId: string; rank: number; status: SubmissionStatus }[];
}

export interface FilePreview {
  path: string;
  content: string;
  truncated: boolean;
}

export interface CoachRequest {
  message: string;
  challengeId?: string | null;
  quickPrompt?: CoachQuickPrompt | null;
}

export interface CoachResponse {
  /** Markdown. */
  reply: string;
  recommendedChallengeIds: string[];
}

export interface RubricSuggestRequest {
  type: ChallengeType;
  title?: string;
  brief?: string;
}

export interface RubricSuggestResponse {
  rubric: RubricCriterion[];
}

export interface ApiError {
  /** `issues` lists field-level problems for VALIDATION_ERROR responses (added by S1). */
  error: { code: string; message: string; issues?: { path: string; message: string }[] };
}

/* ─────────────────────── Real-time (SSE) ─────────────────────── */

/** Broadcast to every client on GET /api/events; clients filter by persona. */
export type ServerEvent =
  | { type: 'challenge.created'; payload: { challenge: ChallengeView } }
  | {
      type: 'challenge.updated';
      /** `reason`/`studentId` added by S1: 'joined' when a student claims a spot. */
      payload: { challengeId: string; companyId: string | null; reason?: 'joined' | 'updated' | 'shortlisted'; studentId?: string | null };
    }
  | { type: 'submission.created'; payload: { submissionId: string; challengeId: string; studentId: string; companyId: string | null } }
  | { type: 'submission.scored'; payload: { submissionId: string; challengeId: string; studentId: string; companyId: string | null; totalScore: number } }
  | { type: 'challenge.awarded'; payload: { challengeId: string; companyId: string | null; results: { studentId: string; rank: number; placed: boolean }[] } }
  | { type: 'notification.created'; payload: { notification: Notification } }
  | { type: 'system.reset'; payload: Record<string, never> };

export type ServerEventType = ServerEvent['type'];

/* ───────────────── Seed content (shared/content → server seeder) ───────────────── */

export interface ChallengeSeed extends Omit<Challenge, 'deadline' | 'createdAt' | 'createdBy'> {
  /** Relative to seed time; negative = in the past; null = evergreen. */
  deadlineInDays: number | null;
  createdDaysAgo: number;
  /**
   * Totals after seeding, INCLUDING scriptedResults and joinedNotSubmitted for this challenge.
   * The seeder generates the remainder from background students.
   * Invariant: participants ≥ submissions ≥ scored.
   */
  seed: { participants: number; submissions: number; scored: number };
}

/** Raw material the seeder uses to fabricate realistic submissions for a challenge. */
export interface SubmissionTemplate {
  quality: 'strong' | 'solid' | 'weak';
  /** Approach notes, first person. */
  notes: string;
  /** Zip contents; always includes README.md. */
  files: StarterFile[];
  /** Employer (or Coach) feedback matching this quality tier. */
  feedback: string;
  aiDisclosure?: string;
}

/** Hand-authored results for named students (drives profiles and leaderboards). */
export interface ScriptedResult {
  challengeId: string;
  studentId: string;
  /** criterionId → 1..5; null = submitted but not scored yet. */
  scores: Record<string, number> | null;
  feedback: string | null;
  /** Index into submissionTemplates[challengeId] (0 strong, 1 solid, 2 weak). */
  templateIndex: number;
  submittedDaysAgo: number;
}

/** Dummy-AI field guidance used by Coach's recommend mode. */
export interface CoachPack {
  /** Markdown, 2–4 sentences: what entry-level work in this field looks like. */
  fieldIntro: string;
  learningPath: string[];
  /** Words in a message that map to this field (majors, job titles, tools). */
  keywords: string[];
}

export interface BackgroundPools {
  firstNames: string[];
  lastNames: string[];
  universities: string[];
  majors: { major: string; type: ChallengeType }[];
  /** Placeholders: {major} {university} {field}. */
  bioTemplates: string[];
  /** How many background students to generate (~40). */
  count: number;
}

export interface NotificationSeed extends Omit<Notification, 'id' | 'createdAt'> {
  daysAgo: number;
}

export interface WizardExample extends Omit<CreateChallengeInput, 'deadline'> {
  deadlineInDays: number;
}

export interface SeedContent {
  companies: Company[];
  employers: EmployerUser[];
  /** Named, hand-written students (incl. demo persona stu_maya). */
  students: Student[];
  background: BackgroundPools;
  challenges: ChallengeSeed[];
  /** Key = challenge id. Exactly 3 per challenge, ordered [strong, solid, weak]. */
  submissionTemplates: Record<string, SubmissionTemplate[]>;
  scriptedResults: ScriptedResult[];
  /** Named students who joined but haven't submitted (e.g. Maya on ch_rate_limiter). */
  joinedNotSubmitted: { challengeId: string; studentId: string }[];
  seedNotifications: NotificationSeed[];
  coachPacks: Record<ChallengeType, CoachPack>;
  rubricTemplates: Record<ChallengeType, RubricCriterion[]>;
  /** Key = company id. Prefill for the employer wizard's "Use example". */
  wizardExamples: Record<string, WizardExample>;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

/** A result is "verified" when a person confirmed it: the employer scored it, or someone confirmed an AI grade. */
export function isVerified(s: { reviewer: ReviewerKind | null; verifiedBy?: string | null }): boolean {
  return s.reviewer === 'employer' || !!s.verifiedBy;
}

/** How many top finishers of a challenge get a medal (0 = none). Medals are separate from grading. */
export function placementsFor(challenge: { placements?: number }): number {
  return challenge.placements ?? PLATFORM_RULES.placementCount;
}

/** Weighted total 0–100; missing criteria count as 0. Used by the API and the review UI's live total. */
export function computeTotalScore(rubric: RubricCriterion[], scores: Record<string, number>): number {
  const raw = rubric.reduce((sum, c) => sum + ((scores[c.id] ?? 0) / PLATFORM_RULES.scoreMax) * c.weight, 0);
  return Math.round(raw);
}

