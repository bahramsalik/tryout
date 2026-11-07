/** Pure business rules shared by the seeder and the live endpoints. */
import { payoutForRank, type Challenge, type SubmissionStatus } from '../../shared/types.ts';
import type { SubmissionRecord } from './db.ts';
import { shortHash } from './rng.ts';

/* ───────────── blind-review aliases (SPEC §5.5 #11) ───────────── */

const ALIAS_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I / O
const ALIAS_DIGITS = '23456789'; // no 0 / 1

/** Pinned so the demo script's "Candidate K7" is exact (SPEC §4). */
export const RESERVED_ALIASES: Record<string, Record<string, string>> = {
  ch_rate_limiter: { stu_maya: 'K7' },
};

export const aliasCode = (alias: string) => alias.replace(/^Candidate /, '');

/** Stable per (challenge, student); unique within the challenge given the codes already taken. */
export function assignAlias(challengeId: string, studentId: string, takenCodes: Set<string>): string {
  const reservedHere = RESERVED_ALIASES[challengeId] ?? {};
  const mine = reservedHere[studentId];
  if (mine && !takenCodes.has(mine)) return `Candidate ${mine}`;
  const blocked = new Set([...takenCodes, ...Object.values(reservedHere)]);
  const space = ALIAS_LETTERS.length * ALIAS_DIGITS.length; // 192
  let idx = parseInt(shortHash(`${challengeId}:${studentId}`, 8), 16) % space;
  for (let i = 0; i < space; i++) {
    const code = `${ALIAS_LETTERS[Math.floor(idx / ALIAS_DIGITS.length)]}${ALIAS_DIGITS[idx % ALIAS_DIGITS.length]}`;
    if (!blocked.has(code)) return `Candidate ${code}`;
    idx = (idx + 7) % space; // 7 is coprime with 192 → visits every code
  }
  for (let n = 10; ; n++) {
    const code = `${ALIAS_LETTERS[n % ALIAS_LETTERS.length]}${n}`;
    if (!blocked.has(code)) return `Candidate ${code}`;
  }
}

/* ───────────── ranking + awards (SPEC §5.5 #9) ───────────── */

/** Scored submissions by total desc; ties go to the earlier submission. */
export function rankScored(subs: SubmissionRecord[]): SubmissionRecord[] {
  return subs
    .filter((s) => s.totalScore !== null)
    .sort(
      (a, b) =>
        (b.totalScore ?? 0) - (a.totalScore ?? 0) ||
        Date.parse(a.submittedAt) - Date.parse(b.submittedAt) ||
        a.id.localeCompare(b.id),
    );
}

export interface AwardLine {
  sub: SubmissionRecord;
  rank: number;
  payout: number;
  status: SubmissionStatus;
}

export function computeAward(challenge: Challenge, subs: SubmissionRecord[]): AwardLine[] {
  return rankScored(subs).map((sub, i) => {
    const rank = i + 1;
    const payout = payoutForRank(challenge.reward, rank);
    return { sub, rank, payout, status: payout > 0 ? 'awarded' : 'not_selected' };
  });
}

/** Mutates the submissions in place. */
export function applyAward(lines: AwardLine[]): void {
  for (const l of lines) {
    l.sub.rank = l.rank;
    l.sub.payout = l.payout;
    l.sub.status = l.status;
  }
}

/* ───────────── small helpers ───────────── */

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

export const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};

export const medal = (rank: number) => (({ 1: '🥇', 2: '🥈', 3: '🥉' }) as Record<number, string>)[rank] ?? '🏅';

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
