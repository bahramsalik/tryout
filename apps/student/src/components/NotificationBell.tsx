import { Alert20Regular } from '@fluentui/react-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Notification } from '@shared/types';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/lib/queries';
import { useDismiss } from '@/lib/useDismiss';
import { useNow } from '@/lib/useNow';
import { Button, Skeleton } from './ui';

function NotificationRow({ n, onOpen, now }: { n: Notification; onOpen: (n: Notification) => void; now: number }) {
  return (
    <button onClick={() => onOpen(n)} className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-bg1-hover">
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand')} aria-label={n.read ? undefined : 'Unread'} />
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-fg1">{n.title}</span>
        <span className="block truncate text-caption text-fg2">{n.body}</span>
      </span>
      <span className="shrink-0 text-caption text-fg3">{timeAgo(n.createdAt, now)}</span>
    </button>
  );
}

export function NotificationBell() {
  const q = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const navigate = useNavigate();
  const now = useNow(30_000);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const list = q.data ?? [];
  const unread = list.filter((n) => !n.read).length;

  // Opening the flyout marks everything read after a moment.
  const { mutate: markAllRead } = markAll;
  useEffect(() => {
    if (!open || unread === 0) return;
    const t = window.setTimeout(() => markAllRead(), 2500);
    return () => window.clearTimeout(t);
  }, [open, unread, markAllRead]);

  const onOpen = (n: Notification) => {
    if (!n.read) markOne.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        appearance="subtle"
        iconOnly
        icon={Alert20Regular}
        onClick={() => setOpen((v) => !v)}
        className={cn('relative', open && 'bg-bg1-selected')}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
      >
        {unread > 0 ? (
          <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-10 z-50 w-[min(360px,calc(100vw-24px))] rounded-lg bg-bg1 shadow-16">
          <div className="px-4 pb-2 pt-3 text-subtitle2 font-semibold text-fg1">Notifications</div>
          <div className="max-h-[min(420px,70vh)] overflow-y-auto px-1 pb-2">
            {q.isLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : q.isError ? (
              <p className="px-3 py-6 text-center text-body text-fg3">Couldn't load notifications</p>
            ) : list.length === 0 ? (
              <p className="px-3 py-6 text-center text-body text-fg3">No notifications</p>
            ) : (
              list.slice(0, 20).map((n) => <NotificationRow key={n.id} n={n} onOpen={onOpen} now={now} />)
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
