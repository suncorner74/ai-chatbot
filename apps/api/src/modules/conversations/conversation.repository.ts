import { PrismaClient, MessageRole } from '@prisma/client';
import { ConversationDetails, ConversationSummary } from './conversation.types';

export class ConversationRepository {
  constructor(private readonly database: PrismaClient) {}

  async create(title = 'New chat', userId = 'anonymous'): Promise<ConversationSummary> {
    return this.database.conversation.create({
      data: { title, userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async list(userId = 'anonymous'): Promise<ConversationSummary[]> {
    return this.database.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async getById(id: string, userId = 'anonymous'): Promise<ConversationDetails | null> {
    return this.database.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    }) as Promise<ConversationDetails | null>;
  }

  async addMessage(conversationId: string, role: MessageRole, content: string) {
    return this.database.$transaction([
      this.database.message.create({ data: { conversationId, role, content } }),
      this.database.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  async renameIfNew(conversationId: string, title: string) {
    return this.database.conversation.updateMany({
      where: { id: conversationId, title: 'New chat' },
      data: { title: title.slice(0, 100) },
    });
  }

  async delete(id: string, userId = 'anonymous'): Promise<boolean> {
    const result = await this.database.conversation.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }
}
