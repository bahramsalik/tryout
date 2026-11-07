import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

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

/** Animates a number from its previous value to the new one; `bumped` is true briefly after an increase. */
export function useCountUp(value: number, ready = true, duration = 700): { display: number; bumped: boolean } {
  const [display, setDisplay] = useState(value);
  const [bumped, setBumped] = useState(false);
  const prev = useRef(value);
  const first = useRef(true);
  const bumpTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(bumpTimer.current), []);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    // The first real value (after loading) is shown as-is: only later changes animate and glow.
    if (first.current || !ready) {
      if (ready) first.current = false;
      setDisplay(value);
      return;
    }
    if (from === value) return;
    if (value > from) {
      setBumped(true);
      window.clearTimeout(bumpTimer.current);
      bumpTimer.current = window.setTimeout(() => setBumped(false), 1600);
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ready, duration]);

  return { display: ready ? display : value, bumped };
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
