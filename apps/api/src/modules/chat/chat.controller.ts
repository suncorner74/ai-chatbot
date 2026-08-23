import { NextFunction, Response } from 'express';
import { MAX_MESSAGE_LENGTH } from './chat.types';
import { ChatService } from './chat.service';
import { encodeSseEvent, writeSseHeaders } from './chat.stream';
import type { AuthenticatedRequest } from '../auth/auth.types';

class ChatHttpError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'ChatHttpError';
  }
}

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId } = this.validateRequest(req);
      const result = await this.chatService.chat(req.user!.id, conversationId, message);
      res.status(200).json(result);
    } catch (error) {
      if (this.respondToKnownError(error, res)) return;
      next(error);
    }
  }

  async streamMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const abortController = new AbortController();
    const startedAt = performance.now();
    let firstTokenAt: number | null = null;

    const abort = () => {
      if (!res.writableEnded) abortController.abort();
    };
    req.once('aborted', abort);
    res.once('close', abort);

    try {
      const { message, conversationId } = this.validateRequest(req);
      const result = await this.chatService.streamChat(
        req.user!.id,
        conversationId,
        message,
        abortController.signal,
      );

      writeSseHeaders(res);

      for await (const token of result.tokens) {
        if (firstTokenAt === null) firstTokenAt = performance.now();
        res.write(encodeSseEvent({ event: 'token', data: { token } }));
      }

      const latencyMs = Math.round(performance.now() - startedAt);
      const ttftMs = firstTokenAt === null ? null : Math.round(firstTokenAt - startedAt);
      res.write(encodeSseEvent({
        event: 'done',
        data: { conversationId: result.conversationId, ttftMs, latencyMs },
      }));
      res.end();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (!res.writableEnded) res.end();
        return;
      }

      if (res.headersSent) {
        res.write(encodeSseEvent({
          event: 'error',
          data: { code: 'GENERATION_FAILED', message: 'Unable to generate a response. Please try again.' },
        }));
        res.end();
        return;
      }

      if (this.respondToKnownError(error, res)) return;
      next(error);
    } finally {
      req.off('aborted', abort);
      res.off('close', abort);
    }
  }

  private validateRequest(req: AuthenticatedRequest): { message: string; conversationId?: string } {
    if (!req.user) {
      throw new ChatHttpError(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    const { message, conversationId } = req.body ?? {};
    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new ChatHttpError(400, 'INVALID_REQUEST', 'Message must be a non-empty string.');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new ChatHttpError(400, 'INVALID_REQUEST', `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`);
    }
    if (conversationId !== undefined && typeof conversationId !== 'string') {
      throw new ChatHttpError(400, 'INVALID_REQUEST', 'conversationId must be a string.');
    }

    return { message: message.trim(), conversationId };
  }

  private respondToKnownError(error: unknown, res: Response): boolean {
    if (error instanceof ChatHttpError) {
      res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      return true;
    }
    if (error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return true;
    }
    return false;
  }
}
