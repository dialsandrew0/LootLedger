/**
 * Security headers, request tracking, and input sanitization middleware.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from './logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

/**
 * Attaches unique request correlation ID, security headers, and access logging.
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Correlation ID
  const incomingReqId = req.headers['x-request-id'] as string;
  const requestId = (incomingReqId && /^[a-zA-Z0-9_\-]+$/.test(incomingReqId)) 
    ? incomingReqId 
    : crypto.randomUUID();
  
  req.requestId = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);

  // 2. Standard Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove express signature header
  res.removeHeader('X-Powered-By');

  // 3. Response completion logger
  res.on('finish', () => {
    const durationMs = Date.now() - req.startTime;
    // Log API routes or non-200 static routes
    if (req.path.startsWith('/api') || res.statusCode >= 400) {
      logger.http(req.method, req.path, res.statusCode, durationMs, req.requestId);
    }
  });

  next();
}

/**
 * Validates and sanitizes incoming appraisal payload to prevent injection,
 * oversized payloads, and malformed base64.
 */
export function validateAppraisePayload(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  // 1. Image validation
  if (!body.image || typeof body.image !== 'string') {
    return { valid: false, error: 'An image (base64 or data URL) is required for appraisal.' };
  }

  // Verify image data URL or base64 format and reasonable length
  const isDataUrl = body.image.startsWith('data:image/');
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(body.image.slice(0, 100));
  if (!isDataUrl && !isBase64) {
    return { valid: false, error: 'Image must be a valid base64 string or data URL (data:image/...).' };
  }

  // Max payload size check (~12MB base64 string corresponds to ~9MB file)
  if (body.image.length > 15 * 1024 * 1024) {
    return { valid: false, error: 'Image payload exceeds maximum allowed size (10MB limit).' };
  }

  // 2. Price validation
  if (body.purchasePrice !== undefined) {
    const price = Number(body.purchasePrice);
    if (isNaN(price) || price < 0 || price > 100000000) {
      return { valid: false, error: 'Purchase price must be a valid non-negative number under 100,000,000.' };
    }
  }

  // 3. String fields length limits
  const maxTextLen = 500;
  if (body.category && typeof body.category === 'string' && body.category.length > maxTextLen) {
    return { valid: false, error: `Category string exceeds maximum allowed length (${maxTextLen} chars).` };
  }
  if (body.marks && typeof body.marks === 'string' && body.marks.length > maxTextLen) {
    return { valid: false, error: `Marks string exceeds maximum allowed length (${maxTextLen} chars).` };
  }
  if (body.condition && typeof body.condition === 'string' && body.condition.length > maxTextLen) {
    return { valid: false, error: `Condition string exceeds maximum allowed length (${maxTextLen} chars).` };
  }

  return { valid: true };
}
