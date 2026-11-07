/** "Use example" prefill for the employer wizard (SPEC §5.6): wizardExamples[companyId], or any example retargeted. */
import type { Company, CreateChallengeInput, WizardExample } from '../../shared/types.ts';
import { notFound } from './errors.ts';
import { getDb } from './store.ts';

const DAY = 86_400_000;

export function exampleChallengeFor(company: Company): CreateChallengeInput {
  const db = getDb();
  const examples = db.content.wizardExamples ?? {};
  let example: WizardExample | undefined = examples[company.id];

  if (!example) {
    const entries = Object.entries(examples);
    if (!entries.length) throw notFound('NO_EXAMPLE', 'The seed content has no wizard examples.');
    // Prefer an example in the field this company posts most in.
    const counts = new Map<string, number>();
    for (const c of db.challenges) if (c.companyId === company.id) counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
    const topType = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const [sourceId, source] = entries.find(([, e]) => e.type === topType) ?? entries[0]!;
    const sourceName = db.companies.find((c) => c.id === sourceId)?.name;
    const sourceShort = sourceName?.split(' ')[0];
    const targetShort = company.name.split(' ')[0] ?? company.name;
    const swap = (s: string) => {
      if (!sourceName) return s;
      let out = s.split(sourceName).join(company.name);
      if (sourceShort && sourceShort.length >= 4) out = out.split(sourceShort).join(targetShort);
      return out;
    };
    example = {
      ...structuredClone(source),
      title: swap(source.title),
      summary: swap(source.summary),
      brief: swap(source.brief),
      deliverables: source.deliverables.map(swap),
      hiringFor: company.hiringFor[0] ?? null,
    };
  }

  const { deadlineInDays, ...rest } = structuredClone(example);
  const deadline = new Date(Date.now() + Math.max(1, deadlineInDays) * DAY);
  deadline.setUTCMinutes(0, 0, 0);
  return {
    ...rest,
    classroomConcepts: rest.classroomConcepts ?? [],
    hiringFor: rest.hiringFor ?? null,
    deadline: deadline.toISOString(),
  };
}
