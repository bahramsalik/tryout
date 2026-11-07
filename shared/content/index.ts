/**
 * Tryout seed content (S2): everything in SPEC.md §6. The API imports `seedContent` from this file
 * and reseeds whenever it changes. All companies, people, schools and products are fictional.
 *
 * Layout
 * - companies.ts        6 companies + their employer personas
 * - students.ts         10 named students (incl. the demo persona stu_maya) + background pools
 * - challenges/<id>.ts  one module per challenge: the challenge, its 3 submission templates
 *                       [strong, solid, weak] and named students' scripted results on it
 * - activity.ts         joined-but-not-submitted spots + seeded notifications
 * - coach.ts            Coach field packs · rubricTemplates.ts ✨ Suggest rubric · wizardExamples.ts Use example
 *
 * After editing, run `npx -y tsx shared/content/check.ts` from the repo root.
 */
import type { SeedContent, SubmissionTemplate } from '../types.ts';
import { joinedNotSubmitted, seedNotifications } from './activity.ts';
import { challengeModules } from './challenges/index.ts';
import { coachPacks } from './coach.ts';
import { companies, employers } from './companies.ts';
import { rubricTemplates } from './rubricTemplates.ts';
import { background, students } from './students.ts';
import { wizardExamples } from './wizardExamples.ts';

const submissionTemplates: Record<string, SubmissionTemplate[]> = {};
for (const m of challengeModules) submissionTemplates[m.challenge.id] = m.templates;

export const seedContent: SeedContent = {
  companies,
  employers,
  students,
  background,
  challenges: challengeModules.map((m) => m.challenge),
  submissionTemplates,
  scriptedResults: challengeModules.flatMap((m) => m.scripted),
  joinedNotSubmitted,
  seedNotifications,
  coachPacks,
  rubricTemplates,
  wizardExamples,
};

export default seedContent;
