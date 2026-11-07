import {
  CheckmarkCircle20Filled,
  Dismiss20Regular,
  ErrorCircle12Filled,
  ErrorCircle20Filled,
  Info20Filled,
  Warning20Filled,
  type FluentIcon,
} from '@fluentui/react-icons';
import {
  forwardRef,
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';

/* Fluent 2 primitives built on the tokens in shared/fluent-tokens.css. */

/* ─────────────────────────────── Button ─────────────────────────────── */

export type Appearance = 'primary' | 'secondary' | 'subtle';
type Size = 'small' | 'medium' | 'large';

const base =
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-semibold transition-colors duration-100 disabled:cursor-not-allowed aria-disabled:pointer-events-none';

const appearances: Record<Appearance, string> = {
  primary:
    'border-transparent bg-brand text-white hover:bg-brand-hover active:bg-brand-pressed disabled:bg-bg4 disabled:text-fg-disabled',
  secondary:
    'border-stroke1 bg-bg1 text-fg1 hover:border-stroke1-hover hover:bg-bg1-hover active:bg-bg1-pressed disabled:border-stroke2 disabled:text-fg-disabled disabled:hover:bg-bg1',
  subtle: 'border-transparent bg-transparent text-fg2 hover:bg-bg1-hover hover:text-fg1 active:bg-bg1-pressed disabled:text-fg-disabled',
};

const sizes: Record<Size, string> = {
  small: 'h-6 min-w-16 px-2 text-caption',
  medium: 'h-8 min-w-24 px-3 text-body',
  large: 'h-10 min-w-24 px-4 text-subtitle2',
};

export function buttonClass(appearance: Appearance = 'secondary', size: Size = 'medium', className?: string) {
  return cn(base, appearances[appearance], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: Appearance;
  size?: Size;
  loading?: boolean;
  icon?: FluentIcon;
  /** Icon-only button (square). */
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { appearance = 'secondary', size = 'medium', loading, icon: Icon, iconOnly, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(appearance, size, cn(iconOnly && 'min-w-0 px-0', iconOnly && (size === 'small' ? 'w-6' : size === 'large' ? 'w-10' : 'w-8'), className))}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={16} inverted={appearance === 'primary'} /> : Icon ? <Icon aria-hidden /> : null}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  appearance?: Appearance;
  size?: Size;
  icon?: FluentIcon;
}

export function ButtonLink({ appearance = 'secondary', size = 'medium', icon: Icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(appearance, size, typeof className === 'string' ? className : undefined)} {...rest}>
      {Icon ? <Icon aria-hidden /> : null}
      {children as ReactNode}
    </Link>
  );
}

export function AnchorButton({
  appearance = 'secondary',
  size = 'medium',
  icon: Icon,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { appearance?: Appearance; size?: Size; icon?: FluentIcon }) {
  return (
    <a className={buttonClass(appearance, size, className)} {...rest}>
      {Icon ? <Icon aria-hidden /> : null}
      {children}
    </a>
  );
}

/* ─────────────────────────────── Card ─────────────────────────────── */

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg bg-bg1 shadow-4', className)} {...rest} />;
}

/** Section header: a noun, nothing under it. */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-subtitle2 font-semibold text-fg1">{children}</h2>
      {action}
    </div>
  );
}

/** Page header: a title and at most one meta line of numbers. */
export function PageHeader({ title, meta, action }: { title: ReactNode; meta?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-title2 font-semibold text-fg1">{title}</h1>
        {meta ? <p className="mt-1 text-body text-fg3">{meta}</p> : null}
      </div>
      {action}
    </header>
  );
}

/* ─────────────────────────────── Badge ─────────────────────────────── */

type BadgeColor = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

const badgeTint: Record<BadgeColor, string> = {
  brand: 'bg-brand-bg2 text-brand-fg2 border-brand-stroke2',
  neutral: 'bg-bg3 text-fg2 border-stroke2',
  success: 'bg-success-bg text-success-fg border-success-border',
  warning: 'bg-warning-bg text-warning-fg border-warning-border',
  danger: 'bg-danger-bg text-danger-fg border-danger-border',
};

const badgeFilled: Record<BadgeColor, string> = {
  brand: 'bg-brand text-white border-transparent',
  neutral: 'bg-fg3 text-white border-transparent',
  success: 'bg-success text-white border-transparent',
  warning: 'bg-warning text-white border-transparent',
  danger: 'bg-danger text-white border-transparent',
};

export function Badge({
  color = 'neutral',
  appearance = 'tint',
  icon: Icon,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { color?: BadgeColor; appearance?: 'tint' | 'filled'; icon?: FluentIcon }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-caption font-semibold',
        appearance === 'filled' ? badgeFilled[color] : badgeTint[color],
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon aria-hidden /> : null}
      {children}
    </span>
  );
}

/* ─────────────────────────────── TabList ─────────────────────────────── */

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function TabList<T extends string>({
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
    <div role="tablist" aria-label={ariaLabel} className={cn('flex gap-1 overflow-x-auto no-scrollbar', className)}>
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'group relative flex h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-body transition-colors',
              active ? 'font-semibold text-fg1' : 'text-fg2 hover:bg-bg1-hover hover:text-fg1',
            )}
          >
            {t.label}
            {t.count !== undefined ? <span className={cn('tabular-nums', active ? 'text-fg2' : 'text-fg3')}>{t.count}</span> : null}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-colors',
                active ? 'bg-brand' : 'bg-transparent group-hover:bg-stroke1',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────── Field / inputs ─────────────────────────────── */

export function Field({
  label,
  htmlFor,
  optional,
  counter,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  /** Hard-limit counter, e.g. "42/140". */
  counter?: ReactNode;
  /** Validation message, shown only when invalid. */
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-body font-semibold text-fg1">
          {label}
          {optional ? <span className="ml-1 font-normal text-fg3">(optional)</span> : null}
        </label>
        {counter ? <span className="text-caption tabular-nums text-fg3">{counter}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-caption text-danger-fg" role="alert">
          <ErrorCircle12Filled aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
}

const inputBase =
  'w-full rounded-md border border-stroke1 border-b-stroke-accessible bg-bg1 px-2.5 text-body text-fg1 outline-none transition-colors placeholder:text-fg4 hover:border-stroke1-hover hover:border-b-fg2 focus:border-b-2 focus:border-b-brand disabled:bg-bg3 disabled:text-fg-disabled';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, 'h-8', invalid && 'border-b-danger', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, 'resize-y py-1.5', invalid && 'border-b-danger', className)} {...rest} />
  );
});

/* ─────────────────────────────── MessageBar ─────────────────────────────── */

type Intent = 'info' | 'success' | 'warning' | 'error';

const intentStyle: Record<Intent, { box: string; icon: FluentIcon; iconClass: string }> = {
  info: { box: 'bg-bg3 border-stroke2', icon: Info20Filled, iconClass: 'text-fg3' },
  success: { box: 'bg-success-bg border-success-border', icon: CheckmarkCircle20Filled, iconClass: 'text-success' },
  warning: { box: 'bg-warning-bg border-warning-border', icon: Warning20Filled, iconClass: 'text-warning-fg' },
  error: { box: 'bg-danger-bg border-danger-border', icon: ErrorCircle20Filled, iconClass: 'text-danger' },
};

export function MessageBar({
  intent = 'info',
  title,
  children,
  actions,
  icon,
  className,
}: {
  intent?: Intent;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const s = intentStyle[intent];
  const Icon = s.icon;
  return (
    <div
      role={intent === 'error' ? 'alert' : 'status'}
      className={cn('flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2', s.box, className)}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {icon ?? <Icon className={cn('shrink-0', s.iconClass)} aria-hidden />}
        <span className="min-w-0 text-body text-fg1">
          {title ? <span className="font-semibold">{title}</span> : null}
          {title && children ? ' ' : null}
          {children}
        </span>
      </span>
      {actions ? <span className="flex shrink-0 items-center gap-2">{actions}</span> : null}
    </div>
  );
}

/* ─────────────────────────────── Avatar ─────────────────────────────── */

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length === 0 ? '?' : parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full bg-brand-bg2 font-semibold text-brand-fg2', className)}
      style={{ width: size, height: size, fontSize: size <= 32 ? 12 : size <= 48 ? 16 : 28 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ─────────────────────────────── Drawer (Dialog surface) ─────────────────────────────── */

export function OverlayDrawer({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const last = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      last?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col bg-bg1 shadow-64"
      >
        {children}
      </div>
    </>
  );
}

export function DrawerHeader({ title, badge, onClose, actions }: { title: string; badge?: ReactNode; onClose: () => void; actions?: ReactNode }) {
  return (
    <header className="flex items-center gap-2 px-6 pb-3 pt-5">
      <h2 className="text-subtitle1 font-semibold text-fg1">{title}</h2>
      {badge}
      <span className="ml-auto flex items-center gap-1">
        {actions}
        <Button appearance="subtle" iconOnly icon={Dismiss20Regular} onClick={onClose} aria-label="Close" />
      </span>
    </header>
  );
}

/* ─────────────────────────────── States ─────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-bg4', className)} />;
}

export function Spinner({ size = 20, inverted, className }: { size?: number; inverted?: boolean; className?: string }) {
  return (
    <span
      role="progressbar"
      aria-label="Loading"
      className={cn('inline-block shrink-0 animate-spin rounded-full border-2', inverted ? 'border-white/40 border-t-white' : 'border-brand-stroke2 border-t-brand', className)}
      style={{ width: size, height: size }}
    />
  );
}

/** One short line + at most one button. */
export function EmptyState({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stroke1 px-6 py-10 text-center', className)}>
      <p className="text-body text-fg2">{title}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = "Couldn't load this", message, onRetry, className }: { title?: string; message?: string; onRetry?: () => void; className?: string }) {
  return (
    <MessageBar
      intent="error"
      title={title}
      className={className}
      actions={
        onRetry ? (
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </MessageBar>
  );
}

/* ─────────────────────────────── Progress ─────────────────────────────── */

export function ProgressBar({ value, className, color = 'brand' }: { value: number; className?: string; color?: 'brand' | 'success' }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div
      className={cn('h-0.5 w-full overflow-hidden rounded-full bg-bg5', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div className={cn('h-full rounded-full transition-[width]', color === 'success' ? 'bg-success' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  );
}

