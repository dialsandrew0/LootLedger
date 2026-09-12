/**
 * Production health and readiness endpoint.
 * Provides system status, uptime, memory, and service dependency checks.
 */

import { Request, Response } from 'express';

const startTime = Date.now();

export function handleHealthCheck(req: Request, res: Response) {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();

  const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const isOpenAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const isAnthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

  const status = isGeminiConfigured ? 'healthy' : 'degraded';

  res.status(200).json({
    status,
    app: 'LootLedger',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rssMb: (mem.rss / 1024 / 1024).toFixed(1),
      heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(1),
      heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(1),
    },
    services: {
      geminiEngine: isGeminiConfigured ? 'ready' : 'unconfigured_fallback_only',
      openAiEngine: isOpenAiConfigured ? 'available' : 'disabled',
      anthropicEngine: isAnthropicConfigured ? 'available' : 'disabled',
    },
    requestId: (req as any).requestId
  });
}
