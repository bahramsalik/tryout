import type { ReactNode } from 'react';
import { money } from '@/lib/format';
import { Card, Skeleton, cn } from './ui';

export type StatTone = 'slate' | 'indigo' | 'amber' | 'emerald' | 'violet';

/** Label + value. No count-up, no glow: the number just changes. */
export function StatTile({
  label,
  value,
  format = 'count',
  icon,
  className,
  loading,
  suffix,
}: {
  label: string;
  value: number;
  format?: 'count' | 'money';
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  className?: string;
  loading?: boolean;
  suffix?: ReactNode;
}) {
  return (
    <Card className={cn('p-4', className)}>
      <p className="flex items-center gap-1.5 truncate text-sm text-[var(--colorNeutralForeground3)] [&_svg]:size-4">
        {icon}
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <p className="mt-1 flex items-baseline gap-1.5 text-2xl font-semibold tabular-nums">
          {format === 'money' ? money(value) : value.toLocaleString('en-US')}
          {suffix && <span className="text-sm font-normal text-[var(--colorNeutralForeground3)]">{suffix}</span>}
        </p>
      )}
    </Card>
  );
}
