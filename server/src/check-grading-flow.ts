/**
 * `npm run check-grading-flow`: end-to-end check of AI grading with a FAKE local API standing in for Claude.
 * It never contacts the real API and never spends money. It uses a throwaway data folder.
 *
 * Covers: a live submission is marked "grading", gets graded in the background, becomes visible to the
 * student at once, notifies them, and a recruiter's own score replaces the AI's. Also the "delayed" path.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import type { Notification } from '../../shared/types.ts';

let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${err instanceof Error ? err.message : err}`);
  }
}

/* ── fake Anthropic API ── */
let mode: 'ok' | 'fail' = 'ok';
let apiCalls = 0;
const fake = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    apiCalls += 1;
    if (mode === 'fail') {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'boom' } }));
      return;
    }
    const prompt = String(JSON.parse(body).messages[0].content);
    const ids = [...prompt.matchAll(/^- id: (\S+) \|/gm)].map((m) => m[1]!);
    const out = {
      criteria: ids.map((id, i) => ({ criterionId: id, evidence: `Evidence for ${id}`, score: i % 2 ? 4 : 5 })),
      feedback: 'Good work. Add more tests to cover the edge cases.',
    };
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-haiku-5-5',
        content: [{ type: 'text', text: JSON.stringify(out) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 300 },
      }),
    );
  });
});
await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
const port = (fake.address() as AddressInfo).port;

// Must be set before the server modules load (config reads them once).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tryout-grading-'));
process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`;
process.env.GRADER_DAILY_LIMIT = '10';

const { initData } = await import('./boot.ts');
const { getDb } = await import('./store.ts');
const actions = await import('./actions.ts');
const views = await import('./views.ts');
const { writeUpload } = await import('./store.ts');
const { computeTotalScore, needsRecruiterReview, prizeForPlace } = await import('../../shared/types.ts');

await initData();
const db = getDb();
const ch = db.challenges.find((c) => c.id === 'ch_rate_limiter')!;
const student = db.students.find((s) => s.id === 'stu_maya')!;
const employer = db.employers.find((e) => e.companyId === ch.companyId)!;
const company = db.companies.find((c) => c.id === ch.companyId)!;
const studentP = { kind: 'student' as const, id: student.id, student };
const employerP = { kind: 'employer' as const, id: employer.id, employer, company };

const zip = new AdmZip();
zip.addFile('README.md', Buffer.from('# Limiter\nToken bucket with per-key refill.'));
zip.addFile('src/limiter.ts', Buffer.from('export const limit = 10;\n'));
const zipBuf = zip.toBuffer();

console.log('AI grading flow checks (fake API)');

const view = actions.submitWork(studentP, ch, { originalname: 'work.zip', size: zipBuf.length, buffer: zipBuf }, { notes: 'x'.repeat(80) });
const sub = db.submissions.find((s) => s.id === view.id)!;

await test('marks live work as grading and hides the score until it is done', () => {
  assert.equal(sub.gradingState, 'grading');
  assert.equal(view.totalScore, null);
});

for (let i = 0; i < 100 && sub.totalScore === null; i++) await new Promise((r) => setTimeout(r, 50));

await test('grades it in the background with per-criterion evidence', () => {
  assert.notEqual(sub.totalScore, null);
  assert.equal(sub.reviewer, 'ai');
  assert.equal(sub.scoredBy, 'ai');
  assert.equal(sub.status, 'scored');
  assert.equal(sub.gradingState, undefined);
  for (const c of ch.rubric) {
    assert.ok(sub.scores?.[c.id], `score for ${c.id}`);
    assert.equal(sub.scoreNotes?.[c.id], `Evidence for ${c.id}`);
  }
  assert.equal(sub.totalScore, computeTotalScore(ch.rubric, sub.scores!));
  assert.equal(apiCalls, 1);
});

await test('shows the result to the student straight away, unverified', () => {
  const mine = views.submissionView(sub, studentP);
  assert.equal(mine.totalScore, sub.totalScore);
  assert.equal(mine.verified, false);
  assert.ok(mine.feedback && mine.feedback.length > 20);
});

await test('notifies the student', () => {
  const n = db.notifications.find((x: Notification) => x.recipientId === student.id && x.title.startsWith('Graded'));
  assert.ok(n, 'a "Graded" notification');
});

await test('puts a strong AI grade in the recruiter queue', () => {
  assert.ok(sub.totalScore! >= 75);
  assert.equal(needsRecruiterReview(sub), true);
  assert.ok((views.challengeView(ch, employerP).toReview ?? 0) >= 1);
});

await test('confirming keeps the AI scores and makes the result verified', () => {
  const before = { total: sub.totalScore, scores: { ...sub.scores } };
  const after = actions.verifySubmission(employerP, sub);
  assert.equal(sub.reviewer, 'ai');
  assert.equal(sub.verifiedBy, employer.id);
  assert.equal(sub.totalScore, before.total);
  assert.deepEqual(sub.scores, before.scores);
  assert.equal(after.verified, true);
  assert.equal(needsRecruiterReview(sub), false);
});

await test('a recruiter scoring it replaces the AI grade and verifies it', () => {
  const scores = Object.fromEntries(ch.rubric.map((c) => [c.id, 3]));
  const after = actions.scoreSubmission(employerP, sub, { scores, feedback: 'Reviewed by hand; solid but untested.' });
  assert.equal(sub.reviewer, 'employer');
  assert.equal(sub.scoreNotes, undefined);
  assert.equal(after.verified, true);
});

await test('publishing a challenge with no award ranks nobody and awards nothing', () => {
  ch.placements = 0;
  const placeNotificationsBefore = db.notifications.filter((n: Notification) => n.title.includes(' place')).length;
  const res = actions.awardChallenge(employerP, ch);
  const mine = db.submissions.filter((x) => x.challengeId === ch.id);
  assert.ok(mine.length > 1);
  assert.ok(mine.every((x) => x.rank === null), 'no stored ranks');
  assert.ok(mine.every((x) => x.status !== 'awarded'), 'nobody placed');
  assert.ok(res.results.every((r) => r.rank === null && r.status !== 'awarded'));
  assert.equal(db.notifications.filter((n: Notification) => n.title.includes(' place')).length, placeNotificationsBefore, 'no "place" notifications');
});

await test('pays a prize only to a Verified winner', () => {
  // A fresh challenge: Top 1, a 300 prize, two AI-graded submissions that nobody has confirmed yet.
  const prizeCh = { ...ch, id: 'ch_prize_test', status: 'open' as const, placements: 1, prizePool: 300 };
  delete (prizeCh as { awardedAt?: unknown }).awardedAt;
  db.challenges.push(prizeCh);
  const mk = (id: string, studentId: string, score: number) => ({
    ...sub,
    id,
    challengeId: prizeCh.id,
    studentId,
    totalScore: score,
    reviewer: 'ai' as const,
    verifiedBy: null,
    scoredBy: 'ai',
    status: 'scored' as const,
    rank: null,
    feedback: 'Good work. Add more tests to cover the edge cases.',
    scores: Object.fromEntries(ch.rubric.map((c) => [c.id, 4])),
  });
  const top = mk('sub_prize_top', 'stu_hana', 90);
  const second = mk('sub_prize_second', 'stu_arjun', 80);
  db.submissions.push(top, second);

  assert.throws(() => actions.awardChallenge(employerP, prizeCh), /prizes go to verified results only/);
  assert.equal(top.prize, undefined, 'nothing is paid while the winner is unconfirmed');
  assert.equal(prizeCh.status, 'open');

  actions.verifySubmission(employerP, top);
  actions.awardChallenge(employerP, prizeCh);
  assert.equal(top.prize, 300);
  assert.equal(second.prize, undefined);
  const note = db.notifications.find((n: Notification) => n.recipientId === 'stu_hana' && n.title.includes('300'));
  assert.ok(note, 'the winner is told about the prize');
});

await test('splits a Top 3 prize 50 / 30 / 20', () => {
  const three = { placements: 3, prizePool: 500 };
  assert.deepEqual([1, 2, 3, 4].map((rank) => prizeForPlace(three, rank)), [250, 150, 100, 0]);
  assert.equal(prizeForPlace({ placements: 0, prizePool: 500 }, 1), 0);
  assert.equal(prizeForPlace({ placements: 1 }, 1), 0);
});

await test('leaves work "delayed" instead of inventing a score when the API fails', async () => {
  mode = 'fail';
  const clone = { ...sub, id: 'sub_delayed_test', totalScore: null, scores: null, feedback: null, scoredAt: null, reviewer: null, status: 'submitted' as const, gradingState: 'grading' as const };
  delete (clone as { scoreNotes?: unknown }).scoreNotes;
  db.submissions.push(clone);
  writeUpload(clone.id, zipBuf);
  await actions.runAiGrading(clone.id, zipBuf, 3); // attempt 3 = out of retries
  assert.equal(clone.gradingState, 'delayed');
  assert.equal(clone.totalScore, null);
  mode = 'ok';
});

fake.close();
fake.closeAllConnections?.();
console.log(failed === 0 ? '\nAll grading-flow checks passed.' : `\n${failed} grading-flow check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
