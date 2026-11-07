import { useEffect, useRef, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Tryout for Employers` : 'Tryout for Employers';
  }, [title]);
}

/** Remembers item ids seen on first render; returns a predicate for ids that showed up later. */
export function useNewIds(ids: string[] | undefined): (id: string) => boolean {
  const seen = useRef<Set<string> | null>(null);
  const fresh = useRef<Set<string>>(new Set());
  if (ids) {
    if (seen.current === null) {
      seen.current = new Set(ids);
    } else {
      for (const id of ids) {
        if (!seen.current.has(id)) {
          seen.current.add(id);
          fresh.current.add(id);
        }
      }
    }
  }
  return (id: string) => fresh.current.has(id);
}
