'use strict';

const express = require('express');
const { loadApiKeys, requireApiKey } = require('./auth');
const { DEFAULT_LIMITS } = require('./config');
const { createMemoryStore } = require('./rate-limit/memory-store');
const { rateLimit } = require('./rate-limit/middleware');
const shipments = require('./data/shipments.json');

const byTrackingNumber = new Map(shipments.map((s) => [s.trackingNumber, s]));

/**
 * Builds the Express app. Options exist so tests can control the environment:
 *
 *   keys    Map of API key -> client record (default: config/api-keys.json)
 *   limits  per-tier overrides merged over DEFAULT_LIMITS, e.g. { free: { limit: 5, burst: 5, windowMs: 60000 } }
 *   now     clock function returning epoch milliseconds (default: Date.now)
 *   store   rate-limit bucket store (default: a fresh in-memory store per app; Redis later, OL-PLAT-413)
 *   logger  where rate-limit warnings go (default: console)
 */
function createApp(options = {}) {
  const keys = options.keys || loadApiKeys();
  const now = options.now || Date.now;
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  const store = options.store || createMemoryStore();

  const app = express();
  app.disable('x-powered-by');
  app.locals.now = now;
  app.locals.limits = limits;

  // Load balancer health check. Must never be rate limited or require a key.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', shipments: byTrackingNumber.size });
  });

  // Auth first, so the limiter can key on req.client (API key + plan tier), never the IP.
  // Unauthenticated requests are rejected before they spend anyone's tokens.
  app.use('/v1', requireApiKey(keys), rateLimit({ store, limits, now, logger: options.logger }));

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
    res.status(404).json({ error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` } });
  });

  return app;
}

module.exports = { createApp };
