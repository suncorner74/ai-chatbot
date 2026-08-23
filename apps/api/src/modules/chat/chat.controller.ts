import { NextFunction, Response } from 'express';
import { MAX_MESSAGE_LENGTH } from './chat.types';
import { ChatGenerationMode, ChatService, RagOptions } from './chat.service';
import { encodeSseEvent, writeSseHeaders } from './chat.stream';
import type { AuthenticatedRequest } from '../auth/auth.types';

class ChatHttpError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) { super(message); this.name = 'ChatHttpError'; }
}

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId, rag } = this.validateRequest(req);
      const result = await this.chatService.chat(req.user!.id, conversationId, message, rag);
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
    const abort = () => { if (!res.writableEnded) abortController.abort(); };
    req.once('aborted', abort);
    res.once('close', abort);

    try {
      const { message, conversationId, mode, rag } = this.validateRequest(req);
      const result = await this.chatService.streamChat(req.user!.id, conversationId, message, abortController.signal, mode, rag);
      writeSseHeaders(res);
      if (result.citations.length) res.write(encodeSseEvent({ event: 'sources', data: { sources: result.citations } }));
      for await (const token of result.tokens) {
        if (firstTokenAt === null) firstTokenAt = performance.now();
        res.write(encodeSseEvent({ event: 'token', data: { token } }));
      }
      const latencyMs = Math.round(performance.now() - startedAt);
      const ttftMs = firstTokenAt === null ? null : Math.round(firstTokenAt - startedAt);
      res.write(encodeSseEvent({ event: 'done', data: { conversationId: result.conversationId, ttftMs, latencyMs } }));
      res.end();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') { if (!res.writableEnded) res.end(); return; }
      if (res.headersSent) {
        res.write(encodeSseEvent({ event: 'error', data: { code: 'GENERATION_FAILED', message: 'Unable to generate a response. Please try again.' } }));
        res.end(); return;
      }
      if (this.respondToKnownError(error, res)) return;
      next(error);
    } finally {
      req.off('aborted', abort); res.off('close', abort);
    }
  }

  private validateRequest(req: AuthenticatedRequest): { message: string; conversationId?: string; mode: ChatGenerationMode; rag: RagOptions } {
    if (!req.user) throw new ChatHttpError(401, 'UNAUTHORIZED', 'Authentication required.');
    const { message, conversationId, mode = 'new', rag = {}, documentId, knowledgeBaseId } = req.body ?? {};
    if (typeof message !== 'string' || !message.trim()) throw new ChatHttpError(400, 'INVALID_REQUEST', 'Message must be a non-empty string.');
    if (message.length > MAX_MESSAGE_LENGTH) throw new ChatHttpError(400, 'INVALID_REQUEST', `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`);
    if (conversationId !== undefined && typeof conversationId !== 'string') throw new ChatHttpError(400, 'INVALID_REQUEST', 'conversationId must be a string.');
    if (mode !== 'new' && mode !== 'retry' && mode !== 'regenerate') throw new ChatHttpError(400, 'INVALID_REQUEST', 'Invalid generation mode.');
    if (mode !== 'new' && !conversationId) throw new ChatHttpError(400, 'INVALID_REQUEST', 'conversationId is required for retry or regenerate.');
    if (documentId !== undefined && typeof documentId !== 'string') throw new ChatHttpError(400, 'INVALID_REQUEST', 'documentId must be a string.');
    if (knowledgeBaseId !== undefined && typeof knowledgeBaseId !== 'string') throw new ChatHttpError(400, 'INVALID_REQUEST', 'knowledgeBaseId must be a string.');
    const normalizedRag: RagOptions = {
      enabled: rag?.enabled === true || Boolean(documentId) || Boolean(knowledgeBaseId),
      documentId: documentId || rag?.documentId,
      knowledgeBaseId: knowledgeBaseId || rag?.knowledgeBaseId,
    };
    return { message: message.trim(), conversationId, mode, rag: normalizedRag };
  }

  private respondToKnownError(error: unknown, res: Response): boolean {
    if (error instanceof ChatHttpError) { res.status(error.statusCode).json({ error: { code: error.code, message: error.message } }); return true; }
    if (error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND') { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } }); return true; }
    return false;
  }
}
