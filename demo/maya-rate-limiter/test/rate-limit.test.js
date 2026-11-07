'use strict';

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
  baseUrl = `http://127.0.0.1:${server.address().port}`;
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
  assert.match(retryAfter ?? '', /^\d+$/, 'Retry-After should be an integer number of seconds');
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
