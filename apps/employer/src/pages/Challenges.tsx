import { useDocumentTitle } from '@/lib/hooks';
import { useDashboard } from '@/lib/queries';
import { ChallengesTable } from '@/components/ChallengesTable';
import { ErrorState, PageHeader } from '@/components/ui';

/**
 * Challenges page: every challenge the company has posted, ongoing and done.
 * A Filter menu switches between ongoing / done / all and narrows by field or posted date.
 * Basic template: the layout is meant to be redesigned.
 */
export function ChallengesPage() {
  const { data, isPending, isError, error, refetch } = useDashboard();
  useDocumentTitle('Challenges');

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title="Challenges" />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <ChallengesTable challenges={data?.challenges} loading={isPending} title="All challenges" filterable />
      )}
    </div>
  );
}
