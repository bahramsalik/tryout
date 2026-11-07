import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Link, type LinkProps } from 'react-router';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { errorMessage } from '@/lib/api';

export function cn(...classes: (string | false | null | undefined | 0)[]): string {
  return classes.filter(Boolean).join(' ');
}

/* ───────────────────────────── Button ───────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'dark' | 'subtle';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 disabled:shadow-none',
  secondary:
    'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 shadow-sm hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400 disabled:ring-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 disabled:text-slate-300',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:text-slate-400',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
  success:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-300 disabled:shadow-none',
  dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-400',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, iconRight, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode; iconRight?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  variant = 'ghost',
  size = 'md',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: ButtonVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors',
        size === 'sm' ? 'size-8' : 'size-9',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Surfaces ───────────────────────────── */

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-slate-200 bg-white shadow-card', className)} {...rest} />;
}

export function CardHeader({
  title,
  subtitle,
  actions,
  className,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-3', className)}>
      {icon && <span className="text-slate-400">{icon}</span>}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export type BadgeTone = 'slate' | 'indigo' | 'emerald' | 'amber' | 'red' | 'violet' | 'sky';

const BADGE_TONES: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export function Badge({
  tone = 'slate',
  className,
  children,
  icon,
  dot,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset',
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {icon}
      {children}
    </span>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin text-slate-400', className)} aria-label="Loading" />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      {icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = 'Couldn’t load this',
  className,
  compact,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-slate-500">{errorMessage(error)}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" icon={<RefreshCw className="size-3.5" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ───────────────────────────── Form controls ───────────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  optional,
  counter,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  optional?: boolean;
  counter?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-slate-800">
          {label}
          {optional && <span className="ml-1.5 text-xs font-normal text-slate-400">Optional</span>}
        </label>
        {counter && <span className="text-xs text-slate-400 tabular-nums">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const controlBase =
  'block w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50 disabled:text-slate-500';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          controlBase,
          'h-9 px-3',
          invalid ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        controlBase,
        'px-3 py-2 leading-relaxed',
        invalid ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-primary' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white shadow transition-transform',
          size === 'sm' ? 'size-4' : 'size-5',
          checked ? (size === 'sm' ? 'translate-x-4.5' : 'translate-x-5.5') : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: string;
  size?: 'sm' | 'md';
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-lg bg-slate-100 p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {o.label}
            {o.count != null && (
              <span className={cn('tabular-nums', active ? 'text-slate-500' : 'text-slate-400')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  tone = 'indigo',
  className,
  label,
}: {
  value: number;
  max: number;
  tone?: 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const color = {
    indigo: 'bg-primary',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-slate-400',
  }[tone];
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function useStableId(prefix: string) {
  return `${prefix}-${useId().replace(/:/g, '')}`;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-300 bg-white px-1 font-sans text-[10px] font-semibold text-slate-500 shadow-[0_1px_0_#cbd5e1]">
      {children}
    </kbd>
  );
}

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label="Working">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-current animate-bounce-dot"
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );
}

/** Error line for inside modals (toasts render beneath native <dialog> backdrops). */
export function InlineError({ error, className }: { error: unknown; className?: string }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className={cn('flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200', className)}
    >
      <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
      {errorMessage(error)}
    </p>
  );
}
