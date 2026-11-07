### What I built
A per-API-key token bucket, sized from each key's plan tier and mounted on `/v1` right after `requireApiKey`. When a key is over its limit, it gets a 429 with `rate_limited`, a whole-second `Retry-After` and the three `X-RateLimit` headers. `/health` is never limited. All 14 provided tests pass, plus 14 of my own, in about 0.3 s using the injected clock.

### Key decisions & trade-offs
- **Token bucket, not a fixed window.** A fixed window would let a free key send 120 requests in 2 seconds across a minute boundary, which is the incident pattern in miniature. The config's `burst` field maps straight onto bucket capacity, and each key stores just two numbers.
- **Keyed on the API key and its tier, never the IP.** Partners share NATs, and the incident came from one key.
- **Storage behind a one-method seam,** `consume(key, policy, now)`. The Redis version (OL-PLAT-413) is one Lua script in a new file.
- **Fail open if the store errors,** with a logged warning. This is an open decision, and I flagged it in the README.

### What I'd do with more time
Build the Redis store with a shared contract test suite, add per-route token costs, and alert when one key is throttled for more than 5 minutes.
