import type { NextFunction, Response as ExpressResponse } from 'express';
import { env } from '../config/env';
import type { AuthenticatedRequest } from '../modules/auth/auth.types';

async function incrementDistributed(key: string, windowSeconds: number): Promise<number | null> {
  if (!env.upstashRedisRestUrl || !env.upstashRedisToken) return null;

  const base = env.upstashRedisRestUrl.replace(/\/$/, '');
  const headers = { Authorization: `Bearer ${env.upstashRedisRestToken}` };
  const response = await fetch(`${base}/incr/${encodeURIComponent(key)}`, { headers });
  if (!response.ok) throw new Error(`Rate limiter failed with ${response.status}`);

  const value = Number(await response.text());
  if (value === 1) {
    await fetch(`${base}/expire/${encodeURIComponent(key)}/${windowSeconds}`, { headers });
  }
  return value;
}

export function createRateLimiter(limit: number, windowSeconds: number, keyPrefix: string) {
  return async (req: AuthenticatedRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const identity = req.user?.id || req.ip || 'unknown';
      const count = await incrementDistributed(`${keyPrefix}:${identity}`, windowSeconds);
      if (count !== null && count > limit) {
        res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } });
        return;
      }
      next();
    } catch (error) {
      // Fail closed in production when the distributed limiter is configured.
      if (env.nodeEnv === 'production' && env.upstashRedisRestUrl && env.upstashRedisToken) {
        res.status(503).json({ error: { code: 'RATE_LIMIT_UNAVAILABLE', message: 'Please try again later.' } });
        return;
      }
      next(error);
    }
  };
}
