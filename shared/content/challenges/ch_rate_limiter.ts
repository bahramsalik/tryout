import type { ChallengeModule } from '../lib.ts';

const brief = `## Context

On October 14 a partner's dispatcher board started polling our Shipment Tracking API once a second for every open load. For 40 minutes a single API key sent about 1,800 requests a minute, roughly 72,000 in all. The API has no per-key limits, so that traffic competed with everyone else's for the same database connection pool. p95 latency for all of our ~300 carriers rose from 120 ms to 2.4 s, and 3.1% of requests timed out. The only way we could stop it was to phone the partner and ask them to roll back.

The API answers about 40 million status checks a day. We need our own lever, and that's ticket OL-PLAT-412.

## The task

Add per-API-key rate limiting to the trimmed copy of the API in the starter kit:

- Limits follow the key's plan tier: free 60 requests/min, partner 600/min, enterprise 3,000/min, each with a small burst allowance (see \`src/config.js\`).
- Over the limit, return \`429\` with a JSON error and a \`Retry-After\` header in whole seconds.
- Every \`/v1\` response carries \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\` and \`X-RateLimit-Reset\`.
- \`/health\` is never limited.
- We run one instance today, so in-memory state is fine. We move to Redis next quarter, so keep storage behind a seam that a Redis version could replace.

Make \`test/rate-limit.test.js\` pass, add tests of your own, and explain in your README which algorithm you chose and why.

## Constraints

- Time box: about 4 hours.
- Node.js 20+ and Express. If you add a dependency, justify it in one sentence in your README.
- Tests must not wait out real minutes. Use the \`now\` and \`limits\` hooks on \`createApp\`.
- Out of scope: running Redis, multi-instance coordination, billing and plan changes, and the auth scheme.
- AI assistants are welcome. Tell us how you used them.

## What we provide

- \`src/app.js\`, \`src/auth.js\`, \`src/config.js\`, \`src/server.js\`: the Express app, the \`x-api-key\` middleware and the tier limits
- \`config/api-keys.json\`: four test keys (two free, one partner, one enterprise)
- \`src/data/shipments.json\`: ten sample shipments with tracking events
- \`test/tracking.test.js\` (passes) and \`test/rate-limit.test.js\` (6 of its 7 tests fail today)
- \`docs/incident-2026-10-14.md\`: our write-up of the incident
- \`README.md\`: setup, code layout and the testing hooks`;

const starterReadme = `# tracking-api (rate-limiting challenge copy)

This is a trimmed copy of Orbitline's public **Shipment Tracking API**: the same Express
structure, auth middleware and response shapes as production, with a JSON file standing in
for Postgres. Your job is ticket **OL-PLAT-412**: add per-API-key rate limiting.
Read \`docs/incident-2026-10-14.md\` for why.

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
| \`src/app.js\` | \`createApp(options)\` builds the Express app. Start here. |
| \`src/auth.js\` | \`x-api-key\` middleware. Sets \`req.client = { key, clientId, name, tier }\`. |
| \`src/config.js\` | \`DEFAULT_LIMITS\`: limit, burst and window for each plan tier. |
| \`config/api-keys.json\` | Four keys: two \`free\`, one \`partner\`, one \`enterprise\`. |
| \`src/data/shipments.json\` | Ten sample shipments with tracking events. |
| \`test/tracking.test.js\` | Existing behavior. Passes today and must keep passing. |
| \`test/rate-limit.test.js\` | The behavior we want. **6 of its 7 tests fail today.** |

## What we expect

- Limits apply **per API key**, using the key's tier from \`req.client.tier\`.
- Over the limit: \`429\` with JSON \`{ "error": { "code": "rate_limited", "message": "..." } }\`
  and a \`Retry-After\` header (whole seconds until a request will succeed).
- Every \`/v1\` response carries:
  - \`X-RateLimit-Limit\`: the tier's \`limit\`
  - \`X-RateLimit-Remaining\`: requests the key can make right now
  - \`X-RateLimit-Reset\`: Unix time (seconds) when the key's allowance is fully restored
- \`/health\` is never limited.
- One instance today, so in-memory state is fine. We will move to Redis (OL-PLAT-413), so
  keep the storage behind a seam that a Redis version could replace.

## Testing hooks

Nobody wants a test that waits a minute. \`createApp\` accepts two options for tests:

~~~js
const app = createApp({
  now: () => clock.ms,                                    // fake clock, epoch ms
  limits: { free: { limit: 5, burst: 5, windowMs: 60000 } }, // merged over DEFAULT_LIMITS
});
~~~

Both are already resolved in \`createApp\` (\`now\`, \`limits\`), so your limiter just needs to use
them instead of \`Date.now()\` and \`DEFAULT_LIMITS\`. \`test/rate-limit.test.js\` shows the pattern:
it moves \`clock.ms\` forward instead of sleeping.

You may change any file, add files and add tests. Express is the only dependency today;
if you add another, say why in your README.
`;

const starterPackageJson = `{
  "name": "tracking-api",
  "version": "0.9.0",
  "private": true,
  "description": "Orbitline Shipment Tracking API (trimmed copy for the rate-limiting challenge)",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}
`;

const starterAppJs = `'use strict';

const express = require('express');
const { loadApiKeys, requireApiKey } = require('./auth');
const { DEFAULT_LIMITS } = require('./config');
const shipments = require('./data/shipments.json');

const byTrackingNumber = new Map(shipments.map((s) => [s.trackingNumber, s]));

/**
 * Builds the Express app. Options exist so tests can control the environment:
 *
 *   keys    Map of API key -> client record (default: config/api-keys.json)
 *   limits  per-tier overrides merged over DEFAULT_LIMITS, e.g. { free: { limit: 5, burst: 5, windowMs: 60000 } }
 *   now     clock function returning epoch milliseconds (default: Date.now)
 *
 * \`limits\` and \`now\` are resolved below but nothing uses them yet: that is your task.
 */
function createApp(options = {}) {
  const keys = options.keys || loadApiKeys();
  const now = options.now || Date.now;
  const limits = { ...DEFAULT_LIMITS, ...options.limits };

  const app = express();
  app.disable('x-powered-by');
  app.locals.now = now;
  app.locals.limits = limits;

  // Load balancer health check. Must never be rate limited or require a key.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', shipments: byTrackingNumber.size });
  });

  app.use('/v1', requireApiKey(keys));

  app.get('/v1/shipments/:trackingNumber', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    const { events, ...summary } = shipment;
    return res.json({ ...summary, lastEvent: events[events.length - 1] });
  });

  app.get('/v1/shipments/:trackingNumber/events', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    return res.json({ trackingNumber: shipment.trackingNumber, events: shipment.events });
  });

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: \`No route for \${req.method} \${req.path}\` } });
  });

  return app;
}

module.exports = { createApp };
`;

const starterAuthJs = `'use strict';

const path = require('node:path');
const fs = require('node:fs');

const KEYS_FILE = path.join(__dirname, '..', 'config', 'api-keys.json');

/** Loads API keys from config/api-keys.json into a Map of key -> client record. */
function loadApiKeys(file = KEYS_FILE) {
  const records = JSON.parse(fs.readFileSync(file, 'utf8'));
  return new Map(records.map((record) => [record.key, record]));
}

/**
 * Express middleware: requires a valid \`x-api-key\` header.
 * On success, the client record ({ key, clientId, name, tier }) is stored on \`req.client\`.
 */
function requireApiKey(keys) {
  return function apiKeyAuth(req, res, next) {
    const key = req.get('x-api-key');
    if (!key) {
      return res.status(401).json({ error: { code: 'missing_api_key', message: 'Send your API key in the x-api-key header.' } });
    }
    const client = keys.get(key);
    if (!client || client.disabled) {
      return res.status(401).json({ error: { code: 'invalid_api_key', message: 'This API key is not recognized.' } });
    }
    req.client = client;
    return next();
  };
}

module.exports = { loadApiKeys, requireApiKey };
`;

const starterConfigJs = `'use strict';

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
`;

const starterServerJs = `'use strict';

const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, () => {
  console.log(\`tracking-api listening on http://localhost:\${port}\`);
});
`;

const apiKeysJson = `[
  {
    "key": "olk_free_3b9e17c2d4",
    "clientId": "cli_0141",
    "name": "Fennimore Hardware (shipper, self-serve)",
    "tier": "free"
  },
  {
    "key": "olk_free_8a20f6e15b",
    "clientId": "cli_0187",
    "name": "Quarry Lane Ceramics (shipper, self-serve)",
    "tier": "free"
  },
  {
    "key": "olk_partner_51c7aa093e",
    "clientId": "cli_0032",
    "name": "Ridgeway Dispatch (partner app)",
    "tier": "partner"
  },
  {
    "key": "olk_ent_d06b4f92c8",
    "clientId": "cli_0007",
    "name": "Lakeshore Freight Co (carrier, enterprise)",
    "tier": "enterprise"
  }
]
`;

const shipmentsJson = `[
  {
    "trackingNumber": "OLX-48213907",
    "carrier": "Lakeshore Freight Co",
    "shipper": "Fennimore Hardware",
    "origin": "Madison, WI",
    "destination": "Rockford, IL",
    "status": "DELIVERED",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Madison, WI",
        "at": "2026-11-02T13:10:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Janesville, WI",
        "at": "2026-11-02T15:42:00Z"
      },
      {
        "code": "OUT_FOR_DELIVERY",
        "location": "Rockford, IL",
        "at": "2026-11-03T13:05:00Z"
      },
      {
        "code": "DELIVERED",
        "location": "Rockford, IL",
        "at": "2026-11-03T17:31:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48214455",
    "carrier": "Prairie Line Carriers",
    "shipper": "Quarry Lane Ceramics",
    "origin": "Peoria, IL",
    "destination": "Des Moines, IA",
    "status": "IN_TRANSIT",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Peoria, IL",
        "at": "2026-11-05T14:20:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Galesburg, IL",
        "at": "2026-11-05T17:02:00Z"
      },
      {
        "code": "ARRIVED_AT_TERMINAL",
        "location": "Davenport, IA",
        "at": "2026-11-05T21:48:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48215021",
    "carrier": "Calumet Express",
    "shipper": "Brightwater Pumps",
    "origin": "Gary, IN",
    "destination": "Toledo, OH",
    "status": "OUT_FOR_DELIVERY",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Gary, IN",
        "at": "2026-11-04T12:00:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Elkhart, IN",
        "at": "2026-11-04T14:35:00Z"
      },
      {
        "code": "ARRIVED_AT_TERMINAL",
        "location": "Toledo, OH",
        "at": "2026-11-04T19:12:00Z"
      },
      {
        "code": "OUT_FOR_DELIVERY",
        "location": "Toledo, OH",
        "at": "2026-11-05T12:40:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48215873",
    "carrier": "Lakeshore Freight Co",
    "shipper": "Halvorsen Supply",
    "origin": "Milwaukee, WI",
    "destination": "Grand Rapids, MI",
    "status": "EXCEPTION",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Milwaukee, WI",
        "at": "2026-11-03T15:00:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Chicago, IL",
        "at": "2026-11-03T18:22:00Z"
      },
      {
        "code": "EXCEPTION",
        "location": "Benton Harbor, MI",
        "at": "2026-11-04T10:15:00Z",
        "note": "Consignee dock closed; delivery rescheduled"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48216340",
    "carrier": "Driftless Motor Lines",
    "shipper": "Fennimore Hardware",
    "origin": "La Crosse, WI",
    "destination": "Rochester, MN",
    "status": "DELIVERED",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "La Crosse, WI",
        "at": "2026-10-30T13:30:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Winona, MN",
        "at": "2026-10-30T15:05:00Z"
      },
      {
        "code": "DELIVERED",
        "location": "Rochester, MN",
        "at": "2026-10-30T19:48:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48217112",
    "carrier": "Prairie Line Carriers",
    "shipper": "Copperfield Farm Co-op",
    "origin": "Springfield, IL",
    "destination": "St. Louis, MO",
    "status": "PICKED_UP",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Springfield, IL",
        "at": "2026-11-06T16:45:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48217698",
    "carrier": "Tri-Rivers Cartage",
    "shipper": "Brightwater Pumps",
    "origin": "Fort Wayne, IN",
    "destination": "Columbus, OH",
    "status": "IN_TRANSIT",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Fort Wayne, IN",
        "at": "2026-11-05T13:15:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Lima, OH",
        "at": "2026-11-05T15:50:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48218254",
    "carrier": "Calumet Express",
    "shipper": "Northgate Office Interiors",
    "origin": "Hammond, IN",
    "destination": "Indianapolis, IN",
    "status": "DELIVERED",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Hammond, IN",
        "at": "2026-11-01T12:30:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Lafayette, IN",
        "at": "2026-11-01T15:10:00Z"
      },
      {
        "code": "OUT_FOR_DELIVERY",
        "location": "Indianapolis, IN",
        "at": "2026-11-02T13:00:00Z"
      },
      {
        "code": "DELIVERED",
        "location": "Indianapolis, IN",
        "at": "2026-11-02T16:27:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48219006",
    "carrier": "Driftless Motor Lines",
    "shipper": "Quarry Lane Ceramics",
    "origin": "Dubuque, IA",
    "destination": "Cedar Rapids, IA",
    "status": "IN_TRANSIT",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Dubuque, IA",
        "at": "2026-11-06T14:05:00Z"
      },
      {
        "code": "IN_TRANSIT",
        "location": "Monticello, IA",
        "at": "2026-11-06T15:20:00Z"
      }
    ]
  },
  {
    "trackingNumber": "OLX-48219531",
    "carrier": "Lakeshore Freight Co",
    "shipper": "Copperfield Farm Co-op",
    "origin": "Kenosha, WI",
    "destination": "Chicago, IL",
    "status": "OUT_FOR_DELIVERY",
    "events": [
      {
        "code": "PICKED_UP",
        "location": "Kenosha, WI",
        "at": "2026-11-06T13:40:00Z"
      },
      {
        "code": "ARRIVED_AT_TERMINAL",
        "location": "Chicago, IL",
        "at": "2026-11-06T16:55:00Z"
      },
      {
        "code": "OUT_FOR_DELIVERY",
        "location": "Chicago, IL",
        "at": "2026-11-07T12:10:00Z"
      }
    ]
  }
]
`;

const trackingTestJs = `'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

const FREE_KEY = 'olk_free_3b9e17c2d4';
let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = \`http://127.0.0.1:\${server.address().port}\`;
});

after(() => new Promise((resolve) => server.close(resolve)));

function get(path, key = FREE_KEY) {
  return fetch(baseUrl + path, { headers: key ? { 'x-api-key': key } : {} });
}

test('GET /health works without an API key', async () => {
  const res = await get('/health', null);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

test('rejects requests without an API key', async () => {
  const res = await get('/v1/shipments/OLX-48213907', null);
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error.code, 'missing_api_key');
});

test('rejects unknown API keys', async () => {
  const res = await get('/v1/shipments/OLX-48213907', 'olk_free_not_a_real_key');
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error.code, 'invalid_api_key');
});

test('returns a shipment summary with its latest event', async () => {
  const res = await get('/v1/shipments/OLX-48213907');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'DELIVERED');
  assert.equal(body.carrier, 'Lakeshore Freight Co');
  assert.equal(body.lastEvent.location, 'Rockford, IL');
});

test('tracking numbers are case-insensitive', async () => {
  const res = await get('/v1/shipments/olx-48215873');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'EXCEPTION');
});

test('returns events in chronological order', async () => {
  const res = await get('/v1/shipments/OLX-48214455/events');
  assert.equal(res.status, 200);
  const { events } = await res.json();
  const times = events.map((e) => Date.parse(e.at));
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
});

test('returns 404 for an unknown tracking number', async () => {
  const res = await get('/v1/shipments/OLX-00000000');
  assert.equal(res.status, 404);
});
`;

const rateLimitTestJs = `'use strict';

// These tests describe the behavior we want. They fail until rate limiting is implemented.
// They use a fake clock and tiny limits so they run in milliseconds: see "Testing hooks" in README.md.

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

const FREE_A = 'olk_free_3b9e17c2d4';
const FREE_B = 'olk_free_8a20f6e15b';
const PARTNER = 'olk_partner_51c7aa093e';

const TEST_LIMITS = {
  free: { limit: 5, burst: 5, windowMs: 60_000 },
  partner: { limit: 20, burst: 20, windowMs: 60_000 },
};

let clock;
let server;
let baseUrl;

beforeEach(async () => {
  clock = { ms: Date.UTC(2026, 10, 7, 15, 0, 0) };
  server = createApp({ limits: TEST_LIMITS, now: () => clock.ms }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = \`http://127.0.0.1:\${server.address().port}\`;
});

afterEach(() => new Promise((resolve) => server.close(resolve)));

function track(key, path = '/v1/shipments/OLX-48213907') {
  return fetch(baseUrl + path, { headers: { 'x-api-key': key } });
}

async function sendN(key, n) {
  const statuses = [];
  for (let i = 0; i < n; i++) statuses.push((await track(key)).status);
  return statuses;
}

test('a free key gets 429 once it exceeds its limit', async () => {
  const statuses = await sendN(FREE_A, 5);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200]);

  const res = await track(FREE_A);
  assert.equal(res.status, 429);
  const body = await res.json();
  assert.equal(body.error.code, 'rate_limited');
});

test('429 responses include a whole-second Retry-After', async () => {
  await sendN(FREE_A, 5);
  const res = await track(FREE_A);
  assert.equal(res.status, 429);
  const retryAfter = res.headers.get('retry-after');
  assert.match(retryAfter ?? '', /^\\d+$/, 'Retry-After should be an integer number of seconds');
  assert.ok(Number(retryAfter) >= 1 && Number(retryAfter) <= 60);
});

test('requests succeed again once Retry-After has passed', async () => {
  await sendN(FREE_A, 5);
  const blocked = await track(FREE_A);
  assert.equal(blocked.status, 429);

  clock.ms += Number(blocked.headers.get('retry-after')) * 1000;
  assert.equal((await track(FREE_A)).status, 200);
});

test('limits are per API key, not shared', async () => {
  await sendN(FREE_A, 6);
  assert.equal((await track(FREE_A)).status, 429);
  assert.equal((await track(FREE_B)).status, 200, 'another free key must not be affected');
});

test('limits follow the plan tier of the key', async () => {
  const statuses = await sendN(PARTNER, 20);
  assert.ok(statuses.every((s) => s === 200), 'partner keys get 20 requests in the test config');
  assert.equal((await track(PARTNER)).status, 429);
});

test('responses carry X-RateLimit-Limit, -Remaining and -Reset', async () => {
  const first = await track(FREE_A);
  assert.equal(first.headers.get('x-ratelimit-limit'), '5');
  assert.equal(first.headers.get('x-ratelimit-remaining'), '4');
  const reset = Number(first.headers.get('x-ratelimit-reset'));
  assert.ok(Number.isInteger(reset) && reset >= Math.floor(clock.ms / 1000), 'Reset is a Unix time in seconds');

  await sendN(FREE_A, 4);
  const blocked = await track(FREE_A);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('x-ratelimit-remaining'), '0');
});

test('/health is never rate limited', async () => {
  for (let i = 0; i < 30; i++) {
    assert.equal((await fetch(baseUrl + '/health')).status, 200);
  }
});
`;

const incidentMd = `# Incident INC-2291: Tracking API latency spike (2026-10-14)

**Severity:** SEV-2 · **Owner:** Platform team · **Status:** resolved, follow-ups open
**Duration:** 40 minutes (14:05 to 14:45 CT)

## Summary

A polling script in a partner integration sent about 1,800 requests per minute to
\`GET /v1/shipments/:trackingNumber\` for 40 minutes, roughly 72,000 requests from a single
API key (\`olk_partner_51c7aa093e\`, Ridgeway Dispatch). The Tracking API has no per-key
limits, so this traffic competed with every other client for the same Postgres connection
pool. p95 latency for all customers rose from 120 ms to 2.4 s, and 3.1% of requests timed
out at the load balancer (504).

## Timeline (CT)

| Time  | Event |
|-------|-------|
| 14:02 | Ridgeway deploys a dispatcher-board release that polls every open load once per second instead of once per minute. |
| 14:05 | p95 latency crosses the 500 ms alert threshold. The on-call engineer is paged. |
| 14:12 | Connection pool saturated (40 of 40 in use). The 504 rate climbs to 3.1%. |
| 14:21 | Traffic is traced to a single partner key using the request logs. |
| 14:30 | Customer Experience reaches Ridgeway's on-call engineer by phone. |
| 14:45 | Ridgeway rolls back. Latency returns to normal within two minutes. |

## Impact

- About 300 carriers and their shippers saw slow or failed tracking lookups for 40 minutes.
- 11 support tickets, including two from enterprise carriers asking for credits.
- No data loss.

## What went well

- Request logs carry the API key, so the source was identified in 16 minutes.

## What went wrong

- We could only stop the traffic by asking the customer to roll back. We had no lever of our own.
- One client's mistake degraded service for everyone.

## Follow-ups

| ID | Action | Owner | Status |
|----|--------|-------|--------|
| OL-PLAT-412 | Per-key rate limiting by plan tier (free 60/min, partner 600/min, enterprise 3,000/min, each with a small burst allowance). Over-limit requests get 429 with Retry-After. | Platform | **Open** |
| OL-PLAT-413 | Move limiter state to Redis once the API runs on more than one instance (planned for Q1). | Platform | Planned |
| OL-CX-88 | Publish polling guidance (use webhooks; poll no more than once a minute per shipment). | Customer Experience | Done |
`;

const strongNotes = `### What I built

A token-bucket limiter per API key, in three pieces: a pure \`takeToken(state, policy, nowMs)\` function, a \`MemoryStore\` behind a one-method interface (\`consume\`), and Express middleware mounted on \`/v1\` after auth. All 21 tests pass, including 7 new unit tests that treat time as a plain number, so nothing sleeps.

### Key decisions & trade-offs

- **Token bucket over a fixed window.** The config already has \`burst\`, and a fixed window lets a key double its limit around a minute boundary. One test steps through a full minute in 100 ms ticks and checks the bucket never allows more than \`burst + limit\`.
- **Exact refill math.** The refill multiplies before it divides, so whole-token refills land exactly and \`Retry-After\` is never off by one.
- **Fail open and fall back to free.** If the store throws, the request goes through. A tier with no policy gets the free policy. Both are judgment calls, so I flagged them in the README.
- **Sweeping.** A full bucket behaves the same as a missing one, so \`MemoryStore\` deletes full buckets every 10,000 operations.

### What I'd do with more time

I'd write the Redis Lua script and run the same unit tests against it. I'd add tests for the fail-open and unknown-tier paths. I'd also log a metric whenever a key gets limited, so Customer Experience can see who is near their limit before they complain.`;

const strongReadme = `# OL-PLAT-412: per-key rate limiting

All 21 tests pass (\`npm test\`): the 7 provided rate-limit tests, the 7 existing tracking
tests, and 7 new unit tests in \`test/token-bucket.test.js\`. No new dependencies.

## How it works

\`/v1\` requests go through \`requireApiKey\`, then \`rateLimit\`. \`/health\` is registered before
both, so it is never limited.

| File | Role |
|------|------|
| \`src/rate-limit/token-bucket.js\` | Pure \`takeToken(state, policy, nowMs)\`: the algorithm, no I/O |
| \`src/rate-limit/memory-store.js\` | \`MemoryStore.consume(key, policy, nowMs)\`: per-key state plus sweeping |
| \`src/rate-limit/middleware.js\` | Picks the tier policy, sets headers, returns 429 |

Each key has a bucket of \`burst\` tokens that refills at \`limit\` per \`windowMs\`
(free: 20 tokens, 1 per second). A request costs one token.

## Why a token bucket

| | Fixed window | Sliding log | Token bucket |
|---|---|---|---|
| Edge burst | Up to 2x limit around :00 | None | Bounded by \`burst\` |
| Memory per key | 1 counter | 1 entry per request | 2 numbers |
| Maps to our config | Ignores \`burst\` | Ignores \`burst\` | Uses \`limit\` and \`burst\` directly |

A fixed window would let the polling script from INC-2291 send 120 requests in two seconds
around a minute boundary. A sliding log fixes that but stores up to 600 timestamps per
partner key. The bucket needs two numbers per key and is a single atomic step, which also
makes it easy to port to Redis.

## Headers

- \`X-RateLimit-Limit\`: the tier's per-minute \`limit\` (60 for free)
- \`X-RateLimit-Remaining\`: whole tokens left, so at most \`burst\`
- \`X-RateLimit-Reset\`: Unix seconds when the bucket is full again
- \`Retry-After\` (429 only): seconds until one token is back, at least 1

## Moving to Redis (OL-PLAT-413)

Write a \`RedisStore\` with the same \`consume\` signature. It should run the \`takeToken\` logic as
one Lua script over a hash \`{tokens, updatedAt}\`, with \`PEXPIRE\` set to the time until the
bucket is full. Then pass it in with \`createApp({ store })\`. The middleware does not change.

## Decisions to check with the team

- **Fail open:** if the store throws, the request is allowed and a warning is logged.
- **Unknown tier:** falls back to the free policy rather than no limit.
- **Per key, not per client:** a customer with two keys gets two buckets, as the ticket says.
`;

const strongTokenBucketJs = `'use strict';

/**
 * Token bucket, as a pure function so it can be tested without a server or a clock.
 *
 * A bucket holds up to \`policy.burst\` tokens and refills at \`policy.limit\` tokens per
 * \`policy.windowMs\`. Each request takes one token. An idle key can therefore send \`burst\`
 * requests back-to-back, but cannot average more than \`limit\` per window.
 *
 * @param {{ tokens: number, updatedAt: number } | undefined} state  previous state, or undefined for a new key
 * @param {{ limit: number, burst: number, windowMs: number }} policy
 * @param {number} nowMs
 */
function takeToken(state, policy, nowMs) {
  const capacity = policy.burst;
  const msPerToken = policy.windowMs / policy.limit;

  let tokens = capacity;
  if (state) {
    // Clamp at 0 so a clock that steps backwards can never mint tokens.
    const elapsed = Math.max(0, nowMs - state.updatedAt);
    // Multiply before dividing so whole-token refills stay exact (12000 * 5 / 60000 === 1).
    tokens = Math.min(capacity, state.tokens + (elapsed * policy.limit) / policy.windowMs);
  }

  const allowed = tokens >= 1;
  if (allowed) tokens -= 1;

  const fullAtMs = nowMs + Math.ceil((capacity - tokens) * msPerToken);
  return {
    allowed,
    remaining: Math.floor(tokens),
    retryAfterMs: allowed ? 0 : Math.ceil((1 - tokens) * msPerToken),
    resetAtMs: fullAtMs,
    state: { tokens, updatedAt: Math.max(nowMs, state ? state.updatedAt : nowMs), fullAtMs },
  };
}

module.exports = { takeToken };
`;

const strongMemoryStoreJs = `'use strict';

const { takeToken } = require('./token-bucket');

/**
 * In-memory bucket store for a single instance.
 *
 * Store contract (what a RedisStore must also implement for OL-PLAT-413):
 *   consume(key, policy, nowMs) -> Promise<{ allowed, remaining, retryAfterMs, resetAtMs }>
 * The read-refill-take-write must be atomic per key. Here that is free (one JS thread);
 * in Redis it becomes one Lua script over a hash { tokens, updatedAt } with PEXPIRE set to
 * the time-to-full, so idle keys expire on their own.
 */
class MemoryStore {
  constructor({ sweepEvery = 10_000 } = {}) {
    this.buckets = new Map();
    this.sweepEvery = sweepEvery;
    this.ops = 0;
  }

  async consume(key, policy, nowMs) {
    const { state, ...decision } = takeToken(this.buckets.get(key), policy, nowMs);
    this.buckets.set(key, state);
    if (++this.ops % this.sweepEvery === 0) this.sweep(nowMs);
    return decision;
  }

  /** A full bucket behaves exactly like a missing one, so it is safe to forget it. */
  sweep(nowMs) {
    for (const [key, state] of this.buckets) {
      if (state.fullAtMs <= nowMs) this.buckets.delete(key);
    }
  }

  get size() {
    return this.buckets.size;
  }
}

module.exports = { MemoryStore };
`;

const strongMiddlewareJs = `'use strict';

const { MemoryStore } = require('./memory-store');

/**
 * Per-API-key rate limiting. Mount after requireApiKey so req.client is set.
 *
 * @param {object} options
 * @param {Record<string, { limit: number, burst: number, windowMs: number }>} options.limits
 * @param {() => number} options.now   epoch ms (injected so tests control time)
 * @param {{ consume: Function }} [options.store]
 * @param {(msg: string, err?: Error) => void} [options.warn]
 */
function rateLimit({ limits, now, store = new MemoryStore(), warn = console.warn }) {
  return async function rateLimiter(req, res, next) {
    const { key, tier } = req.client;
    let policy = limits[tier];
    if (!policy) {
      // An unknown tier is a config mistake. Use the strictest plan rather than no limit.
      warn(\`rate-limit: no policy for tier "\${tier}", using free\`);
      policy = limits.free;
    }

    let decision;
    try {
      decision = await store.consume(key, policy, now());
    } catch (err) {
      // Fail open: a limiter outage should not take tracking down with it.
      warn('rate-limit: store unavailable, allowing request', err);
      return next();
    }

    res.set('X-RateLimit-Limit', String(policy.limit));
    res.set('X-RateLimit-Remaining', String(decision.remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(decision.resetAtMs / 1000)));

    if (decision.allowed) return next();

    const retryAfter = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: {
        code: 'rate_limited',
        message: \`This API key is limited to \${policy.limit} requests per minute on the \${tier} plan. Retry in \${retryAfter}s.\`,
      },
    });
  };
}

module.exports = { rateLimit };
`;

const strongAppJs = `'use strict';

const express = require('express');
const { loadApiKeys, requireApiKey } = require('./auth');
const { DEFAULT_LIMITS } = require('./config');
const { rateLimit } = require('./rate-limit/middleware');
const { MemoryStore } = require('./rate-limit/memory-store');
const shipments = require('./data/shipments.json');

const byTrackingNumber = new Map(shipments.map((s) => [s.trackingNumber, s]));

/**
 * Builds the Express app. Options exist so tests can control the environment:
 *
 *   keys    Map of API key -> client record (default: config/api-keys.json)
 *   limits  per-tier overrides merged over DEFAULT_LIMITS, e.g. { free: { limit: 5, burst: 5, windowMs: 60000 } }
 *   now     clock function returning epoch milliseconds (default: Date.now)
 *   store   rate-limit store (default: a new MemoryStore; a RedisStore later, see OL-PLAT-413)
 */
function createApp(options = {}) {
  const keys = options.keys || loadApiKeys();
  const now = options.now || Date.now;
  const limits = { ...DEFAULT_LIMITS, ...options.limits };

  const app = express();
  app.disable('x-powered-by');

  // Load balancer health check. Must never be rate limited or require a key.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', shipments: byTrackingNumber.size });
  });

  app.use('/v1', requireApiKey(keys));
  app.use('/v1', rateLimit({ limits, now, store: options.store || new MemoryStore() }));

  app.get('/v1/shipments/:trackingNumber', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    const { events, ...summary } = shipment;
    return res.json({ ...summary, lastEvent: events[events.length - 1] });
  });

  app.get('/v1/shipments/:trackingNumber/events', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    return res.json({ trackingNumber: shipment.trackingNumber, events: shipment.events });
  });

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: \`No route for \${req.method} \${req.path}\` } });
  });

  return app;
}

module.exports = { createApp };
`;

const strongTokenBucketTestJs = `'use strict';

// Unit tests for the bucket math and the store. No server, no sleeps: time is just a number.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { takeToken } = require('../src/rate-limit/token-bucket');
const { MemoryStore } = require('../src/rate-limit/memory-store');

const FREE = { limit: 60, burst: 20, windowMs: 60_000 }; // 1 token per second, bucket of 20
const T0 = Date.UTC(2026, 10, 7, 15, 0, 0);

function drain(policy, n, at = T0) {
  let state;
  let last;
  for (let i = 0; i < n; i++) {
    last = takeToken(state, policy, at);
    state = last.state;
  }
  return { state, last };
}

test('a new key starts with a full bucket of \`burst\` tokens', () => {
  const first = takeToken(undefined, FREE, T0);
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 19);
});

test('the request after the burst is rejected with a 1 s retry', () => {
  const { state } = drain(FREE, 20);
  const next = takeToken(state, FREE, T0);
  assert.equal(next.allowed, false);
  assert.equal(next.retryAfterMs, 1000);
});

test('refills at limit/window and never above burst', () => {
  const { state } = drain(FREE, 20);
  assert.equal(takeToken(state, FREE, T0 + 5_000).remaining, 4); // 5 refilled, 1 taken
  assert.equal(takeToken(state, FREE, T0 + 3_600_000).remaining, 19); // capped at 20
});

test('reset is when the bucket will be full again', () => {
  const { last } = drain(FREE, 20);
  assert.equal(last.resetAtMs, T0 + 20_000);
});

test('no more than burst + limit requests in any 60 s, even across a minute boundary', () => {
  // The fixed-window failure mode: everything at :59.9 then everything at :00.0.
  let state;
  let allowed = 0;
  for (let ms = 0; ms < 60_000; ms += 100) {
    const r = takeToken(state, FREE, T0 + ms);
    state = r.state;
    if (r.allowed) allowed++;
  }
  assert.ok(allowed <= FREE.burst + FREE.limit, \`allowed \${allowed}\`);
});

test('a clock that steps backwards does not mint tokens', () => {
  const { state } = drain(FREE, 20);
  const r = takeToken(state, FREE, T0 - 30_000);
  assert.equal(r.allowed, false);
});

test('MemoryStore keeps keys separate and sweeps buckets that are full again', async () => {
  const store = new MemoryStore({ sweepEvery: 1_000_000 });
  await store.consume('a', FREE, T0);
  await store.consume('b', FREE, T0);
  assert.equal(store.size, 2);

  store.sweep(T0 + 500); // neither bucket is full yet
  assert.equal(store.size, 2);
  store.sweep(T0 + 1_000); // one token back = full
  assert.equal(store.size, 0);
});
`;

const solidNotes = `### What I built

A fixed-window limiter keyed by API key, with the limit taken from the key's tier (\`req.client.tier\`). Over the limit it returns 429 with \`Retry-After\` set to the seconds left in the window, and every \`/v1\` response gets the three X-RateLimit headers. It uses the \`now\` clock passed into \`createApp\`, so the provided tests pass. I also added three tests that run against short real windows.

### Key decisions & trade-offs

- **Fixed window** because it's the easiest to reason about and to check: one counter per key per window, and \`Retry-After\` is just the time left in that window.
- **Counters live inside \`createRateLimiter\`**, not at module level. My first version kept them at module level and the headers test failed, because state leaked from the previous test's app.
- **Known gap:** a fixed window allows a burst at the edge, up to twice the limit in about a second. I wrote this up in the README but didn't fix it, and I don't use the \`burst\` value yet.

### What I'd do with more time

Switch to a sliding window or a token bucket so \`burst\` means something, and put the Map behind an interface so it can be swapped for Redis.`;

const solidReadme = `# Rate limiting for the Tracking API

## What changed

- \`src/rateLimiter.js\`: a fixed-window limiter, keyed by API key, with the limit taken from
  the key's tier (\`req.client.tier\`). It uses the \`now\` clock passed into \`createApp\`.
- \`src/app.js\`: mounts the limiter on \`/v1\` right after \`requireApiKey\`. \`/health\` is defined
  earlier, so it is not limited.
- \`test/rate-limit-timing.test.js\`: three extra tests that use short real windows (300 ms to
  5 s), to check the limiter against the real clock as well as the fake one.

\`npm test\` passes: 17 tests (7 tracking, 7 provided rate-limit tests, 3 of mine).

## How it behaves

Each key gets \`limit\` requests per clock-aligned window (for example 15:00:00 to 15:00:59).
Request number \`limit + 1\` gets a 429 with \`Retry-After\` set to the seconds left in the
window. All \`/v1\` responses get \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\` and
\`X-RateLimit-Reset\` (the end of the current window, in Unix seconds).

## Known limitation

A fixed window allows a burst at the edges. A free key could send 60 requests at 15:00:59
and 60 more at 15:01:00, so 120 in about one second. I used the fixed window because it is
simple and easy to check. A sliding window or token bucket would fix this, and would
also use the \`burst\` value from the config, which my version currently ignores.

## Running

~~~
npm install
npm test
~~~
`;

const solidRateLimiterJs = `'use strict';

/**
 * Fixed-window rate limiter keyed by API key.
 * Each key gets \`limit\` requests per window; the window is aligned to the clock
 * (e.g. 15:00:00-15:00:59 for a 60 s window).
 */
function createRateLimiter({ limits, now }) {
  const counts = new Map(); // "apiKey:windowStart" -> request count

  return function rateLimiter(req, res, next) {
    const policy = limits[req.client.tier] || limits.free;
    const currentTime = now();
    const windowStart = Math.floor(currentTime / policy.windowMs) * policy.windowMs;
    const windowEnd = windowStart + policy.windowMs;
    const counterKey = \`\${req.client.key}:\${windowStart}\`;

    const count = (counts.get(counterKey) || 0) + 1;
    counts.set(counterKey, count);

    res.set('X-RateLimit-Limit', String(policy.limit));
    res.set('X-RateLimit-Remaining', String(Math.max(0, policy.limit - count)));
    res.set('X-RateLimit-Reset', String(Math.ceil(windowEnd / 1000)));

    if (count > policy.limit) {
      const retryAfterSeconds = Math.ceil((windowEnd - currentTime) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: { code: 'rate_limited', message: 'Too many requests for this API key. Try again later.' },
      });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
`;

const solidAppJs = `'use strict';

const express = require('express');
const { loadApiKeys, requireApiKey } = require('./auth');
const { DEFAULT_LIMITS } = require('./config');
const { createRateLimiter } = require('./rateLimiter');
const shipments = require('./data/shipments.json');

const byTrackingNumber = new Map(shipments.map((s) => [s.trackingNumber, s]));

/**
 * Builds the Express app. Options exist so tests can control the environment:
 *
 *   keys    Map of API key -> client record (default: config/api-keys.json)
 *   limits  per-tier overrides merged over DEFAULT_LIMITS, e.g. { free: { limit: 5, burst: 5, windowMs: 60000 } }
 *   now     clock function returning epoch milliseconds (default: Date.now)
 */
function createApp(options = {}) {
  const keys = options.keys || loadApiKeys();
  const now = options.now || Date.now;
  const limits = { ...DEFAULT_LIMITS, ...options.limits };

  const app = express();
  app.disable('x-powered-by');

  // Load balancer health check. Must never be rate limited or require a key.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', shipments: byTrackingNumber.size });
  });

  app.use('/v1', requireApiKey(keys));
  app.use('/v1', createRateLimiter({ limits, now }));

  app.get('/v1/shipments/:trackingNumber', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    const { events, ...summary } = shipment;
    return res.json({ ...summary, lastEvent: events[events.length - 1] });
  });

  app.get('/v1/shipments/:trackingNumber/events', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    return res.json({ trackingNumber: shipment.trackingNumber, events: shipment.events });
  });

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: \`No route for \${req.method} \${req.path}\` } });
  });

  return app;
}

module.exports = { createApp };
`;

const solidTimingTestJs = `'use strict';

// Extra checks with a short real window, to make sure the limiter works with the real clock too.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

const FREE_KEY = 'olk_free_3b9e17c2d4';
const ENTERPRISE_KEY = 'olk_ent_d06b4f92c8';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withServer(options, fn) {
  const server = createApp(options).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = \`http://127.0.0.1:\${server.address().port}\`;
  try {
    await fn((key) => fetch(base + '/v1/shipments/OLX-48219531', { headers: { 'x-api-key': key } }));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('window resets after windowMs with the real clock', async () => {
  await withServer({ limits: { free: { limit: 3, burst: 3, windowMs: 300 } } }, async (track) => {
    for (let i = 0; i < 3; i++) assert.equal((await track(FREE_KEY)).status, 200);
    assert.equal((await track(FREE_KEY)).status, 429);
    await sleep(350);
    assert.equal((await track(FREE_KEY)).status, 200);
  });
});

test('enterprise keys use the enterprise limit', async () => {
  await withServer({ limits: { enterprise: { limit: 8, burst: 8, windowMs: 1000 } } }, async (track) => {
    for (let i = 0; i < 8; i++) assert.equal((await track(ENTERPRISE_KEY)).status, 200);
    assert.equal((await track(ENTERPRISE_KEY)).status, 429);
  });
});

test('Retry-After counts down to the end of the window', async () => {
  await withServer({ limits: { free: { limit: 1, burst: 1, windowMs: 5000 } } }, async (track) => {
    await track(FREE_KEY);
    const res = await track(FREE_KEY);
    assert.equal(res.status, 429);
    const retryAfter = Number(res.headers.get('retry-after'));
    assert.ok(retryAfter >= 1 && retryAfter <= 5);
  });
});
`;

const weakNotes = `### What I built

I added the \`express-rate-limit\` middleware to the app with a limit of 100 requests per minute. A script like the one in the incident would now get 429s instead of slowing everyone else down.

### Key decisions & trade-offs

- I used an existing package instead of writing my own limiter. It's widely used, so it probably handles edge cases better than I could in 4 hours.
- I used one limit (100/min) for everyone to keep it simple. It sits between the free and partner limits.
- I turned off the extra rate-limit headers to keep responses clean.
- I tested it by hand with a curl loop: the first 100 requests return 200 and the rest return 429.

### What I'd do with more time

I'd get the rest of \`test/rate-limit.test.js\` passing. The per-key tests fail because all test requests come from localhost, so I'd check whether the package can be configured for the test setup. I'd also add a different limit for each tier.`;

const weakReadme = `# Rate limiting

I added rate limiting with the \`express-rate-limit\` package. It is a widely used
middleware, so it is more reliable than writing a limiter from scratch.

## Changes

- Added \`express-rate-limit\` to \`package.json\`.
- In \`src/app.js\`, every request goes through the limiter: 100 requests per minute.
  After that the API returns 429 with the message "Too many requests, please try again later."

100 per minute is between the free limit (60) and the partner limit (600), so it should stop
a script like the one in the incident report without bothering normal users.

## Testing

I tested it by hand with a loop of curl requests:

~~~
for i in $(seq 1 110); do curl -s -o /dev/null -w "%{http_code}\\n" \\
  -H "x-api-key: olk_free_3b9e17c2d4" http://localhost:3000/v1/shipments/OLX-48213907; done
~~~

The first 100 return 200 and the rest return 429.

Some tests in \`test/rate-limit.test.js\` still fail. All test requests come from 127.0.0.1,
so they share one limit, and the test config uses limits of 5 and 20, which the package
does not read. In production, every client has its own IP, so this should be fine.

## How to run

~~~
npm install
npm start
~~~
`;

const weakAppJs = `'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { loadApiKeys, requireApiKey } = require('./auth');
const { DEFAULT_LIMITS } = require('./config');
const shipments = require('./data/shipments.json');

const byTrackingNumber = new Map(shipments.map((s) => [s.trackingNumber, s]));

/**
 * Builds the Express app. Options exist so tests can control the environment:
 *
 *   keys    Map of API key -> client record (default: config/api-keys.json)
 *   limits  per-tier overrides merged over DEFAULT_LIMITS, e.g. { free: { limit: 5, burst: 5, windowMs: 60000 } }
 *   now     clock function returning epoch milliseconds (default: Date.now)
 *
 * \`limits\` and \`now\` are resolved below but nothing uses them yet: that is your task.
 */
function createApp(options = {}) {
  const keys = options.keys || loadApiKeys();
  const now = options.now || Date.now;
  const limits = { ...DEFAULT_LIMITS, ...options.limits };

  const app = express();
  app.disable('x-powered-by');
  app.locals.now = now;
  app.locals.limits = limits;

  // Limit everyone to 100 requests per minute so one client can't overload the API.
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: false,
      legacyHeaders: false,
      message: 'Too many requests, please try again later.',
    }),
  );

  // Load balancer health check. Must never be rate limited or require a key.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', shipments: byTrackingNumber.size });
  });

  app.use('/v1', requireApiKey(keys));

  app.get('/v1/shipments/:trackingNumber', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    const { events, ...summary } = shipment;
    return res.json({ ...summary, lastEvent: events[events.length - 1] });
  });

  app.get('/v1/shipments/:trackingNumber/events', (req, res) => {
    const shipment = byTrackingNumber.get(req.params.trackingNumber.toUpperCase());
    if (!shipment) {
      return res.status(404).json({ error: { code: 'not_found', message: 'No shipment with that tracking number.' } });
    }
    return res.json({ trackingNumber: shipment.trackingNumber, events: shipment.events });
  });

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: \`No route for \${req.method} \${req.path}\` } });
  });

  return app;
}

module.exports = { createApp };
`;

const weakPackageJson = `{
  "name": "tracking-api",
  "version": "0.9.0",
  "private": true,
  "description": "Orbitline Shipment Tracking API (trimmed copy for the rate-limiting challenge)",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "express": "^4.21.2",
    "express-rate-limit": "^7.4.1"
  }
}
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'ch_rate_limiter',
    kind: 'live',
    companyId: 'co_orbitline',
    title: 'Add rate limiting to our Shipment Tracking API',
    summary: 'One key flooded our API. Add per-key, tier-aware rate limits with 429s and tests.',
    type: 'software',
    skills: ['Node.js', 'Express', 'API design', 'Rate limiting', 'Automated testing', 'HTTP'],
    classroomConcepts: [
      { concept: 'Token bucket algorithm', course: 'Data Structures & Algorithms' },
      { concept: 'HTTP 429 status and the Retry-After header', course: 'Computer Networks' },
      { concept: 'Atomic read-modify-write and race conditions', course: 'Operating Systems' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief: brief,
    deliverables: [
      'A rate limiter in the starter app, enforced per API key and plan tier',
      'test/rate-limit.test.js passing, plus deterministic tests of your own',
      'A README that explains your algorithm choice and the path to Redis',
      'Approach notes, including how you used AI tools',
    ],
    rubric: [
      {
        id: 'correctness',
        name: 'Correctness',
        description:
          'Limits are enforced per API key by tier, 429s carry an accurate Retry-After, all three X-RateLimit headers are right, /health is exempt, and every provided test passes.',
        weight: 30,
      },
      {
        id: 'design',
        name: 'Design & trade-offs',
        description:
          'The algorithm is chosen against named alternatives (edge bursts, memory per key), and per-key state sits behind an interface a Redis store could replace without touching the middleware.',
        weight: 25,
      },
      {
        id: 'tests',
        name: 'Tests',
        description:
          'Deterministic tests with an injected clock cover the limit, recovery after Retry-After, per-key isolation, tiers and edge cases such as a minute boundary, with no real sleeps.',
        weight: 20,
      },
      {
        id: 'code_quality',
        name: 'Code quality',
        description:
          'Small, well-named modules keep the algorithm separate from Express, the non-obvious math is commented, and there is no dead code or module-level state leaking between apps.',
        weight: 15,
      },
      {
        id: 'communication',
        name: 'Communication',
        description:
          'A teammate can read the README in five minutes and understand the behavior, the header semantics, the Redis path and the open decisions, such as failing open.',
        weight: 10,
      },
    ],
    applicantCap: 40,
    status: 'open',
    hiringFor: 'Junior Backend Engineer · Full-time · Remote (US)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'package.json', content: starterPackageJson },
      { path: 'src/app.js', content: starterAppJs },
      { path: 'src/auth.js', content: starterAuthJs },
      { path: 'src/config.js', content: starterConfigJs },
      { path: 'src/server.js', content: starterServerJs },
      { path: 'config/api-keys.json', content: apiKeysJson },
      { path: 'src/data/shipments.json', content: shipmentsJson },
      { path: 'test/tracking.test.js', content: trackingTestJs },
      { path: 'test/rate-limit.test.js', content: rateLimitTestJs },
      { path: 'docs/incident-2026-10-14.md', content: incidentMd },
    ],
    aiHints: {
      testing:
        'Whether you can turn an incident into precise, testable API behavior. We look at three things: do you limit the right thing (the API key and its tier, not the IP address), do clients get what they need to back off (429, Retry-After and the X-RateLimit headers), and can you explain why your algorithm fits better than the alternatives.',
      steps: [
        'Read docs/incident-2026-10-14.md, then run npm test and read why the 6 rate-limit tests fail.',
        'Compare fixed window, sliding window and token bucket: write down what each allows at a minute boundary and what it stores per key.',
        'Write the algorithm as a pure function of (state, policy, now) and unit-test it with plain numbers for time.',
        'Put per-key state behind a small store interface, then mount a middleware on /v1 after requireApiKey.',
        'Set the X-RateLimit headers and Retry-After, and make the provided tests pass using the injected clock.',
        'Write the README: your algorithm choice, what each header means, the Redis path and any open decisions.',
      ],
      greatLooksLike:
        'A great submission keys on req.client.key and the tier policy, never the IP, and passes every provided test without sleeping. It keeps the bucket or window math out of Express so it can be tested with plain numbers, and it shows a store interface a Redis version could implement without building Redis. The README compares at least two algorithms with a concrete example, such as a key sending 120 requests across a minute boundary.',
      pitfalls: [
        'Limiting by IP address: every test request (and every partner behind one NAT) shares one IP, and tiers are ignored.',
        'Leaving out Retry-After, or sending it in milliseconds instead of whole seconds.',
        'Calling Date.now() directly, so tests have to sleep and become slow and flaky.',
        'Keeping the counter Map at module level, so state leaks between tests and app instances.',
        'Never deleting old keys or windows, so memory grows with every key and minute ever seen.',
      ],
    },
    deadlineInDays: 1,
    createdDaysAgo: 6,
    seed: { participants: 15, submissions: 14, scored: 14 },
  },
  templates: [
    {
      quality: 'strong',
      notes: strongNotes,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'src/rate-limit/token-bucket.js', content: strongTokenBucketJs },
        { path: 'src/rate-limit/memory-store.js', content: strongMemoryStoreJs },
        { path: 'src/rate-limit/middleware.js', content: strongMiddlewareJs },
        { path: 'src/app.js', content: strongAppJs },
        { path: 'test/token-bucket.test.js', content: strongTokenBucketTestJs },
      ],
      feedback:
        'This is close to what we would ship. The pure takeToken function plus a one-method store makes the Redis move a drop-in, and your minute-boundary test shows you understood exactly what went wrong in INC-2291. Retry-After and all three headers are correct, and the algorithm table in the README is the clearest explanation we received. Before production, add tests for the fail-open and unknown-tier paths, and log when a key gets limited.',
      aiDisclosure:
        'Used an AI assistant to compare rate-limiting algorithms and to review my refill math for floating-point drift. I wrote the code and tests myself and checked every number by hand.',
    },
    {
      quality: 'solid',
      notes: solidNotes,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'src/rateLimiter.js', content: solidRateLimiterJs },
        { path: 'src/app.js', content: solidAppJs },
        { path: 'test/rate-limit-timing.test.js', content: solidTimingTestJs },
      ],
      feedback:
        'Solid, working limiter: per-key and per-tier limits, an accurate Retry-After and the headers are all right, and you caught the module-level state leak yourself. Two design gaps held it back: the fixed window ignores burst and allows the edge burst you noted (close to the traffic pattern from our incident), and the key:windowStart Map is never cleaned up, so it grows with every minute of traffic. Your extra tests use real timers on clock-aligned windows, so they can straddle a boundary; the injected clock would make them deterministic.',
      aiDisclosure: 'Asked an AI assistant to explain the Express middleware order. The limiter and the tests are my own.',
    },
    {
      quality: 'weak',
      notes: weakNotes,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'src/app.js', content: weakAppJs },
        { path: 'package.json', content: weakPackageJson },
      ],
      feedback:
        'Reaching for a well-tested library is a reasonable instinct, but this limits by IP address instead of by API key, so partners behind one NAT share a budget while a single key can still spread across IPs. Every tier gets the same 100 requests a minute, which would cut partners from 600 to 100, the 429s go out without Retry-After, and the limiter also runs on /health. Most of test/rate-limit.test.js still fails and there are no new tests. Start from req.client.key and the tier policy, and use the injected clock to test it.',
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'ch_rate_limiter',
      studentId: 'stu_hana',
      templateIndex: 0,
      submittedDaysAgo: 2,
      scores: { correctness: 5, design: 5, tests: 4, code_quality: 4, communication: 4 },
      feedback:
        'Excellent work. The token bucket is per key and per tier, Retry-After and all three headers are exact, and the store interface makes OL-PLAT-413 a drop-in, which is why correctness and design got full marks. Tests lost a point because the fail-open and unknown-tier branches have no coverage. Code quality lost one because takeToken returns the decision and the internal state together, so the store has to pull them apart. The README is strong, and one example of the headers a client actually sees would make it stronger.',
    },
    {
      challengeId: 'ch_rate_limiter',
      studentId: 'stu_arjun',
      templateIndex: 1,
      submittedDaysAgo: 3,
      scores: { correctness: 5, design: 4, tests: 4, code_quality: 4, communication: 3 },
      feedback:
        'Everything in the spec works: per-key, per-tier limits, a correct Retry-After, the three headers and every provided test, and you moved the counters out of module scope after spotting the leak yourself. Design lost a point because the fixed window ignores burst, and the key:windowStart Map is never cleaned up. Your timing tests use real windows that can straddle a boundary. The README names the edge-burst problem in one paragraph, but we wanted the reasoning: why a fixed window was acceptable for now, and how the Redis move would work.',
    },
  ],
};

export default mod;
