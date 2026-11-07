/**
 * Authoring types for Tryout seed content (S2). Type-only: nothing in this file runs at seed time.
 *
 * Each challenge lives in its own module under ./challenges/<id>.ts and default-exports a
 * ChallengeModule. index.ts collects them into SeedContent (challenges, submissionTemplates,
 * scriptedResults).
 */
import type { ChallengeSeed, ScriptedResult, SubmissionTemplate } from '../types.ts';

/** One challenge's complete seed content. */
export interface ChallengeModule {
  challenge: ChallengeSeed;
  /** Exactly 3, ordered [strong, solid, weak]. */
  templates: [SubmissionTemplate, SubmissionTemplate, SubmissionTemplate];
  /** Hand-authored results for named students on this challenge (challengeId === challenge.id). */
  scripted: ScriptedResult[];
}
