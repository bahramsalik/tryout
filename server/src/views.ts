/**
 * Read models: entity → API view, with the privacy rules applied.
 *
 * - Results (scores, feedback, rank, "scored" status) are hidden from everyone except the owning
 *   company until results are published; practice (Coach) results are visible immediately (§5.5 #8, #14).
 * - Files are visible to the author and the owning company only (§5.5 #12).
 * - Shortlists are visible to the owning company only.
 */
import {
  CHALLENGE_TYPES,
  PLATFORM_RULES,
  isVerified,
  needsRecruiterReview,
  type ActivityItem,
  type Challenge,
  type ChallengeSummary,
  type ChallengeType,
  type ChallengeView,
  type Company,
  type EmployerDashboard,
  type ProfileHistoryItem,
  type Student,
  type StudentListItem,
  type StudentProfile,
  type StudentStats,
  type SubmissionStatus,
  type SubmissionView,
} from '../../shared/types.ts';
import type { SubmissionRecord } from './db.ts';
import { clipWords, truncate } from './logic.ts';
import type { EmployerPersona, Persona } from './persona.ts';
import { getDb } from './store.ts';

/* ───────────── lookups ───────────── */

export const companyById = (id: string | null): Company | null => (id ? (getDb().companies.find((c) => c.id === id) ?? null) : null);
export const challengeById = (id: string): Challenge | undefined => getDb().challenges.find((c) => c.id === id);
export const studentById = (id: string): Student | undefined => getDb().students.find((s) => s.id === id);
export const studentByIdOrHandle = (key: string): Student | undefined =>
  getDb().students.find((s) => s.id === key || s.handle === key);
export const submissionById = (id: string): SubmissionRecord | undefined => getDb().submissions.find((s) => s.id === id);
export const participationOf = (challengeId: string, studentId: string) =>
  getDb().participations.find((p) => p.challengeId === challengeId && p.studentId === studentId);
export const submissionOf = (challengeId: string, studentId: string) =>
  getDb().submissions.find((s) => s.challengeId === challengeId && s.studentId === studentId);

/* ───────────── visibility rules ───────────── */

export function isOwner(viewer: Persona | null, ch: Challenge): boolean {
  return viewer?.kind === 'employer' && ch.companyId !== null && viewer.company.id === ch.companyId;
}

export function resultsPublished(ch: Challenge): boolean {
  return ch.kind === 'practice' || ch.status === 'awarded';
}

export function canSeeResults(ch: Challenge, viewer: Persona | null): boolean {
  return resultsPublished(ch) || isOwner(viewer, ch);
}

/** An AI-graded result is visible as soon as it exists: it is the student's own credential, not a ranking. */
export function isAiGraded(sub: SubmissionRecord): boolean {
  return sub.reviewer === 'ai' && sub.totalScore !== null;
}

function visibleStatus(sub: SubmissionRecord, ch: Challenge, viewer: Persona | null): SubmissionStatus {
  if (canSeeResults(ch, viewer) || isAiGraded(sub)) return sub.status;
  return sub.status === 'scored' ? 'submitted' : sub.status;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/* ───────────── challenges ───────────── */

export function challengeSummary(ch: Challenge): ChallengeSummary {
  return {
    id: ch.id,
    title: ch.title,
    type: ch.type,
    kind: ch.kind,
    status: ch.status,
    estHours: ch.estHours,
    rubric: ch.rubric,
    company: companyById(ch.companyId),
    companyId: ch.companyId,
    deadline: ch.deadline,
  };
}

export function challengeView(ch: Challenge, viewer: Persona | null): ChallengeView {
  const db = getDb();
  const { starterFiles, ...rest } = ch;
  const parts = db.participations.filter((p) => p.challengeId === ch.id);
  const subs = db.submissions.filter((s) => s.challengeId === ch.id);
  const scored = subs.filter((s) => s.totalScore !== null);
  const view: ChallengeView = {
    ...rest,
    awardedAt: ch.awardedAt ?? null,
    company: companyById(ch.companyId),
    participantCount: parts.length,
    submissionCount: subs.length,
    scoredCount: scored.length,
    spotsLeft: ch.applicantCap === null ? null : Math.max(0, ch.applicantCap - parts.length),
    hasStarterKit: starterFiles.length > 0,
  };
  if (viewer?.kind === 'student') {
    const sub = subs.find((s) => s.studentId === viewer.id);
    view.viewer = {
      joined: !!sub || parts.some((p) => p.studentId === viewer.id),
      submissionId: sub?.id ?? null,
      submissionStatus: sub ? visibleStatus(sub, ch, viewer) : null,
    };
  }
  if (isOwner(viewer, ch)) {
    const avg = mean(scored.map((s) => s.totalScore ?? 0));
    view.avgScore = avg === null ? null : Math.round(avg);
    view.toReview = subs.filter(needsRecruiterReview).length;
  }
  return view;
}

/** True while a live challenge accepts joins/submissions. */
export function isAcceptingWork(ch: Challenge, now = Date.now()): boolean {
  if (ch.status !== 'open') return false;
  return ch.deadline === null || Date.parse(ch.deadline) > now;
}

/* ───────────── submissions ───────────── */

export function submissionView(sub: SubmissionRecord, viewer: Persona | null, opts: { peer?: boolean } = {}): SubmissionView {
  const ch = challengeById(sub.challengeId);
  const student = studentById(sub.studentId);
  if (!ch || !student) throw new Error(`dangling submission ${sub.id}`);
  const { scoredBy: _scoredBy, verifiedBy: _verifiedBy, ...base } = sub;
  const view: SubmissionView = {
    ...base,
    verified: isVerified(sub),
    file: { ...base.file, tree: [...base.file.tree] },
    autoChecks: base.autoChecks.map((c) => ({ ...c })),
    scores: base.scores ? { ...base.scores } : null,
    student,
    challenge: challengeSummary(ch),
  };
  if (!isOwner(viewer, ch)) {
    view.shortlisted = false;
    if (!resultsPublished(ch) && !isAiGraded(sub)) {
      view.status = visibleStatus(sub, ch, viewer);
      view.reviewer = null;
      view.verified = false;
      view.scores = null;
      view.totalScore = null;
      view.feedback = null;
      view.scoredAt = null;
      view.rank = null;
    }
  }
  if (opts.peer) {
    // Another student's entry on a published leaderboard: placement only, no work or feedback.
    view.notes = '';
    view.demoUrl = null;
    view.aiDisclosure = null;
    view.feedback = null;
    view.scores = null;
    view.file = { ...view.file, tree: [], readme: null };
  }
  return view;
}

/* ───────────── students ───────────── */

export function studentStats(studentId: string): StudentStats {
  const db = getDb();
  const student = studentById(studentId);
  let verifiedHours = 0;
  let practiceHours = 0;
  let tasksCompleted = 0;
  const placements = { first: 0, second: 0, third: 0 };
  const employerScores: number[] = [];
  const byType = new Map<ChallengeType, { sum: number; count: number }>();
  const skillWeight = new Map<string, number>();

  for (const s of db.submissions) {
    if (s.studentId !== studentId || s.totalScore === null) continue;
    const ch = challengeById(s.challengeId);
    if (!ch) continue;
    if (ch.kind === 'practice') {
      practiceHours += ch.estHours;
    } else {
      // Employer-scored results count once published (keeps unpublished scores private); AI grades count straight away.
      const counted = s.reviewer === 'ai' || (ch.status === 'awarded' && s.reviewer === 'employer');
      if (!counted) continue;
      tasksCompleted += 1;
      employerScores.push(s.totalScore);
      if (s.totalScore >= PLATFORM_RULES.verifiedPassScore) verifiedHours += ch.estHours;
      if (s.status === 'awarded') {
        if (s.rank === 1) placements.first += 1;
        else if (s.rank === 2) placements.second += 1;
        else if (s.rank === 3) placements.third += 1;
      }
    }
    const agg = byType.get(ch.type) ?? { sum: 0, count: 0 };
    agg.sum += s.totalScore;
    agg.count += 1;
    byType.set(ch.type, agg);
    if (s.totalScore >= PLATFORM_RULES.verifiedPassScore) {
      for (const skill of ch.skills) skillWeight.set(skill, (skillWeight.get(skill) ?? 0) + s.totalScore);
    }
  }

  const earned = [...skillWeight.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const topSkills = [...new Set([...earned, ...(student?.skills ?? [])])].slice(0, 6);
  const avg = mean(employerScores);
  return {
    verifiedHours,
    practiceHours,
    tasksCompleted,
    placements,
    avgScore: avg === null ? null : Math.round(avg),
    typeScores: CHALLENGE_TYPES.filter((t) => byType.has(t)).map((t) => {
      const agg = byType.get(t)!;
      return { type: t, avgScore: Math.round(agg.sum / agg.count), count: agg.count };
    }),
    topSkills,
  };
}

function historyItem(sub: SubmissionRecord, viewer: Persona | null): ProfileHistoryItem {
  const ch = challengeById(sub.challengeId)!;
  const company = companyById(ch.companyId);
  const visible = canSeeResults(ch, viewer) || isAiGraded(sub);
  return {
    submissionId: sub.id,
    challengeId: ch.id,
    challengeTitle: ch.title,
    type: ch.type,
    kind: ch.kind,
    company: company ? { id: company.id, name: company.name, logoColor: company.logoColor, logoInitials: company.logoInitials } : null,
    submittedAt: sub.submittedAt,
    status: visibleStatus(sub, ch, viewer),
    reviewer: visible ? sub.reviewer : null,
    verified: visible && isVerified(sub),
    totalScore: visible ? sub.totalScore : null,
    rank: visible ? sub.rank : null,
    feedbackExcerpt: visible && sub.feedback ? truncate(sub.feedback.replace(/\s+/g, ' ').trim(), 180) : null,
    estHours: ch.estHours,
    canViewFiles: (viewer?.kind === 'student' && viewer.id === sub.studentId) || isOwner(viewer, ch),
  };
}

export function studentProfile(student: Student, viewer: Persona | null): StudentProfile {
  const history = getDb()
    .submissions.filter((s) => s.studentId === student.id && challengeById(s.challengeId))
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
    .map((s) => historyItem(s, viewer));
  return { ...student, stats: studentStats(student.id), history };
}

export function studentListItem(student: Student): StudentListItem {
  return { ...student, stats: studentStats(student.id) };
}

/* ───────────── employer dashboard ───────────── */

/** Feed lines are ≤ 8 words (SPEC-FLUENT §6). */
const feedTitle = (t: string, words: number) => clipWords(t, words);

export function activityFeed(companyId: string, limit = 30): ActivityItem[] {
  const db = getDb();
  const live = new Map(db.challenges.filter((c) => c.companyId === companyId && c.kind === 'live').map((c) => [c.id, c]));
  const nameOf = (employerId: string | null) =>
    (employerId && db.employers.find((e) => e.id === employerId)?.name.split(' ')[0]) || 'Your team';
  const items: ActivityItem[] = [];
  for (const p of db.participations) {
    const ch = live.get(p.challengeId);
    if (!ch) continue;
    items.push({ id: `act_join_${ch.id}_${p.studentId}`, kind: 'join', text: `${p.alias} joined ${feedTitle(ch.title, 5)}`, challengeId: ch.id, studentId: p.studentId, at: p.joinedAt });
  }
  for (const s of db.submissions) {
    const ch = live.get(s.challengeId);
    if (!ch) continue;
    items.push({ id: `act_sub_${s.id}`, kind: 'submission', text: `${s.alias} submitted ${feedTitle(ch.title, 5)}`, challengeId: ch.id, studentId: s.studentId, at: s.submittedAt });
    if (s.scoredAt && s.reviewer === 'employer' && s.totalScore !== null) {
      items.push({ id: `act_score_${s.id}`, kind: 'scored', text: `${nameOf(s.scoredBy)} scored ${s.alias} · ${s.totalScore}`, challengeId: ch.id, studentId: s.studentId, at: s.scoredAt });
    }
  }
  for (const ch of live.values()) {
    if (!ch.awardedAt) continue;
    const text = `Results out · ${feedTitle(ch.title, 6)}`;
    items.push({ id: `act_award_${ch.id}`, kind: 'award', text, challengeId: ch.id, studentId: null, at: ch.awardedAt });
  }
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || a.id.localeCompare(b.id)).slice(0, limit);
}

export function employerDashboard(p: EmployerPersona): EmployerDashboard {
  const db = getDb();
  const companyId = p.company.id;
  const live = db.challenges
    .filter((c) => c.companyId === companyId && c.kind === 'live')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const liveIds = new Set(live.map((c) => c.id));
  const active = live.filter((c) => c.status !== 'awarded');
  const activeIds = new Set(active.map((c) => c.id));
  const subs = db.submissions.filter((s) => liveIds.has(s.challengeId));
  const scored = subs.filter((s) => s.totalScore !== null && s.reviewer === 'employer');
  const avg = mean(scored.map((s) => s.totalScore ?? 0));
  return {
    company: p.company,
    kpis: {
      activeChallenges: active.length,
      totalSubmissions: subs.length,
      awaitingReview: subs.filter((s) => activeIds.has(s.challengeId) && needsRecruiterReview(s)).length,
      avgScore: avg === null ? null : Math.round(avg),
    },
    challenges: live.map((c) => challengeView(c, p)),
    recentActivity: activityFeed(companyId),
  };
}
