import {
  Checkmark16Filled,
  Clock16Regular,
  Code20Regular,
  DataBarVertical20Regular,
  DesignIdeas20Regular,
  Lightbulb20Regular,
  Megaphone20Regular,
  Money16Regular,
  Money20Regular,
  People16Regular,
  Shield20Regular,
  TargetArrow16Regular,
  Timer16Regular,
  Trophy16Filled,
  type FluentIcon,
} from '@fluentui/react-icons';
import type { ReactNode } from 'react';
import { DIFFICULTY_LABEL, type ChallengeType, type ChallengeView, type Company } from '@shared/types';
import { cn } from '@/lib/cn';
import { countdown, money, ordinal } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { Badge } from './ui';

/* ─────────────────────────────── Brand mark ─────────────────────────────── */

export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-md bg-brand text-white', className)} style={{ width: size, height: size }} aria-hidden>
      <Checkmark16Filled />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-subtitle1 font-semibold leading-none text-fg1">tryout</span>
    </span>
  );
}

/* ─────────────────────────────── Challenge types ─────────────────────────────── */

const TYPE_ICONS: Record<ChallengeType, FluentIcon> = {
  software: Code20Regular,
  data: DataBarVertical20Regular,
  design: DesignIdeas20Regular,
  product: Lightbulb20Regular,
  marketing: Megaphone20Regular,
  finance: Money20Regular,
  security: Shield20Regular,
};

export function typeIcon(type: ChallengeType): FluentIcon {
  return TYPE_ICONS[type] ?? Code20Regular;
}

/* ─────────────────────────────── Company ─────────────────────────────── */

type LogoCompany = Pick<Company, 'name' | 'logoColor' | 'logoInitials'>;

export function CompanyLogo({ company, size = 32, className }: { company: LogoCompany | null | undefined; size?: number; className?: string }) {
  if (!company) return <LogoMark size={size} className={className} />;
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-md font-semibold text-white', className)}
      style={{ width: size, height: size, backgroundColor: company.logoColor, fontSize: size >= 40 ? 14 : 12 }}
      aria-hidden
    >
      {company.logoInitials}
    </span>
  );
}

/* ─────────────────────────────── Meta row ─────────────────────────────── */

export function Meta({ icon: Icon, children, className, title }: { icon: FluentIcon; children: ReactNode; className?: string; title?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-caption text-fg3', className)} title={title}>
      <Icon className="shrink-0" aria-hidden />
      {children}
    </span>
  );
}

export function rewardLabel(c: Pick<ChallengeView, 'kind' | 'rewardTotal' | 'reward'>): string {
  if (c.kind === 'practice') return 'Practice';
  if (c.reward.mode === 'none' || c.rewardTotal <= 0) return 'No bounty';
  return money(c.rewardTotal);
}

export function Countdown({ deadline, className }: { deadline: string | null; className?: string }) {
  const now = useNow(30_000);
  if (!deadline) return null;
  const c = countdown(deadline, now);
  const urgent = !c.passed && c.ms < 24 * 3600_000;
  return (
    <Meta icon={Timer16Regular} className={cn(urgent && 'font-semibold text-warning-fg', className)}>
      {c.passed ? 'Closed' : `${c.label} left`}
    </Meta>
  );
}

/** reward · hours · level · spots · time left */
export function ChallengeMeta({ c, level, spots = true, className }: { c: ChallengeView; level?: boolean; spots?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <Meta icon={Money16Regular} className={cn(c.kind === 'live' && c.rewardTotal > 0 && 'font-semibold text-fg1')}>
        {rewardLabel(c)}
      </Meta>
      <Meta icon={Clock16Regular}>~{c.estHours} h</Meta>
      {level ? <Meta icon={TargetArrow16Regular}>{DIFFICULTY_LABEL[c.difficulty]}</Meta> : null}
      {spots && c.kind === 'live' ? (
        <Meta icon={People16Regular}>{c.applicantCap ? `${c.spotsLeft ?? 0} spots left` : `${c.participantCount} joined`}</Meta>
      ) : null}
      {c.kind === 'live' && c.status === 'open' ? <Countdown deadline={c.deadline} /> : null}
    </div>
  );
}

/* ─────────────────────────────── Stats & results ─────────────────────────────── */

export function StatTile({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg bg-bg1 p-4 shadow-4', className)}>
      <div className="text-caption text-fg3">{label}</div>
      <div className="mt-1 text-title3 font-semibold tabular-nums text-fg1">{value}</div>
    </div>
  );
}

export function Placements({ first, second, third }: { first: number; second: number; third: number }) {
  return (
    <span className="flex items-center gap-3">
      {[
        ['1st', first],
        ['2nd', second],
        ['3rd', third],
      ].map(([label, n]) => (
        <span key={label} className="inline-flex items-baseline gap-1">
          {n}
          <span className="text-caption font-normal text-fg3">{label}</span>
        </span>
      ))}
    </span>
  );
}

export function RankBadge({ rank, className }: { rank: number | null; className?: string }) {
  if (!rank) return null;
  return (
    <Badge color={rank === 1 ? 'warning' : 'neutral'} icon={rank <= 3 ? Trophy16Filled : undefined} className={className}>
      {ordinal(rank)}
    </Badge>
  );
}

export function Score({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline gap-0.5 tabular-nums', className)}>
      <span className="text-title3 font-semibold text-fg1">{score}</span>
      <span className="text-caption text-fg3">/100</span>
    </span>
  );
}
