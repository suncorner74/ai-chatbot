import { Router } from 'express';
import { GeminiProvider } from '../../ai/llm/providers/gemini.provider';
import { OpenRouterProvider } from '../../ai/llm/providers/openrouter.provider';
import { requireAuth } from '../../middleware/auth';
import { createRateLimiter } from '../../middleware/rate-limit';
import { enforceDailyChatLimit } from '../../middleware/usage-limit';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const router = Router();
const providers = {
  gemini: new GeminiProvider(),
  openrouter: new OpenRouterProvider(),
} as const;

type ProviderName = keyof typeof providers;

router.post('/', requireAuth, createRateLimiter(30, 60, 'chat'), enforceDailyChatLimit, (req, res, next) => {
  const provider = (req.body?.provider || 'gemini') as ProviderName;
  if (!(provider in providers)) {
    res.status(400).json({ error: { code: 'INVALID_PROVIDER', message: 'Unsupported AI provider.' } });
    return;
  }
  const chatService = new ChatService(providers[provider]);
  const chatController = new ChatController(chatService);
  void chatController.streamMessage(req, res, next);
});

export default router;
