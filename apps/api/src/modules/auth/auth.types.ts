import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  sessionId?: string;
};
