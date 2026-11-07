import { ArrowRight, BadgeCheck } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Logo } from '@/components/brand';
import { ProofProfile, ProofProfileSkeleton } from '@/components/ProofProfile';
import { ErrorState, buttonClass } from '@/components/ui';
import { errorMessage, isApiError } from '@/lib/api';
import { useStudentProfile } from '@/lib/queries';

/** The link a student puts on LinkedIn: no app chrome. */
export function PublicProfilePage() {
  const { handle } = useParams();
  const q = useStudentProfile(handle);
  useEffect(() => {
    if (q.data) document.title = `${q.data.name} · Proof Profile · Tryout`;
    return () => {
      document.title = 'Tryout — Real work. Real pay. Real proof.';
    };
  }, [q.data]);
  const notFound = isApiError(q.error) && q.error.status === 404;
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/" aria-label="Tryout">
            <Logo />
          </Link>
          <span className="hidden items-center gap-1 text-xs font-semibold text-slate-500 sm:inline-flex">
            <BadgeCheck className="size-3.5 text-emerald-500" aria-hidden /> Verified Proof Profile
          </span>
          <Link to="/" className={buttonClass('primary', 'sm', 'ml-auto')}>
            Try Tryout <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {q.isError ? (
          <ErrorState
            title={notFound ? 'Profile not found' : "Couldn't load this profile"}
            message={notFound ? `There's no Tryout profile at /p/${handle}.` : errorMessage(q.error)}
            onRetry={notFound ? undefined : () => void q.refetch()}
          />
        ) : !q.data ? (
          <ProofProfileSkeleton />
        ) : (
          <ProofProfile profile={q.data} publicView />
        )}
        <p className="mt-10 text-center text-xs text-slate-500">
          Every employer-verified result here was scored with a published rubric by the company that posted the task. <span className="font-semibold text-ink">tryout</span> · Real work. Real pay. Real proof.
        </p>
      </main>
    </div>
  );
}
