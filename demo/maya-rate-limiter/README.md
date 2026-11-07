# OL-PLAT-412: per-key rate limiting for the Shipment Tracking API

Tryout challenge submission · about 4 hours · name left out for blind review

## TL;DR

- Each **API key** gets a **token bucket**, sized from its plan tier in `src/config.js`:
  - free: 60/min, burst 20
  - partner: 600/min, burst 100
  - enterprise: 3,000/min, burst 300
- Over the limit, the API returns `429 {"error":{"code":"rate_limited",…}}` with a **`Retry-After` in whole seconds** (rounded up).
- Every `/v1` response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`. `/health` is never limited.
- Storage sits behind a **one-method store interface**, `consume(key, policy, now)`. The Redis version for OL-PLAT-413 is a new file, not a rewrite.
- `npm test` passes all 14 provided tests plus 14 of mine, in about 0.3 s. It uses the injected clock and never sleeps.
- No new dependencies.

## Why a token bucket

Take the incident in miniature: a free key (60/min) sends **60 requests at 14:00:59 and 60 more at 14:01:00**.

| Algorithm | What gets through | State per key | Notes |
|---|---|---|---|
| Fixed window | **all 120** in 2 s, twice the limit | 1 counter | Simple, but a burst at the window edge is exactly what hurt us |
| Sliding log | 60 | up to `limit` timestamps (3,000 for enterprise) | Precise, but expensive in memory and in Redis |
| Sliding window counter | about 60 | 2 counters | A good approximation, but it has no notion of `burst` |
| **Token bucket** ✅ | **21** (20 burst + 1 refilled) | 2 numbers | The config's `burst` *is* the bucket size; at most burst + limit in any 60 s |

The deciding factor was that `src/config.js` already defines `burst` next to `limit`. A token bucket models that exactly: a key can send `burst` requests back to back after being idle, then a steady `limit` per minute. The test `minute boundary: 120 requests in 2 s get 21 through, where a fixed window lets all 120 through` pins the example above.

## How it works

| File | Responsibility |
|---|---|
| `src/rate-limit/token-bucket.js` | `takeToken(state, policy, now)`, a **pure function**: refill, spend, compute Retry-After and Reset. No Express, no `Date.now()`. |
| `src/rate-limit/memory-store.js` | `createMemoryStore()`: a `Map` of buckets **per app** (never module-level), with idle-key cleanup and no timers. |
| `src/rate-limit/middleware.js` | `rateLimit({ store, limits, now })`: sets the headers and returns 429s. |
| `src/app.js` | Mounts `requireApiKey` → `rateLimit` on `/v1`, so we key on `req.client.key` and `req.client.tier`. |

We key on the **API key, never the IP**. Ridgeway's 1,800 requests a minute came from one key, and many partners sit behind a single NAT. Unauthenticated requests are rejected before they spend anyone's tokens.

## Headers

| Header | Meaning | Example (free key, 1 request in) |
|---|---|---|
| `X-RateLimit-Limit` | The tier's sustained limit per window | `60` |
| `X-RateLimit-Remaining` | Whole requests the key can send right now | `19` |
| `X-RateLimit-Reset` | Unix time (s) when the bucket is full again | `1794063601` |
| `Retry-After` (429 only) | Whole seconds until one request will succeed | `1` |

`Remaining` is capped by `burst`, not `limit`: a free key shows at most 20. That's worth one sentence in the partner docs.

## Path to Redis (OL-PLAT-413)

1. Add `createRedisStore(redis)` with the same `consume(key, policy, now)`.
2. Do the refill and take in **one Lua script** (`EVALSHA`): `HMGET tokens updatedAt` → the same math as `takeToken` → `HSET` + `PEXPIRE` set to the time until full. That keeps the read-modify-write atomic across instances, so two instances can't spend the same token (the race condition from Operating Systems, now across machines).
3. Use Redis `TIME` inside the script instead of each instance's clock, so instances with clock skew agree.
4. Key format: `rl:{apiKey}`. The hash tag keeps it cluster-safe.
5. Run the same store contract tests against both stores.

## Open decisions (I need a call from the team)

1. **Fail open or fail closed when the store errors?** I fail open and log a warning, because a limiter outage shouldn't become a tracking outage for 300 carriers. Ops may prefer failing closed for free keys.
2. **Should 404s count?** Today they do, because they still cost a database lookup. 401s don't, because they're rejected before the limiter.
3. **Is a partner burst of 100 right?** It lets a dispatcher board refresh 100 loads at once. We should confirm that with Ridgeway.
4. **Unknown tier** falls back to the free policy (the strictest) rather than unlimited.

## Testing

- `npm test` runs `node --test`. I didn't change either of the provided test files.
- `test/token-bucket.test.js` covers the bucket math with plain numbers: burst, continuous refill, Retry-After and Reset, the idle cap, a clock that steps backwards, and the minute-boundary example.
- `test/rate-limit.extra.test.js` covers HTTP behavior: the enterprise tier, the 429 body, isolation between app instances, failing open, the unknown-tier fallback and idle-key cleanup.

## With more time

- The Redis store and a shared contract test suite.
- Per-route costs, e.g. charging `/events` 2 tokens.
- A metric for 429s per key, plus an alert when one key is throttled for more than 5 minutes. We'd have found Ridgeway in about a minute instead of 16.

## How I used AI

I used an AI assistant to compare rate-limiting algorithms and to sanity-check my Retry-After rounding. It suggested calling `Date.now()` inside the middleware, which I rejected because tests need the injected clock. I wrote the code and the tests myself and verified every suggestion against the tests.

<sub>The original starter README is in [`docs/STARTER-README.md`](docs/STARTER-README.md).</sub>
