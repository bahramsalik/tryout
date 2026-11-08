import { useMemo, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { ChallengeView, InviteView, SubmissionView } from '@shared/types';
import { Countdown, CompanyLogo, RankBadge } from '@/components/brand';
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, MessageBar, PageHeader, Skeleton, TabList } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { continueItems, hasVisibleResult } from '@/lib/derive';
import { timeAgo } from '@/lib/format';
import { useChallenges, useInvites, useMySubmissions, useRespondInvite } from '@/lib/queries';
import { useNow } from '@/lib/useNow';

type Tab = 'progress' | 'submitted' | 'results';

function InviteBar({ invite }: { invite: InviteView }) {
  const respond = useRespondInvite();
  const busy = respond.isPending;
  const title = `${invite.company.name} wants to interview you${invite.role ? ` for ${invite.role}` : ''}.`;
  if (invite.status !== 'pending') {
    return (
      <MessageBar intent={invite.status === 'accepted' ? 'success' : 'info'} title={invite.status === 'accepted' ? 'Accepted' : 'Declined'}>
        {invite.company.name}
        {invite.role ? ` · ${invite.role}` : ''}
      </MessageBar>
    );
  }
  return (
    <MessageBar
      intent="success"
      title={title}
      actions={
        <>
          <Button size="small" appearance="primary" loading={busy && respond.variables?.status === 'accepted'} disabled={busy} onClick={() => respond.mutate({ id: invite.id, status: 'accepted' })}>
            Accept
          </Button>
          <Button size="small" appearance="subtle" disabled={busy} onClick={() => respond.mutate({ id: invite.id, status: 'declined' })}>
            Decline
          </Button>
        </>
      }
    >
      {invite.message ? <span className="mt-1 block whitespace-pre-line text-fg2">{invite.message}</span> : null}
      {respond.isError ? <span className="mt-1 block text-danger-fg">{errorMessage(respond.error)}</span> : null}
    </MessageBar>
  );
}

function Row({ company, title, to, meta, end }: { company: ChallengeView['company']; title: string; to: string; meta: ReactNode; end?: ReactNode }) {
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <CompanyLogo company={company} size={32} />
      <div className="min-w-0 flex-1">
        <Link to={to} className="block truncate text-body font-semibold text-fg1 hover:text-brand-fg2">
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg3">{meta}</div>
      </div>
      {end}
    </Card>
  );
}

function ResultRow({ s }: { s: SubmissionView }) {
  return (
    <Row
      company={s.challenge.company}
      title={s.challenge.title}
      to={`/challenges/${s.challengeId}`}
      meta={
        <>
          <span>{s.challenge.company?.name ?? 'Practice'}</span>
          {s.feedback ? <span className="line-clamp-1 min-w-0 flex-1">{s.feedback}</span> : null}
        </>
      }
      end={
        <span className="flex items-center gap-2">
          <RankBadge rank={s.rank} />
          {s.totalScore !== null ? <span className="w-8 text-right text-subtitle2 font-semibold tabular-nums">{s.totalScore}</span> : null}
        </span>
      }
    />
  );
}

export function MyWorkPage() {
  const [params, setParams] = useSearchParams();
  const subs = useMySubmissions();
  const challenges = useChallenges();
  const invites = useInvites();
  const now = useNow(60_000);

  const inProgress = useMemo(() => continueItems(challenges.data, now), [challenges.data, now]);
  const all = subs.data ?? [];
  const results = useMemo(
    () => all.filter(hasVisibleResult).sort((a, b) => new Date(b.scoredAt ?? b.submittedAt).getTime() - new Date(a.scoredAt ?? a.submittedAt).getTime()),
    [all],
  );
  const submitted = useMemo(
    () => all.filter((s) => !hasVisibleResult(s)).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [all],
  );
  // Pending invites first, then the latest answered one.
  const inviteList = [...(invites.data ?? [])]
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .filter((i, idx) => i.status === 'pending' || idx === 0);

  const paramTab = params.get('tab');
  const tab: Tab =
    paramTab === 'progress' || paramTab === 'submitted' || paramTab === 'results'
      ? paramTab
      : inProgress.length > 0
        ? 'progress'
        : submitted.length > 0
          ? 'submitted'
          : 'results';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true, preventScrollReset: true });
  const loading = subs.isLoading || challenges.isLoading;

  return (
    <div className="space-y-4">
      <PageHeader title="My work" />

      {inviteList.map((i) => (
        <InviteBar key={i.id} invite={i} />
      ))}

      <TabList<Tab>
        ariaLabel="My work"
        value={tab}
        onChange={setTab}
        className="border-b border-stroke2"
        items={[
          { value: 'progress', label: 'In progress', count: loading ? undefined : inProgress.length },
          { value: 'submitted', label: 'Submitted', count: loading ? undefined : submitted.length },
          { value: 'results', label: 'Results', count: loading ? undefined : results.length },
        ]}
      />

      <div role="tabpanel" className="space-y-2">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] rounded-lg" />)
        ) : subs.isError ? (
          <ErrorState message={errorMessage(subs.error)} onRetry={() => void subs.refetch()} />
        ) : tab === 'progress' ? (
          inProgress.length === 0 ? (
            <EmptyState title="Nothing in progress" action={<ButtonLink to="/explore">Explore</ButtonLink>} />
          ) : (
            inProgress.map((c, i) => (
              <Row
                key={c.id}
                company={c.company}
                title={c.title}
                to={`/challenges/${c.id}`}
                meta={<Countdown deadline={c.deadline} />}
                end={
                  <ButtonLink to={`/challenges/${c.id}/submit`} appearance={i === 0 ? 'primary' : 'secondary'}>
                    Submit
                  </ButtonLink>
                }
              />
            ))
          )
        ) : tab === 'submitted' ? (
          submitted.length === 0 ? (
            <EmptyState title="Nothing under review" />
          ) : (
            submitted.map((s) => (
              <Row
                key={s.id}
                company={s.challenge.company}
                title={s.challenge.title}
                to={`/challenges/${s.challengeId}`}
                meta={<span>Submitted {timeAgo(s.submittedAt, now)}</span>}
                end={<Badge color="brand">Under review</Badge>}
              />
            ))
          )
        ) : results.length === 0 ? (
          <EmptyState title="No results yet" />
        ) : (
          results.map((s) => <ResultRow key={s.id} s={s} />)
        )}
      </div>
    </div>
  );
}
