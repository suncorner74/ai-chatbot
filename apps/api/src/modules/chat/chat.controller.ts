import { NextFunction, Request, Response } from 'express';
import { MAX_MESSAGE_LENGTH } from './chat.types';
import { ChatService } from './chat.service';

/**
 * ChatController — the HTTP boundary.
 *
 * ─────────────────────────────────────────────────────────────────
 * SINGLE RESPONSIBILITY:
 * The controller sits between the HTTP layer and the business logic.
 * It has exactly three jobs:
 *   1. Extract and validate data from the HTTP request
 *   2. Call the service with clean, validated data
 *   3. Format and return the HTTP response
 *
 * What the controller does NOT do:
 * ✗ Does NOT contain business logic (no LLM calls, no message building)
 * ✗ Does NOT know about OpenAI or any LLM
 * ✗ Does NOT touch the database (future phases)
 * ─────────────────────────────────────────────────────────────────
 *
 * WHY VALIDATE IN THE CONTROLLER, NOT THE SERVICE?
 * HTTP validation (missing fields, wrong types, length limits) is an
 * HTTP concern. The service should receive clean, trusted data.
 * This way the service can be called from anywhere (CLI, tests, cron jobs)
 * without needing to pass HTTP-formatted requests.
 */
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { message, conversationId } = req.body;

      // ── Validation ─────────────────────────────────────────────
      if (message === undefined || message === null) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request body must include a "message" field.',
          },
        });
        return;
      }

      if (typeof message !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Message must be a string.',
          },
        });
        return;
      }

      if (message.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Message must not be empty.',
          },
        });
        return;
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
          },
        });
        return;
      }

      if (conversationId !== undefined && typeof conversationId !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Conversation ID must be a string.',
          },
        });
        return;
      }
      // ── End Validation ──────────────────────────────────────────

      // Delegate to the service with clean, validated data
      const response = await this.chatService.chat(message.trim(), conversationId);

      res.status(200).json(response);
    } catch (error) {
      // Pass any unexpected errors to the global error handler (error-handler.ts)
      next(error);
    }
  }
}
