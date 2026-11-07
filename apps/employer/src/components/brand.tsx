import { useEffect, useState, type ComponentType, type CSSProperties, type SVGProps } from 'react';
import {
  Calculator,
  Check,
  Clock,
  Code,
  Compass,
  Database,
  EyeOff,
  Lock,
  Megaphone,
  Palette,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import {
  REWARD_MODE_LABEL,
  TYPE_META,
  rewardTotal,
  type ChallengeStatus,
  type ChallengeType,
  type Company,
  type Reward,
  type TypeMeta,
} from '@shared/types';
import { initials, money, timeLeft } from '@/lib/format';
import { cn } from './ui';

/* ───────────────────────────── Logo ───────────────────────────── */

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-lg shadow-sm', className)}
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
      aria-hidden
    >
      <Check className="text-white" style={{ width: size * 0.62, height: size * 0.62 }} strokeWidth={3.25} />
    </span>
  );
}

export function Wordmark({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'text-[20px] leading-none font-extrabold tracking-[-0.045em]',
        dark ? 'text-white' : 'text-slate-900',
        className,
      )}
    >
      tryout
    </span>
  );
}

export function EmployerPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[18px] items-center rounded-full bg-white/10 px-2 text-[10px] font-semibold tracking-wide text-indigo-200 ring-1 ring-white/15 ring-inset',
        className,
      )}
    >
      for employers
    </span>
  );
}

/* ───────────────────────────── Types ───────────────────────────── */

const TYPE_ICONS: Record<TypeMeta['icon'], ComponentType<SVGProps<SVGSVGElement>>> = {
  Code,
  Database,
  Palette,
  Compass,
  Megaphone,
  Calculator,
  ShieldCheck,
};

export function TypeIcon({ type, className, style }: { type: ChallengeType; className?: string; style?: CSSProperties }) {
  const meta = TYPE_META[type] ?? TYPE_META.software;
  const Icon = TYPE_ICONS[meta.icon] ?? Code;
  return <Icon className={className} style={style} aria-hidden />;
}

export function TypeChip({ type, className, size = 'md' }: { type: ChallengeType; className?: string; size?: 'sm' | 'md' }) {
  const meta = TYPE_META[type] ?? TYPE_META.software;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md font-semibold whitespace-nowrap',
        size === 'sm' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs',
        className,
      )}
      style={{ backgroundColor: meta.softBg, color: meta.color }}
    >
      <TypeIcon type={type} className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      {meta.label}
    </span>
  );
}

/* ───────────────────────────── Money ───────────────────────────── */

export function RewardBadge({ reward, className, size = 'md' }: { reward: Reward; className?: string; size?: 'sm' | 'md' }) {
  const total = rewardTotal(reward);
  const text = size === 'sm' ? 'text-[11px] h-5 px-1.5' : 'text-xs h-6 px-2';
  if (reward.mode === 'none' || total === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-md bg-slate-100 font-semibold text-slate-600', text, className)}>
        No bounty
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-amber-50 font-semibold whitespace-nowrap text-amber-800 ring-1 ring-amber-200 ring-inset',
        text,
        className,
      )}
    >
      <Trophy className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden />
      <span className="tabular-nums">{money(total)}</span>
      <span className="font-medium text-amber-700/80">· {reward.mode === 'winner' ? 'Winner' : 'Top 3'}</span>
    </span>
  );
}

export function rewardSummary(reward: Reward): string {
  if (reward.mode === 'winner') return `Winner takes ${money(reward.amounts[0] ?? 0)}`;
  if (reward.mode === 'top3') return reward.amounts.map((a) => money(a)).join(' / ');
  return REWARD_MODE_LABEL.none;
}

export function EscrowChip({
  amount,
  state = 'escrowed',
  className,
}: {
  amount: number;
  state?: 'escrowed' | 'paid';
  className?: string;
}) {
  if (amount <= 0) return null;
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md bg-emerald-50 px-2 text-xs font-semibold whitespace-nowrap text-emerald-700 ring-1 ring-emerald-200 ring-inset',
        className,
      )}
      title={state === 'escrowed' ? 'Held in escrow until you publish results' : 'Paid out to winners'}
    >
      <Lock className="size-3" aria-hidden />
      <span className="tabular-nums">{money(amount)}</span> {state === 'escrowed' ? 'escrowed' : 'paid'}
    </span>
  );
}

export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn('font-semibold text-emerald-700 tabular-nums', className)}>{money(amount)}</span>;
}

/* ───────────────────────────── People & companies ───────────────────────────── */

export function CompanyLogo({
  company,
  size = 28,
  className,
}: {
  company: Pick<Company, 'logoColor' | 'logoInitials' | 'name'> | null | undefined;
  size?: number;
  className?: string;
}) {
  if (!company) {
    return (
      <span
        className={cn('inline-flex shrink-0 items-center justify-center rounded-lg', className)}
        style={{ width: size, height: size, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
        aria-hidden
      >
        <LogoMark size={size * 0.7} className="shadow-none" />
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: company.logoColor,
        fontSize: Math.max(9, Math.round(size * 0.38)),
        letterSpacing: '-0.02em',
      }}
      title={company.name}
      aria-hidden
    >
      {company.logoInitials}
    </span>
  );
}

export function Avatar({
  name,
  color,
  size = 32,
  className,
  blind,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
  /** Blind review: neutral glyph instead of initials/color. */
  blind?: boolean;
}) {
  if (blind) {
    return (
      <span
        className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500', className)}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <EyeOff style={{ width: size * 0.45, height: size * 0.45 }} />
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, backgroundColor: color ?? '#64748B', fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/* ───────────────────────────── Status & progress ───────────────────────────── */

export function StatusBadge({ status, className }: { status: ChallengeStatus; className?: string }) {
  const map: Record<ChallengeStatus, { label: string; cls: string }> = {
    open: { label: 'Open', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    reviewing: { label: 'Reviewing', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
    awarded: { label: 'Awarded', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  };
  const s = map[status] ?? map.open;
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold ring-1 ring-inset',
        s.cls,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full bg-current', status === 'open' && 'animate-pulse')} aria-hidden />
      {s.label}
    </span>
  );
}

export function SpotsBar({
  joined,
  cap,
  className,
  compact,
}: {
  joined: number;
  cap: number | null;
  className?: string;
  compact?: boolean;
}) {
  const pct = cap ? Math.min(100, (joined / cap) * 100) : Math.min(100, joined * 2);
  const full = cap != null && joined >= cap;
  return (
    <div className={cn('min-w-0', className)}>
      <div className={cn('flex items-center justify-between gap-2 text-xs', compact && 'text-[11px]')}>
        <span className="flex items-center gap-1 text-slate-600 tabular-nums">
          {!compact && <Users className="size-3.5 text-slate-400" aria-hidden />}
          <span className="font-semibold text-slate-800">{joined}</span>
          {cap != null ? <span className="text-slate-400">/ {cap}</span> : <span className="text-slate-400">joined</span>}
        </span>
        {!compact && cap != null && (
          <span className={cn('text-[11px]', full ? 'font-semibold text-amber-700' : 'text-slate-400')}>
            {full ? 'Full' : `${cap - joined} left`}
          </span>
        )}
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700', full ? 'bg-amber-500' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Ticks every 30 s. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function Countdown({
  deadline,
  status,
  className,
  icon = true,
}: {
  deadline: string | null;
  status?: ChallengeStatus;
  className?: string;
  icon?: boolean;
}) {
  const now = useNow();
  if (status === 'awarded') {
    return <span className={cn('text-xs text-slate-500', className)}>Results published</span>;
  }
  const t = timeLeft(deadline, now);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap tabular-nums',
        t.past ? 'text-slate-500' : t.urgent ? 'text-amber-700' : 'text-slate-600',
        className,
      )}
    >
      {icon && <Clock className="size-3.5 opacity-70" aria-hidden />}
      {t.label}
    </span>
  );
}

export function scoreTone(score: number): { text: string; bg: string; ring: string; bar: string } {
  if (score >= 85) return { text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200', bar: 'bg-emerald-500' };
  if (score >= 70) return { text: 'text-indigo-700', bg: 'bg-indigo-50', ring: 'ring-indigo-200', bar: 'bg-indigo-500' };
  if (score >= 60) return { text: 'text-amber-800', bg: 'bg-amber-50', ring: 'ring-amber-200', bar: 'bg-amber-500' };
  return { text: 'text-slate-700', bg: 'bg-slate-100', ring: 'ring-slate-200', bar: 'bg-slate-400' };
}

export function ScorePill({ score, className }: { score: number; className?: string }) {
  const t = scoreTone(score);
  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-[13px] font-bold tabular-nums ring-1 ring-inset',
        t.text,
        t.bg,
        t.ring,
        className,
      )}
    >
      {score}
    </span>
  );
}

export function NeedsReview({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md bg-amber-50 px-2 text-xs font-semibold whitespace-nowrap text-amber-800 ring-1 ring-amber-200 ring-inset',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
      Needs review
    </span>
  );
}

export function MedalBadge({ rank, className }: { rank: number; className?: string }) {
  const styles: Record<number, string> = {
    1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-amber-400',
    2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-slate-300',
    3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 ring-orange-400',
  };
  return (
    <span
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ring-1',
        styles[rank] ?? 'bg-slate-100 text-slate-600 ring-slate-200',
        className,
      )}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}
