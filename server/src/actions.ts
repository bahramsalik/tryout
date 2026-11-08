/**
 * Mutations. Each one updates the in-memory db, persists it, then broadcasts its ServerEvents
 * (and the notifications it created) over SSE — in that order, so a client refetching on an event
 * always sees the new state.
 */
import {
  PLATFORM_RULES,
  computeTotalScore,
  type AwardResponse,
  type Challenge,
  type ChallengeView,
  type CreateChallengeInput,
  type Notification,
  type ScoreSubmissionInput,
  type ServerEvent,
  type SubmissionView,
} from '../../shared/types.ts';
import { practiceReview, synthesizeAiHints } from './ai.ts';
import type { Participation, SubmissionRecord } from './db.ts';
import { badRequest, conflict, forbidden, notFound } from './errors.ts';
import { emit } from './events.ts';
import { aliasCode, applyAward, assignAlias, clipWords, computeAward, countWords, ordinal } from './logic.ts';
import type { EmployerPersona, StudentPersona } from './persona.ts';
import { randomId } from './rng.ts';
import { getDb, persist, writeUpload } from './store.ts';
import {
  challengeById,
  challengeView,
  isAcceptingWork,
  participationOf,
  studentById,
  submissionOf,
  submissionView,
} from './views.ts';
import { computeAutoChecks, inspectZip, looksLikeZip } from './zip.ts';

const nowIso = () => new Date().toISOString();
/** Notification bodies are ≤ 8 words (SPEC-FLUENT §6); a clipped challenge title is usually the whole body. */
const bodyTitle = (t: string, words = 8) => clipWords(t, words);

function commit(events: ServerEvent[]): void {
  persist();
  for (const e of events) emit(e);
}

function uniqueId(prefix: string, taken: (id: string) => boolean): string {
  for (;;) {
    const id = randomId(prefix);
    if (!taken(id)) return id;
  }
}

function notification(events: ServerEvent[], n: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const db = getDb();
  const created: Notification = {
    id: uniqueId('ntf', (id) => db.notifications.some((x) => x.id === id)),
    createdAt: nowIso(),
    read: false,
    ...n,
  };
  db.notifications.push(created);
  events.push({ type: 'notification.created', payload: { notification: created } });
  return created;
}


function addParticipation(ch: Challenge, studentId: string): Participation {
  const db = getDb();
  const taken = new Set(db.participations.filter((p) => p.challengeId === ch.id).map((p) => aliasCode(p.alias)));
  const p: Participation = { challengeId: ch.id, studentId, joinedAt: nowIso(), alias: assignAlias(ch.id, studentId, taken) };
  db.participations.push(p);
  return p;
}

const participantCount = (challengeId: string) => getDb().participations.filter((p) => p.challengeId === challengeId).length;

/* ───────────── challenges ───────────── */

export function createChallenge(p: EmployerPersona, input: CreateChallengeInput): ChallengeView {
  const db = getDb();
  const events: ServerEvent[] = [];
  const ch: Challenge = {
    id: uniqueId('ch', (id) => db.challenges.some((c) => c.id === id)),
    kind: 'live',
    companyId: p.company.id,
    title: input.title.trim(),
    summary: input.summary.trim(),
    type: input.type,
    skills: input.skills.map((s) => s.trim()).filter(Boolean),
    classroomConcepts: input.classroomConcepts ?? [],
    difficulty: input.difficulty,
    estHours: input.estHours,
    brief: input.brief,
    deliverables: input.deliverables.map((d) => d.trim()).filter(Boolean),
    rubric: input.rubric,
    applicantCap: input.applicantCap,
    ...(input.placements !== undefined ? { placements: input.placements } : {}),
    deadline: new Date(input.deadline).toISOString(),
    status: 'open',
    hiringFor: input.hiringFor?.trim() || null,
    starterFiles: [],
    aiHints: synthesizeAiHints(input),
    createdAt: nowIso(),
    createdBy: p.id,
    awardedAt: null,
  };
  db.challenges.push(ch);
  events.push({ type: 'challenge.created', payload: { challenge: challengeView(ch, null) } });
  // §5.5 #15: notify students whose interests include the type.
  for (const s of db.students.filter((st) => st.interests.includes(ch.type))) {
    notification(events, {
      recipientId: s.id,
      kind: 'new_challenge',
      title: `New from ${p.company.name}`,
      body: bodyTitle(ch.title),
      link: `/challenges/${ch.id}`,
    });
  }
  commit(events);
  return challengeView(ch, p);
}

export function updateChallenge(p: EmployerPersona, ch: Challenge, patch: { status?: 'open' | 'reviewing'; deadline?: string }): ChallengeView {
  if (ch.status === 'awarded') throw conflict('ALREADY_AWARDED', 'Results are out. This challenge is locked.');
  if (patch.status) ch.status = patch.status;
  if (patch.deadline) ch.deadline = new Date(patch.deadline).toISOString();
  commit([{ type: 'challenge.updated', payload: { challengeId: ch.id, companyId: ch.companyId, reason: 'updated', studentId: null } }]);
  return challengeView(ch, p);
}

export function joinChallenge(p: StudentPersona, ch: Challenge): ChallengeView {
  if (participationOf(ch.id, p.id) || submissionOf(ch.id, p.id)) throw conflict('ALREADY_JOINED', 'Already joined.');
  if (!isAcceptingWork(ch)) throw conflict('CLOSED', 'This challenge is closed.');
  if (ch.applicantCap !== null && participantCount(ch.id) >= ch.applicantCap) {
    throw conflict('CAP_REACHED', `All ${ch.applicantCap} spots are taken.`);
  }
  const events: ServerEvent[] = [];
  addParticipation(ch, p.id);
  events.push({ type: 'challenge.updated', payload: { challengeId: ch.id, companyId: ch.companyId, reason: 'joined', studentId: p.id } });
  if (ch.companyId && ch.kind === 'live' && ch.applicantCap !== null && participantCount(ch.id) >= ch.applicantCap) {
    notification(events, {
      recipientId: ch.companyId,
      kind: 'cap_reached',
      title: `Challenge full · ${ch.applicantCap} spots`,
      body: bodyTitle(ch.title),
      link: `/challenges/${ch.id}`,
    });
  }
  commit(events);
  return challengeView(ch, p);
}

/* ───────────── submissions ───────────── */

/** Cheap checks that don't need the upload; run before multer reads the body. */
export function assertCanSubmit(p: StudentPersona, ch: Challenge): void {
  if (!isAcceptingWork(ch)) throw conflict('CLOSED', 'This challenge is closed.');
  if (submissionOf(ch.id, p.id)) throw conflict('ALREADY_SUBMITTED', 'You already submitted. One per student.');
  if (ch.kind === 'live' && !participationOf(ch.id, p.id)) throw forbidden('NOT_JOINED', 'Join the challenge first.');
}

export interface SubmitFields {
  notes?: unknown;
  demoUrl?: unknown;
  aiDisclosure?: unknown;
}

/** Multipart field → string, with CRLF (as browsers send form fields) normalized to LF. */
const asText = (v: unknown) =>
  (typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '').replace(/\r\n?/g, '\n');

export function submitWork(
  p: StudentPersona,
  ch: Challenge,
  file: { originalname: string; size: number; buffer: Buffer } | undefined,
  fields: SubmitFields,
): SubmissionView {
  assertCanSubmit(p, ch); // re-check: state may have changed while the upload streamed in
  const notes = asText(fields.notes).trim();
  if (notes.length < PLATFORM_RULES.minNotesChars) {
    throw badRequest('NOTES_TOO_SHORT', `Notes need ${PLATFORM_RULES.minNotesChars}+ characters (${notes.length} now).`);
  }
  if (!file) throw badRequest('NOT_ZIP', 'Attach a .zip file.');
  if (file.size > PLATFORM_RULES.maxUploadMb * 1024 * 1024) {
    throw badRequest('FILE_TOO_LARGE', `Max zip size is ${PLATFORM_RULES.maxUploadMb} MB.`);
  }
  const originalName = (file.originalname.split(/[\\/]/).pop() ?? 'submission.zip').replace(/[\u0000-\u001f]/g, '').slice(0, 120) || 'submission.zip';
  const { extOk, magicOk } = looksLikeZip(originalName, file.buffer);
  if (!extOk) throw badRequest('NOT_ZIP', 'Upload a .zip file.');
  if (!magicOk) throw badRequest('NOT_ZIP', "That file isn't a real zip.");
  let info: ReturnType<typeof inspectZip>;
  try {
    info = inspectZip(file.buffer);
  } catch {
    throw badRequest('NOT_ZIP', "That zip can't be read. Re-zip and retry.");
  }

  let demoUrl: string | null = asText(fields.demoUrl).trim() || null;
  if (demoUrl) {
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(demoUrl)) demoUrl = `https://${demoUrl}`;
    try {
      const u = new URL(demoUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('protocol');
    } catch {
      throw badRequest('INVALID_DEMO_URL', 'Use an http(s) link.');
    }
  }
  const aiDisclosure = asText(fields.aiDisclosure).trim() || null;

  const db = getDb();
  const events: ServerEvent[] = [];
  let participation = participationOf(ch.id, p.id);
  if (!participation) {
    participation = addParticipation(ch, p.id); // practice: auto-join on submit (§5.5 #3)
    events.push({ type: 'challenge.updated', payload: { challengeId: ch.id, companyId: ch.companyId, reason: 'joined', studentId: p.id } });
  }
  const id = uniqueId('sub', (x) => db.submissions.some((s) => s.id === x));
  writeUpload(id, file.buffer);
  const autoChecks = computeAutoChecks(ch.type, info, file.size);
  const sub: SubmissionRecord = {
    id,
    challengeId: ch.id,
    studentId: p.id,
    submittedAt: nowIso(),
    notes,
    demoUrl,
    aiDisclosure,
    file: { originalName, sizeBytes: file.size, fileCount: info.fileCount, tree: info.tree, readme: info.readme },
    autoChecks,
    status: 'submitted',
    reviewer: null,
    scores: null,
    totalScore: null,
    feedback: null,
    scoredAt: null,
    rank: null,
    shortlisted: false,
    alias: participation.alias,
    scoredBy: null,
  };

  if (ch.kind === 'practice') {
    // DUMMY-AI: instant Coach review (§5.5 #14).
    const review = practiceReview(ch, { submissionId: id, notes, autoChecks });
    Object.assign(sub, {
      status: 'scored',
      reviewer: 'coach',
      scores: review.scores,
      totalScore: review.totalScore,
      feedback: review.feedback,
      scoredAt: nowIso(),
      scoredBy: 'coach',
    } satisfies Partial<SubmissionRecord>);
  }
  db.submissions.push(sub);

  const companyId = ch.companyId;
  events.push({ type: 'submission.created', payload: { submissionId: id, challengeId: ch.id, studentId: p.id, companyId } });
  if (ch.kind === 'practice') {
    events.push({
      type: 'submission.scored',
      payload: { submissionId: id, challengeId: ch.id, studentId: p.id, companyId, totalScore: sub.totalScore ?? 0 },
    });
    notification(events, {
      recipientId: p.id,
      kind: 'coach_review',
      title: `Coach review · ${sub.totalScore}/100`,
      body: bodyTitle(ch.title),
      link: `/challenges/${ch.id}`,
    });
  } else if (companyId) {
    const awaiting = db.submissions.filter((s) => s.challengeId === ch.id && s.totalScore === null).length;
    notification(events, {
      recipientId: companyId,
      kind: 'submission_received',
      title: `New submission · ${awaiting} to review`,
      body: `${sub.alias} · ${bodyTitle(ch.title, 8 - countWords(sub.alias))}`,
      link: `/challenges/${ch.id}/review/${id}`,
    });
  }
  commit(events);
  return submissionView(sub, p);
}

export function scoreSubmission(p: EmployerPersona, sub: SubmissionRecord, input: ScoreSubmissionInput): SubmissionView {
  const ch = challengeById(sub.challengeId)!;
  if (ch.kind === 'practice') throw conflict('PRACTICE_SUBMISSION', 'Coach reviews practice work.');
  if (ch.status === 'awarded') throw conflict('ALREADY_AWARDED', 'Results are out. Scores are final.');
  const issues: { path: string; message: string }[] = [];
  const scores = input.scores ?? {};
  const ids = new Set(ch.rubric.map((c) => c.id));
  for (const k of Object.keys(scores)) if (!ids.has(k)) issues.push({ path: `scores.${k}`, message: 'Unknown rubric criterion' });
  for (const c of ch.rubric) {
    const v = scores[c.id];
    if (v === undefined) issues.push({ path: `scores.${c.id}`, message: `Missing score for "${c.name}"` });
    else if (!Number.isInteger(v) || v < PLATFORM_RULES.scoreMin || v > PLATFORM_RULES.scoreMax) {
      issues.push({ path: `scores.${c.id}`, message: `Score must be an integer ${PLATFORM_RULES.scoreMin}–${PLATFORM_RULES.scoreMax}` });
    }
  }
  if (issues.length) throw badRequest('INVALID_SCORES', `Score every criterion ${PLATFORM_RULES.scoreMin}–${PLATFORM_RULES.scoreMax}.`, issues);
  const feedback = (input.feedback ?? '').trim();
  if (feedback.length < PLATFORM_RULES.minFeedbackChars) {
    throw badRequest('FEEDBACK_TOO_SHORT', `Feedback needs ${PLATFORM_RULES.minFeedbackChars}+ characters.`);
  }
  const clean: Record<string, number> = {};
  for (const c of ch.rubric) clean[c.id] = scores[c.id]!;
  sub.scores = clean;
  sub.totalScore = computeTotalScore(ch.rubric, clean);
  sub.feedback = feedback;
  sub.scoredAt = nowIso();
  sub.status = 'scored';
  sub.reviewer = 'employer';
  sub.scoredBy = p.id;
  if (typeof input.shortlisted === 'boolean') sub.shortlisted = input.shortlisted;
  commit([
    {
      type: 'submission.scored',
      payload: { submissionId: sub.id, challengeId: ch.id, studentId: sub.studentId, companyId: ch.companyId, totalScore: sub.totalScore },
    },
  ]);
  return submissionView(sub, p);
}

export function setShortlisted(p: EmployerPersona, sub: SubmissionRecord, shortlisted: boolean): SubmissionView {
  sub.shortlisted = shortlisted;
  const ch = challengeById(sub.challengeId)!;
  commit([{ type: 'challenge.updated', payload: { challengeId: ch.id, companyId: ch.companyId, reason: 'shortlisted', studentId: sub.studentId } }]);
  return submissionView(sub, p);
}

export function awardChallenge(p: EmployerPersona, ch: Challenge): AwardResponse {
  if (ch.kind === 'practice') throw conflict('PRACTICE_NOT_AWARDABLE', 'Practice tasks have no results.');
  if (ch.status === 'awarded') throw conflict('ALREADY_AWARDED', 'Results are already out.');
  const db = getDb();
  const subs = db.submissions.filter((s) => s.challengeId === ch.id);
  const pending = subs.filter(
    (s) => s.totalScore === null || !s.feedback || s.feedback.trim().length < PLATFORM_RULES.minFeedbackChars,
  );
  if (pending.length) {
    throw conflict(
      'UNSCORED_SUBMISSIONS',
      `Score ${pending.length} more submission${pending.length === 1 ? '' : 's'} first.`,
    );
  }
  const lines = computeAward(ch, subs);
  applyAward(lines);
  ch.status = 'awarded';
  ch.awardedAt = nowIso();

  const events: ServerEvent[] = [
    {
      type: 'challenge.awarded',
      payload: { challengeId: ch.id, companyId: ch.companyId, results: lines.map((l) => ({ studentId: l.sub.studentId, rank: l.rank })) },
    },
  ];
  for (const l of lines) {
    if (l.status === 'awarded') {
      notification(events, {
        recipientId: l.sub.studentId,
        kind: 'awarded',
        title: `${ordinal(l.rank)} place`,
        body: bodyTitle(ch.title),
        link: `/challenges/${ch.id}`,
      });
    } else {
      notification(events, {
        recipientId: l.sub.studentId,
        kind: 'results',
        title: 'Results are in',
        body: `${l.sub.totalScore}/100 · ${bodyTitle(ch.title, 7)}`,
        link: `/challenges/${ch.id}`,
      });
    }
  }
  commit(events);
  return {
    challenge: challengeView(ch, p),
    results: lines.map((l) => ({ submissionId: l.sub.id, studentId: l.sub.studentId, rank: l.rank, status: l.status })),
  };
}

/* ───────────── notifications ───────────── */

export function markAllRead(recipientId: string): void {
  let changed = false;
  for (const n of getDb().notifications) {
    if (n.recipientId === recipientId && !n.read) {
      n.read = true;
      changed = true;
    }
  }
  if (changed) persist();
}

export function markRead(recipientId: string, id: string): Notification {
  const n = getDb().notifications.find((x) => x.id === id && x.recipientId === recipientId);
  if (!n) throw notFound('NOTIFICATION_NOT_FOUND', `No notification ${id}.`);
  if (!n.read) {
    n.read = true;
    persist();
  }
  return n;
}
