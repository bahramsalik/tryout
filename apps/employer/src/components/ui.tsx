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
import { AlertTriangle, CheckCircle2, Info, X } from '@/components/icons';
import { errorMessage } from '@/lib/api';

/* Fluent 2 primitives built on the tokens in shared/fluent-tokens.css (no @fluentui/react-components). */

export function cn(...classes: (string | false | null | undefined | 0)[]): string {
  return classes.filter(Boolean).join(' ');
}

/* ───────────────────────────── Button ─────────────────────────────
   Appearances: primary · secondary (outline) · subtle (transparent). Sizes: small 24 px, medium 32 px. */

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'success' | 'dark';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const APPEARANCE: Record<'primary' | 'secondary' | 'subtle', string> = {
  primary:
    'border-transparent bg-[var(--colorBrandBackground)] text-[var(--colorNeutralForegroundOnBrand)] hover:bg-[var(--colorBrandBackgroundHover)] active:bg-[var(--colorBrandBackgroundPressed)]',
  secondary:
    'border-[var(--colorNeutralStroke1)] bg-[var(--colorNeutralBackground1)] text-[var(--colorNeutralForeground1)] hover:border-[var(--colorNeutralStroke1Hover)] hover:bg-[var(--colorNeutralBackground1Hover)] active:bg-[var(--colorNeutralBackground1Pressed)]',
  subtle:
    'border-transparent bg-transparent text-[var(--colorNeutralForeground2)] hover:bg-[var(--colorNeutralBackground1Hover)] hover:text-[var(--colorNeutralForeground2Hover)] active:bg-[var(--colorNeutralBackground1Pressed)]',
};

const appearanceOf = (v: ButtonVariant) =>
  v === 'secondary' ? 'secondary' : v === 'subtle' || v === 'ghost' ? 'subtle' : 'primary';

const DISABLED =
  'disabled:border-[var(--colorNeutralStrokeDisabled)] disabled:bg-[var(--colorNeutralBackgroundDisabled)] disabled:text-[var(--colorNeutralForegroundDisabled)] aria-disabled:pointer-events-none';

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra?: string) {
  const a = appearanceOf(variant);
  const small = size === 'xs' || size === 'sm';
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--borderRadiusMedium)] border font-semibold whitespace-nowrap select-none',
    'transition-colors duration-[var(--durationNormal)] ease-[var(--curveEasyEase)]',
    small ? 'h-6 min-w-12 px-2 text-xs' : 'h-8 min-w-16 px-3 text-sm',
    APPEARANCE[a],
    a === 'subtle' ? 'disabled:bg-transparent disabled:text-[var(--colorNeutralForegroundDisabled)]' : DISABLED,
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
      {loading ? <Spinner className="size-4" /> : icon}
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

/** Icon-only subtle button (32 px, or 24 px small). */
export function IconButton({
  label,
  className,
  children,
  variant = 'subtle',
  size = 'md',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: ButtonVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[var(--borderRadiusMedium)] border transition-colors',
        size === 'sm' ? 'size-6' : 'size-8',
        APPEARANCE[appearanceOf(variant)],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Card ───────────────────────────── */

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[var(--borderRadiusXLarge)] bg-[var(--colorNeutralBackground1)] shadow-[var(--shadow4)]', className)}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  actions,
  className,
  icon,
}: {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 pb-2', className)}>
      {icon && <span className="text-[var(--colorNeutralForeground3)]">{icon}</span>}
      <h2 className="min-w-0 flex-1 truncate text-[length:16px] leading-[22px] font-semibold">{title}</h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ───────────────────────────── Badge ─────────────────────────────
   Fluent Badge, tint appearance: 20 px, circular. */

export type BadgeTone = 'slate' | 'indigo' | 'emerald' | 'amber' | 'red' | 'violet' | 'sky';

const BADGE_TONES: Record<BadgeTone, string> = {
  slate: 'bg-[var(--colorNeutralBackground4)] text-[var(--colorNeutralForeground2)] border-[var(--colorNeutralStroke2)]',
  indigo: 'bg-[var(--colorBrandBackground2)] text-[var(--colorBrandForeground2)] border-[var(--colorBrandStroke2)]',
  violet: 'bg-[var(--colorBrandBackground2)] text-[var(--colorBrandForeground2)] border-[var(--colorBrandStroke2)]',
  sky: 'bg-[var(--colorBrandBackground2)] text-[var(--colorBrandForeground2)] border-[var(--colorBrandStroke2)]',
  emerald:
    'bg-[var(--colorStatusSuccessBackground1)] text-[var(--colorStatusSuccessForeground1)] border-[var(--colorStatusSuccessBorder1)]',
  amber:
    'bg-[var(--colorStatusWarningBackground1)] text-[var(--colorStatusWarningForeground1)] border-[var(--colorStatusWarningBorder1)]',
  red: 'bg-[var(--colorStatusDangerBackground1)] text-[var(--colorStatusDangerForeground1)] border-[var(--colorStatusDangerBorder1)]',
};

export function Badge({
  tone = 'slate',
  className,
  children,
  icon,
  title,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  dot?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-[var(--borderRadiusCircular)] border px-2 text-xs font-semibold whitespace-nowrap [&_svg]:size-3',
        BADGE_TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ───────────────────────────── Status / feedback ───────────────────────────── */

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden />;
}

/** Fluent Spinner (ring). */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="progressbar"
      aria-label="Loading"
      className={cn(
        'inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--colorBrandStroke2)] border-t-[var(--colorBrandStroke1)]',
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
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
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-12', className)}>
      {icon && <div className="mb-2 text-[var(--colorNeutralForeground3)] [&_svg]:size-6">{icon}</div>}
      <p className="text-sm text-[var(--colorNeutralForeground2)]">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
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
    <div className={cn(compact ? 'p-3' : 'p-4', className)}>
      <MessageBar
        intent="error"
        action={
          onRetry && (
            <Button size="sm" variant="subtle" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {errorMessage(error)}
      </MessageBar>
    </div>
  );
}

/** Fluent MessageBar: one line, intent icon, optional action and dismiss. */
export function MessageBar({
  intent = 'info',
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  intent?: 'info' | 'success' | 'warning' | 'error';
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const styles = {
    info: 'bg-[var(--colorNeutralBackground3)] border-[var(--colorNeutralStroke2)] [--mb-icon:var(--colorNeutralForeground3)]',
    success:
      'bg-[var(--colorStatusSuccessBackground1)] border-[var(--colorStatusSuccessBorder1)] [--mb-icon:var(--colorStatusSuccessForeground1)]',
    warning:
      'bg-[var(--colorStatusWarningBackground1)] border-[var(--colorStatusWarningBorder1)] [--mb-icon:var(--colorStatusWarningForeground1)]',
    error:
      'bg-[var(--colorStatusDangerBackground1)] border-[var(--colorStatusDangerBorder1)] [--mb-icon:var(--colorStatusDangerForeground1)]',
  }[intent];
  const Icon = intent === 'success' ? CheckCircle2 : intent === 'info' ? Info : AlertTriangle;
  return (
    <div
      role={intent === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex min-h-9 items-center gap-2 rounded-[var(--borderRadiusMedium)] border px-3 py-1.5 text-sm text-[var(--colorNeutralForeground1)]',
        styles,
        className,
      )}
    >
      <Icon className="size-4 shrink-0 text-[var(--mb-icon)]" aria-hidden />
      <span className="min-w-0 flex-1">
        {title && <span className="font-semibold">{title} </span>}
        {children}
      </span>
      {action}
      {onDismiss && (
        <IconButton label="Dismiss" size="sm" onClick={onDismiss}>
          <X className="size-4" />
        </IconButton>
      )}
    </div>
  );
}

/** Error line inside dialogs (toasts render beneath native <dialog> backdrops). */
export function InlineError({ error, className }: { error: unknown; className?: string }) {
  if (!error) return null;
  return (
    <MessageBar intent="error" className={className}>
      {errorMessage(error)}
    </MessageBar>
  );
}

/* ───────────────────────────── Field + inputs ─────────────────────────────
   Label above, control, then a validation message only when invalid. Counter for hard limits. */

export function Field({
  label,
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
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-[var(--colorNeutralForeground1)]">
          {label}
          {optional && <span className="ml-1 font-normal text-[var(--colorNeutralForeground3)]">(optional)</span>}
        </label>
        {counter && <span className="text-xs text-[var(--colorNeutralForeground3)] tabular-nums">{counter}</span>}
      </div>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--colorStatusDangerForeground1)]">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

/* Fluent input: 32 px, 1px stroke with an accessible bottom stroke and a brand accent on focus. */
const controlBase = cn(
  'block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke1)] border-b-[var(--colorNeutralStrokeAccessible)]',
  'bg-[var(--colorNeutralBackground1)] text-sm text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground4)]',
  'hover:border-[var(--colorNeutralStroke1Hover)] hover:border-b-[var(--colorNeutralForeground3)]',
  'focus:border-b-2 focus:border-b-[var(--colorBrandStroke1)] focus:outline-none',
  'disabled:border-[var(--colorNeutralStrokeDisabled)] disabled:bg-[var(--colorNeutralBackgroundDisabled)] disabled:text-[var(--colorNeutralForegroundDisabled)]',
);
const invalidCls = 'border-b-2 border-b-[var(--colorStatusDangerBackground3)]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(controlBase, 'h-8 px-2.5', invalid && invalidCls, className)}
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
      className={cn(controlBase, 'px-2.5 py-1.5', invalid && invalidCls, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const selectClass = cn(controlBase, 'h-8 px-2 pr-7');

/** Fluent Switch: 40×20 track, 14 px thumb. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
  showLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  showLabel?: boolean;
}) {
  const btn = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-10 shrink-0 items-center rounded-[var(--borderRadiusCircular)] border transition-colors disabled:opacity-50',
        checked
          ? 'border-transparent bg-[var(--colorBrandBackground)] hover:bg-[var(--colorBrandBackgroundHover)]'
          : 'border-[var(--colorNeutralStrokeAccessible)] bg-[var(--colorNeutralBackground1)]',
      )}
    >
      <span
        className={cn(
          'inline-block size-3.5 rounded-full transition-transform duration-[var(--durationNormal)]',
          checked ? 'translate-x-[22px] bg-[var(--colorNeutralForegroundOnBrand)]' : 'translate-x-[2px] bg-[var(--colorNeutralForeground3)]',
        )}
      />
    </button>
  );
  if (!showLabel) return btn;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--colorNeutralForeground1)]">
      {btn}
      {label}
    </label>
  );
}

/** Fluent toggle button (used for the single "To review" filter). */
export function ToggleButton({
  pressed,
  onChange,
  children,
  icon,
}: {
  pressed: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={cn(
        buttonClass('secondary', 'md'),
        pressed &&
          'border-[var(--colorNeutralStroke1)] bg-[var(--colorNeutralBackground1Selected)] hover:bg-[var(--colorNeutralBackground1Selected)]',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Segmented choice rendered as a Fluent TabList (underline indicator). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
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
    <TabList
      label={label}
      value={value}
      onChange={onChange}
      items={options.map((o) => ({ value: o.value, label: o.label, count: o.count }))}
      className={className}
    />
  );
}

/** Fluent TabList: 44 px tabs, 3 px brand underline on the selected tab. */
export function TabList<T extends string>({
  value,
  onChange,
  items,
  className,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: ReactNode; count?: number | null; icon?: ReactNode }[];
  className?: string;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('scrollbar-thin flex overflow-x-auto', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'group relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[var(--borderRadiusMedium)] px-2.5 text-sm transition-colors hover:bg-[var(--colorNeutralBackground1Hover)]',
              active ? 'font-semibold text-[var(--colorNeutralForeground1)]' : 'text-[var(--colorNeutralForeground2)]',
            )}
          >
            {item.icon}
            {item.label}
            {item.count != null && <span className="text-[var(--colorNeutralForeground3)] tabular-nums">{item.count}</span>}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-2.5 bottom-0 h-[3px] rounded-[var(--borderRadiusCircular)]',
                active ? 'bg-[var(--colorBrandStroke1)]' : 'group-hover:bg-[var(--colorNeutralStroke1Hover)]',
              )}
            />
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
    indigo: 'bg-[var(--colorBrandBackground)]',
    emerald: 'bg-[var(--colorStatusSuccessBackground3)]',
    amber: 'bg-[var(--colorStatusWarningBackground3)]',
    red: 'bg-[var(--colorStatusDangerBackground3)]',
    slate: 'bg-[var(--colorNeutralForeground4)]',
  }[tone];
  return (
    <div
      className={cn('h-0.5 w-full overflow-hidden rounded-full bg-[var(--colorNeutralBackground6)]', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-[width]', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function useStableId(prefix: string) {
  return `${prefix}-${useId().replace(/:/g, '')}`;
}

/** Page header: title + at most one meta line. */
export function PageHeader({
  title,
  meta,
  actions,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-[var(--colorNeutralForeground1)]">{title}</h1>
        {meta && <div className="mt-1 text-sm text-[var(--colorNeutralForeground3)]">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
