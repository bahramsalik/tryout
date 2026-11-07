'use strict';

/**
 * Token bucket, written as a pure function of (state, policy, now) so it can be tested with
 * plain numbers. No Express, no Date.now(), no storage.
 *
 * A key's bucket holds up to `policy.burst` tokens and refills continuously at
 * `policy.limit` tokens per `policy.windowMs` (free: 60 per minute = one token per second).
 * Each request spends one token.
 *
 *   state   { tokens, updatedAt } from the store, or undefined for a new key (starts full)
 *   policy  { limit, burst, windowMs } for the key's plan tier
 *   now     epoch milliseconds (the injected clock)
 */

// Floating-point refill can land a hair under a whole token (0.9999999999) right when
// Retry-After says it should be available. Treat anything this close to 1 as 1.
const EPSILON = 1e-9;

function takeToken(state, policy, now) {
  const { limit, burst, windowMs } = policy;

  // Refill for the time since the last request, capped at the bucket size. Multiply before
  // dividing so whole intervals refill to exact integers. Math.max(0, …) stops a clock that
  // steps backwards (NTP) from minting tokens.
  const elapsed = state ? Math.max(0, now - state.updatedAt) : 0;
  const available = state ? Math.min(burst, state.tokens + (elapsed * limit) / windowMs) : burst;

  const allowed = available >= 1 - EPSILON;
  const tokens = allowed ? Math.max(0, available - 1) : available;

  // Milliseconds until one whole token exists again (0 when this request was allowed).
  const retryAfterMs = allowed ? 0 : Math.ceil(((1 - tokens) * windowMs) / limit);
  // Epoch ms when the bucket is completely full again: what X-RateLimit-Reset reports.
  const resetAtMs = now + Math.ceil(((burst - tokens) * windowMs) / limit);

  return {
    allowed,
    state: { tokens, updatedAt: now },
    remaining: Math.floor(tokens + EPSILON),
    retryAfterMs,
    resetAtMs,
  };
}

module.exports = { takeToken };
