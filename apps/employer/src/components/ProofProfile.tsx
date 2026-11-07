import { Link } from 'react-router';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, BadgeCheck, Clock, Coins, FileLock2, Medal, Sparkles } from 'lucide-react';
import { CHALLENGE_TYPES, TYPE_META, type ProfileHistoryItem, type StudentStats } from '@shared/types';
import { medal, money, ordinal, shortDate } from '@/lib/format';
import { CompanyLogo, ScorePill, TypeChip } from './brand';
import { StatTile } from './StatTile';
import { Card, CardHeader, EmptyState, cn } from './ui';

export function ProofStats({ stats }: { stats: StudentStats }) {
  const p = stats.placements;
  const medals = p.first + p.second + p.third;
  return (
    <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
      <StatTile
        label="Verified hours"
        value={stats.verifiedHours}
        suffix="h"
        tone="indigo"
        icon={<Clock className="size-4" aria-hidden />}
        sub={stats.practiceHours ? `+ ${stats.practiceHours} h practice` : 'Employer-scored ≥ 60'}
      />
      <StatTile
        label="Employer-verified tasks"
        value={stats.tasksCompleted}
        tone="violet"
        icon={<BadgeCheck className="size-4" aria-hidden />}
        sub={stats.avgScore != null ? `Avg. score ${stats.avgScore}` : 'No employer scores yet'}
      />
      <StatTile
        label="Bounties earned"
        value={stats.bountiesEarned}
        format="money"
        tone="emerald"
        icon={<Coins className="size-4" aria-hidden />}
        sub="Paid for real work"
      />
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">Placements</p>
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Medal className="size-4" aria-hidden />
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-2 text-xl font-bold tabular-nums" aria-label={`${p.first} first, ${p.second} second, ${p.third} third places`}>
          <span title="1st place">🥇{p.first}</span>
          <span title="2nd place">🥈{p.second}</span>
          <span title="3rd place">🥉{p.third}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">{medals ? `${medals} podium finish${medals === 1 ? '' : 'es'}` : 'No podiums yet'}</p>
      </div>
    </div>
  );
}

export function SkillsRadar({ stats }: { stats: StudentStats }) {
  const data = CHALLENGE_TYPES.map((t) => {
    const entry = stats.typeScores.find((x) => x.type === t);
    return { type: TYPE_META[t].label, score: entry?.avgScore ?? 0, count: entry?.count ?? 0 };
  });
  const hasData = stats.typeScores.length > 0;
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Skills radar" subtitle="Average score by field, from scored work" />
      {hasData ? (
        <div className="h-64 px-2 py-2" role="img" aria-label={`Skills radar: ${data.filter((d) => d.count).map((d) => `${d.type} ${d.score}`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="type" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                formatter={(value, _name, item) => {
                  const count = (item?.payload as { count?: number } | undefined)?.count ?? 0;
                  return [count ? `${value} avg · ${count} task${count === 1 ? '' : 's'}` : 'No scored work', 'Score'];
                }}
                contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
              />
              <Radar dataKey="score" stroke="#4F46E5" strokeWidth={2} fill="#6366F1" fillOpacity={0.25} isAnimationActive />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState compact icon={<Sparkles className="size-5" aria-hidden />} title="No scored work yet" body="The radar fills in as employers score their submissions." />
      )}
    </Card>
  );
}

export function ProofHistory({ items, companyName }: { items: ProfileHistoryItem[]; companyName?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Proof history" subtitle="Real tasks, scored by employers or Coach" />
      {items.length === 0 ? (
        <EmptyState compact title="No submissions yet" body="Completed challenges and practice tasks show up here." />
      ) : (
        <ol className="divide-y divide-slate-100">
          {items.map((h) => (
            <HistoryRow key={h.submissionId} item={h} companyName={companyName} />
          ))}
        </ol>
      )}
    </Card>
  );
}

function HistoryRow({ item: h, companyName }: { item: ProfileHistoryItem; companyName?: string }) {
  const employer = h.reviewer === 'employer';
  const coach = h.reviewer === 'coach' || h.kind === 'practice';
  const content = (
    <div className="flex gap-3 px-4 py-3.5">
      <CompanyLogo company={h.company} size={34} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-semibold text-slate-900">{h.challengeTitle}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <TypeChip type={h.type} size="sm" />
          {employer ? (
            <span className="inline-flex h-5 items-center gap-1 rounded-md bg-emerald-50 px-1.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
              <BadgeCheck className="size-3" aria-hidden /> Employer-verified
            </span>
          ) : coach ? (
            <span className="inline-flex h-5 items-center gap-1 rounded-md bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">
              <Sparkles className="size-3" aria-hidden /> Practice · Coach review
            </span>
          ) : null}
          <span>
            {h.company?.name ?? 'Tryout Practice'} · {shortDate(h.submittedAt)} · ~{h.estHours} h
          </span>
        </div>
        {h.feedbackExcerpt && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-slate-600 italic">“{h.feedbackExcerpt}”</p>
        )}
        <div className="mt-1.5 text-[11px]">
          {h.canViewFiles ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
              Open the submission <ArrowUpRight className="size-3" aria-hidden />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <FileLock2 className="size-3" aria-hidden />
              {h.kind === 'practice'
                ? 'Practice task — files stay with the student'
                : h.company && h.company.name !== companyName
                  ? `Files private to ${h.company.name} — score and feedback only`
                  : 'Files private — score and feedback only'}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {h.totalScore != null ? (
          <ScorePill score={h.totalScore} />
        ) : (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
            {h.status === 'submitted' ? 'In review' : 'Pending'}
          </span>
        )}
        {h.rank != null && h.rank <= 3 && (
          <span className="text-xs font-semibold text-slate-600">
            {medal(h.rank)} {ordinal(h.rank)}
          </span>
        )}
        {h.payout ? <span className="text-xs font-bold text-emerald-700 tabular-nums">{money(h.payout)}</span> : null}
      </div>
    </div>
  );
  return (
    <li>
      {h.canViewFiles ? (
        <Link
          to={`/challenges/${h.challengeId}/review/${h.submissionId}`}
          className={cn('block transition-colors hover:bg-slate-50')}
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
