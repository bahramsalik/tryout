import type { ReactNode } from 'react';
import { useCountUp } from '@/lib/hooks';
import { money } from '@/lib/format';
import { Skeleton, cn } from './ui';

export type StatTone = 'slate' | 'indigo' | 'amber' | 'emerald' | 'violet';

const TONES: Record<StatTone, { icon: string; value: string }> = {
  slate: { icon: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600', value: 'text-slate-900' },
  amber: { icon: 'bg-amber-50 text-amber-600', value: 'text-amber-700' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700' },
  violet: { icon: 'bg-violet-50 text-violet-600', value: 'text-slate-900' },
};

export function StatTile({
  label,
  value,
  format = 'count',
  sub,
  icon,
  tone = 'slate',
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
  const { display, bumped } = useCountUp(value, !loading);
  const t = TONES[tone];
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-white p-4 shadow-card transition-[border-color,box-shadow] duration-500',
        bumped ? 'border-emerald-300 ring-4 ring-emerald-100' : 'border-slate-200',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        {icon && <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', t.icon)}>{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className={cn('mt-1.5 flex items-baseline gap-1.5 text-2xl font-bold tracking-tight tabular-nums', t.value)}>
          <span className={cn('inline-block transition-transform duration-300', bumped && 'scale-110')}>
            {format === 'money' ? money(display) : display.toLocaleString('en-US')}
          </span>
          {suffix && <span className="text-xs font-medium tracking-normal text-slate-500">{suffix}</span>}
        </p>
      )}
      {sub && <div className="mt-1 truncate text-xs text-slate-500">{loading ? <Skeleton className="h-3 w-24" /> : sub}</div>}
    </div>
  );
}
