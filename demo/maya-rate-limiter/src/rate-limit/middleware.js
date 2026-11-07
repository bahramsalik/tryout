'use strict';

/**
 * Express middleware that enforces per-API-key limits. Mount it after requireApiKey so
 * req.client ({ key, tier }) is set: we key on the API key and its plan tier, never the IP.
 *
 * Headers on every response it handles:
 *   X-RateLimit-Limit      the tier's sustained limit per window
 *   X-RateLimit-Remaining  requests the key can make right now (whole tokens left)
 *   X-RateLimit-Reset      Unix time in seconds when the key's allowance is fully restored
 * Over the limit: 429 { error: { code: 'rate_limited', ... } } plus Retry-After in whole seconds.
 *
 *   store   anything with consume(key, policy, now) → { allowed, remaining, retryAfterMs, resetAtMs }
 *   limits  per-tier policies ({ free: { limit, burst, windowMs }, ... })
 *   now     clock returning epoch ms (injected so tests never sleep)
 *   logger  defaults to console; tests pass a silent one
 */
function rateLimit({ store, limits, now, logger = console }) {
  return async function rateLimitMiddleware(req, res, next) {
    const { key, tier } = req.client;

    // An unknown tier means a config mistake. Fall back to the strictest policy rather than
    // letting the key through unlimited.
    const policy = limits[tier] || limits.free;

    let result;
    try {
      result = await store.consume(key, policy, now());
    } catch (err) {
      // OPEN DECISION (see README): if the store is down we fail open. An outage of the
      // limiter should not become an outage of tracking for 300 carriers.
      logger.warn(`[rate-limit] store error, failing open for ${req.client.clientId}: ${err.message}`);
      return next();
    }

    res.set('X-RateLimit-Limit', String(policy.limit));
    res.set('X-RateLimit-Remaining', String(result.remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(result.resetAtMs / 1000)));

    if (result.allowed) return next();

    // Round up: telling a client to come back a fraction of a second too early guarantees
    // another 429.
    const retryAfter = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: {
        code: 'rate_limited',
        message: `Rate limit exceeded for your ${tier} plan (${policy.limit} requests per ${policy.windowMs / 1000}s). Retry in ${retryAfter}s.`,
      },
    });
  };
}

module.exports = { rateLimit };
