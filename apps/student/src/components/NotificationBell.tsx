import { Award, Bell, BellRing, CheckCheck, Inbox, Mail, MessageSquareText, Sparkles, Trophy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Notification, NotificationKind } from '@shared/types';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { useMarkAllRead, useNotifications } from '@/lib/queries';
import { useDismiss } from '@/lib/useDismiss';
import { useNow } from '@/lib/useNow';
import { Skeleton } from './ui';

const KIND_META: Partial<Record<NotificationKind, { icon: typeof Bell; className: string }>> = {
  new_challenge: { icon: Sparkles, className: 'bg-violet-50 text-violet-600' },
  results: { icon: MessageSquareText, className: 'bg-sky-50 text-sky-600' },
  awarded: { icon: Trophy, className: 'bg-amber-50 text-amber-600' },
  interview: { icon: Mail, className: 'bg-emerald-50 text-emerald-600' },
  coach_review: { icon: Award, className: 'bg-indigo-50 text-indigo-600' },
};

export function NotificationIcon({ kind, className }: { kind: NotificationKind; className?: string }) {
  const meta = KIND_META[kind] ?? { icon: Bell, className: 'bg-slate-100 text-slate-500' };
  const Icon = meta.icon;
  return (
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', meta.className, className)}>
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

export function NotificationRow({ n, onOpen, now }: { n: Notification; onOpen: (n: Notification) => void; now: number }) {
  return (
    <button
      onClick={() => onOpen(n)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50',
        !n.read && 'bg-indigo-50/50 hover:bg-indigo-50',
      )}
    >
      <NotificationIcon kind={n.kind} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-semibold leading-snug text-ink">{n.title}</span>
          {!n.read ? <span className="mt-1 size-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" /> : null}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">{n.body}</span>
        <span className="mt-1 block text-[11px] font-medium text-slate-400">{timeAgo(n.createdAt, now)}</span>
      </span>
    </button>
  );
}

export function NotificationBell() {
  const q = useNotifications();
  const markAll = useMarkAllRead();
  const navigate = useNavigate();
  const now = useNow(30_000);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const list = q.data ?? [];
  const unread = list.filter((n) => !n.read).length;

  // Let the user see what's new, then mark everything read.
  const { mutate: markAllRead } = markAll;
  useEffect(() => {
    if (!open || unread === 0) return;
    const t = window.setTimeout(() => markAllRead(), 2500);
    return () => window.clearTimeout(t);
  }, [open, unread, markAllRead]);

  // Ring briefly when a new unread notification lands.
  const [ring, setRing] = useState(false);
  const prevUnread = useRef(unread);
  useEffect(() => {
    if (unread > prevUnread.current) {
      setRing(true);
      const t = window.setTimeout(() => setRing(false), 1600);
      prevUnread.current = unread;
      return () => window.clearTimeout(t);
    }
    prevUnread.current = unread;
  }, [unread]);

  const onOpen = (n: Notification) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-ink',
          open && 'bg-slate-100 text-ink',
        )}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
      >
        {ring ? <BellRing className="size-5 animate-wiggle text-indigo-600" /> : <Bell className="size-5" />}
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-[18px] animate-pop-in place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-24px))] animate-pop-in overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="font-bold text-ink">Notifications</div>
            <button
              onClick={() => markAll.mutate()}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <CheckCheck className="size-3.5" aria-hidden /> Mark all read
            </button>
          </div>
          <div className="max-h-[min(460px,70vh)] overflow-y-auto p-1.5">
            {q.isLoading ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : q.isError ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Couldn't load notifications.</div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <Inbox className="mb-2 size-8 text-slate-300" aria-hidden />
                <div className="text-sm font-semibold text-ink">You're all caught up</div>
                <div className="text-xs text-slate-500">New challenges, results and invites show up here.</div>
              </div>
            ) : (
              list.slice(0, 20).map((n) => <NotificationRow key={n.id} n={n} onOpen={onOpen} now={now} />)
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
