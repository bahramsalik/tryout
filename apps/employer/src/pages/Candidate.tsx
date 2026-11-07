import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from '@/components/icons';
import { ApiError } from '@/lib/api';
import { useDocumentTitle } from '@/lib/hooks';
import { useInvitesByStudent, useStudent } from '@/lib/queries';
import { Avatar } from '@/components/brand';
import { InviteModal, type InviteTarget } from '@/components/InviteModal';
import { ProofHistory, ProofStats, SkillsRadar } from '@/components/ProofProfile';
import { Button, ButtonLink, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';

export function CandidatePage() {
  const { idOrHandle } = useParams();
  const profile = useStudent(idOrHandle);
  const invites = useInvitesByStudent();
  const [invite, setInvite] = useState<InviteTarget | null>(null);
  const p = profile.data;
  useDocumentTitle(p?.name ?? 'Candidate');

  if (profile.isPending) return <CandidateSkeleton />;
  if (profile.isError || !p) {
    const notFound = profile.error instanceof ApiError && profile.error.status === 404;
    return (
      <Card className="mx-auto max-w-xl">
        {notFound ? (
          <EmptyState title="Candidate not found" action={<ButtonLink to="/talent">Talent</ButtonLink>} />
        ) : (
          <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
        )}
      </Card>
    );
  }

  const lastInvite = invites.get(p.id);
  const invited = !!lastInvite && lastInvite.status !== 'declined';
  const latestYours = p.history.find((h) => h.canViewFiles);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link to="/talent" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Talent
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Avatar name={p.name} color={p.avatarColor} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <p className="text-sm text-slate-600">
            {p.university} · {p.major} · {p.gradYear}
          </p>
          {p.bio && <p className="mt-1 truncate text-sm text-slate-700">{p.bio}</p>}
        </div>
        <Button
          variant={invited ? 'secondary' : 'primary'}
          disabled={invited}
          onClick={() =>
            setInvite({
              student: p,
              challenge: latestYours ? { id: latestYours.challengeId, title: latestYours.challengeTitle, hiringFor: null } : null,
            })
          }
        >
          {lastInvite?.status === 'accepted' ? 'Interview accepted' : invited ? 'Invited' : 'Invite to interview'}
        </Button>
      </div>

      <ProofStats stats={p.stats} />

      <div className="mt-4 grid items-start gap-4 @4xl:grid-cols-[20rem_minmax(0,1fr)]">
        <SkillsRadar stats={p.stats} />
        <ProofHistory items={p.history} />
      </div>

      <InviteModal open={!!invite} target={invite} onClose={() => setInvite(null)} />
    </div>
  );
}

function CandidateSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4" aria-busy>
      <Skeleton className="h-16 w-1/2" />
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
