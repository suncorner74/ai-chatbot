import type { NextFunction, Response } from 'express';
import { authService } from '../modules/auth/auth.service';
import { readSessionCookie } from '../modules/auth/auth.cookie';
import type { AuthenticatedRequest } from '../modules/auth/auth.types';

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessionId = readSessionCookie(req.headers.cookie);
    if (!sessionId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const session = await authService.getSessionUser(sessionId);
    if (!session) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    req.sessionId = session.sessionId;
    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
}
