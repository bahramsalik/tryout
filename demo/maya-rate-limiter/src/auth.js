'use strict';

const path = require('node:path');
const fs = require('node:fs');

const KEYS_FILE = path.join(__dirname, '..', 'config', 'api-keys.json');

/** Loads API keys from config/api-keys.json into a Map of key -> client record. */
function loadApiKeys(file = KEYS_FILE) {
  const records = JSON.parse(fs.readFileSync(file, 'utf8'));
  return new Map(records.map((record) => [record.key, record]));
}

/**
 * Express middleware: requires a valid `x-api-key` header.
 * On success, the client record ({ key, clientId, name, tier }) is stored on `req.client`.
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
