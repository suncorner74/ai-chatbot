import { Router } from 'express';
import { OpenRouterProvider } from '../../ai/llm/providers/openrouter.provider';
import { requireAuth } from '../../middleware/auth';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const router = Router();

const llmProvider = new OpenRouterProvider();
const chatService = new ChatService(llmProvider);
const chatController = new ChatController(chatService);

// AI requests are authenticated in Phase 3 to prevent anonymous abuse and cost.
router.post('/', requireAuth, (req, res, next) =>
  chatController.sendMessage(req, res, next)
);

export default router;
