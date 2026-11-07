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
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-bold text-ink">{p.field}</div>
      <div className="text-slate-600">
        {p.count > 0 ? (
          <>
            Avg <span className="font-semibold tabular-nums text-ink">{p.score}</span>/100 · {p.count} task{p.count === 1 ? '' : 's'}
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
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis dataKey="field" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
            <Radar dataKey="score" stroke="#4F46E5" strokeWidth={2} fill="#4F46E5" fillOpacity={0.18} dot={{ r: 4, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }} isAnimationActive />
            <Tooltip content={<RadarTip />} cursor={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {scored.map((d) => (
          <li key={d.field}>
            {d.field} <span className="font-semibold tabular-nums text-ink">{d.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
