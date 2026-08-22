# AI Chatbot — Phase 2

A production-quality chatbot built with **React**, **Node.js**, **PostgreSQL**, **Prisma**, and **OpenAI-compatible LLMs**.

## Architecture

```
React (Vite + TypeScript)
    ↓  POST /api/chat
Node.js (Express + TypeScript)
    ↓
PostgreSQL (via Prisma)
    ↓
LLM Provider Interface
    ↓
OpenAIProvider → OpenAI API
```

## Project Structure

```
ai-chatbot/
├── apps/
│   ├── web/        → React frontend (port 5173)
│   └── api/        → Node.js backend (port 5000)
└── packages/
    └── shared-types/ → TypeScript types shared between frontend and backend
```

## Prerequisites

- **Node.js** 18+
- **pnpm** 8+ → `npm install -g pnpm`
- **PostgreSQL** 14+ (local or hosted, such as Neon/Supabase)
- An **OpenAI API key** → https://platform.openai.com/api-keys

## Setup

```bash
# 1. Install all dependencies
pnpm install

# 2. Create your environment file
cp .env.example .env

# 3. Open .env and add your database URL and OpenAI API key
#    DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_chatbot?schema=public
#    LLM_API_KEY=sk-...your-key-here...

# 4. Apply the committed database migrations
pnpm --filter api db:migrate

# 5. Start both servers
pnpm dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Health check**: http://localhost:5000/health

For the frontend, copy `apps/web/.env.example` to `apps/web/.env` and set
`VITE_API_URL` to the API origin. Vite reads frontend environment variables
from the `apps/web` directory.

## Running Tests

```bash
# Backend tests
pnpm --filter api test

# Frontend tests
pnpm --filter web test

# All tests
pnpm test
```

## API Reference

### `POST /api/chat`

Send a message and receive an AI response.

**Request**
```json
{ "message": "What is React?" }
```

`conversationId` is optional for backward compatibility. When omitted, the API
creates a new anonymous conversation. Subsequent requests should send the
returned ID.

**Response (200)**
```json
{ "message": "React is a JavaScript library for building user interfaces...", "conversationId": "cl..." }
```

### Conversation endpoints

- `POST /api/conversations` creates an anonymous conversation.
- `GET /api/conversations` lists conversations newest first.
- `GET /api/conversations/:id/messages` returns one conversation and its messages.
- `DELETE /api/conversations/:id` deletes a conversation and its messages.

**Error (400)**
```json
{ "error": { "code": "INVALID_REQUEST", "message": "Message must be a non-empty string." } }
```

**Error (500)**
```json
{ "error": { "code": "LLM_REQUEST_FAILED", "message": "Unable to generate a response. Please try again." } }
```

## Phase Roadmap

| Phase | Feature |
|---|---|
| **1** | Basic chatbot — React + Node.js + OpenAI |
| **2 (current)** | PostgreSQL + Prisma conversation history |
| 3 | Authentication |
| 4 | Streaming responses |
| 5 | RAG (retrieval-augmented generation) |
| 6 | Memory |
| 7 | Tool calling |
| 8 | Agents |
| 9 | Multiple LLM providers |
| 10 | Production security |
