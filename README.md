# AI Chatbot — Phase 1

A production-quality chatbot built with **React**, **Node.js**, and **OpenAI GPT**.

## Architecture

```
React (Vite + TypeScript)
    ↓  POST /api/chat
Node.js (Express + TypeScript)
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
- An **OpenAI API key** → https://platform.openai.com/api-keys

## Setup

```bash
# 1. Install all dependencies
pnpm install

# 2. Create your environment file
cp .env.example .env

# 3. Open .env and add your OpenAI API key
#    LLM_API_KEY=sk-...your-key-here...

# 4. Start both servers
pnpm dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Health check**: http://localhost:5000/health

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

**Response (200)**
```json
{ "message": "React is a JavaScript library for building user interfaces..." }
```

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
| **1 (current)** | Basic chatbot — React + Node.js + OpenAI |
| 2 | PostgreSQL + conversation history |
| 3 | Authentication |
| 4 | Streaming responses |
| 5 | RAG (retrieval-augmented generation) |
| 6 | Memory |
| 7 | Tool calling |
| 8 | Agents |
| 9 | Multiple LLM providers |
| 10 | Production security |
