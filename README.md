# AI Chatbot

A full-stack AI chatbot monorepo built with **React + Vite**, **Node.js + Express**, **OpenAI**, **PostgreSQL**, and **Prisma**.

This README is the onboarding guide for a new developer. It explains how to set up the UI, API, local PostgreSQL database, Prisma, environment variables, tests, and the production/Vercel setup.

> **Important:** Never commit `.env` files, database passwords, API keys, or other secrets.

## 1. Architecture

```text
Browser
   │
   ▼
React + Vite (apps/web)
   │ HTTP
   ▼
Node.js + Express (apps/api)
   │
   ├── LLM Provider → OpenAI API
   │
   └── Prisma ORM
          │
          ▼
      PostgreSQL
```

The frontend must **not** connect directly to PostgreSQL. Database access belongs in the API.

## 2. Repository Structure

```text
ai-chatbot/
├── apps/
│   ├── web/                  # React/Vite frontend
│   └── api/                  # Node.js/Express backend
│       └── prisma/           # Prisma schema/migrations when DB phase is enabled
├── packages/
│   └── shared-types/         # Shared TypeScript types
├── .env.example              # Safe environment-variable template
├── package.json              # Workspace scripts
├── pnpm-workspace.yaml       # pnpm monorepo configuration
└── README.md
```

The repository is a pnpm workspace containing `apps/*` and `packages/*`.

## 3. Technology Stack

### Web

- React 18
- Vite 5
- TypeScript
- Vitest

### API

- Node.js
- Express
- TypeScript
- OpenAI SDK
- Jest + Supertest

### Database

- PostgreSQL
- Prisma ORM

### Package manager

- pnpm

## 4. Prerequisites

Install these before starting:

- **Node.js 18+**
- **pnpm 8+**
- **PostgreSQL** (PostgreSQL 18.x is currently used in development)
- Git
- An OpenAI API key for chatbot functionality

Check the installations:

```powershell
node --version
npm --version
pnpm --version
psql --version
```

If pnpm is not installed:

```powershell
npm install -g pnpm
```

If Windows reports `ERR_PNPM_NO_GLOBAL_BIN_DIR`, run:

```powershell
pnpm setup
```

Then restart PowerShell.

## 5. Clone the Repository

```powershell
git clone https://github.com/suncorner74/ai-chatbot.git
cd ai-chatbot
```

## 6. Install Dependencies

From the repository root:

```powershell
pnpm install
```

## 7. Configure Environment Variables

Start from the existing template:

```text
.env.example
```

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

The backend currently expects values such as:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LLM_API_KEY=sk-...your-key...
LLM_MODEL=gpt-4o-mini
```

### PostgreSQL / Prisma

When the database phase is enabled in your checkout, the API Prisma schema uses:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_chatbot"
```

Create this variable in the environment used by the API. Do **not** expose a PostgreSQL URL through `VITE_*` frontend variables.

If the project contains an `apps/api/.env` convention, put the API database variable there. If the application loads the root `.env`, use the root file instead. Follow the existing dotenv loading code in the API.

## 8. Local PostgreSQL Setup

### 8.1 Start PostgreSQL

Make sure PostgreSQL is running.

Verify that the CLI is available:

```powershell
psql --version
```

### 8.2 Create a database

Create a local database named, for example:

```text
ai_chatbot
```

A typical local connection string is:

```text
postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_chatbot
```

Use the username, password, port, and database name configured on the developer's machine.

### 8.3 Test the connection

```powershell
psql -U postgres -h localhost -d ai_chatbot
```

Exit psql with:

```sql
\q
```

## 9. Prisma Setup

Prisma files are under:

```text
apps/api/prisma/
```

From the API directory:

```powershell
cd apps/api
```

Generate Prisma Client:

```powershell
pnpm exec prisma generate
```

### Create/synchronize local tables

Make sure `DATABASE_URL` points to the **local** PostgreSQL database before running this command:

```powershell
pnpm exec prisma db push
```

`db push` reads `schema.prisma` and synchronizes the database structure with the Prisma schema. It can create tables such as `Conversation` and `Message` when those models exist in the schema.

> **Warning:** Always check `DATABASE_URL` before running `db push`. Running it with a production URL changes the production database schema.

### Inspect the database

```powershell
pnpm exec prisma studio
```

Prisma Studio lets you inspect tables and rows in a browser.

A newly created database may show:

```text
Conversation  0
Message       0
```

`0` means there are no records yet. It does not mean the table is missing.

## 10. Start the Application Locally

The root project already provides a combined development script:

```powershell
pnpm dev
```

This starts both workspace applications using `concurrently`.

### Web

The web application runs on:

```text
http://localhost:5173
```

### API

The API runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

If you prefer separate terminals:

### Terminal 1 — API

```powershell
cd apps/api
pnpm dev
```

### Terminal 2 — Web

```powershell
cd apps/web
pnpm dev
```

## 11. API Environment and LLM Configuration

The API keeps the OpenAI key on the server. Do not put `LLM_API_KEY` in the React application.

The current environment template supports:

```env
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

The frontend communicates with the backend; the backend communicates with OpenAI.

## 12. Database Development Workflow

When changing the Prisma data model:

```text
apps/api/prisma/schema.prisma
            │
            ▼
     Prisma Client
            │
            ▼
     PostgreSQL schema
```

For a simple development database synchronization:

```powershell
cd apps/api
pnpm exec prisma generate
pnpm exec prisma db push
```

For a production-quality team workflow, prefer Prisma migrations once migrations are part of the project:

```powershell
pnpm exec prisma migrate dev
```

Commit the generated migration files to Git. Production should apply committed migrations with:

```powershell
pnpm exec prisma migrate deploy
```

Do not use `db push` as the long-term production migration strategy for a growing production application.

## 13. Local vs Production Database

Keep local and production databases separate.

### Local

```text
React/Vite
   ↓
Local Node API
   ↓
DATABASE_URL
   ↓
Local PostgreSQL
localhost:5432
```

### Production

```text
Vercel Web
   ↓
Vercel API
   ↓
DATABASE_URL (Production)
   ↓
Managed PostgreSQL
```

Never use the production database for normal local development.

## 14. Vercel / Production Setup

The production application uses a managed PostgreSQL database and Vercel for deployment.

The **API Vercel project** must have:

```text
DATABASE_URL
```

configured for the **Production** environment.

The frontend normally does **not** need the PostgreSQL connection string. The database URL contains credentials and must stay server-side.

After adding or changing Vercel environment variables, redeploy the affected project so the new deployment receives the values.

### Production database tables

Creating a managed PostgreSQL database does not automatically create application tables.

The Prisma schema/migrations must be applied to the production database. For the initial database setup, `prisma db push` can synchronize a newly created database when explicitly intended. For an established production system, use committed migrations and:

```powershell
pnpm exec prisma migrate deploy
```

## 15. API Reference

### `POST /api/chat`

Send a message and receive an AI response.

Request:

```json
{ "message": "What is React?" }
```

Response:

```json
{ "message": "React is a JavaScript library for building user interfaces..." }
```

Example validation error:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Message must be a non-empty string."
  }
}
```

Example LLM failure:

```json
{
  "error": {
    "code": "LLM_REQUEST_FAILED",
    "message": "Unable to generate a response. Please try again."
  }
}
```

## 16. Tests

Backend:

```powershell
pnpm --filter api test
```

Frontend:

```powershell
pnpm --filter web test
```

All tests:

```powershell
pnpm test
```

## 17. Build

From the repository root:

```powershell
pnpm build
```

The root build runs the shared package, API build, and web build in order.

## 18. Common Problems

### `psql` is not recognized

PostgreSQL is installed but its `bin` directory is not on PATH. Add the PostgreSQL `bin` directory to PATH, restart PowerShell, and verify:

```powershell
psql --version
```

### `prisma` is not recognized

Use the project-local Prisma executable:

```powershell
pnpm exec prisma --version
```

### `DATABASE_URL` is missing

Error:

```text
Environment variable not found: DATABASE_URL
```

Check the API environment file and confirm it contains:

```env
DATABASE_URL="postgresql://..."
```

### `The table public.Conversation does not exist`

This normally means Prisma successfully reached the database but the required table has not been created there.

For a local development database:

```powershell
cd apps/api
pnpm exec prisma db push
```

Then inspect it with:

```powershell
pnpm exec prisma studio
```

### Prisma Client `EPERM` error on Windows

If `prisma generate` reports an `EPERM` error involving `query_engine-windows.dll.node`:

1. Stop the API/dev server.
2. Close Prisma Studio.
3. Close other processes using the project.
4. Run:

```powershell
pnpm exec prisma generate
```

If Windows still has the file locked, restart Windows and retry.

### API cannot reach PostgreSQL

Check:

1. PostgreSQL is running.
2. Host and port are correct.
3. Username/password are correct.
4. Database exists.
5. `DATABASE_URL` points to the intended database.
6. The API is using the expected environment file.

## 19. New Developer Quick Start

```powershell
# Clone
git clone https://github.com/suncorner74/ai-chatbot.git
cd ai-chatbot

# Install dependencies
pnpm install

# Create local environment
Copy-Item .env.example .env

# Edit .env and add your LLM_API_KEY
# Add DATABASE_URL if the Prisma/database phase is enabled

# Prepare Prisma when the DB phase is present
cd apps/api
pnpm exec prisma generate
pnpm exec prisma db push

# Return to root and start the application
cd ../..
pnpm dev
```

Then open:

```text
Frontend: http://localhost:5173
API:      http://localhost:5000
Health:   http://localhost:5000/health
```

## 20. Before Opening a Pull Request

- [ ] `pnpm install` works
- [ ] Local UI starts
- [ ] API starts
- [ ] PostgreSQL is reachable when DB features are enabled
- [ ] Prisma Client is generated when DB features are enabled
- [ ] Database schema is synchronized/migrations are applied
- [ ] Chat request works
- [ ] Conversation/message persistence works when DB features are enabled
- [ ] Tests pass
- [ ] Build passes
- [ ] No `.env` or secrets are committed
- [ ] Production database credentials are not exposed to frontend code

## 21. Security Rules

Never commit:

```text
.env
.env.local
```

Never commit:

- OpenAI API keys
- PostgreSQL passwords
- `DATABASE_URL` values containing credentials
- Vercel secrets
- Authentication secrets

Use placeholders in documentation:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_chatbot"
```

## 22. Phase Roadmap

| Phase | Feature |
|---|---|
| **1** | Basic chatbot — React + Node.js + OpenAI |
| **2** | PostgreSQL + conversation history |
| **3** | Authentication |
| **4** | Streaming responses |
| **5** | RAG (retrieval-augmented generation) |
| **6** | Memory |
| **7** | Tool calling |
| **8** | Agents |
| **9** | Multiple LLM providers |
| **10** | Production security |

## Summary

The core development flow is:

```text
1. Install Node.js + pnpm + PostgreSQL
2. Clone repository
3. pnpm install
4. Configure environment variables
5. Start PostgreSQL
6. Generate Prisma Client
7. Create/synchronize local database tables
8. Start API + Web
9. Test chatbot and database persistence
```

For production:

```text
Vercel Web
    ↓
Vercel API
    ↓
DATABASE_URL (Production)
    ↓
Prisma
    ↓
Managed PostgreSQL
```
