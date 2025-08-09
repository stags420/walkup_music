type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

function getNumericLevel(level: LogLevel): number {
  switch (level) {
    case 'debug': {
      return 10;
    }
    case 'info': {
      return 20;
    }
    case 'warn': {
      return 30;
    }
    case 'error': {
      return 40;
    }
    case 'silent': {
      return 100;
    }
    default: {
      return 100;
    }
  }
}

function resolveLevel(): LogLevel {
  // Vite exposes import.meta.env at runtime for env variables prefixed with VITE_
  const envLevel = (import.meta as unknown as { env?: Record<string, string> })
    .env?.VITE_LOG_LEVEL as LogLevel | undefined;
  if (envLevel) return envLevel;

  // Default: suppress debug in production builds
  const isProd =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  return isProd ? 'info' : 'debug';
}

class Logger {
  private threshold: number;

  constructor(level: LogLevel) {
    this.threshold = getNumericLevel(level);
  }

  setLevel(level: LogLevel): void {
    this.threshold = getNumericLevel(level);
  }

  debug(...args: unknown[]): void {
    if (this.threshold <= getNumericLevel('debug')) {
      console.debug(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.threshold <= getNumericLevel('info')) {
      console.info(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.threshold <= getNumericLevel('warn')) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.threshold <= getNumericLevel('error')) {
      console.error(...args);
    }
  }
}

export const logger = new Logger(resolveLevel());

export type { LogLevel };
