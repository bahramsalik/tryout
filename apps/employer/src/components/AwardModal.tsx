import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { placementsFor, prizeForPlace, type AwardResponse, type ChallengeView, type SubmissionView } from '@shared/types';
import { api } from '@/lib/api';
import { usd } from '@/lib/format';
import { qk, queryClient, isScored, rankSubmissions } from '@/lib/queries';
import { Avatar, MedalBadge, ScorePill } from './brand';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './overlay';
import { Button, InlineError } from './ui';

export function AwardModal({
  open,
  onClose,
  challenge,
  submissions,
  blind,
}: {
  open: boolean;
  onClose: () => void;
  challenge: ChallengeView;
  submissions: SubmissionView[];
  blind: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} width="30rem" labelledBy="award-title">
      <AwardFlow challenge={challenge} submissions={submissions} blind={blind} onClose={onClose} />
    </Dialog>
  );
}

function AwardFlow({
  challenge,
  submissions,
  blind,
  onClose,
}: {
  challenge: ChallengeView;
  submissions: SubmissionView[];
  blind: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [result, setResult] = useState<AwardResponse | null>(null);
  const ranked = useMemo(() => rankSubmissions(submissions), [submissions]);
  const unscored = submissions.filter((s) => !isScored(s) || !s.feedback?.trim());
  const podium = ranked.slice(0, placementsFor(challenge));
  const hasPrize = (challenge.prizePool ?? 0) > 0 && placementsFor(challenge) > 0;
  // Prizes go to Verified results only, so a person must confirm each prize place first.
  const unverified = hasPrize ? podium.filter((s) => !s.verified) : [];
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
    },
  });

  /* ── Blocked: every submission needs scores + feedback ── */
  if (!result && unscored.length > 0) {
    return (
      <>
        <DialogHeader id="award-title" title="Publish results" onClose={onClose} />
        <DialogBody>
          <p className="text-sm">{unscored.length} left to score.</p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              navigate(`/challenges/${challenge.id}/review/next`);
            }}
          >
            Score next
          </Button>
        </DialogFooter>
      </>
    );
  }

  /* ── Blocked: prize places must be Verified ── */
  if (!result && unverified.length > 0) {
    return (
      <>
        <DialogHeader id="award-title" title="Confirm the winners" onClose={onClose} />
        <DialogBody className="space-y-3">
          <p className="text-sm">
            The prize goes to verified results only. Confirm {unverified.length === 1 ? 'this result' : `these ${unverified.length} results`} first.
          </p>
          <ol>
            {unverified.map((s) => (
              <li key={s.id} className="flex items-center gap-3 border-b border-slate-200 py-2 last:border-0">
                <MedalBadge rank={podium.indexOf(s) + 1} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{blind ? s.alias : s.student.name}</span>
                <ScorePill score={s.totalScore ?? 0} className="text-right" />
              </li>
            ))}
          </ol>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              navigate(`/challenges/${challenge.id}/review/${unverified[0]!.id}`);
            }}
          >
            Review
          </Button>
        </DialogFooter>
      </>
    );
  }

  /* ── Done: identities revealed ── */
  if (result) {
    // Ranks exist only when the challenge has an award.
    const results = result.results.flatMap((r) => (r.rank === null ? [] : [{ ...r, rank: r.rank }])).sort((a, b) => a.rank - b.rank);
    const shown = results.slice(0, placementsFor(challenge));
    return (
      <>
        <DialogHeader id="award-title" title="Results published" onClose={onClose} />
        <DialogBody>
          <ol>
            {shown.map((r) => {
              const sub = byStudent.get(r.studentId);
              if (!sub) return null;
              return (
                <li key={r.studentId} className="flex items-center gap-3 border-b border-slate-200 py-2 last:border-0">
                  <MedalBadge rank={r.rank} />
                  <Avatar name={sub.student.name} color={sub.student.avatarColor} size={28} />
                  <Link
                    to={`/candidates/${sub.student.handle || sub.studentId}`}
                    onClick={onClose}
                    className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline"
                    title={`was ${sub.alias}`}
                  >
                    {sub.student.name}
                  </Link>
                  {hasPrize && r.rank !== null && <span className="w-16 text-right text-sm tabular-nums">{usd(prizeForPlace(challenge, r.rank))}</span>}
                </li>
              );
            })}
          </ol>
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
      <DialogHeader id="award-title" title="Publish results" onClose={onClose} />
      <DialogBody className="space-y-3">
        <ol>
          {podium.map((s, i) => {
            return (
              <li key={s.id} className="flex items-center gap-3 border-b border-slate-200 py-2 last:border-0">
                <MedalBadge rank={i + 1} />
                <Avatar name={s.student.name} color={s.student.avatarColor} size={28} blind={blind} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{blind ? s.alias : s.student.name}</span>
                <ScorePill score={s.totalScore ?? 0} className="text-right" />
                {hasPrize && <span className="w-16 text-right text-sm tabular-nums">{usd(prizeForPlace(challenge, i + 1))}</span>}
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-slate-600">
          {blind ? 'Reveals names and sends feedback to students.' : 'Sends feedback to students.'}
        </p>
        <InlineError error={award.error} />
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose} disabled={award.isPending}>
          Cancel
        </Button>
        <Button variant="primary" loading={award.isPending} onClick={() => award.mutate()} disabled={ranked.length === 0}>
          Publish
        </Button>
      </DialogFooter>
    </>
  );
}
