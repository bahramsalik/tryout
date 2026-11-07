import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Mail, Send, UserRound } from 'lucide-react';
import type { CreateInviteInput, InterviewInvite, Student } from '@shared/types';
import { api, errorMessage } from '@/lib/api';
import { firstName, shortDate } from '@/lib/format';
import { usePersona } from '@/lib/persona';
import { qk, queryClient, useInvitesByStudent } from '@/lib/queries';
import { Avatar } from './brand';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './overlay';
import { Button, ButtonLink, Field, InlineError, Input, Textarea } from './ui';

export interface InviteTarget {
  student: Pick<Student, 'id' | 'handle' | 'name' | 'avatarColor' | 'university' | 'major'>;
  challenge?: { id: string; title: string; hiringFor: string | null } | null;
  /** Blind review still on: address the candidate by alias. */
  alias?: string | null;
}

function roleName(role: string): string {
  return role.split('·')[0].trim();
}

function defaultMessage(t: InviteTarget, role: string, sender: { name: string; title: string; company: string }): string {
  const hi = t.alias ? 'Hi there' : `Hi ${firstName(t.student.name)}`;
  const about = t.challenge
    ? `Thank you for your submission to “${t.challenge.title}” — your work really stood out to our team.`
    : 'Your Proof Profile really stood out to our team.';
  const roleLine = role ? ` We’d love to talk with you about our ${roleName(role)} role.` : ' We’d love to talk with you.';
  return `${hi},\n\n${about}${roleLine}\n\nAre you free for a 30-minute intro call next week?\n\nBest,\n${sender.name}\n${sender.title}, ${sender.company}`;
}

export function InviteModal({ open, onClose, target }: { open: boolean; onClose: () => void; target: InviteTarget | null }) {
  return (
    <Dialog open={open && !!target} onClose={onClose} width="34rem" labelledBy="invite-title">
      {target && <InviteForm target={target} onClose={onClose} />}
    </Dialog>
  );
}

function InviteForm({ target, onClose }: { target: InviteTarget; onClose: () => void }) {
  const { employer, company } = usePersona();
  const invites = useInvitesByStudent();
  const initialRole = target.challenge?.hiringFor ?? company?.hiringFor[0] ?? '';
  const [role, setRole] = useState(initialRole);
  const [message, setMessage] = useState(() =>
    defaultMessage(target, initialRole, {
      name: employer?.name ?? 'The hiring team',
      title: employer?.title ?? 'Hiring team',
      company: company?.name ?? '',
    }),
  );
  const [sent, setSent] = useState<InterviewInvite | null>(null);
  const existing = invites.get(target.student.id);
  const pendingHere =
    !!existing && existing.status === 'pending' && (existing.challengeId ?? null) === (target.challenge?.id ?? null);
  const displayName = target.alias ?? target.student.name;

  const send = useMutation({
    mutationFn: (body: CreateInviteInput) => api<InterviewInvite>('/invites', { method: 'POST', json: body }),
    onSuccess: (inv) => {
      void queryClient.invalidateQueries({ queryKey: qk.invites });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      void queryClient.invalidateQueries({ queryKey: qk.student(target.student.id) });
      setSent(inv);
      toast.success(`Interview invite sent to ${displayName}`, { description: 'They’ll see it instantly in Tryout.' });
    },
    onError: (err) => toast.error('Couldn’t send the invite', { description: errorMessage(err) }),
  });

  if (sent) {
    return (
      <>
        <DialogHeader id="invite-title" title="Invite sent" onClose={onClose} />
        <DialogBody className="py-8 text-center">
          <div className="mx-auto flex size-12 animate-pop-in items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="size-6" aria-hidden />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">{displayName} has your invite</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            It just appeared on their Tryout. You’ll get a notification when they accept or decline.
          </p>
        </DialogBody>
        <DialogFooter>
          {!target.alias && (
            <ButtonLink
              to={`/candidates/${target.student.handle || target.student.id}`}
              variant="secondary"
              onClick={onClose}
              icon={<UserRound className="size-4" aria-hidden />}
            >
              View Proof Profile
            </ButtonLink>
          )}
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </>
    );
  }

  const tooShort = message.trim().length < 20;

  return (
    <>
      <DialogHeader
        id="invite-title"
        title="Invite to interview"
        subtitle={target.challenge ? `From “${target.challenge.title}”` : 'From their Proof Profile'}
        onClose={onClose}
        icon={
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Mail className="size-4" aria-hidden />
          </span>
        }
      />
      <DialogBody className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <Avatar name={target.student.name} color={target.student.avatarColor} size={40} blind={!!target.alias} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">
              {target.alias ? 'Identity hidden until results are published' : `${target.student.major} · ${target.student.university}`}
            </p>
          </div>
        </div>
        {existing && (
          <p
            className={
              existing.status === 'accepted'
                ? 'rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200'
                : 'rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200'
            }
          >
            {pendingHere
              ? `An invite for this challenge is already pending (sent ${shortDate(existing.createdAt)}).`
              : existing.status === 'accepted'
                ? `${target.alias ? 'This candidate' : firstName(target.student.name)} already accepted an interview${existing.challengeTitle ? ` from “${existing.challengeTitle}”` : ''}.`
                : `You invited ${target.alias ? 'this candidate' : firstName(target.student.name)} on ${shortDate(existing.createdAt)} · ${existing.status}.`}
          </p>
        )}
        <Field label="Role" htmlFor="inv-role" hint="Prefilled from the challenge’s “Hiring for”.">
          <Input id="inv-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Junior Backend Engineer" />
        </Field>
        <Field label="Message" htmlFor="inv-msg" counter={`${message.trim().length} chars`}>
          <Textarea id="inv-msg" rows={9} value={message} onChange={(e) => setMessage(e.target.value)} invalid={tooShort} />
        </Field>
        <InlineError error={send.error} />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={send.isPending}
          disabled={tooShort || pendingHere}
          icon={<Send className="size-4" aria-hidden />}
          onClick={() =>
            send.mutate({
              studentId: target.student.id,
              challengeId: target.challenge?.id ?? null,
              role: role.trim() || null,
              message: message.trim(),
            })
          }
        >
          Send invite
        </Button>
      </DialogFooter>
    </>
  );
}
