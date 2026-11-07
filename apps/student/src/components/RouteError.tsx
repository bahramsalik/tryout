import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Logo } from './brand';
import { buttonClass } from './ui';

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (!notFound) console.error('[tryout] route error', error);
  return (
    <div className="grid min-h-dvh place-items-center bg-bg2 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg bg-bg1 p-8 text-center shadow-4">
        <Logo />
        <h1 className="text-subtitle1 font-semibold text-fg1">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className={buttonClass('secondary')}>
            Reload
          </button>
          <Link to="/" className={buttonClass('primary')}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
