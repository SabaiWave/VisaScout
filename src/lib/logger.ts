interface LogMeta {
  agent?: string;
  phase?: string;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
}

function sendToBetterStack(entry: object): void {
  const token = process.env.BETTERSTACK_SOURCE_TOKEN;
  const url = process.env.BETTERSTACK_INGEST_URL;
  if (!token || !url) return;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(entry),
  }).catch((err) => {
    if (process.env.NODE_ENV !== 'production') console.error('BetterStack send failed:', err);
  }); // fire-and-forget — logging must never throw
}

function emit(level: 'info' | 'warn' | 'error', message: string, meta: LogMeta = {}) {
  const entry = { dt: new Date().toISOString(), level, message, ...meta };

  if (process.env.NODE_ENV !== 'production') {
    const prefix = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '✔';
    const hasMeta = Object.keys(meta).length > 0;
    if (level === 'error') console.error(prefix, message, hasMeta ? meta : '');
    else if (level === 'warn') console.warn(prefix, message, hasMeta ? meta : '');
    else console.log(prefix, message, hasMeta ? meta : '');
  } else {
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  sendToBetterStack(entry);
}

export const log = {
  info: (message: string, meta?: LogMeta) => emit('info', message, meta),
  warn: (message: string, meta?: LogMeta) => emit('warn', message, meta),
  error: (message: string, meta?: LogMeta) => emit('error', message, meta),
};
