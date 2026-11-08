import { useEffect, useState, type ComponentType, type CSSProperties } from 'react';
import {
  Code20Regular,
  DataBarVertical20Regular,
  DesignIdeas20Regular,
  Lightbulb20Regular,
  Megaphone20Regular,
  Money20Regular,
  Shield20Regular,
} from '@fluentui/react-icons';
import { Check, Clock, EyeOff, TrophyFilled } from '@/components/icons';
import { TYPE_META, type ChallengeStatus, type ChallengeType, type Company } from '@shared/types';
import { initials, timeLeft } from '@/lib/format';
import { Badge, cn } from './ui';

/* ───────────────────────────── Brand mark ─────────────────────────────
   24 px brand square, radius 4, white checkmark + "tryout" wordmark (600). Same on both sites. */

export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[var(--borderRadiusMedium)] bg-[var(--colorBrandBackground)]', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Check className="text-[var(--colorNeutralForegroundOnBrand)]" style={{ width: size * 0.7, height: size * 0.7 }} />
    </span>
  );
}

export function Wordmark({ className }: { dark?: boolean; className?: string }) {
  return <span className={cn('text-base leading-none font-semibold text-[var(--colorNeutralForeground1)]', className)}>tryout</span>;
}

export function EmployerPill({ className }: { className?: string }) {
  return <span className={cn('text-sm text-[var(--colorNeutralForeground3)]', className)}>Employers</span>;
}

/* ───────────────────────────── Challenge types ───────────────────────────── */

const TYPE_ICONS: Record<ChallengeType, ComponentType<{ className?: string; style?: CSSProperties }>> = {
  software: Code20Regular,
  data: DataBarVertical20Regular,
  design: DesignIdeas20Regular,
  product: Lightbulb20Regular,
  marketing: Megaphone20Regular,
  finance: Money20Regular,
  security: Shield20Regular,
};

export function TypeIcon({ type, className, style }: { type: ChallengeType; className?: string; style?: CSSProperties }) {
  const Icon = TYPE_ICONS[type] ?? Code20Regular;
  return <Icon className={className} style={style} aria-hidden />;
}

export function TypeChip({ type, className }: { type: ChallengeType; className?: string; size?: 'sm' | 'md' }) {
  const meta = TYPE_META[type] ?? TYPE_META.software;
  return (
    <span
      className={cn('inline-flex h-5 shrink-0 items-center gap-1 rounded-[var(--borderRadiusCircular)] px-2 text-xs font-semibold whitespace-nowrap', className)}
      style={{ backgroundColor: meta.softBg, color: meta.color }}
    >
      <TypeIcon type={type} className="size-3" />
      {meta.label}
    </span>
  );
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
  if (!company) return <LogoMark size={size} className={className} />;
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[var(--borderRadiusMedium)] font-semibold text-white', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: company.logoColor,
        fontSize: Math.max(9, Math.round(size * 0.38)),
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
        className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--colorNeutralBackground6)] text-[var(--colorNeutralForeground3)]', className)}
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
      style={{ width: size, height: size, backgroundColor: color ?? 'var(--colorNeutralForeground3)', fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/* ───────────────────────────── Status & progress ───────────────────────────── */

export function StatusBadge({ status, className }: { status: ChallengeStatus; className?: string }) {
  const map: Record<ChallengeStatus, { label: string; tone: 'emerald' | 'amber' | 'slate' }> = {
    open: { label: 'Open', tone: 'emerald' },
    reviewing: { label: 'Reviewing', tone: 'slate' },
    awarded: { label: 'Awarded', tone: 'slate' },
  };
  const s = map[status] ?? map.open;
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
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
      <div className={cn('flex items-center justify-between gap-2 text-xs', compact && 'text-xs')}>
        <span className="flex items-center gap-1 text-slate-600 tabular-nums">
          <span className="font-semibold text-slate-800">{joined}</span>
          {cap != null ? <span className="text-slate-400">/ {cap}</span> : <span className="text-slate-400">joined</span>}
        </span>
        {!compact && cap != null && (
          <span className={cn('text-xs', full ? 'font-semibold text-amber-700' : 'text-slate-400')}>
            {full ? 'Full' : `${cap - joined} left`}
          </span>
        )}
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={cn('h-full rounded-full transition-[width]', full ? 'bg-amber-500' : 'bg-primary')}
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
    return <span className={cn('text-xs whitespace-nowrap text-slate-500', className)}>Results published</span>;
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
  return { text: 'text-slate-900', bg: 'bg-slate-100', ring: 'ring-slate-200', bar: 'bg-primary' };
}

export function ScorePill({ score, className }: { score: number; className?: string }) {
  return <span className={cn('inline-block min-w-8 text-sm font-semibold tabular-nums', className)}>{score}</span>;
}

export function NeedsReview({ className }: { className?: string }) {
  return (
    <Badge tone="indigo" className={className}>
      To review
    </Badge>
  );
}

const ORDINAL = ['', '1st', '2nd', '3rd'];
/* Fluent shared-color palette: gold / silver / bronze foregrounds. */
export const MEDAL_COLOR: Record<number, string> = { 1: '#C19C00', 2: '#7A7574', 3: '#A74109' };

/** `1st` / `2nd` / `3rd` badge with a colored Fluent trophy; plain rank number after that. */
export function MedalBadge({ rank, className }: { rank: number; className?: string }) {
  if (rank > 3) {
    return <span className={cn('inline-block w-10 text-sm text-[var(--colorNeutralForeground3)] tabular-nums', className)}>#{rank}</span>;
  }
  return (
    <span className={cn('inline-flex w-10 shrink-0 items-center gap-1 text-sm font-semibold', className)} aria-label={`Rank ${rank}`}>
      <TrophyFilled className="size-4" style={{ color: MEDAL_COLOR[rank] }} aria-hidden />
      {ORDINAL[rank]}
    </span>
  );
}
