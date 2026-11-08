import { createBrowserRouter, useLocation, useParams, useRouteError } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { ButtonLink, EmptyState, MessageBar } from '@/components/ui';
import { useDocumentTitle } from '@/lib/hooks';
import { CandidatePage } from '@/pages/Candidate';
import { ChallengesPage } from '@/pages/Challenges';
import { ChallengePage } from '@/pages/Challenge';
import { DashboardPage } from '@/pages/Dashboard';
import { NewChallengePage } from '@/pages/new-challenge/NewChallenge';
import { ReviewPage } from '@/pages/Review';
import { TalentPage } from '@/pages/Talent';

function NotFound() {
  useDocumentTitle('Not found');
  return <EmptyState title="Page not found" action={<ButtonLink to="/">Dashboard</ButtonLink>} />;
}

function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="mx-auto max-w-md p-6">
      <MessageBar intent="error" action={<a href="/" className="text-sm underline">Reload</a>}>
        {error instanceof Error ? error.message : 'Something went wrong.'}
      </MessageBar>
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
      { path: 'challenges', element: <ChallengesPage /> },
      { path: 'challenges/new', element: <NewChallengeRoute /> },
      { path: 'challenges/:id', element: <ChallengeRoute /> },
      { path: 'challenges/:id/review/:submissionId', element: <ReviewPage /> },
      { path: 'talent', element: <TalentPage /> },
      { path: 'candidates/:idOrHandle', element: <CandidatePage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
