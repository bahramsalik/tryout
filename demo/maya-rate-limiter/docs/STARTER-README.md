# tracking-api (rate-limiting challenge copy)

This is a trimmed copy of Orbitline's public **Shipment Tracking API**: the same Express
structure, auth middleware and response shapes as production, with a JSON file standing in
for Postgres. Your job is ticket **OL-PLAT-412**: add per-API-key rate limiting.
Read `docs/incident-2026-10-14.md` for why.

## Setup

Requires Node.js 20 or newer.

~~~
npm install
npm test        # runs every file in test/ with node --test
npm start       # http://localhost:3000
~~~

Try it:

~~~
curl http://localhost:3000/health
curl -H "x-api-key: olk_free_3b9e17c2d4" http://localhost:3000/v1/shipments/OLX-48213907
~~~

## Layout

| Path | What it is |
|------|------------|
| `src/app.js` | `createApp(options)` builds the Express app. Start here. |
| `src/auth.js` | `x-api-key` middleware. Sets `req.client = { key, clientId, name, tier }`. |
| `src/config.js` | `DEFAULT_LIMITS`: limit, burst and window for each plan tier. |
| `config/api-keys.json` | Four keys: two `free`, one `partner`, one `enterprise`. |
| `src/data/shipments.json` | Ten sample shipments with tracking events. |
| `test/tracking.test.js` | Existing behavior. Passes today and must keep passing. |
| `test/rate-limit.test.js` | The behavior we want. **6 of its 7 tests fail today.** |

## What we expect

- Limits apply **per API key**, using the key's tier from `req.client.tier`.
- Over the limit: `429` with JSON `{ "error": { "code": "rate_limited", "message": "..." } }`
  and a `Retry-After` header (whole seconds until a request will succeed).
- Every `/v1` response carries:
  - `X-RateLimit-Limit`: the tier's `limit`
  - `X-RateLimit-Remaining`: requests the key can make right now
  - `X-RateLimit-Reset`: Unix time (seconds) when the key's allowance is fully restored
- `/health` is never limited.
- One instance today, so in-memory state is fine. We will move to Redis (OL-PLAT-413), so
  keep the storage behind a seam that a Redis version could replace.

## Testing hooks

Nobody wants a test that waits a minute. `createApp` accepts two options for tests:

~~~js
const app = createApp({
  now: () => clock.ms,                                    // fake clock, epoch ms
  limits: { free: { limit: 5, burst: 5, windowMs: 60000 } }, // merged over DEFAULT_LIMITS
});
~~~

Both are already resolved in `createApp` (`now`, `limits`), so your limiter just needs to use
them instead of `Date.now()` and `DEFAULT_LIMITS`. `test/rate-limit.test.js` shows the pattern:
it moves `clock.ms` forward instead of sleeping.

You may change any file, add files and add tests. Express is the only dependency today;
if you add another, say why in your README.
