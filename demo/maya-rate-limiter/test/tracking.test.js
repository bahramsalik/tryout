'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

const FREE_KEY = 'olk_free_3b9e17c2d4';
let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
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
