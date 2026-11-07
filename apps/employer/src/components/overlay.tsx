import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { X } from '@/components/icons';
import { IconButton, TabList, cn } from './ui';

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
            'dialog-panel flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[var(--borderRadiusXLarge)] bg-[var(--colorNeutralBackground1)] shadow-[var(--shadow64)]',
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
  onClose,
  id,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  id?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-6 pt-6 pb-2">
      <h2 id={id} className="min-w-0 flex-1 text-xl font-semibold text-[var(--colorNeutralForeground1)]">
        {title}
      </h2>
      {onClose && (
        <IconButton label="Close" onClick={onClose} className="-mt-0.5 -mr-2">
          <X className="size-5" />
        </IconButton>
      )}
    </div>
  );
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-2', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center justify-end gap-2 px-6 pt-4 pb-6', className)}>{children}</div>;
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
            'absolute z-50 rounded-[var(--borderRadiusMedium)] bg-[var(--colorNeutralBackground1)] p-1 shadow-[var(--shadow16)]',
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
        'flex min-h-8 w-full items-center gap-2 rounded-[var(--borderRadiusMedium)] px-2 py-1.5 text-left text-sm transition-colors',
        'text-[var(--colorNeutralForeground2)] hover:bg-[var(--colorNeutralBackground1Hover)] hover:text-[var(--colorNeutralForeground1)]',
        active && 'bg-slate-100',
        className,
      )}
    >
      {icon && <span className={cn('shrink-0', 'text-[var(--colorNeutralForeground3)]')}>{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {hint}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-slate-100" role="separator" />;
}

/** TabList alias (Fluent underline tabs). */
export const Tabs = TabList;
