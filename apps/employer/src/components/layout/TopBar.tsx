import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  CheckCheck,
  ExternalLink,
  Inbox,
  MailCheck,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Notification, NotificationKind } from '@shared/types';
import { api, errorMessage, STUDENT_SITE_URL } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { usePersona } from '@/lib/persona';
import { qk, queryClient, useNotifications } from '@/lib/queries';
import { clearBlind } from '@/lib/stores';
import { Avatar } from '../brand';
import { Dialog, DialogBody, DialogFooter, DialogHeader, MenuItem, MenuSeparator, Popover } from '../overlay';
import { Button, ButtonLink, InlineError, Skeleton, cn } from '../ui';

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-8">
      <TalentSearch />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ButtonLink to="/challenges/new" variant="primary" size="md" icon={<Plus className="size-4" aria-hidden />}>
          <span className="max-[420px]:hidden">Add challenge</span>
        </ButtonLink>
        <NotificationBell />
        <MoreMenu />
      </div>
    </header>
  );
}

function TalentSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const onTalent = location.pathname === '/talent';

  useEffect(() => {
    if (onTalent) setQ(params.get('q') ?? '');
  }, [onTalent, params]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    navigate(value ? `/talent?q=${encodeURIComponent(value)}` : '/talent');
  };

  return (
    <form onSubmit={submit} role="search" className="relative min-w-0 flex-1 sm:max-w-xs lg:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search talent by name, skill, school…"
        aria-label="Search talent"
        className="h-9 w-full rounded-lg border border-transparent bg-slate-100 pr-3 pl-8 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
      />
    </form>
  );
}

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  new_challenge: Sparkles,
  submission_received: Inbox,
  results: Trophy,
  awarded: Trophy,
  interview: UserPlus,
  invite_response: MailCheck,
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
          className="relative inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="size-[18px]" aria-hidden />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 animate-pop-in items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white tabular-nums ring-2 ring-white">
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-indigo-800"
              >
                <CheckCheck className="size-3.5" aria-hidden /> Mark all read
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
                <p className="text-sm font-semibold text-slate-800">You’re all caught up</p>
                <p className="mt-1 text-xs text-slate-500">New submissions and invite replies show up here.</p>
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
                          !n.read && 'bg-indigo-50/50',
                        )}
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="min-w-0 flex-1 text-[13px] font-semibold text-slate-900">{n.title}</span>
                            {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.body}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
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
  const { employer } = usePersona();
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <Popover
        placement="bottom-end"
        panelClassName="w-64"
        trigger={({ toggle, ...aria }) => (
          <button
            type="button"
            onClick={toggle}
            {...aria}
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="More"
          >
            <MoreHorizontal className="size-[18px]" aria-hidden />
          </button>
        )}
      >
        {(close) => (
          <>
            {employer && (
              <div className="flex items-center gap-2.5 px-2.5 py-2">
                <Avatar name={employer.name} color="#334155" size={30} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{employer.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {employer.title} · {employer.company.name}
                  </p>
                </div>
              </div>
            )}
            <MenuSeparator />
            <MenuItem
              icon={<ExternalLink className="size-4" />}
              onSelect={() => {
                close();
                window.open(STUDENT_SITE_URL, '_blank', 'noopener');
              }}
            >
              Open the student site
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              danger
              icon={<RotateCcw className="size-4" />}
              onSelect={() => {
                close();
                setResetOpen(true);
              }}
            >
              Reset demo data…
            </MenuItem>
          </>
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
      toast.success('Demo data reset', { description: 'Both sites are back to the demo starting state.' });
    },
    onError: (err) => toast.error('Reset failed', { description: errorMessage(err) }),
  });

  return (
    <Dialog open={open} onClose={() => !reset.isPending && onClose()} width="28rem" labelledBy="reset-title">
      <DialogHeader
        id="reset-title"
        title="Reset demo data?"
        icon={
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <RotateCcw className="size-4" aria-hidden />
          </span>
        }
        onClose={onClose}
      />
      <DialogBody>
        <p className="text-sm leading-relaxed text-slate-600">
          This reseeds the shared Tryout API, so <strong className="text-slate-900">both sites</strong> go back to the demo
          starting state. Challenges, submissions, scores and invites created since then are deleted for everyone.
        </p>
        <InlineError error={reset.error} className="mt-3" />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={reset.isPending}>
          Cancel
        </Button>
        <Button variant="danger" loading={reset.isPending} onClick={() => reset.mutate()} icon={<RotateCcw className="size-4" />}>
          Reset demo data
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
