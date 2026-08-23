import { PrismaClient } from '@prisma/client';

/**
 * Reuse one Prisma client per serverless runtime instance.
 * Creating a client per request can exhaust PostgreSQL connections when
 * multiple serverless invocations run concurrently.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
