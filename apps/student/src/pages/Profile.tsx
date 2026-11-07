import { ProofProfile, ProofProfileSkeleton } from '@/components/ProofProfile';
import { ErrorState } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useCurrentStudent, useMe, useStudentProfile } from '@/lib/queries';

export function ProfilePage() {
  const me = useMe();
  const student = useCurrentStudent();
  const q = useStudentProfile(student?.id);
  if (me.isError) return <ErrorState message={errorMessage(me.error)} onRetry={() => void me.refetch()} />;
  if (q.isError) return <ErrorState title="Couldn't load your Proof Profile" message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;
  if (!q.data) return <ProofProfileSkeleton />;
  return <ProofProfile profile={q.data} own />;
}
