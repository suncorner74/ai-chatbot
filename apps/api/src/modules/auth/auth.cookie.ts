import type { Response } from 'express';
import { env } from '../../config/env';

export function setSessionCookie(res: Response, sessionId: string) {
  const parts = [
    `${env.sessionCookieName}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${env.nodeEnv === 'production' ? 'None' : 'Lax'}`,
    `Max-Age=${Math.max(1, env.sessionTtlDays * 24 * 60 * 60)}`,
  ];

  if (env.nodeEnv === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response) {
  const parts = [
    `${env.sessionCookieName}=`,
    'Path=/',
    'HttpOnly',
    `SameSite=${env.nodeEnv === 'production' ? 'None' : 'Lax'}`,
    'Max-Age=0',
  ];

  if (env.nodeEnv === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function readSessionCookie(cookieHeader?: string) {
  if (!cookieHeader) return null;
  const prefix = `${env.sessionCookieName}=`;
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}
