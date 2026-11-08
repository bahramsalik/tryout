import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import {
  Bell,
  BellOff,
  Inbox,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
} from '@/components/icons';
import type { Notification, NotificationKind } from '@shared/types';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { qk, queryClient, useNotifications } from '@/lib/queries';
import { clearBlind, useSidebar } from '@/lib/stores';
import { Dialog, DialogBody, DialogFooter, DialogHeader, MenuItem, Popover } from '../overlay';
import { Button, ButtonLink, InlineError, Skeleton, cn } from '../ui';
import { SidebarToggle } from './Sidebar';

export function TopBar() {
  const [sidebarOpen] = useSidebar();
  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-1 border-b border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-3 sm:px-6">
      {/* With the sidebar open on a wide screen the toggle sits beside the logo; here it covers the hidden and narrow cases. */}
      <SidebarToggle className={sidebarOpen ? 'lg:hidden' : undefined} />
      <div className="ml-auto flex items-center gap-1">
        <ButtonLink to="/challenges/new" variant="primary" icon={<Plus className="size-5" aria-hidden />}>
          Add challenge
        </ButtonLink>
        <NotificationBell />
        <MoreMenu />
      </div>
    </header>
  );
}

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  new_challenge: Sparkles,
  submission_received: Inbox,
  results: Trophy,
  awarded: Trophy,
  coach_review: Sparkles,
  cap_reached: Users,
};

function NotificationBell() {
  const { data, isPending, isError, refetch } = useNotifications();
  const navigate = useNavigate();
  const unread = (data ?? []).filter((n) => !n.read).length;
  const markedRef = useRef(false);
  const wasOpen = useRef(false);

  const readAll = useMutation({
    mutationFn: () => api<{ ok: true }>('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(qk.notifications, (prev) => prev?.map((n) => ({ ...n, read: true })));
    },
  });

  return (
    <Popover
      placement="bottom-end"
      panelClassName="w-[min(22rem,calc(100vw-1.5rem))] p-0 overflow-hidden"
      onOpenChange={(open) => {
        if (open) {
          wasOpen.current = true;
          markedRef.current = false;
          return;
        }
        // Mark everything read when the panel closes, so unread items stay highlighted while open.
        if (wasOpen.current) {
          wasOpen.current = false;
          if (!markedRef.current && unread > 0) readAll.mutate();
          markedRef.current = false;
        }
      }}
      trigger={({ toggle, ...aria }) => (
        <button
          type="button"
          onClick={toggle}
          {...aria}
          className="relative inline-flex size-8 items-center justify-center rounded-[var(--borderRadiusMedium)] text-[var(--colorNeutralForeground2)] transition-colors hover:bg-[var(--colorNeutralBackground1Hover)]"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--colorBrandBackground)] px-1 text-[10px] leading-none font-semibold text-white tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => {
                  markedRef.current = true;
                  readAll.mutate();
                }}
                className="text-sm text-[var(--colorBrandForegroundLink)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="scrollbar-thin max-h-[min(26rem,70vh)] overflow-y-auto">
            {isPending ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Couldn’t load notifications.{' '}
                <button type="button" className="font-semibold text-primary" onClick={() => refetch()}>
                  Retry
                </button>
              </div>
            ) : (data ?? []).length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <BellOff className="mb-2 size-5 text-slate-400" aria-hidden />
                <p className="text-sm text-slate-700">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(data ?? []).slice(0, 30).map((n) => {
                  const Icon = KIND_ICON[n.kind] ?? Bell;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          if (n.link) navigate(n.link);
                        }}
                        className={cn(
                          'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                          !n.read && 'bg-[var(--colorBrandBackground2)]',
                        )}
                      >
                        <Icon className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{n.title}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {n.body} · {timeAgo(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}

function MoreMenu() {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <Popover
        placement="bottom-end"
        panelClassName="w-52"
        trigger={({ toggle, ...aria }) => (
          <button
            type="button"
            onClick={toggle}
            {...aria}
            className="inline-flex size-8 items-center justify-center rounded-[var(--borderRadiusMedium)] text-[var(--colorNeutralForeground2)] transition-colors hover:bg-[var(--colorNeutralBackground1Hover)]"
            aria-label="More"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </button>
        )}
      >
        {(close) => (
          <MenuItem
            icon={<RotateCcw className="size-4" />}
            onSelect={() => {
              close();
              setResetOpen(true);
            }}
          >
            Reset demo data
          </MenuItem>
        )}
      </Popover>
      <ResetDemoDialog open={resetOpen} onClose={() => setResetOpen(false)} />
    </>
  );
}

function ResetDemoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const reset = useMutation({
    mutationFn: () => api<unknown>('/admin/reset', { method: 'POST' }),
    onSuccess: () => {
      clearBlind();
      void queryClient.invalidateQueries();
      onClose();
      navigate('/');
    },
  });

  return (
    <Dialog open={open} onClose={() => !reset.isPending && onClose()} width="28rem" labelledBy="reset-title">
      <DialogHeader id="reset-title" title="Reset demo data?" onClose={onClose} />
      <DialogBody>
        <p className="text-sm">Both sites go back to the seed. New work is deleted.</p>
        <InlineError error={reset.error} className="mt-3" />
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose} disabled={reset.isPending}>
          Cancel
        </Button>
        <Button variant="primary" loading={reset.isPending} onClick={() => reset.mutate()}>
          Reset
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
