import { LoaderCircle, RefreshCw, CircleExclamationPoint, type LucideIcon } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';

/* ─────────────────────────────── Button ─────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'success' | 'white';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

const variants: Record<Variant, string> = {
  primary:
    'brand-gradient text-white shadow-[0_6px_16px_-6px_rgb(79_70_229/0.6)] hover:shadow-[0_10px_22px_-8px_rgb(79_70_229/0.7)] hover:brightness-110',
  secondary: 'border border-line bg-white text-ink shadow-sm hover:border-slate-300 hover:bg-slate-50',
  soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  success: 'bg-emerald-500 text-white shadow-[0_6px_16px_-6px_rgb(16_185_129/0.6)] hover:bg-emerald-600',
  white: 'bg-white text-indigo-700 shadow-md hover:bg-indigo-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

export function ButtonLink({ variant = 'primary', size = 'md', icon: Icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...rest}>
      {Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children as ReactNode}
    </Link>
  );
}

/* ─────────────────────────────── Surfaces ─────────────────────────────── */

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line/80 bg-white shadow-soft', className)} {...rest} />;
}

export function SectionTitle({
  children,
  action,
  icon: Icon,
  className,
  sub,
}: {
  children: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
  sub?: ReactNode;
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
          {Icon ? <Icon className="size-[18px] text-indigo-500" aria-hidden /> : null}
          {children}
        </h2>
        {sub ? <p className="mt-0.5 text-sm text-slate-500">{sub}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Pill({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5',
        className,
      )}
      {...rest}
    />
  );
}

/* ─────────────────────────────── States ─────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('size-5 animate-spin text-indigo-500', className)} aria-label="Loading" />;
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
  emoji,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center',
        className,
      )}
    >
      {emoji ? (
        <div className="mb-3 text-3xl" aria-hidden>
          {emoji}
        </div>
      ) : Icon ? (
        <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">
          <Icon className="size-6" aria-hidden />
        </div>
      ) : null}
      <p className="font-semibold text-ink">{title}</p>
      {children ? <div className="mt-1 max-w-sm text-sm text-slate-500">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-8 text-center', className)}
    >
      <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-red-100 text-red-500">
        <CircleExclamationPoint className="size-5" aria-hidden />
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {message ? <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────── Tabs ─────────────────────────────── */

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 no-scrollbar', className)}>
      {items.map((t) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-all',
              active ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink',
            )}
          >
            {Icon ? <Icon className="size-4" aria-hidden /> : null}
            {t.label}
            {t.count !== undefined ? (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-xs tabular-nums leading-5',
                  active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600',
                )}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────── Progress ─────────────────────────────── */

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div className={cn('h-full rounded-full brand-gradient transition-[width] duration-300', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}
