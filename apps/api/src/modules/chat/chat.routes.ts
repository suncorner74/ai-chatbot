import { Router } from 'express';
import { OpenRouterProvider } from '../../ai/llm/providers/openrouter.provider';
import { requireAuth } from '../../middleware/auth';
import { createRateLimiter } from '../../middleware/rate-limit';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const router = Router();
const llmProvider = new OpenRouterProvider();
const chatService = new ChatService(llmProvider);
const chatController = new ChatController(chatService);

router.post('/', requireAuth, createRateLimiter(30, 60, 'chat'), (req, res, next) =>
  chatController.sendMessage(req, res, next)
);

export default router;
