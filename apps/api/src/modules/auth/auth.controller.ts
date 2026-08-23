import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { clearSessionCookie, readSessionCookie, setSessionCookie } from './auth.cookie';
import type { AuthenticatedRequest } from './auth.types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(body: unknown): { email: string; password: string; name?: string } | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (typeof value.email !== 'string' || !emailPattern.test(value.email.trim())) return null;
  if (typeof value.password !== 'string' || value.password.length < 8 || value.password.length > 128) return null;
  if (value.name !== undefined && typeof value.name !== 'string') return null;
  return { email: value.email, password: value.password, name: typeof value.name === 'string' ? value.name : undefined };
}

export async function register(req: Request, res: Response) {
  const credentials = validateCredentials(req.body);
  if (!credentials) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Valid email and password are required.' } });
    return;
  }

  try {
    const result = await authService.register(credentials.email, credentials.password, credentials.name);
    setSessionCookie(res, result.sessionId);
    res.status(201).json({ user: result.user });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
      res.status(409).json({ error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'Unable to create account with these details.' } });
      return;
    }
    throw error;
  }
}

export async function login(req: Request, res: Response) {
  const credentials = validateCredentials(req.body);
  if (!credentials) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Valid email and password are required.' } });
    return;
  }

  try {
    const result = await authService.login(credentials.email, credentials.password);
    setSessionCookie(res, result.sessionId);
    res.json({ user: result.user });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      return;
    }
    throw error;
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  const sessionId = req.sessionId || readSessionCookie(req.headers.cookie);
  if (sessionId) await authService.logout(sessionId);
  clearSessionCookie(res);
  res.status(204).send();
}

export function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }
  res.json({ user: req.user });
}
