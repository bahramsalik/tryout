import { Clock, Gauge, Users as People } from './icons';
import { DIFFICULTY_LABEL, type ChallengeView } from '@shared/types';
import { timeLeft } from '@/lib/format';
import { CompanyLogo, useNow } from './brand';
import { Markdown } from './Markdown';
import { Badge, Card, cn } from './ui';

/** The fields the student-facing previews need: satisfied by a ChallengeView or a wizard draft. */
export type PreviewChallenge = Pick<
  ChallengeView,
  | 'title'
  | 'summary'
  | 'type'
  | 'skills'
  | 'classroomConcepts'
  | 'difficulty'
  | 'estHours'
  | 'brief'
  | 'deliverables'
  | 'rubric'
  | 'applicantCap'
  | 'deadline'
  | 'hiringFor'
  | 'company'
  | 'participantCount'
  | 'status'
>;

/** Meta row: hours · level · spots · time left. */
function MetaRow({ c }: { c: PreviewChallenge }) {
  const now = useNow();
  const t = timeLeft(c.deadline, now);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 [&_svg]:size-4 [&_svg]:text-slate-500">
      <span className="inline-flex items-center gap-1">
        <Clock aria-hidden />~{c.estHours} h
      </span>
      <span className="inline-flex items-center gap-1">
        <Gauge aria-hidden />
        {DIFFICULTY_LABEL[c.difficulty]}
      </span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <People aria-hidden />
        {c.participantCount}
        {c.applicantCap != null ? `/${c.applicantCap}` : ''}
      </span>
      <span className={cn('tabular-nums', t.urgent && 'text-amber-700')}>{t.label}</span>
    </div>
  );
}

/** The card students see on Explore: logo + company, title, meta row. */
export function StudentCard({ challenge: c, className }: { challenge: PreviewChallenge; className?: string }) {
  return (
    <Card className={cn('p-4', className)} aria-label="Student card">
      <div className="flex items-center gap-2">
        <CompanyLogo company={c.company} size={24} />
        <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{c.company?.name ?? 'Tryout'}</span>
      </div>
      <h3 className={cn('mt-2 line-clamp-2 text-lg font-semibold', !c.title && 'text-slate-400')}>
        {c.title || 'Challenge title'}
      </h3>
      <div className="mt-2">
        <MetaRow c={c} />
      </div>
    </Card>
  );
}

/** The brief as students see it: meta, brief, deliverables, rubric weights, classroom concepts. */
export function StudentChallengePreview({ challenge: c }: { challenge: PreviewChallenge }) {
  const concepts = c.classroomConcepts.filter((k) => k.concept.trim());
  const deliverables = c.deliverables.filter((d) => d.trim());

  return (
    <Card className="space-y-6 p-5">
      {c.hiringFor && <Badge tone="indigo">Hiring: {c.hiringFor}</Badge>}

      <section>
        {c.brief.trim() ? <Markdown>{c.brief}</Markdown> : <p className="text-sm text-slate-500">No brief yet.</p>}
      </section>

      {deliverables.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg font-semibold">Deliverables</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {deliverables.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {c.rubric.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg font-semibold">Rubric</h3>
          <ul className="space-y-2">
            {c.rubric.map((r, i) => (
              <li key={`${r.id}-${i}`} title={r.description || undefined}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{r.name || 'Unnamed'}</span>
                  <span className="text-slate-500 tabular-nums">{r.weight}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--colorNeutralBackground6)]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, r.weight)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {concepts.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg font-semibold">Uses</h3>
          <div className="flex flex-wrap gap-1.5">
            {concepts.map((k, i) => (
              <Badge key={i} title={k.course || undefined}>
                {k.concept}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </Card>
  );
}
