import { useMemo } from 'react';
import { Link } from 'react-router';
import type { ChallengeView } from '@shared/types';
import { Countdown, CompanyLogo, Placements, StatTile } from '@/components/brand';
import { ChallengeCard, ChallengeCardSkeleton } from '@/components/ChallengeCard';
import { ButtonLink, Card, ErrorState, PageHeader, SectionTitle, Skeleton } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { continueItems, recommendedLive } from '@/lib/derive';
import { firstName } from '@/lib/format';
import { useChallenges, useCurrentStudent, useMe, useStudentProfile } from '@/lib/queries';
import { useNow } from '@/lib/useNow';

function Stats({ studentId }: { studentId?: string }) {
  const q = useStudentProfile(studentId);
  const s = q.data?.stats;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const hasPlacements = !s || s.placements.first + s.placements.second + s.placements.third > 0; // an award is optional
  return (
    <div className={cn('grid grid-cols-2 gap-3', hasPlacements ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
      {!s ? (
        [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[84px] rounded-lg" />)
      ) : (
        <>
          <StatTile label="Verified hours" value={s.verifiedHours} />
          <StatTile label="Tasks" value={s.tasksCompleted} />
          <StatTile label="Avg score" value={s.avgScore ?? '–'} />
          {hasPlacements ? <StatTile label="Placements" value={<Placements {...s.placements} />} /> : null}
        </>
      )}
    </div>
  );
}

function ContinueCard({ c }: { c: ChallengeView }) {
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <CompanyLogo company={c.company} size={32} />
      <div className="min-w-0 flex-1">
        <Link to={`/challenges/${c.id}`} className="block truncate text-subtitle2 font-semibold text-fg1 hover:text-brand-fg2">
          {c.title}
        </Link>
        <Countdown deadline={c.deadline} />
      </div>
      <ButtonLink to={`/challenges/${c.id}/submit`} appearance="primary">
        Submit
      </ButtonLink>
    </Card>
  );
}

export function HomePage() {
  const me = useMe();
  const student = useCurrentStudent();
  const challenges = useChallenges();
  const now = useNow(60_000);

  const inProgress = useMemo(() => continueItems(challenges.data, now), [challenges.data, now]);
  const recs = useMemo(() => recommendedLive(challenges.data, student?.interests, now).slice(0, 3), [challenges.data, student?.interests, now]);

  if (me.isError) {
    return <ErrorState title="API unreachable" message={errorMessage(me.error)} onRetry={() => void me.refetch()} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title={student ? `Hi, ${firstName(student.name)}` : <Skeleton className="h-9 w-40" />} />

      {inProgress[0] ? (
        <section>
          <SectionTitle>Continue</SectionTitle>
          <ContinueCard c={inProgress[0]} />
        </section>
      ) : null}

      <Stats studentId={student?.id} />

      <section>
        <SectionTitle
          action={
            <Link to="/explore" className="text-body text-brand-link hover:text-brand-link-hover hover:underline">
              See all
            </Link>
          }
        >
          Recommended
        </SectionTitle>
        {challenges.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <ChallengeCardSkeleton key={i} />
            ))}
          </div>
        ) : challenges.isError ? (
          <ErrorState message={errorMessage(challenges.error)} onRetry={() => void challenges.refetch()} />
        ) : recs.length === 0 ? (
          <p className="text-body text-fg3">Nothing new right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
