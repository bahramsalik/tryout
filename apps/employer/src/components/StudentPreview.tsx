import type { ReactNode } from 'react';
import { BookOpen, Briefcase, CheckCircle2, Clock, Gauge, Lock, MessageSquareText, Scale, ShieldCheck, Users } from 'lucide-react';
import { DIFFICULTY_LABEL, rewardTotal, type ChallengeView } from '@shared/types';
import { money, ordinal, timeLeft } from '@/lib/format';
import { CompanyLogo, RewardBadge, TypeChip, useNow } from './brand';
import { Markdown } from './Markdown';
import { cn } from './ui';

/** The fields the student-facing previews need — satisfied by a ChallengeView or a wizard draft. */
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
  | 'reward'
  | 'applicantCap'
  | 'deadline'
  | 'hiringFor'
  | 'company'
  | 'participantCount'
  | 'status'
>;

export function payoutLine(c: Pick<PreviewChallenge, 'reward' | 'applicantCap'>): string {
  const cap = c.applicantCap != null ? `of up to ${c.applicantCap}` : 'of all entrants';
  if (c.reward.mode === 'winner') return `Winner ${cap} gets paid`;
  if (c.reward.mode === 'top3') return `Top 3 ${cap} get paid`;
  return 'Hiring signal · every submission gets feedback';
}

/** Mirrors the card students see on Explore (student mood: roomy, rounded-2xl). */
export function StudentCard({ challenge: c, className }: { challenge: PreviewChallenge; className?: string }) {
  const now = useNow();
  const t = timeLeft(c.deadline, now);
  const cap = c.applicantCap;
  const pct = cap ? Math.min(100, (c.participantCount / cap) * 100) : 0;
  return (
    <article
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_20px_-6px_rgb(15_23_42/0.12)] transition-shadow',
        className,
      )}
      aria-label="Student-facing card preview"
    >
      <div className="flex items-center gap-2">
        <CompanyLogo company={c.company} size={26} className="rounded-md" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{c.company?.name ?? 'Tryout Practice'}</span>
        {c.hiringFor && (
          <span className="inline-flex h-5 items-center gap-1 rounded-full bg-violet-50 px-2 text-[10px] font-semibold text-violet-700">
            <Briefcase className="size-3" aria-hidden /> Hiring
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <TypeChip type={c.type} size="sm" />
        <RewardBadge reward={c.reward} size="sm" />
      </div>
      <h3 className={cn('mt-2 line-clamp-2 text-[15px] leading-snug font-bold tracking-tight', c.title ? 'text-slate-900' : 'text-slate-300')}>
        {c.title || 'Your challenge title'}
      </h3>
      <p className={cn('mt-1 line-clamp-2 text-[13px] leading-relaxed', c.summary ? 'text-slate-600' : 'text-slate-300')}>
        {c.summary || 'A one-line summary students see on the card.'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />~{c.estHours} h
        </span>
        <span className="inline-flex items-center gap-1">
          <Gauge className="size-3.5" aria-hidden />
          {DIFFICULTY_LABEL[c.difficulty]}
        </span>
        <span className={cn('inline-flex items-center gap-1 tabular-nums', t.urgent && 'font-semibold text-amber-700')}>
          {t.label}
        </span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Users className="size-3" aria-hidden />
            {cap != null ? `${c.participantCount}/${cap} joined` : `${c.participantCount} joined · no cap`}
          </span>
          {c.reward.mode !== 'none' && rewardTotal(c.reward) > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <Lock className="size-3" aria-hidden /> Escrowed
            </span>
          )}
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </article>
  );
}

/** The challenge detail page as students see it (header, brief, deliverables, rubric, classroom, fair-work box). */
export function StudentChallengePreview({ challenge: c }: { challenge: PreviewChallenge }) {
  const now = useNow();
  const t = timeLeft(c.deadline, now);
  const total = rewardTotal(c.reward);
  const concepts = c.classroomConcepts.filter((k) => k.concept.trim());
  const deliverables = c.deliverables.filter((d) => d.trim());

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-5">
        <div className="flex items-center gap-2">
          <CompanyLogo company={c.company} size={28} />
          <span className="text-[13px] font-semibold text-slate-700">{c.company?.name ?? 'Tryout Practice'}</span>
        </div>
        <h2 className="mt-3 text-lg leading-snug font-bold tracking-tight text-slate-900">{c.title || 'Untitled challenge'}</h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <TypeChip type={c.type} />
          <RewardBadge reward={c.reward} />
          {total > 0 && (
            <span className="inline-flex h-6 items-center gap-1 rounded-md bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
              <Lock className="size-3" aria-hidden /> {money(total)} escrowed
            </span>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 sm:flex sm:flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5 text-slate-400" aria-hidden />
            <dt className="sr-only">Estimated time</dt>
            <dd>~{c.estHours} hours</dd>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="size-3.5 text-slate-400" aria-hidden />
            <dt className="sr-only">Difficulty</dt>
            <dd>{DIFFICULTY_LABEL[c.difficulty]}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Deadline</dt>
            <dd className={cn('tabular-nums', t.urgent && 'font-semibold text-amber-700')}>{t.label}</dd>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <Users className="size-3.5 text-slate-400" aria-hidden />
            <dt className="sr-only">Who gets paid</dt>
            <dd>{payoutLine(c)}</dd>
          </div>
        </dl>
        {c.hiringFor && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
            <Briefcase className="size-3.5" aria-hidden /> Hiring: {c.hiringFor}
          </p>
        )}
      </div>

      <div className="space-y-6 p-5">
        <section>
          <SectionTitle icon={<BookOpen className="size-4" />}>The brief</SectionTitle>
          {c.brief.trim() ? (
            <Markdown>{c.brief}</Markdown>
          ) : (
            <p className="text-sm text-slate-400">No brief yet.</p>
          )}
        </section>

        {deliverables.length > 0 && (
          <section>
            <SectionTitle icon={<CheckCircle2 className="size-4" />}>Deliverables</SectionTitle>
            <ul className="space-y-1.5">
              {deliverables.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          </section>
        )}

        {c.rubric.length > 0 && (
          <section>
            <SectionTitle icon={<Scale className="size-4" />}>How you’ll be judged</SectionTitle>
            <ul className="space-y-2.5">
              {c.rubric.map((r, i) => (
                <li key={`${r.id}-${i}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">{r.name || 'Unnamed criterion'}</span>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">{r.weight}%</span>
                  </div>
                  {r.description && <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>}
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, r.weight)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {concepts.length > 0 && (
          <section>
            <SectionTitle icon={<BookOpen className="size-4" />}>From the classroom</SectionTitle>
            <ul className="flex flex-wrap gap-2">
              {concepts.map((k, i) => (
                <li key={i} className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2">
                  <p className="text-[13px] font-semibold text-indigo-900">{k.concept}</p>
                  {k.course && <p className="text-[11px] text-indigo-700/80">{k.course}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
            <ShieldCheck className="size-4" aria-hidden /> Fair work, guaranteed
          </p>
          <ul className="mt-2 space-y-1 text-xs text-emerald-900/80">
            <li className="flex gap-1.5">
              <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
              {total > 0
                ? `The ${money(total)} bounty is escrowed before you start — ${prizeLine(c.reward.amounts, c.reward.mode)}.`
                : 'No bounty on this one — it’s a hiring signal, and the employer may invite strong entrants to interview.'}
            </li>
            <li className="flex gap-1.5">
              <MessageSquareText className="mt-0.5 size-3 shrink-0" aria-hidden />
              Every submission gets rubric scores and written feedback.
            </li>
            <li className="flex gap-1.5">
              <ShieldCheck className="mt-0.5 size-3 shrink-0" aria-hidden />
              You keep your IP unless you’re paid. Capped at {c.estHours} hours of work.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function prizeLine(amounts: number[], mode: string): string {
  if (mode === 'winner') return `the winner gets ${money(amounts[0] ?? 0)}`;
  return amounts.map((a, i) => `${ordinal(i + 1)} ${money(a)}`).join(' · ');
}

function SectionTitle({ children, icon }: { children: string; icon?: ReactNode }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold tracking-wide text-slate-900 uppercase">
      <span className="text-slate-400">{icon}</span>
      {children}
    </h3>
  );
}
