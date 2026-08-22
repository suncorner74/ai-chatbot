import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { ConversationController } from './conversation.controller';
import { ConversationRepository } from './conversation.repository';

const router = Router();
const controller = new ConversationController(new ConversationRepository(prisma));

router.post('/', (req, res, next) => controller.create(req, res, next));
router.get('/', (req, res, next) => controller.list(req, res, next));
router.get('/:id/messages', (req, res, next) => controller.messages(req, res, next));
router.delete('/:id', (req, res, next) => controller.remove(req, res, next));

export default router;
