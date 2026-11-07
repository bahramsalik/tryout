import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHALLENGE_TYPES, TYPE_META, type StudentStats } from '@shared/types';

interface Point {
  field: string;
  score: number;
  count: number;
}

function RadarTip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md bg-bg1 px-3 py-2 text-caption shadow-16">
      <div className="font-semibold text-fg1">{p.field}</div>
      <div className="text-fg2">
        {p.count > 0 ? (
          <>
            Avg <span className="font-semibold tabular-nums text-fg1">{p.score}</span>/100 · {p.count} task{p.count === 1 ? '' : 's'}
          </>
        ) : (
          'No scored work yet'
        )}
      </div>
    </div>
  );
}

/** Average score per field (0 where there's no scored work). */
export function SkillsRadar({ stats }: { stats: StudentStats }) {
  const data: Point[] = CHALLENGE_TYPES.map((t) => {
    const found = stats.typeScores.find((x) => x.type === t);
    return { field: TYPE_META[t].label, score: found?.avgScore ?? 0, count: found?.count ?? 0 };
  });
  const scored = data.filter((d) => d.count > 0);
  return (
    <div>
      <div className="h-[260px] w-full" role="img" aria-label={`Skills radar: ${scored.map((d) => `${d.field} ${d.score}`).join(', ') || 'no scored work yet'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="var(--colorNeutralStroke2)" />
            <PolarAngleAxis dataKey="field" tick={{ fill: 'var(--colorNeutralForeground3)', fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
            <Radar dataKey="score" stroke="var(--colorBrandBackground)" strokeWidth={2} fill="var(--colorBrandBackground)" fillOpacity={0.15} dot={{ r: 3, fill: 'var(--colorBrandBackground)' }} isAnimationActive={false} />
            <Tooltip content={<RadarTip />} cursor={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
