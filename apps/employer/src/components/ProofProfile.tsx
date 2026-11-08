import { Link } from 'react-router';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { BadgeCheck, Clock, Gauge, Trophy, TrophyFilled } from '@/components/icons';
import { CHALLENGE_TYPES, TYPE_META, type ProfileHistoryItem, type StudentStats } from '@shared/types';
import { CompanyLogo, MEDAL_COLOR, MedalBadge, ScorePill, VerifiedBadge } from './brand';
import { StatTile } from './StatTile';
import { Card, CardHeader, EmptyState, cn } from './ui';

export function ProofStats({ stats }: { stats: StudentStats }) {
  const p = stats.placements;
  const hasPlacements = p.first + p.second + p.third > 0; // no award on a challenge means no placements to show
  return (
    <div className={cn('grid grid-cols-2 gap-3', hasPlacements ? '@3xl:grid-cols-4' : '@3xl:grid-cols-3')}>
      <StatTile label="Verified hours" value={stats.verifiedHours} suffix="h" icon={<Clock aria-hidden />} />
      <StatTile label="Tasks" value={stats.tasksCompleted} icon={<BadgeCheck aria-hidden />} />
      <StatTile label="Avg score" value={stats.avgScore ?? 0} icon={<Gauge aria-hidden />} />
      {hasPlacements && (
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-sm text-slate-500 [&_svg]:size-4">
            <Trophy aria-hidden />
            Placements
          </p>
          <p
            className="mt-1 flex items-center gap-3 text-2xl font-semibold tabular-nums"
            aria-label={`${p.first} first, ${p.second} second, ${p.third} third places`}
          >
            {[p.first, p.second, p.third].map((n, i) => (
              <span key={i} className="inline-flex items-center gap-1" title={['1st', '2nd', '3rd'][i]}>
                <TrophyFilled className="size-5" style={{ color: MEDAL_COLOR[i + 1] }} aria-hidden />
                {n}
              </span>
            ))}
          </p>
        </Card>
      )}
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
      <CardHeader title="Skills" />
      {hasData ? (
        <div
          className="h-64 px-2 pb-2"
          role="img"
          aria-label={`Skills radar: ${data
            .filter((d) => d.count)
            .map((d) => `${d.type} ${d.score}`)
            .join(', ')}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke="var(--colorNeutralStroke2)" />
              <PolarAngleAxis dataKey="type" tick={{ fill: 'var(--colorNeutralForeground3)', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [value, 'Avg score']}
                contentStyle={{
                  borderRadius: 4,
                  border: 'none',
                  boxShadow: 'var(--shadow16)',
                  fontSize: 12,
                  fontFamily: 'var(--fontFamilyBase)',
                }}
              />
              <Radar
                dataKey="score"
                stroke="var(--colorBrandBackground)"
                strokeWidth={2}
                fill="var(--colorBrandBackground)"
                fillOpacity={0.2}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState compact title="No scored work yet" />
      )}
    </Card>
  );
}

export function ProofHistory({ items }: { items: ProfileHistoryItem[]; companyName?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="History" />
      <p className="px-4 pb-2 text-xs text-slate-500">Scores are graded automatically against the company's rubric. Verified means a person at the company confirmed the result.</p>
      {items.length === 0 ? (
        <EmptyState compact title="No submissions yet" />
      ) : (
        <ol>
          {items.map((h) => (
            <HistoryRow key={h.submissionId} item={h} />
          ))}
        </ol>
      )}
    </Card>
  );
}

function HistoryRow({ item: h }: { item: ProfileHistoryItem }) {
  const content = (
    <div className="flex gap-3 px-4 py-3">
      <CompanyLogo company={h.company} size={28} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{h.challengeTitle}</p>
        <p className="truncate text-xs text-slate-500">{h.company?.name ?? 'Practice'}</p>
        {h.feedbackExcerpt && <p className="mt-1 truncate text-sm text-slate-700">{h.feedbackExcerpt}</p>}
      </div>
      <div className="flex shrink-0 items-start gap-3 text-sm">
        {h.verified && <VerifiedBadge company={h.company?.name} />}
        {h.status === 'awarded' && h.rank != null && <MedalBadge rank={h.rank} />}
        {h.totalScore != null ? <ScorePill score={h.totalScore} className="text-right" /> : <span className="text-slate-500">–</span>}
      </div>
    </div>
  );
  return (
    <li className="border-t border-slate-200 first:border-0">
      {h.canViewFiles ? (
        <Link to={`/challenges/${h.challengeId}/review/${h.submissionId}`} className="block hover:bg-[var(--colorNeutralBackground1Hover)]">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
