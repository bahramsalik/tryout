import { useSyncExternalStore } from 'react';

/**
 * Tiny localStorage-backed stores shared across components.
 * - Blind review: per challenge, ON by default (SPEC §5.5 rule 10). Not part of the API contract.
 */

type Listener = () => void;

function createStore<T>(key: string, fallback: T) {
  let state: T = fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) state = { ...fallback, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(next: T) {
      state = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/* ───────────── Blind review ───────────── */

const blindStore = createStore<Record<string, boolean>>('tryout.employer.blind', {});

export function isBlind(challengeId: string, status?: string | null): boolean {
  if (status === 'awarded') return false; // identities are revealed once results are published
  return blindStore.get()[challengeId] ?? true;
}

export function setBlind(challengeId: string, value: boolean) {
  blindStore.set({ ...blindStore.get(), [challengeId]: value });
}

export function clearBlind() {
  blindStore.set({});
}

/** [blind, setBlind] for a challenge. Awarded challenges are never blind. */
export function useBlind(challengeId: string | undefined, status?: string | null): [boolean, (v: boolean) => void] {
  const map = useSyncExternalStore(blindStore.subscribe, blindStore.get);
  const id = challengeId ?? '';
  const blind = status === 'awarded' ? false : (map[id] ?? true);
  return [blind, (v: boolean) => setBlind(id, v)];
}

/* ───────────── Live arrivals (submissions that arrived over SSE this session) ───────────── */

let arrivals: Record<string, number> = {};
const arrivalListeners = new Set<Listener>();

export function markArrival(submissionId: string) {
  arrivals = { ...arrivals, [submissionId]: Date.now() };
  arrivalListeners.forEach((l) => l());
}

/** True for ~60 s after a submission arrived live — rows flash and get a "New" badge. */
export function useArrivals(): Record<string, number> {
  return useSyncExternalStore(
    (l) => {
      arrivalListeners.add(l);
      return () => arrivalListeners.delete(l);
    },
    () => arrivals,
  );
}

export function isFreshArrival(map: Record<string, number>, id: string, windowMs = 60_000): boolean {
  const t = map[id];
  return t != null && Date.now() - t < windowMs;
}

/* ───────────── Seed scoping ───────────── */

const SEED_KEY = 'tryout.employer.seedId';

/**
 * Local UI state (blind toggles) only makes sense for the data it was made on.
 * When the API was reseeded (demo reset, new content), wipe it so the demo always starts clean.
 */
export function applySeedId(seedId: string | null | undefined) {
  if (!seedId) return;
  let prev: string | null = null;
  try {
    prev = localStorage.getItem(SEED_KEY);
  } catch {
    /* ignore */
  }
  if (prev === seedId) return;
  try {
    localStorage.setItem(SEED_KEY, seedId);
  } catch {
    /* ignore */
  }
  clearBlind();
}

/* ───────────── Sidebar visibility ───────────── */

const sidebarStore = createStore<{ open: boolean }>('tryout.employer.sidebar', { open: true });

/** [open, toggle] for the left sidebar. Remembered between visits. */
export function useSidebar(): [boolean, () => void] {
  const { open } = useSyncExternalStore(sidebarStore.subscribe, sidebarStore.get);
  return [open, () => sidebarStore.set({ open: !sidebarStore.get().open })];
}
