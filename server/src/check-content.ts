/**
 * `npm run check-content` — what the API thinks of shared/content: errors (block seeding), warnings,
 * and a per-challenge preview of what the seeder would generate. Exit code 1 on errors.
 */
import { loadContent } from './content.ts';
import { buildSeed } from './seed.ts';

const loaded = await loadContent();
if (!loaded.ok) {
  console.error(`✗ ${loaded.error}`);
  for (const d of loaded.details) console.error(`  · ${d}`);
  process.exit(1);
}

console.log(`✓ seed content is valid (hash ${loaded.hash.slice(0, 12)})`);
if (loaded.warnings.length) {
  console.log(`\n${loaded.warnings.length} warning(s):`);
  for (const w of loaded.warnings) console.log(`  · ${w}`);
}

const { summary, db } = buildSeed(loaded.content, loaded.hash);
console.log(
  `\nWould seed: ${summary.companies} companies, ${summary.employers} employers, ${summary.students} students ` +
    `(${summary.backgroundStudents} generated), ${summary.challenges} challenges, ${summary.participations} joins, ` +
    `${summary.submissions} submissions (${summary.scored} scored), ${summary.notifications} notifications, ${summary.zips} zips\n`,
);
console.log('challenge                 joined  subs  scored  top');
for (const c of summary.perChallenge) {
  console.log(`${c.id.padEnd(24)} ${String(c.participants).padStart(6)} ${String(c.submissions).padStart(5)} ${String(c.scored).padStart(7)}  ${c.topScore ?? '—'}`);
}

const maya = db.students.find((s) => s.id === 'stu_maya');
if (maya) {
  const subs = db.submissions.filter((s) => s.studentId === 'stu_maya');
  console.log(`\nMaya: ${subs.length} submission(s)`);
  for (const s of subs) {
    const ch = db.challenges.find((c) => c.id === s.challengeId);
    console.log(`  · ${s.challengeId.padEnd(22)} ${String(s.totalScore ?? '—').padStart(3)}  rank ${s.rank ?? '—'}  ${ch?.status}`);
  }
  const joined = db.participations.filter((p) => p.studentId === 'stu_maya' && !subs.some((s) => s.challengeId === p.challengeId));
  for (const p of joined) console.log(`  · ${p.challengeId.padEnd(22)} joined, not submitted (${p.alias})`);
}
