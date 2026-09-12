/**
 * Production-grade structured logger for LootLedger backend.
 * Emits JSON in production environments and clean formatted output in development.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private format(payload: LogPayload): string {
    if (this.isProduction) {
      return JSON.stringify(payload);
    }

    const color = payload.level === 'ERROR' ? '\x1b[31m' :
                  payload.level === 'WARN'  ? '\x1b[33m' :
                  payload.level === 'DEBUG' ? '\x1b[36m' : '\x1b[32m';
    const reset = '\x1b[0m';
    const reqPart = payload.requestId ? ` [req:${payload.requestId.slice(0, 8)}]` : '';
    const httpPart = payload.method && payload.path ? ` ${payload.method} ${payload.path}` : '';
    const statusPart = payload.statusCode ? ` ${payload.statusCode}` : '';
    const durationPart = payload.durationMs !== undefined ? ` (${payload.durationMs.toFixed(1)}ms)` : '';

    let out = `${color}[${payload.timestamp}] [${payload.level}]${reset}${reqPart}${httpPart}${statusPart}${durationPart} - ${payload.message}`;
    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      out += ` | ${JSON.stringify(payload.metadata)}`;
    }
    if (payload.error) {
      out += `\n  ${color}${payload.error.name}: ${payload.error.message}${reset}`;
      if (payload.error.stack && !this.isProduction) {
        out += `\n${payload.error.stack.split('\n').slice(1, 4).join('\n')}`;
      }
    }
    return out;
  }

  info(message: string, context?: { requestId?: string; metadata?: Record<string, any> }) {
    const payload: LogPayload = {
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId,
      metadata: context?.metadata,
    };
    console.log(this.format(payload));
  }

  warn(message: string, context?: { requestId?: string; metadata?: Record<string, any>; error?: Error }) {
    const payload: LogPayload = {
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId,
      metadata: context?.metadata,
      error: context?.error ? { name: context.error.name, message: context.error.message } : undefined,
    };
    console.warn(this.format(payload));
  }

  error(message: string, context?: { requestId?: string; metadata?: Record<string, any>; error?: Error }) {
    const payload: LogPayload = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId,
      metadata: context?.metadata,
      error: context?.error ? {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack
      } : undefined,
    };
    console.error(this.format(payload));
  }

  http(method: string, path: string, statusCode: number, durationMs: number, requestId?: string) {
    const payload: LogPayload = {
      level: statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO',
      message: `${method} ${path} -> ${statusCode}`,
      timestamp: new Date().toISOString(),
      requestId,
      method,
      path,
      statusCode,
      durationMs,
    };
    console.log(this.format(payload));
  }
}

export const logger = new Logger();
