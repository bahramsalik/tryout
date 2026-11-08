/** Tryout API entry point. `npm run dev` runs this under `tsx watch` (also watching ../shared). */
import http from 'node:http';
import { startAiGradingSweep } from './actions.ts';
import { createApp } from './app.ts';
import { initData } from './boot.ts';
import { DATA_DIR, PORT } from './config.ts';
import { closeAllStreams } from './events.ts';
import { log } from './log.ts';

await initData();

const server = http.createServer(createApp());
server.keepAliveTimeout = 65_000;

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    log.error(`Port ${PORT} is already in use. Another API may be running: curl -s localhost:${PORT}/api/health`);
  } else {
    log.error(`Server error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  log.info(`Tryout API listening on http://localhost:${PORT}/api (data: ${DATA_DIR})`);
  startAiGradingSweep();
});

let stopping = false;
function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  log.info(`${signal} → shutting down`);
  closeAllStreams();
  server.close(() => process.exit(0));
  server.closeAllConnections?.();
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
