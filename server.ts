import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { handleAppraiseRequest, handleGetModels } from './src/server/appraise';
import { securityMiddleware } from './src/server/security';
import { createRateLimiter } from './src/server/rateLimiter';
import { handleHealthCheck } from './src/server/health';
import { logger } from './src/server/logger';

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Security headers & request correlation ID
app.use(securityMiddleware);

// 2. Safe JSON body parser with size cap
app.use(express.json({ limit: '25mb' }));

// 3. Rate Limiters
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'General rate limit reached. Please slow down.'
});

const appraiseLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Appraisal request limit reached (30/minute). Please wait before submitting another appraisal.'
});

// 4. API routes mounted directly BEFORE any static fallback
app.get('/api/health', generalLimiter, handleHealthCheck);
app.get('/api/models', generalLimiter, handleGetModels);
app.post('/api/appraise', appraiseLimiter, handleAppraiseRequest);
app.post('/api/analyze', appraiseLimiter, handleAppraiseRequest);

// 5. Explicit 404 handler for unknown /api/* requests so they NEVER fall through to HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: `API route ${req.method} ${req.path} not found.`,
    code: 'NOT_FOUND',
    requestId: req.requestId
  });
});

// 6. Centralized Error Handling Middleware (prevents stack leak and ensures JSON responses)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  logger.error(`Unhandled server error on ${req.method} ${req.path}: ${err.message}`, {
    requestId: req.requestId,
    error: err
  });

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' && statusCode === 500 
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.requestId
  });
});

// Process-level crash prevention
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection caught at process level', {
    error: reason instanceof Error ? reason : new Error(String(reason))
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception caught at process level', { error: err });
});

// Serve static assets in development & production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
