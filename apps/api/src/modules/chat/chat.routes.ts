import { Router } from 'express';
import { OpenRouterProvider } from '../../ai/llm/providers/openrouter.provider';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const router = Router();

/**
 * Dependency Injection — wiring the layers together.
 *
 * Notice how we just swapped OpenAIProvider for OpenRouterProvider.
 * The ChatService doesn't care! It just asks the injected provider
 * to generate a response.
 */
const llmProvider = new OpenRouterProvider();
const chatService = new ChatService(llmProvider);
const chatController = new ChatController(chatService);

/**
 * POST /api/chat
 *
 * Body:    { "message": "What is React?" }
 * Success: { "message": "React is a JavaScript library..." }
 * Error:   { "error": { "code": "...", "message": "..." } }
 */
router.post('/', (req, res, next) =>
  chatController.sendMessage(req, res, next)
);

export default router;
