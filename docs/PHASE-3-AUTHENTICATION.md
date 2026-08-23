# Phase 3 — Authentication, Users & Production Scalability

Implemented on `feature/Authentication_Users_suraj`.

## Step 1 — Database foundation

- Prisma PostgreSQL schema for User, Session, Conversation, Message and Usage.
- Foreign keys with cascade behavior.
- Ownership/query indexes.
- Prisma migration and reusable PrismaClient singleton.

Commands:

```powershell
pnpm install
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
```

## Step 2 — Authentication

- Register/login/logout/me APIs.
- Argon2id password hashing.
- Opaque server-side sessions stored in PostgreSQL.
- HttpOnly/SameSite cookies; Secure in production.
- Authentication middleware.
- React login/register UI and authenticated application gate.
- No auth tokens in localStorage.

Endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Step 3 — Authorization & conversation ownership

- Authenticated chat only.
- Conversation resources scoped by `userId`.
- Message resources scoped through owned conversations.
- Cursor pagination for conversations and messages.
- Chat persists user/assistant messages and returns the persisted conversation ID.

Endpoints:

```text
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
GET    /api/conversations/:id/messages
DELETE /api/conversations/:id
POST   /api/chat
```

## Step 4 — Rate limiting, quotas & security

- Distributed Upstash REST rate limiting for auth and chat endpoints.
- 5 login attempts/minute/IP.
- 5 registration attempts/hour/IP.
- 30 chat requests/minute/user.
- Configurable daily chat quota (default 50).
- Request body size limit.
- CORS credentials configuration.
- Security headers.
- Production proxy trust and HSTS.
- Sanitized centralized error responses.

If Upstash variables are not configured locally, the rate limiter is bypassed for development. In production, a configured but unavailable limiter fails closed.

## Step 5 — Production hardening

Implemented foundations:

- Request IDs.
- Structured request logging.
- Safe error responses containing request IDs.
- Prisma client reuse for serverless instances.
- Environment template for database, session, rate-limit and quota configuration.
- Authentication cookie tests.

### Verification limitation

The GitHub integration available during implementation could not execute `pnpm install`, Prisma generation, migrations, TypeScript builds, or load tests in the repository runtime. The environment also could not clone the repository over the public network. Therefore, no build/test result is claimed as passed here.

Before merging/deploying, run:

```powershell
pnpm install
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
pnpm build
pnpm test
```

Then perform load testing only against local/staging infrastructure.
