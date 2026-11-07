import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Github, Globe, Link2, Linkedin, Mail, MapPin, UserX } from 'lucide-react';
import { STUDENT_SITE_URL, ApiError } from '@/lib/api';
import { shortDate } from '@/lib/format';
import { useDocumentTitle } from '@/lib/hooks';
import { usePersona } from '@/lib/persona';
import { useInvitesByStudent, useStudent } from '@/lib/queries';
import { Avatar } from '@/components/brand';
import { InviteModal, type InviteTarget } from '@/components/InviteModal';
import { ProofHistory, ProofStats, SkillsRadar } from '@/components/ProofProfile';
import { Button, ButtonLink, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';

export function CandidatePage() {
  const { idOrHandle } = useParams();
  const { company } = usePersona();
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
          <EmptyState
            icon={<UserX className="size-5" aria-hidden />}
            title="Candidate not found"
            body="This profile doesn’t exist, or was removed by a demo reset."
            action={<ButtonLink to="/talent">Browse talent</ButtonLink>}
          />
        ) : (
          <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
        )}
      </Card>
    );
  }

  const lastInvite = invites.get(p.id);
  const inviteLabel = !lastInvite
    ? 'Invite to interview'
    : lastInvite.status === 'accepted'
      ? 'Interview accepted'
      : lastInvite.status === 'pending'
        ? `Invited ${shortDate(lastInvite.createdAt)} · pending`
        : 'Invite again';
  const yourItems = p.history.filter((h) => h.canViewFiles);
  const latestYours = yourItems[0];
  const links = [
    p.links.github && { href: p.links.github, label: 'GitHub', icon: Github },
    p.links.linkedin && { href: p.links.linkedin, label: 'LinkedIn', icon: Linkedin },
    p.links.portfolio && { href: p.links.portfolio, label: 'Portfolio', icon: Globe },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Github }[];
  const publicUrl = `${STUDENT_SITE_URL}/p/${p.handle}`;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link to="/talent" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-3.5" aria-hidden /> Talent
      </Link>

      <Card className="mt-2 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500" aria-hidden />
        <div className="px-5 pb-5">
          <div className="-mt-8 flex flex-wrap items-end gap-4">
            <Avatar name={p.name} color={p.avatarColor} size={72} className="ring-4 ring-white" />
            <div className="ml-auto flex flex-wrap items-center gap-2 pt-10">
              <Button
                size="sm"
                variant="ghost"
                icon={<Link2 className="size-3.5" aria-hidden />}
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(publicUrl)
                    .then(() => toast.success('Public profile link copied', { description: publicUrl }))
                    .catch(() => toast.error('Couldn’t copy the link'));
                }}
              >
                Copy public link
              </Button>
              <Button
                variant={lastInvite && lastInvite.status !== 'declined' ? 'secondary' : 'primary'}
                icon={
                  lastInvite && lastInvite.status !== 'declined' ? (
                    <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                  ) : (
                    <Mail className="size-4" aria-hidden />
                  )
                }
                onClick={() =>
                  setInvite({
                    student: p,
                    challenge: latestYours
                      ? { id: latestYours.challengeId, title: latestYours.challengeTitle, hiringFor: null }
                      : null,
                  })
                }
              >
                {inviteLabel}
              </Button>
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{p.name}</h1>
              {p.pronouns && <span className="text-sm text-slate-500">({p.pronouns})</span>}
              {p.openToWork && (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> Open to work
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {p.major} · {p.university} · Class of {p.gradYear}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="size-3.5" aria-hidden /> {p.location}
            </p>
            {p.bio && <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-slate-700">{p.bio}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {p.skills.map((s) => (
                <span key={s} className="inline-flex h-6 items-center rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-700">
                  {s}
                </span>
              ))}
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold text-primary ring-1 ring-indigo-200 ring-inset hover:bg-indigo-50"
                >
                  <l.icon className="size-3.5" aria-hidden /> {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Proof Profile · the new experience section</p>
        <ProofStats stats={p.stats} />
      </div>

      <div className="mt-5 grid items-start gap-5 @4xl:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-5">
          <SkillsRadar stats={p.stats} />
          {p.stats.topSkills.length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Top verified skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.stats.topSkills.map((s) => (
                  <span key={s} className="inline-flex h-6 items-center rounded-md bg-indigo-50 px-2 text-xs font-semibold text-indigo-700">
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
        <ProofHistory items={p.history} companyName={company?.name} />
      </div>

      <InviteModal open={!!invite} target={invite} onClose={() => setInvite(null)} />
    </div>
  );
}

function CandidateSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl" aria-busy>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-52 w-full rounded-xl" />
      <div className="mt-5 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-5 h-72 w-full rounded-xl" />
    </div>
  );
}
