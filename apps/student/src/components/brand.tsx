import {
  Briefcase,
  Calculator,
  Check,
  Code,
  Compass,
  Database,
  Lock,
  Megaphone,
  Palette,
  ShieldCheck,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { DIFFICULTY_LABEL, TYPE_META, type ChallengeType, type ChallengeView, type Company, type Difficulty } from '@shared/types';
import { cn } from '@/lib/cn';
import { countdown, initials, medal, money, ordinal } from '@/lib/format';
import { useNow } from '@/lib/useNow';

/* ─────────────────────────────── Brand ─────────────────────────────── */

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-lg brand-gradient shadow-[0_4px_12px_-4px_rgb(79_70_229/0.6)]', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Check className="text-white" style={{ width: size * 0.62, height: size * 0.62 }} strokeWidth={3.25} />
    </span>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className={cn('text-[22px] font-extrabold leading-none tracking-[-0.045em]', light ? 'text-white' : 'text-ink')}>tryout</span>
    </span>
  );
}

/* ─────────────────────────────── Types ─────────────────────────────── */

const TYPE_ICONS: Record<(typeof TYPE_META)[ChallengeType]['icon'], LucideIcon> = {
  Code,
  Database,
  Palette,
  Compass,
  Megaphone,
  Calculator,
  ShieldCheck,
};

export function typeIcon(type: ChallengeType): LucideIcon {
  return TYPE_ICONS[TYPE_META[type]?.icon] ?? Code;
}

export function TypeIcon({ type, className }: { type: ChallengeType; className?: string }) {
  const Icon = typeIcon(type);
  return <Icon className={className} style={{ color: TYPE_META[type]?.color }} aria-hidden />;
}

export function TypeChip({ type, className, size = 'md' }: { type: ChallengeType; className?: string; size?: 'sm' | 'md' }) {
  const meta = TYPE_META[type];
  if (!meta) return null;
  const Icon = typeIcon(type);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs leading-5',
        className,
      )}
      style={{ color: meta.color, backgroundColor: meta.softBg }}
    >
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden />
      {meta.label}
    </span>
  );
}

export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  const bars = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-slate-600', className)}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('w-1 rounded-sm', i <= bars ? 'bg-indigo-500' : 'bg-slate-200')} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

/* ─────────────────────────────── Money ─────────────────────────────── */

export function RewardBadge({
  challenge,
  size = 'md',
  className,
}: {
  challenge: Pick<ChallengeView, 'reward' | 'rewardTotal' | 'kind'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sz = size === 'lg' ? 'px-3 py-1 text-sm' : size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs leading-5';
  if (challenge.kind === 'practice') {
    return (
      <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 font-semibold text-emerald-700', sz, className)}>
        Free practice
      </span>
    );
  }
  if (challenge.reward.mode === 'none' || challenge.rewardTotal <= 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 font-semibold text-slate-600', sz, className)}>
        Hiring signal · feedback
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 font-bold text-amber-700 ring-1 ring-amber-200/80 ring-inset',
        sz,
        className,
      )}
    >
      <span aria-hidden>💰</span>
      <span className="tabular-nums">{money(challenge.rewardTotal)}</span>
      <span className="font-semibold text-amber-600/90">· {challenge.reward.mode === 'top3' ? 'Top 3' : 'Winner'}</span>
    </span>
  );
}

export function EscrowChip({ amount, className }: { amount: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold leading-5 text-emerald-700 ring-1 ring-emerald-200/80 ring-inset',
        className,
      )}
      title="The bounty is held by Tryout from the moment the challenge is posted until results are out."
    >
      <Lock className="size-3" aria-hidden />
      <span className="tabular-nums">{money(amount)}</span> escrowed
    </span>
  );
}

export function HiringTag({ role, className, short }: { role: string; className?: string; short?: boolean }) {
  const label = short ? 'Hiring' : `Hiring: ${role.split('·')[0].trim()}`;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700',
        className,
      )}
      title={role}
    >
      <Briefcase className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/* ─────────────────────────────── People ─────────────────────────────── */

type LogoCompany = Pick<Company, 'name' | 'logoColor' | 'logoInitials'>;

export function CompanyLogo({ company, size = 36, className }: { company: LogoCompany | null | undefined; size?: number; className?: string }) {
  if (!company) {
    return <LogoMark size={size} className={cn('rounded-xl', className)} />;
  }
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-xl font-bold text-white shadow-sm', className)}
      style={{ width: size, height: size, backgroundColor: company.logoColor, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden
    >
      {company.logoInitials}
    </span>
  );
}

export function Avatar({
  name,
  color,
  size = 36,
  className,
  ring,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full font-bold text-white', ring && 'ring-4 ring-white', className)}
      style={{ width: size, height: size, backgroundColor: color ?? '#6366F1', fontSize: Math.max(10, size * 0.38) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/* ─────────────────────────────── Time & spots ─────────────────────────────── */

export function SpotsBar({
  participantCount,
  applicantCap,
  className,
  compact,
}: {
  participantCount: number;
  applicantCap: number | null;
  className?: string;
  compact?: boolean;
}) {
  if (!applicantCap) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-slate-500', className)}>
        <span className="font-semibold tabular-nums text-slate-700">{participantCount}</span> joined · no cap
      </div>
    );
  }
  const ratio = Math.min(1, participantCount / applicantCap);
  const left = Math.max(0, applicantCap - participantCount);
  const tone = ratio >= 1 ? 'bg-red-500' : ratio >= 0.8 ? 'bg-amber-500' : 'bg-indigo-500';
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          <span className="font-semibold tabular-nums text-slate-700">
            {participantCount}/{applicantCap}
          </span>{' '}
          joined
        </span>
        {!compact ? (
          <span className={cn('font-semibold tabular-nums', left === 0 ? 'text-red-600' : left <= 5 ? 'text-amber-600' : 'text-slate-500')}>
            {left === 0 ? 'Full' : `${left} left`}
          </span>
        ) : null}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-[width] duration-500', tone)} style={{ width: `${Math.max(4, ratio * 100)}%` }} />
      </div>
    </div>
  );
}

export function Countdown({
  deadline,
  prefix = 'Closes in',
  className,
  icon = true,
}: {
  deadline: string | null;
  prefix?: string;
  className?: string;
  icon?: boolean;
}) {
  const now = useNow(1000);
  if (!deadline) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-slate-500', className)}>
        {icon ? <Timer className="size-3.5" aria-hidden /> : null}
        Evergreen
      </span>
    );
  }
  const c = countdown(deadline, now);
  const tone = c.passed ? 'text-slate-500' : c.urgency === 'urgent' ? 'text-red-600' : c.urgency === 'soon' ? 'text-amber-600' : 'text-slate-600';
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold tabular-nums', tone, className)}>
      {icon ? <Timer className="size-3.5" aria-hidden /> : null}
      {c.passed ? 'Closed' : `${prefix} ${c.label}`}
    </span>
  );
}

/* ─────────────────────────────── Stats & scores ─────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'indigo',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: 'indigo' | 'emerald' | 'amber' | 'violet' | 'sky';
  className?: string;
}) {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className={cn('rounded-2xl border border-line/80 bg-white p-4 shadow-soft', className)}>
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className={cn('grid size-8 place-items-center rounded-xl', tones[tone])}>
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      <div className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-ink tabular-nums">{value}</div>
      {hint ? <div className="mt-1.5 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function scoreTone(score: number): { stroke: string; text: string; bg: string } {
  if (score >= 85) return { stroke: '#10B981', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 70) return { stroke: '#4F46E5', text: 'text-indigo-600', bg: 'bg-indigo-50' };
  if (score >= 60) return { stroke: '#F59E0B', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { stroke: '#94A3B8', text: 'text-slate-600', bg: 'bg-slate-100' };
}

export function ScoreRing({ score, size = 56, stroke = 6, className }: { score: number; size?: number; stroke?: number; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const tone = scoreTone(score);
  return (
    <span className={cn('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="font-extrabold tabular-nums text-ink" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
      </span>
      <span className="sr-only">Score {score} out of 100</span>
    </span>
  );
}

export function RankBadge({ rank, payout, className }: { rank: number | null; payout?: number | null; className?: string }) {
  if (!rank) return null;
  const m = medal(rank);
  const paid = (payout ?? 0) > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold leading-5',
        paid ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 ring-inset' : 'bg-slate-100 text-slate-600',
        className,
      )}
    >
      {m ? <span aria-hidden>{m}</span> : null}
      {ordinal(rank)} place
    </span>
  );
}
