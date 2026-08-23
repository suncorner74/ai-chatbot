import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { prisma } from '../../config/prisma';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  async register(email: string, password: string, name?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new Error('EMAIL_ALREADY_REGISTERED');

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash, name: name?.trim() || null },
      select: { id: true, email: true, name: true },
    });

    return { user, sessionId: await this.createSession(user.id) };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new Error('INVALID_CREDENTIALS');
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      sessionId: await this.createSession(user.id),
    };
  }

  async createSession(userId: string) {
    const id = randomBytes(32).toString('hex');
    await prisma.session.create({
      data: { id, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    return id;
  }

  async getSessionUser(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!session) return null;
    if (session.expiresAt <= new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }

    return { sessionId: session.id, user: session.user };
  }

  async logout(sessionId: string) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
}

export const authService = new AuthService();
