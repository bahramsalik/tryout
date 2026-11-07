'use strict';

// Unit tests for the bucket math, with plain numbers for time: no server, no clock, no sleeps.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { takeToken } = require('../src/rate-limit/token-bucket');

const FREE = { limit: 60, burst: 20, windowMs: 60_000 }; // the real free tier: one token per second
const T0 = Date.UTC(2026, 10, 7, 14, 0, 0);

/** Sends one request at each time in `times` (epoch ms) and counts how many were allowed. */
function run(policy, times, state) {
  let allowed = 0;
  for (const t of times) {
    const result = takeToken(state, policy, t);
    state = result.state;
    if (result.allowed) allowed += 1;
  }
  return { allowed, state };
}

test('a new key starts with a full bucket', () => {
  const result = takeToken(undefined, FREE, T0);
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 19);
});

test('back-to-back requests are allowed up to the burst, then blocked', () => {
  assert.equal(run(FREE, Array(25).fill(T0)).allowed, 20);
});

test('tokens refill continuously at limit per window', () => {
  const { state } = run(FREE, Array(20).fill(T0));
  assert.equal(takeToken(state, FREE, T0 + 999).allowed, false, 'not quite one token after 999 ms');
  assert.equal(takeToken(state, FREE, T0 + 1000).allowed, true, 'exactly one token after 1 s');
});

test('retryAfterMs is the time until one whole token exists', () => {
  const { state } = run(FREE, Array(20).fill(T0));
  assert.equal(takeToken(state, FREE, T0).retryAfterMs, 1000);
  assert.equal(takeToken(state, FREE, T0 + 500).retryAfterMs, 500, 'half a token in, half the wait is left');
});

test('the bucket never holds more than the burst, however long a key is idle', () => {
  const { state } = run(FREE, [T0]);
  assert.equal(takeToken(state, FREE, T0 + 24 * 60 * 60_000).remaining, 19);
});

test('resetAtMs is when the bucket is completely full again', () => {
  const { state } = run(FREE, Array(20).fill(T0));
  assert.equal(takeToken(state, FREE, T0).resetAtMs, T0 + 20_000, '20 tokens at one per second');
});

test('a clock that steps backwards does not mint tokens', () => {
  const { state } = run(FREE, Array(20).fill(T0));
  assert.equal(takeToken(state, FREE, T0 - 30_000).allowed, false);
});

test('minute boundary: 120 requests in 2 s get 21 through, where a fixed window lets all 120 through', () => {
  // The README example: 60 requests at 14:00:59 and 60 more at 14:01:00.
  const times = [...Array(60).fill(T0 + 59_000), ...Array(60).fill(T0 + 60_000)];
  assert.equal(run(FREE, times).allowed, 21, '20 burst tokens + 1 token refilled in the second between bursts');
});
