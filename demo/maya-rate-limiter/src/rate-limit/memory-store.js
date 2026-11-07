'use strict';

const { takeToken } = require('./token-bucket');

/**
 * In-memory bucket store. One Map per store, and one store per app, never module-level,
 * so tests and multiple app instances never share counters.
 *
 * This is the seam for OL-PLAT-413. A Redis store implements the same single method,
 * `consume(key, policy, now)`, as one Lua script, so the read-modify-write stays atomic
 * across instances. The middleware never touches the Map directly.
 *
 * Here the read-modify-write is atomic for free: there is no `await` between get and set,
 * so two requests in this process can't interleave and double-spend a token.
 */
function createMemoryStore({ idleTtlMs = 10 * 60_000, sweepEvery = 1000 } = {}) {
  const buckets = new Map();
  let calls = 0;

  /**
   * Drops buckets idle for longer than idleTtlMs. Any bucket idle longer than its refill time
   * (≤ 20 s for every tier today) is full again, so deleting it changes no answer: it only
   * stops memory from growing with every key we have ever seen.
   */
  function sweep(now) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.updatedAt > idleTtlMs) buckets.delete(key);
    }
  }

  return {
    async consume(key, policy, now) {
      // Opportunistic cleanup instead of setInterval: no timer keeps test processes alive.
      calls += 1;
      if (calls % sweepEvery === 0) sweep(now);

      const result = takeToken(buckets.get(key), policy, now);
      buckets.set(key, result.state);
      return result;
    },
    sweep,
    size: () => buckets.size,
  };
}

module.exports = { createMemoryStore };
