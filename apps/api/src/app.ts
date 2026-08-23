import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler';
import chatRoutes from './modules/chat/chat.routes';
import authRoutes from './modules/auth/auth.routes';
import { env } from './config/env';

const app = express();

const allowedOrigins = [env.frontendUrl, 'https://ai-chatbot-web.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '256kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
