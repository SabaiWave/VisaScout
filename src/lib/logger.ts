interface LogMeta {
  agent?: string;
  phase?: string;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
}

function emit(level: 'info' | 'warn' | 'error', message: string, meta: LogMeta = {}) {
  if (process.env.NODE_ENV !== 'production') {
    const prefix = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '✔';
    const hasMeta = Object.keys(meta).length > 0;
    if (level === 'error') console.error(prefix, message, hasMeta ? meta : '');
    else if (level === 'warn') console.warn(prefix, message, hasMeta ? meta : '');
    else console.log(prefix, message, hasMeta ? meta : '');
  } else {
    const entry = JSON.stringify({ level, message, ...meta });
    if (level === 'error') console.error(entry);
    else if (level === 'warn') console.warn(entry);
    else console.log(entry);
  }
}

export const log = {
  info: (message: string, meta?: LogMeta) => emit('info', message, meta),
  warn: (message: string, meta?: LogMeta) => emit('warn', message, meta),
  error: (message: string, meta?: LogMeta) => emit('error', message, meta),
};
