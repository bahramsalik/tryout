import type { ChallengeType, ChallengeView, SubmissionView } from '@shared/types';

export function isPastDeadline(c: Pick<ChallengeView, 'deadline'>, now = Date.now()): boolean {
  return Boolean(c.deadline && new Date(c.deadline).getTime() <= now);
}

export function isOpenForWork(c: ChallengeView, now = Date.now()): boolean {
  return c.status === 'open' && !isPastDeadline(c, now);
}

/** Joined live challenges that still need a submission, soonest deadline first. */
export function continueItems(list: ChallengeView[] | undefined, now = Date.now()): ChallengeView[] {
  return (list ?? [])
    .filter((c) => c.kind === 'live' && c.viewer?.joined && !c.viewer.submissionId && isOpenForWork(c, now))
    .sort((a, b) => deadlineMs(a) - deadlineMs(b));
}

export function deadlineMs(c: Pick<ChallengeView, 'deadline'>): number {
  return c.deadline ? new Date(c.deadline).getTime() : Number.POSITIVE_INFINITY;
}

/** Open live challenges that match interests and that the student hasn't touched yet. */
export function recommendedLive(list: ChallengeView[] | undefined, interests: ChallengeType[] | undefined, now = Date.now()): ChallengeView[] {
  const open = (list ?? []).filter((c) => c.kind === 'live' && isOpenForWork(c, now) && !c.viewer?.joined && !c.viewer?.submissionId);
  const matches = open.filter((c) => interests?.includes(c.type));
  const rest = open.filter((c) => !interests?.includes(c.type));
  const byDeadline = (a: ChallengeView, b: ChallengeView) => deadlineMs(a) - deadlineMs(b);
  return [...matches.sort(byDeadline), ...rest.sort((a, b) => b.rewardTotal - a.rewardTotal)];
}

export function practiceToDo(list: ChallengeView[] | undefined, interests: ChallengeType[] | undefined): ChallengeView[] {
  const practice = (list ?? []).filter((c) => c.kind === 'practice' && c.status === 'open' && !c.viewer?.submissionId);
  return [...practice.filter((c) => interests?.includes(c.type)), ...practice.filter((c) => !interests?.includes(c.type))];
}

/** Results are visible to the student: published live results, or an instant Coach review. */
export function hasVisibleResult(s: SubmissionView): boolean {
  return s.status === 'awarded' || s.status === 'not_selected' || (s.reviewer === 'coach' && s.totalScore !== null);
}

export type SortKey = 'newest' | 'bounty' | 'deadline' | 'spots';

export const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest',
  bounty: 'Highest bounty',
  deadline: 'Closing soon',
  spots: 'Most spots left',
};

export function sortChallenges(list: ChallengeView[], sort: SortKey): ChallengeView[] {
  const arr = [...list];
  switch (sort) {
    case 'bounty':
      return arr.sort((a, b) => b.rewardTotal - a.rewardTotal || deadlineMs(a) - deadlineMs(b));
    case 'deadline':
      return arr.sort((a, b) => deadlineMs(a) - deadlineMs(b));
    case 'spots':
      return arr.sort((a, b) => (b.spotsLeft ?? Number.POSITIVE_INFINITY) - (a.spotsLeft ?? Number.POSITIVE_INFINITY));
    case 'newest':
    default:
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
