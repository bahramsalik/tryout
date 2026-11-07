import '@fontsource-variable/inter';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AppLayout } from './components/Layout';
import { RouteError } from './components/RouteError';
import { isApiError } from './lib/api';
import { CoachProvider } from './lib/coach';
import { LiveEventsProvider } from './lib/events';
import { PersonaProvider } from './lib/persona';
import { ChallengeDetailPage } from './pages/ChallengeDetail';
import { ExplorePage } from './pages/Explore';
import { HomePage } from './pages/Home';
import { MyWorkPage } from './pages/MyWork';
import { NotFoundPage } from './pages/NotFound';
import { ProfilePage } from './pages/Profile';
import { PublicProfilePage } from './pages/PublicProfile';
import { SubmitPage } from './pages/Submit';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

/** Providers that need the router (navigation from toasts, Coach follows the URL). */
function Root() {
  return (
    <LiveEventsProvider>
      <CoachProvider>
        <Outlet />
      </CoachProvider>
    </LiveEventsProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'explore', element: <ExplorePage /> },
          { path: 'challenges/:id', element: <ChallengeDetailPage /> },
          { path: 'challenges/:id/submit', element: <SubmitPage /> },
          { path: 'work', element: <MyWorkPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      { path: 'p/:handle', element: <PublicProfilePage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PersonaProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton offset={{ top: 76, right: 16 }} mobileOffset={{ top: 120 }} visibleToasts={4} />
      </PersonaProvider>
    </QueryClientProvider>
  </StrictMode>,
);
