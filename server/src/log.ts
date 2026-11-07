const ts = () => new Date().toISOString().slice(11, 19);

export const log = {
  info: (msg: string) => console.log(`[api ${ts()}] ${msg}`),
  warn: (msg: string) => console.warn(`[api ${ts()}] WARN ${msg}`),
  error: (msg: string) => console.error(`[api ${ts()}] ERROR ${msg}`),
};
