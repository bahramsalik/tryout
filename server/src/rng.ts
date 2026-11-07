import { createHash, randomBytes } from 'node:crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function shortHash(input: string, length = 8): string {
  return sha256(input).slice(0, length);
}

/** Random runtime id, e.g. "sub_3f9a1c2e". Seeded entities use deterministic ids instead. */
export function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString('hex')}`;
}

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** n distinct items (or all of them when n ≥ length). */
  sample<T>(items: readonly T[], n: number): T[];
}

/** Deterministic PRNG (mulberry32) seeded from a string. */
export function makeRng(seed: string): Rng {
  let state = parseInt(shortHash(seed, 8), 16) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)] as (typeof items)[number],
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    sample: (items, n) => rng.shuffle(items).slice(0, Math.max(0, n)),
  };
  return rng;
}
