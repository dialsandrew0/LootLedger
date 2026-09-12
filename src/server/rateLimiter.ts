/**
 * Production-ready in-memory sliding-window rate limiter for Express.
 * Protects expensive AI endpoints and API routes from denial-of-service or credit burnout.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RateLimitOptions {
  windowMs: number;       // Window duration in ms
  maxRequests: number;    // Max requests allowed in window
  message?: string;       // Custom error message
  skipFailedRequests?: boolean;
}

interface ClientRecord {
  timestamps: number[];
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests. Please try again shortly.' } = options;
  const clients = new Map<string, ClientRecord>();

  // Periodically clean up stale client entries to prevent memory leaks
  const cleanupInterval = Math.max(windowMs, 60000);
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < windowMs);
      if (record.timestamps.length === 0) {
        clients.delete(ip);
      }
    }
  }, cleanupInterval).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
               req.socket.remoteAddress || 
               'anonymous';
    const now = Date.now();
    const requestId = (req as any).requestId;

    let record = clients.get(ip);
    if (!record) {
      record = { timestamps: [] };
      clients.set(ip, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter(t => now - t < windowMs);

    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    const resetTime = record.timestamps.length > 0 ? Math.ceil((record.timestamps[0] + windowMs - now) / 1000) : Math.ceil(windowMs / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining - 1));
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (record.timestamps.length >= maxRequests) {
      res.setHeader('Retry-After', resetTime);
      logger.warn(`Rate limit exceeded for IP: ${ip} on ${req.method} ${req.path}`, {
        requestId,
        metadata: { ip, remaining: 0, resetInSec: resetTime }
      });
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: resetTime,
        requestId
      });
    }

    record.timestamps.push(now);
    next();
  };
}
