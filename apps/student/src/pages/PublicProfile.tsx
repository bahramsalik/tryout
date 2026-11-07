import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Logo } from '@/components/brand';
import { ProofProfile, ProofProfileSkeleton } from '@/components/ProofProfile';
import { ErrorState } from '@/components/ui';
import { errorMessage, isApiError } from '@/lib/api';
import { useStudentProfile } from '@/lib/queries';

/** The link a student shares: no app chrome. */
export function PublicProfilePage() {
  const { handle } = useParams();
  const q = useStudentProfile(handle);
  useEffect(() => {
    if (q.data) document.title = `${q.data.name} · Tryout`;
    return () => {
      document.title = 'Tryout';
    };
  }, [q.data]);
  const notFound = isApiError(q.error) && q.error.status === 404;
  return (
    <div className="min-h-dvh bg-bg2">
      <header className="border-b border-stroke2 bg-bg1">
        <div className="mx-auto flex h-12 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/" aria-label="Tryout">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {q.isError ? (
          <ErrorState
            title={notFound ? 'Profile not found' : "Couldn't load this profile"}
            message={notFound ? undefined : errorMessage(q.error)}
            onRetry={notFound ? undefined : () => void q.refetch()}
          />
        ) : !q.data ? (
          <ProofProfileSkeleton />
        ) : (
          <ProofProfile profile={q.data} publicView />
        )}
      </main>
    </div>
  );
}
