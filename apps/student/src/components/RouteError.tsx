import { House, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Logo } from './brand';
import { buttonClass } from './ui';

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (!notFound) console.error('[tryout] route error', error);
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-soft">
        <Logo className="justify-center" />
        <h1 className="mt-6 text-xl font-bold tracking-tight text-ink">{notFound ? 'Page not found' : 'Something went sideways'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {notFound ? "That page doesn't exist." : 'An unexpected error happened. Reload the page or head back home.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => window.location.reload()} className={buttonClass('secondary')}>
            <RefreshCw className="size-4" aria-hidden /> Reload
          </button>
          <Link to="/" className={buttonClass('primary')}>
            <House className="size-4" aria-hidden /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
