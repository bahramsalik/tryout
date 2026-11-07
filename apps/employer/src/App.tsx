import { createBrowserRouter, useLocation, useParams, useRouteError } from 'react-router';
import { Compass, TriangleAlert } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ButtonLink, Card, EmptyState } from '@/components/ui';
import { useDocumentTitle } from '@/lib/hooks';
import { CandidatePage } from '@/pages/Candidate';
import { ChallengePage } from '@/pages/Challenge';
import { DashboardPage } from '@/pages/Dashboard';
import { NewChallengePage } from '@/pages/new-challenge/NewChallenge';
import { ReviewPage } from '@/pages/Review';
import { TalentPage } from '@/pages/Talent';

function NotFound() {
  useDocumentTitle('Not found');
  return (
    <Card className="mx-auto max-w-xl">
      <EmptyState
        icon={<Compass className="size-5" aria-hidden />}
        title="This page doesn’t exist"
        body="The link may be from the student site, or from before a demo reset."
        action={<ButtonLink to="/">Go to dashboard</ButtonLink>}
      />
    </Card>
  );
}

function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="max-w-md">
        <EmptyState
          icon={<TriangleAlert className="size-5" aria-hidden />}
          title="Something went wrong on this page"
          body={error instanceof Error ? error.message : 'An unexpected error occurred.'}
          action={
            <a href="/" className="text-sm font-semibold text-primary hover:underline">
              Reload the dashboard
            </a>
          }
        />
      </Card>
    </div>
  );
}

/** Remount per navigation, so "+ Add challenge" from the success screen starts a fresh wizard. */
function NewChallengeRoute() {
  const { key } = useLocation();
  return <NewChallengePage key={key} />;
}

/** Remount per challenge, so modal/tab state never leaks between challenges. */
function ChallengeRoute() {
  const { id } = useParams();
  return <ChallengePage key={id} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'challenges/new', element: <NewChallengeRoute /> },
      { path: 'challenges/:id', element: <ChallengeRoute /> },
      { path: 'challenges/:id/review/:submissionId', element: <ReviewPage /> },
      { path: 'talent', element: <TalentPage /> },
      { path: 'candidates/:idOrHandle', element: <CandidatePage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
