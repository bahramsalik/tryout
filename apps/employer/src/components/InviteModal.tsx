import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { CreateInviteInput, InterviewInvite, Student } from '@shared/types';
import { api } from '@/lib/api';
import { firstName } from '@/lib/format';
import { usePersona } from '@/lib/persona';
import { qk, queryClient, useInvitesByStudent } from '@/lib/queries';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './overlay';
import { Button, Field, InlineError, Input, MessageBar, Textarea } from './ui';

export interface InviteTarget {
  student: Pick<Student, 'id' | 'handle' | 'name' | 'avatarColor' | 'university' | 'major'>;
  challenge?: { id: string; title: string; hiringFor: string | null } | null;
  /** Blind review still on: address the candidate by alias. */
  alias?: string | null;
}

function roleName(role: string): string {
  return role.split('·')[0].trim();
}

function defaultMessage(t: InviteTarget, role: string, sender: { name: string; company: string }): string {
  const hi = t.alias ? 'Hi' : `Hi ${firstName(t.student.name)}`;
  const about = t.challenge ? `Your work on “${t.challenge.title}” stood out.` : 'Your profile stood out.';
  const ask = role
    ? `Are you free next week for a 30-minute call about our ${roleName(role)} role?`
    : 'Are you free next week for a 30-minute call?';
  return `${hi},\n\n${about} ${ask}\n\n${sender.name}, ${sender.company}`;
}

export function InviteModal({ open, onClose, target }: { open: boolean; onClose: () => void; target: InviteTarget | null }) {
  return (
    <Dialog open={open && !!target} onClose={onClose} width="30rem" labelledBy="invite-title">
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
      company: company?.name ?? '',
    }),
  );
  const existing = invites.get(target.student.id);
  const pendingHere =
    !!existing && existing.status === 'pending' && (existing.challengeId ?? null) === (target.challenge?.id ?? null);
  const displayName = target.alias ?? target.student.name;

  // The result shows in place: the dialog closes and the row's button turns into "Invited".
  const send = useMutation({
    mutationFn: (body: CreateInviteInput) => api<InterviewInvite>('/invites', { method: 'POST', json: body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.invites });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      void queryClient.invalidateQueries({ queryKey: qk.student(target.student.id) });
      onClose();
    },
  });

  const tooShort = message.trim().length < 20;

  return (
    <>
      <DialogHeader id="invite-title" title={`Invite ${displayName}`} onClose={onClose} />
      <DialogBody className="space-y-4">
        {pendingHere && <MessageBar intent="info">Invite already pending.</MessageBar>}
        <Field label="Role" htmlFor="inv-role">
          <Input id="inv-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Junior Backend Engineer" />
        </Field>
        <Field label="Message" htmlFor="inv-msg" error={tooShort ? 'Write at least 20 characters' : undefined}>
          <Textarea id="inv-msg" rows={7} value={message} onChange={(e) => setMessage(e.target.value)} invalid={tooShort} />
        </Field>
        <InlineError error={send.error} />
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          loading={send.isPending}
          disabled={tooShort || pendingHere}
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
