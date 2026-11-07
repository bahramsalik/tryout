import { BadgeCheck, Copy, ExternalLink, Globe, GraduationCap, Hourglass, Link2, MapPin, Radar as RadarIcon, Sparkles, Target, Trophy, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { ProfileHistoryItem, StudentProfile } from '@shared/types';
import { cn } from '@/lib/cn';
import { money, shortDate } from '@/lib/format';
import { Avatar, CompanyLogo, RankBadge, ScoreRing, StatTile, TypeChip } from './brand';
import { SkillsRadar } from './SkillsRadar';
import { Button, Card, EmptyState, Skeleton } from './ui';

function HistoryItem({ h, linkable }: { h: ProfileHistoryItem; linkable: boolean }) {
  const coach = h.reviewer === 'coach';
  const published = h.totalScore !== null;
  const paid = (h.payout ?? 0) > 0;
  const body = (
    <div className={cn('flex gap-4 rounded-2xl border border-line/80 bg-white p-4 transition', linkable && 'hover:-translate-y-0.5 hover:shadow-lift')}>
      <CompanyLogo company={h.company} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold">{h.company?.name ?? 'Tryout Practice'}</span>
          <TypeChip type={h.type} size="sm" />
          <span>{shortDate(h.submittedAt)}</span>
        </div>
        <div className="mt-0.5 font-bold leading-snug text-ink">{h.challengeTitle}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!published ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              <Hourglass className="size-3" aria-hidden /> Under review
            </span>
          ) : coach ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              <Sparkles className="size-3" aria-hidden /> Practice · Coach review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <BadgeCheck className="size-3" aria-hidden /> Employer-verified
            </span>
          )}
          <RankBadge rank={h.rank} payout={h.payout} />
          {paid ? <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">+{money(h.payout)}</span> : null}
          <span className="text-[11px] text-slate-400">~{h.estHours} h</span>
        </div>
        {h.feedbackExcerpt ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">“{h.feedbackExcerpt}”</p> : null}
      </div>
      {published ? <ScoreRing score={h.totalScore!} size={52} stroke={5} /> : null}
    </div>
  );
  return linkable ? <Link to={`/challenges/${h.challengeId}`}>{body}</Link> : body;
}

export function ProofProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[108px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export function ProofProfile({ profile: p, own, publicView }: { profile: StudentProfile; own?: boolean; publicView?: boolean }) {
  const s = p.stats;
  const url = `${window.location.origin}/p/${p.handle}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public link copied', { description: url });
    } catch {
      toast(url, { description: 'Copy this link to share your Proof Profile.' });
    }
  };
  const history = [...p.history].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const verified = history.filter((h) => h.reviewer !== 'coach');
  const practice = history.filter((h) => h.reviewer === 'coach');
  const links = [
    p.links.github && { href: p.links.github, label: 'GitHub', icon: Link2 },
    p.links.linkedin && { href: p.links.linkedin, label: 'LinkedIn', icon: Link2 },
    p.links.portfolio && { href: p.links.portfolio, label: 'Portfolio', icon: Globe },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="hero-gradient relative h-28 sm:h-32">
          <div className="dot-grid absolute inset-0 opacity-50" aria-hidden />
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
            <BadgeCheck className="size-3.5" aria-hidden /> Proof Profile
          </span>
        </div>
        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-3">
            <Avatar name={p.name} color={p.avatarColor} size={84} ring className="shadow-lg" />
            {own ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" icon={Copy} onClick={copy}>
                  Copy public link
                </Button>
                <a href={`/p/${p.handle}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-100">
                  View public page <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-extrabold tracking-tight text-ink">{p.name}</h1>
            {p.pronouns ? <span className="text-sm text-slate-400">{p.pronouns}</span> : null}
            {p.openToWork ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> Open to work
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-4 text-slate-400" aria-hidden /> {p.university} · {p.major} · Class of {p.gradYear}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-slate-400" aria-hidden /> {p.location}
            </span>
          </div>
          {p.bio ? <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-700">{p.bio}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {p.skills.map((sk) => (
              <span key={sk} className="rounded-full border border-line bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {sk}
              </span>
            ))}
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                <l.icon className="size-3.5" aria-hidden /> {l.label}
              </a>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={BadgeCheck} label="Verified hours" value={s.verifiedHours} hint={s.practiceHours ? `+ ${s.practiceHours} practice hours` : 'Employer-scored ≥ 60'} />
        <StatTile icon={Target} tone="violet" label="Employer-verified tasks" value={s.tasksCompleted} hint={s.avgScore != null ? `Avg score ${s.avgScore}/100` : 'No scored work yet'} />
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <RadarIcon className="size-[18px] text-indigo-500" aria-hidden /> Skills radar
          </h2>
          <p className="text-xs text-slate-500">Average score per field, across all scored work.</p>
          {s.typeScores.length > 0 ? (
            <SkillsRadar stats={s} />
          ) : (
            <EmptyState emoji="📡" title="No scored work yet" className="mt-4 border-none">
              Scores from challenges fill in this radar.
            </EmptyState>
          )}
          {s.topSkills.length > 0 ? (
            <div className="mt-4 border-t border-line pt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Top skills shown</div>
              <div className="flex flex-wrap gap-1.5">
                {s.topSkills.map((t) => (
                  <span key={t} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
              <BadgeCheck className="size-[18px] text-emerald-500" aria-hidden /> Employer-verified work
              <span className="rounded-full bg-slate-100 px-2 text-xs tabular-nums text-slate-600">{verified.length}</span>
            </h2>
            {verified.length === 0 ? (
              <EmptyState emoji="🧪" title="No employer-scored work yet">
                {own ? 'Join a live challenge — every submission gets employer scores and feedback.' : 'Results appear here once employers publish them.'}
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {verified.map((h) => (
                  <HistoryItem key={h.submissionId} h={h} linkable={!publicView} />
                ))}
              </div>
            )}
          </section>
          {practice.length > 0 ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
                <Sparkles className="size-[18px] text-indigo-500" aria-hidden /> Practice arena
                <span className="rounded-full bg-slate-100 px-2 text-xs tabular-nums text-slate-600">{practice.length}</span>
              </h2>
              <div className="space-y-3">
                {practice.map((h) => (
                  <HistoryItem key={h.submissionId} h={h} linkable={!publicView} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
