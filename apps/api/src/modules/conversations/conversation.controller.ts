import { NextFunction, Request, Response } from 'express';
import { ConversationRepository } from './conversation.repository';
import { MAX_CONVERSATION_TITLE_LENGTH } from './conversation.types';

export class ConversationController {
  constructor(private readonly repository: ConversationRepository) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body ?? {};
      if (title !== undefined && (typeof title !== 'string' || title.trim().length > MAX_CONVERSATION_TITLE_LENGTH)) {
        res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Title must be a string of at most 100 characters.' } });
        return;
      }
      const conversation = await this.repository.create(title?.trim() || 'New chat');
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await this.repository.list());
    } catch (error) {
      next(error);
    }
  }

  async messages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await this.repository.getById(req.params.id);
      if (!conversation) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
        return;
      }
      res.status(200).json(conversation);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await this.repository.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
