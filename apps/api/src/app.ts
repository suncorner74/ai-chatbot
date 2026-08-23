import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import chatRoutes from './modules/chat/chat.routes';
import authRoutes from './modules/auth/auth.routes';
import conversationRoutes from './modules/conversations/conversations.routes';
import documentsRoutes from './modules/rag/documents.routes';
import { env } from './config/env';

const app = express();
app.set('trust proxy', env.nodeEnv === 'production' ? 1 : false);
app.use(requestId);

const allowedOrigins = [env.frontendUrl, 'https://ai-chatbot-web.vercel.app'];
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) callback(null, true); else callback(new Error('CORS origin not allowed')); }, credentials: true }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (env.nodeEnv === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Uploads use raw request bodies so large files are not base64-expanded in JSON.
app.use('/api/documents', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    express.raw({ limit: env.maxDocumentSizeBytes, type: () => true })(req, res, next);
    return;
  }
  next();
});
app.use(express.json({ limit: '256kb' }));
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentsRoutes);

app.get('/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString(), requestId: res.locals.requestId }); });
app.use(errorHandler);
export default app;
