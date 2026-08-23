import type { NextFunction, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import type { AuthenticatedRequest } from '../modules/auth/auth.types';

function utcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function enforceDailyChatLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  try {
    const usage = await prisma.usage.upsert({
      where: { userId_date: { userId: req.user.id, date: utcDay() } },
      create: { userId: req.user.id, date: utcDay(), requests: 1 },
      update: { requests: { increment: 1 } },
    });

    if (usage.requests > env.chatDailyRequestLimit) {
      res.status(429).json({ error: { code: 'DAILY_QUOTA_EXCEEDED', message: 'Daily chat limit reached.' } });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
