import { NextFunction, Response } from 'express';
import { MAX_MESSAGE_LENGTH } from './chat.types';
import { ChatService } from './chat.service';
import { encodeSseEvent, writeSseHeaders } from './chat.stream';
import type { AuthenticatedRequest } from '../auth/auth.types';

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId } = this.validateRequest(req);
      const result = await this.chatService.chat(req.user!.id, conversationId, message);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND') {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
        return;
      }
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
      res.write(encodeSseEvent({ event: 'token', data: { token: '' } }));

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
      if (error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND') {
        if (!res.headersSent) {
          res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
        } else {
          res.write(encodeSseEvent({ event: 'error', data: { code: 'NOT_FOUND', message: 'Conversation not found.' } }));
          res.end();
        }
        return;
      }

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

      next(error);
    } finally {
      req.off('aborted', abort);
      res.off('close', abort);
    }
  }

  private validateRequest(req: AuthenticatedRequest): { message: string; conversationId?: string } {
    if (!req.user) {
      throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: 401 });
    }

    const { message, conversationId } = req.body ?? {};
    if (typeof message !== 'string' || message.trim().length === 0) {
      throw Object.assign(new Error('INVALID_REQUEST'), { statusCode: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw Object.assign(new Error('MESSAGE_TOO_LONG'), { statusCode: 400 });
    }
    if (conversationId !== undefined && typeof conversationId !== 'string') {
      throw Object.assign(new Error('INVALID_CONVERSATION_ID'), { statusCode: 400 });
    }

    return { message: message.trim(), conversationId };
  }
}
