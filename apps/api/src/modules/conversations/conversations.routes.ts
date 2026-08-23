import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '../../config/prisma';
import type { AuthenticatedRequest } from '../auth/auth.types';

const router = Router();
const MAX_PAGE_SIZE = 100;

router.use(requireAuth);

router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 200) : null;
    const conversation = await prisma.conversation.create({
      data: { userId: req.user!.id, title },
    });
    res.status(201).json({ conversation });
  } catch (error) { next(error); }
});

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), MAX_PAGE_SIZE);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;
    res.json({ conversations: items, nextCursor: hasMore ? items[items.length - 1].id : null });
  } catch (error) { next(error); }
});

router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const conversation = await prisma.conversation.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!conversation) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }
    res.json({ conversation });
  } catch (error) { next(error); }
});

router.get('/:id/messages', async (req: AuthenticatedRequest, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), MAX_PAGE_SIZE);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const ownsConversation = await prisma.conversation.findFirst({ where: { id: req.params.id, userId: req.user!.id }, select: { id: true } });
    if (!ownsConversation) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    res.json({ messages: items, nextCursor: hasMore ? items[items.length - 1].id : null });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await prisma.conversation.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    if (result.count === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
      return;
    }
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
