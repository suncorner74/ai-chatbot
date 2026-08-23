import { prisma } from '../../config/prisma';

export class ChatRepository {
  async findConversationForUser(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
  }

  async createConversation(userId: string, title: string) {
    return prisma.conversation.create({
      data: { userId, title: title.slice(0, 80) },
      select: { id: true },
    });
  }

  async getHistory(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { role: true, content: true },
    });
  }

  async createUserMessage(conversationId: string, content: string) {
    return prisma.message.create({
      data: { conversationId, role: 'user', content },
      select: { id: true },
    });
  }

  async createAssistantMessage(conversationId: string, content: string) {
    return prisma.message.create({
      data: { conversationId, role: 'assistant', content },
      select: { id: true },
    });
  }

  async createAssistantMessageIfMissing(conversationId: string, content: string) {
    const existing = await prisma.message.findFirst({
      where: { conversationId, role: 'assistant', content },
      select: { id: true },
    });
    if (existing) return existing;
    return this.createAssistantMessage(conversationId, content);
  }
}
