'use strict';

// HTTP-level tests beyond the provided ones: tiers, isolation, failure modes and cleanup.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { createMemoryStore } = require('../src/rate-limit/memory-store');

const T0 = Date.UTC(2026, 10, 7, 15, 0, 0);
const FREE_A = 'olk_free_3b9e17c2d4';
const ENTERPRISE = 'olk_ent_d06b4f92c8';
const silent = { warn() {} };

/** Starts an app on a random port, hands `track(key)` to fn, and always closes the server. */
async function withApp(options, fn) {
  const server = createApp({ logger: silent, ...options }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const track = (key) => fetch(`${base}/v1/shipments/OLX-48213907`, { headers: { 'x-api-key': key } });
  try {
    return await fn(track);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('enterprise keys get their own tier', async () => {
  const clock = { ms: T0 };
  await withApp({ now: () => clock.ms, limits: { enterprise: { limit: 3, burst: 3, windowMs: 60_000 } } }, async (track) => {
    for (let i = 0; i < 3; i++) assert.equal((await track(ENTERPRISE)).status, 200);
    const blocked = await track(ENTERPRISE);
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get('x-ratelimit-limit'), '3');
  });
});

test('the 429 body says what happened and when to retry', async () => {
  const clock = { ms: T0 };
  await withApp({ now: () => clock.ms, limits: { free: { limit: 1, burst: 1, windowMs: 60_000 } } }, async (track) => {
    await track(FREE_A);
    const res = await track(FREE_A);
    assert.equal(res.status, 429);
    assert.equal(res.headers.get('retry-after'), '60');
    const { error } = await res.json();
    assert.match(error.message, /free plan/);
    assert.match(error.message, /Retry in 60s/);
  });
});

test('two app instances never share counters', async () => {
  const clock = { ms: T0 };
  const limits = { free: { limit: 1, burst: 1, windowMs: 60_000 } };
  await withApp({ now: () => clock.ms, limits }, async (trackA) => {
    await trackA(FREE_A);
    assert.equal((await trackA(FREE_A)).status, 429);
    await withApp({ now: () => clock.ms, limits }, async (trackB) => {
      assert.equal((await trackB(FREE_A)).status, 200, 'a second app starts with its own buckets');
    });
  });
});

test('if the store fails, requests are still served (fail open) without limit headers', async () => {
  const brokenStore = {
    consume: async () => {
      throw new Error('ECONNREFUSED');
    },
  };
  await withApp({ store: brokenStore }, async (track) => {
    const res = await track(FREE_A);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-ratelimit-limit'), null);
  });
});

test('a key with an unknown tier gets the strictest (free) policy, not unlimited', async () => {
  const keys = new Map([['olk_trial_0001', { key: 'olk_trial_0001', clientId: 'cli_9999', name: 'Trial', tier: 'trial' }]]);
  const clock = { ms: T0 };
  await withApp({ keys, now: () => clock.ms, limits: { free: { limit: 2, burst: 2, windowMs: 60_000 } } }, async (track) => {
    assert.equal((await track('olk_trial_0001')).status, 200);
    assert.equal((await track('olk_trial_0001')).status, 200);
    assert.equal((await track('olk_trial_0001')).status, 429);
  });
});

test('the memory store forgets idle keys, so memory does not grow forever', async () => {
  const store = createMemoryStore({ idleTtlMs: 60_000 });
  const policy = { limit: 60, burst: 20, windowMs: 60_000 };
  await store.consume('olk_a', policy, T0);
  await store.consume('olk_b', policy, T0);
  assert.equal(store.size(), 2);
  store.sweep(T0 + 61_000);
  assert.equal(store.size(), 0);
});
