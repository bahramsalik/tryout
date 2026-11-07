/**
 * Server-Sent Events hub: every ServerEvent is broadcast to every client (clients filter by persona).
 *
 * Event ids are `<seedId>.<bootId>.<seq>`. Browsers resend the last id as `Last-Event-ID` when they
 * reconnect; if the data was reseeded meanwhile (e.g. the server restarted on new seed content),
 * that client immediately gets a `system.reset` so it refetches everything.
 */
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import type { ServerEvent } from '../../shared/types.ts';
import { SSE_HEARTBEAT_MS } from './config.ts';
import { getDb } from './store.ts';

const clients = new Set<Response>();
const bootId = randomBytes(3).toString('hex');
let seq = 0;

const nextId = () => `${getDb().meta.seedId}.${bootId}.${++seq}`;

function write(res: Response, chunk: string): void {
  try {
    res.write(chunk);
  } catch {
    clients.delete(res);
  }
}

function frame(event: ServerEvent): string {
  return `id: ${nextId()}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
}

export function emit(event: ServerEvent): void {
  const chunk = frame(event);
  for (const res of clients) write(res, chunk);
}

export function clientCount(): number {
  return clients.size;
}

export function sseHandler(req: Request, res: Response): void {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  req.socket.setKeepAlive(true);
  req.socket.setNoDelay(true);
  req.socket.setTimeout(0);

  // `retry` speeds up reconnects; an id-only frame sets the client's last-event id without dispatching.
  write(res, `retry: 2000\nid: ${getDb().meta.seedId}.${bootId}.${seq}\n: connected\n\n`);

  const lastId = req.get('last-event-id') ?? (typeof req.query.lastEventId === 'string' ? req.query.lastEventId : '');
  if (lastId) {
    const [lastSeed] = lastId.split('.');
    if (lastSeed && lastSeed !== getDb().meta.seedId) write(res, frame({ type: 'system.reset', payload: {} }));
  }

  clients.add(res);
  const cleanup = () => clients.delete(res);
  req.on('close', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
}

const heartbeat = setInterval(() => {
  for (const res of clients) write(res, `: heartbeat ${new Date().toISOString()}\n\n`);
}, SSE_HEARTBEAT_MS);
heartbeat.unref();

/** Ends every stream (used on shutdown so restarts are instant). */
export function closeAllStreams(): void {
  for (const res of clients) {
    try {
      res.end();
    } catch {
      /* already gone */
    }
  }
  clients.clear();
}
