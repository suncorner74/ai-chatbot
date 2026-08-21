import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler';
import chatRoutes from './modules/chat/chat.routes';
import { env } from './config/env';

/**
 * app.ts — Express application configuration.
 *
 * Separated from server.ts so that tests can import the app
 * without starting the actual HTTP server. This is a standard
 * pattern for testing Express apps with supertest.
 *
 * ORDER MATTERS:
 * 1. CORS middleware (must run before routes so preflight requests work)
 * 2. Body parsing (must run before routes so req.body is available)
 * 3. Routes (the actual feature handlers)
 * 4. Error handler (MUST be last — it only catches errors from the routes above)
 */
const app = express();

// ── CORS ──────────────────────────────────────────────────────────
// Allows the React app to call this API in local and deployed environments.
// Without this, the browser blocks the request with a CORS error.
//
app.use(cors({ origin: env.frontendUrl }));

// ── Body Parsing ──────────────────────────────────────────────────
// Parses JSON request bodies and puts them on req.body.
// Without this, req.body is undefined.
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/chat', chatRoutes);

// Health check endpoint — useful for deployment monitoring
// GET http://localhost:5000/health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ─────────────────────────────────────────────────
// MUST be registered last. Express identifies error handlers by
// their 4-parameter signature: (error, req, res, next)
app.use(errorHandler);

export default app;
