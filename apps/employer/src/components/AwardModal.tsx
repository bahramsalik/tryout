import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, ClipboardCheck, Lock, Mail, PartyPopper, Trophy, Unlock } from 'lucide-react';
import { payoutForRank, rewardTotal, type AwardResponse, type ChallengeView, type SubmissionView } from '@shared/types';
import { api, errorMessage } from '@/lib/api';
import { celebrate } from '@/lib/confetti';
import { money, ordinal, plural } from '@/lib/format';
import { qk, queryClient, isScored, rankSubmissions } from '@/lib/queries';
import { Avatar, MedalBadge, ScorePill } from './brand';
import type { InviteTarget } from './InviteModal';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './overlay';
import { Button, InlineError, cn } from './ui';

export function AwardModal({
  open,
  onClose,
  challenge,
  submissions,
  blind,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  challenge: ChallengeView;
  submissions: SubmissionView[];
  blind: boolean;
  onInvite: (target: InviteTarget) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} width="36rem" labelledBy="award-title">
      <AwardFlow challenge={challenge} submissions={submissions} blind={blind} onClose={onClose} onInvite={onInvite} />
    </Dialog>
  );
}

function AwardFlow({
  challenge,
  submissions,
  blind,
  onClose,
  onInvite,
}: {
  challenge: ChallengeView;
  submissions: SubmissionView[];
  blind: boolean;
  onClose: () => void;
  onInvite: (target: InviteTarget) => void;
}) {
  const navigate = useNavigate();
  const [result, setResult] = useState<AwardResponse | null>(null);
  const ranked = useMemo(() => rankSubmissions(submissions), [submissions]);
  const unscored = submissions.filter((s) => !isScored(s) || !s.feedback?.trim());
  const reward = challenge.reward;
  const paidPlaces = reward.mode === 'winner' ? 1 : reward.mode === 'top3' ? 3 : 0;
  const podium = ranked.slice(0, Math.max(paidPlaces, 3));
  const totalPayout = ranked.reduce((sum, _s, i) => sum + payoutForRank(reward, i + 1), 0);
  const byStudent = useMemo(() => new Map(submissions.map((s) => [s.studentId, s])), [submissions]);

  const award = useMutation({
    mutationFn: () => api<AwardResponse>(`/challenges/${encodeURIComponent(challenge.id)}/award`, { method: 'POST' }),
    onSuccess: (res) => {
      setResult(res);
      queryClient.setQueryData(qk.challenge(challenge.id), res.challenge);
      void queryClient.invalidateQueries({ queryKey: qk.submissions(challenge.id) });
      void queryClient.invalidateQueries({ queryKey: qk.leaderboard(challenge.id) });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      void queryClient.invalidateQueries({ queryKey: qk.studentsAll });
      window.setTimeout(() => celebrate({ y: 0.3 }), 250);
    },
    onError: (err) => toast.error('Couldn’t publish results', { description: errorMessage(err) }),
  });

  /* ── Blocked: feedback guarantee ── */
  if (!result && unscored.length > 0) {
    return (
      <>
        <DialogHeader id="award-title" title="Publish results & award" subtitle={challenge.title} onClose={onClose} />
        <DialogBody>
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-amber-900">{unscored.length} left to score</p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80">
                Every student is guaranteed rubric scores and written feedback, so results can only be published once all{' '}
                {submissions.length} submissions are scored.
              </p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              navigate(`/challenges/${challenge.id}/review/next`);
            }}
          >
            Score the next one
          </Button>
        </DialogFooter>
      </>
    );
  }

  /* ── Done: identities revealed ── */
  if (result) {
    const results = [...result.results].sort((a, b) => a.rank - b.rank);
    const paid = results.filter((r) => r.payout > 0);
    const shown = (paid.length ? paid : results.slice(0, 3)).slice(0, 3);
    return (
      <>
        <DialogHeader
          id="award-title"
          title="Results published"
          subtitle={`${plural(results.length, 'student')} notified · ${money(paid.reduce((s, r) => s + r.payout, 0))} released from escrow`}
          onClose={onClose}
          icon={
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <PartyPopper className="size-4" aria-hidden />
            </span>
          }
        />
        <DialogBody className="space-y-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <Unlock className="size-3.5" aria-hidden /> Identities revealed
          </p>
          {shown.map((r, i) => {
            const sub = byStudent.get(r.studentId);
            if (!sub) return null;
            return (
              <div
                key={r.studentId}
                className="flex animate-reveal items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card [transform-origin:top]"
                style={{ animationDelay: `${200 + i * 260}ms` }}
              >
                <MedalBadge rank={r.rank} />
                <Avatar name={sub.student.name} color={sub.student.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/candidates/${sub.student.handle || sub.studentId}`}
                    onClick={onClose}
                    className="block truncate text-sm font-semibold text-slate-900 hover:text-primary hover:underline"
                  >
                    {sub.student.name}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    was {sub.alias} · {sub.student.university}
                  </p>
                </div>
                <div className="text-right">
                  {r.payout > 0 && <p className="text-sm font-bold text-emerald-700 tabular-nums">{money(r.payout)}</p>}
                  <p className="text-[11px] text-slate-400">{ordinal(r.rank)} place</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Mail className="size-3.5" aria-hidden />}
                  onClick={() =>
                    onInvite({
                      student: sub.student,
                      challenge: { id: challenge.id, title: challenge.title, hiringFor: challenge.hiringFor },
                    })
                  }
                >
                  <span className="max-[480px]:hidden">Invite</span>
                </Button>
              </div>
            );
          })}
          {results.length > shown.length && (
            <p className="pt-1 text-xs text-slate-500">
              The other {plural(results.length - shown.length, 'student')} got their scores and feedback.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </>
    );
  }

  /* ── Confirm ── */
  return (
    <>
      <DialogHeader
        id="award-title"
        title="Publish results & award"
        subtitle={challenge.title}
        onClose={onClose}
        icon={
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Trophy className="size-4" aria-hidden />
          </span>
        }
      />
      <DialogBody className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Scored" value={`${ranked.length}/${submissions.length}`} />
          <Stat label="Get paid" value={String(Math.min(paidPlaces, ranked.length))} />
          <Stat label="Released" value={money(totalPayout)} money />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {reward.mode === 'none' ? 'Top of the leaderboard' : 'Who gets paid'}
          </p>
          <ol className="space-y-2">
            {podium.map((s, i) => {
              const payout = payoutForRank(reward, i + 1);
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
                  <MedalBadge rank={i + 1} />
                  <Avatar name={s.student.name} color={s.student.avatarColor} size={30} blind={blind} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                    {blind ? s.alias : s.student.name}
                  </span>
                  <ScorePill score={s.totalScore ?? 0} />
                  <span
                    className={cn(
                      'w-16 text-right text-sm font-bold tabular-nums',
                      payout > 0 ? 'text-emerald-700' : 'text-slate-400',
                    )}
                  >
                    {payout > 0 ? money(payout) : '—'}
                  </span>
                </li>
              );
            })}
          </ol>
          {ranked.length > podium.length && (
            <p className="mt-2 text-xs text-slate-500">
              The other {plural(ranked.length - podium.length, 'student')} get their scores and feedback, marked “not selected”.
            </p>
          )}
        </div>

        <div className="flex gap-2.5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
          <p>
            Publishing {blind ? 'reveals identities, ' : ''}notifies all {plural(submissions.length, 'student')} and releases{' '}
            {rewardTotal(reward) > 0 ? (
              <>
                <Lock className="inline size-3 align-[-1px]" aria-hidden /> {money(totalPayout)} from escrow
              </>
            ) : (
              'their feedback'
            )}
            . Paid placements transfer the work’s license to you. This can’t be undone.
          </p>
        </div>
        <InlineError error={award.error} />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={award.isPending}>
          Cancel
        </Button>
        <Button
          variant="success"
          loading={award.isPending}
          onClick={() => award.mutate()}
          disabled={ranked.length === 0}
          icon={<Trophy className="size-4" aria-hidden />}
        >
          {totalPayout > 0 ? `Publish & pay ${money(totalPayout)}` : 'Publish results'}
        </Button>
      </DialogFooter>
    </>
  );
}

function Stat({ label, value, money: isMoney }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2.5 ring-1 ring-slate-200">
      <p className={cn('text-base font-bold tabular-nums', isMoney ? 'text-emerald-700' : 'text-slate-900')}>{value}</p>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
    </div>
  );
}
