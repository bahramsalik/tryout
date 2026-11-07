import { ArrowRight, BadgeCheck, Bell, Clock, Dumbbell, Medal, PartyPopper, Sparkles, Target, Trophy, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import type { ChallengeView, InviteView } from '@shared/types';
import { Countdown, CompanyLogo, StatTile, TypeChip } from '@/components/brand';
import { ChallengeCard, ChallengeCardSkeleton } from '@/components/ChallengeCard';
import { NotificationRow } from '@/components/NotificationBell';
import { ButtonLink, Card, EmptyState, ErrorState, SectionTitle, Skeleton, buttonClass } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useCoach } from '@/lib/coach';
import { cn } from '@/lib/cn';
import { continueItems, practiceToDo, recommendedLive } from '@/lib/derive';
import { firstName, greeting, money } from '@/lib/format';
import { useChallenges, useCurrentStudent, useInvites, useMe, useNotifications, useStudentProfile } from '@/lib/queries';
import { useNow } from '@/lib/useNow';

function Hero({ name, next }: { name: string; next?: ChallengeView }) {
  const coach = useCoach();
  return (
    <section className="hero-gradient relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-lift sm:px-8 sm:py-9">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="relative max-w-2xl">
        <p className="text-sm font-semibold text-indigo-100">Real work. Real pay. Real proof.</p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px]">
          {greeting()}, {name || 'there'} <span className="inline-block origin-[70%_70%] animate-wiggle">👋</span>
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-indigo-50/90">
          {next ? (
            <>
              <span className="font-semibold text-white">{next.title}</span> is waiting for your submission.
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
                <Clock className="size-3" aria-hidden />
                <Countdown deadline={next.deadline} prefix="Due in" icon={false} className="text-white" />
              </span>
            </>
          ) : (
            'Prove you’re job-ready with 3–5 hour tasks from real teams. Every submission gets employer feedback — the best get paid.'
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {next ? (
            <ButtonLink to={`/challenges/${next.id}/submit`} variant="white" size="lg">
              Submit your work <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          ) : (
            <ButtonLink to="/explore" variant="white" size="lg">
              Explore challenges <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          )}
          <button
            onClick={() => coach.open({ challengeId: null })}
            className={buttonClass('ghost', 'lg', 'bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20 hover:text-white')}
          >
            <Sparkles className="size-4" aria-hidden /> Ask Coach
          </button>
        </div>
      </div>
    </section>
  );
}

function InviteBanner({ invite }: { invite: InviteView }) {
  return (
    <Link
      to="/work"
      className="group flex animate-pop-in items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-soft transition hover:shadow-lift"
    >
      <CompanyLogo company={invite.company} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-900">
          <PartyPopper className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span className="truncate">{invite.company.name} wants to interview you</span>
        </div>
        <div className="truncate text-xs text-emerald-800/80">
          {invite.role ?? 'Interview invite'}
          {invite.challengeTitle ? ` · after “${invite.challengeTitle}”` : ''}
        </div>
      </div>
      <span className={buttonClass('success', 'sm', 'shrink-0')}>
        Respond <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
}

function ProofSnapshot({ studentId }: { studentId?: string }) {
  const q = useStudentProfile(studentId);
  const s = q.data?.stats;
  if (q.isError) return <ErrorState title="Couldn't load your proof" message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {!s ? (
        [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[108px] rounded-2xl" />)
      ) : (
        <>
          <StatTile icon={BadgeCheck} label="Verified hours" value={s.verifiedHours} hint={s.practiceHours ? `+ ${s.practiceHours} practice hours` : 'Employer-scored work'} />
          <StatTile icon={Target} tone="violet" label="Employer-verified tasks" value={s.tasksCompleted} hint={s.avgScore != null ? `Avg score ${s.avgScore}` : 'Scored by employers'} />
          <StatTile icon={Wallet} tone="emerald" label="Bounties earned" value={money(s.bountiesEarned)} hint="Paid for real work" />
          <StatTile
            icon={Trophy}
            tone="amber"
            label="Placements"
            value={
              <span className="flex items-center gap-3 text-[22px]">
                <span title="1st place">🥇<span className="ml-0.5">{s.placements.first}</span></span>
                <span title="2nd place">🥈<span className="ml-0.5">{s.placements.second}</span></span>
                <span title="3rd place">🥉<span className="ml-0.5">{s.placements.third}</span></span>
              </span>
            }
            hint="Top-3 finishes"
          />
        </>
      )}
    </div>
  );
}

function ContinueCard({ c }: { c: ChallengeView }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CompanyLogo company={c.company} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate font-medium">{c.company?.name}</span>
            <TypeChip type={c.type} size="sm" />
          </div>
          <Link to={`/challenges/${c.id}`} className="mt-0.5 line-clamp-2 font-bold leading-snug text-ink hover:text-indigo-700">
            {c.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Countdown deadline={c.deadline} prefix="Due in" />
            <span className="text-xs text-slate-500">~{c.estHours} h of work</span>
          </div>
        </div>
      </div>
      <ButtonLink to={`/challenges/${c.id}/submit`} className="shrink-0">
        Submit <ArrowRight className="size-4" aria-hidden />
      </ButtonLink>
    </div>
  );
}

function PracticeTile({ c }: { c: ChallengeView }) {
  return (
    <Link
      to={`/challenges/${c.id}`}
      className="group flex w-[240px] shrink-0 flex-col rounded-2xl border border-line/80 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lift sm:w-auto"
    >
      <div className="flex items-center justify-between gap-2">
        <TypeChip type={c.type} size="sm" />
        <span className="text-[11px] font-semibold text-emerald-600">Free · instant review</span>
      </div>
      <div className="mt-2.5 line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-indigo-700">{c.title}</div>
      <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-slate-500">
        <Clock className="size-3.5" aria-hidden />~{c.estHours} h
        <span aria-hidden>·</span>
        {c.participantCount} practiced
      </div>
    </Link>
  );
}

export function HomePage() {
  const me = useMe();
  const student = useCurrentStudent();
  const challenges = useChallenges();
  const invites = useInvites();
  const notifications = useNotifications();
  const navigate = useNavigate();
  const now = useNow(60_000);

  const inProgress = useMemo(() => continueItems(challenges.data, now), [challenges.data, now]);
  const recs = useMemo(() => recommendedLive(challenges.data, student?.interests, now).slice(0, 3), [challenges.data, student?.interests, now]);
  const practice = useMemo(() => practiceToDo(challenges.data, student?.interests).slice(0, 4), [challenges.data, student?.interests]);
  const pendingInvites = (invites.data ?? []).filter((i) => i.status === 'pending');
  const interestsLabel = student?.interests?.length
    ? student.interests.map((t) => t[0].toUpperCase() + t.slice(1)).join(' & ')
    : 'your fields';

  if (me.isError) {
    return (
      <ErrorState
        className="mt-10"
        title="Tryout can't reach its API"
        message={`${errorMessage(me.error)} Start it with “npm --prefix server run dev”, then try again.`}
        onRetry={() => void me.refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <Hero name={firstName(student?.name)} next={inProgress[0]} />

      {pendingInvites.length > 0 ? (
        <div className="space-y-2">
          {pendingInvites.map((i) => (
            <InviteBanner key={i.id} invite={i} />
          ))}
        </div>
      ) : null}

      <section>
        <SectionTitle
          icon={Medal}
          sub="Countable, employer-verified evidence. This is your new experience section."
          action={
            <Link to="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Proof Profile <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          Your proof so far
        </SectionTitle>
        <ProofSnapshot studentId={student?.id} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <SectionTitle icon={Clock} sub="Joined challenges waiting for your submission.">
            Continue
          </SectionTitle>
          {challenges.isLoading ? (
            <Skeleton className="h-[92px] rounded-2xl" />
          ) : challenges.isError ? (
            <ErrorState message={errorMessage(challenges.error)} onRetry={() => void challenges.refetch()} />
          ) : inProgress.length === 0 ? (
            <EmptyState emoji="🧭" title="Nothing in progress" action={<ButtonLink to="/explore" size="sm">Find a challenge</ButtonLink>}>
              Join a live challenge to claim a spot. You'll see your countdown here.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {inProgress.map((c) => (
                <ContinueCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle icon={Bell}>Recent activity</SectionTitle>
          <Card className="p-1.5">
            {notifications.isLoading ? (
              <div className="space-y-3 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (notifications.data ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              (notifications.data ?? []).slice(0, 4).map((n) => (
                <NotificationRow key={n.id} n={n} now={now} onOpen={(x) => x.link && navigate(x.link)} />
              ))
            )}
          </Card>
        </section>
      </div>

      <section>
        <SectionTitle
          icon={Sparkles}
          sub={`Live, paid challenges in ${interestsLabel}.`}
          action={
            <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              See all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          Recommended for you
        </SectionTitle>
        {challenges.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <ChallengeCardSkeleton key={i} />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <EmptyState emoji="🎉" title="You've joined everything that matches" action={<ButtonLink to="/explore" size="sm" variant="secondary">Browse all fields</ButtonLink>}>
            New challenges from employers appear here the moment they're posted.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((c, i) => (
              <ChallengeCard key={c.id} challenge={c} className={cn(i === 2 && 'sm:hidden lg:flex')} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          icon={Dumbbell}
          sub="Free, evergreen tasks with an instant Coach review. Build skills before you compete."
          action={
            <Link to="/explore?mode=practice" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Practice arena <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          Practice to level up
        </SectionTitle>
        {challenges.isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[120px] rounded-2xl" />
            ))}
          </div>
        ) : practice.length === 0 ? (
          <EmptyState emoji="💪" title="You've practiced everything here">
            Nice work. New practice tasks are added every week.
          </EmptyState>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {practice.map((c) => (
              <PracticeTile key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
