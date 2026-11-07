'use strict';

/**
 * Rate-limit policy per plan tier (agreed with Customer Experience, see docs/incident-2026-10-14.md).
 *
 * limit    sustained requests allowed per window, per API key
 * burst    how many requests a key may send back-to-back after being idle
 * windowMs length of the window the limit is expressed over
 */
const DEFAULT_LIMITS = {
  free: { limit: 60, burst: 20, windowMs: 60_000 },
  partner: { limit: 600, burst: 100, windowMs: 60_000 },
  enterprise: { limit: 3000, burst: 300, windowMs: 60_000 },
};

module.exports = { DEFAULT_LIMITS };
