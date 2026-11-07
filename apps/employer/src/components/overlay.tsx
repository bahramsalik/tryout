import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from './ui';

/* ───────────────────────────── Dialog (native <dialog>) ───────────────────────────── */

export function Dialog({
  open,
  onClose,
  children,
  width = '32rem',
  dismissible = true,
  labelledBy,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  dismissible?: boolean;
  labelledBy?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="tryout-dialog"
      style={{ '--dialog-w': width } as CSSProperties}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === ref.current;
      }}
      onClick={(e) => {
        if (dismissible && downOnBackdrop.current && e.target === ref.current) onClose();
        downOnBackdrop.current = false;
      }}
    >
      {open && (
        <div
          className={cn(
            'dialog-panel flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-slate-900/5',
            className,
          )}
        >
          {children}
        </div>
      )}
    </dialog>
  );
}

export function DialogHeader({
  title,
  subtitle,
  onClose,
  id,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  id?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
      {icon}
      <div className="min-w-0 flex-1">
        <h2 id={id} className="text-base font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="-mt-1 -mr-2 inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-4', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3', className)}>
      {children}
    </div>
  );
}

/* ───────────────────────────── Popover / menu ───────────────────────────── */

type Placement = 'bottom-end' | 'bottom-start' | 'right-start' | 'right-end' | 'top-start';

const PLACEMENT: Record<Placement, string> = {
  'bottom-end': 'right-0 top-full mt-2 origin-top-right',
  'bottom-start': 'left-0 top-full mt-2 origin-top-left',
  'right-start': 'left-full top-0 ml-2 origin-top-left',
  'right-end': 'left-full bottom-0 ml-2 origin-bottom-left',
  'top-start': 'left-0 bottom-full mb-2 origin-bottom-left',
};

export function Popover({
  trigger,
  children,
  placement = 'bottom-end',
  className,
  panelClassName,
  onOpenChange,
}: {
  trigger: (props: { open: boolean; toggle: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => ReactNode;
  children: (close: () => void) => ReactNode;
  placement?: Placement;
  className?: string;
  panelClassName?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    onOpenChangeRef.current?.(open);
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 animate-pop-in rounded-xl bg-white p-1 shadow-pop ring-1 ring-slate-900/10',
            PLACEMENT[placement],
            panelClassName,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onSelect,
  icon,
  danger,
  active,
  className,
  hint,
}: {
  children: ReactNode;
  onSelect: () => void;
  icon?: ReactNode;
  danger?: boolean;
  active?: boolean;
  className?: string;
  hint?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100',
        active && 'bg-slate-100',
        className,
      )}
    >
      {icon && <span className={cn('shrink-0', danger ? 'text-red-500' : 'text-slate-400')}>{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {hint}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-slate-100" role="separator" />;
}

/* ───────────────────────────── Tabs ───────────────────────────── */

export function Tabs<T extends string>({
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
    <div
      role="tablist"
      aria-label={label}
      className={cn('scrollbar-thin flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200', className)}
    >
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
              'relative -mb-px inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px] font-semibold transition-colors',
              active ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
            )}
          >
            {item.icon}
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums',
                  active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
