import { NextFunction, Response } from 'express';
import { MAX_MESSAGE_LENGTH } from './chat.types';
import { ChatService } from './chat.service';
import type { AuthenticatedRequest } from '../auth/auth.types';

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
      }

      const { message, conversationId } = req.body ?? {};
      if (typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Message must be a non-empty string.' } });
        return;
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        res.status(400).json({ error: { code: 'INVALID_REQUEST', message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.` } });
        return;
      }
      if (conversationId !== undefined && typeof conversationId !== 'string') {
        res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'conversationId must be a string.' } });
        return;
      }

      const result = await this.chatService.chat(req.user.id, conversationId, message.trim());
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND') {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
        return;
      }
      next(error);
    }
  }
}
