import { prisma } from '../../config/prisma';
import {
  LLMProvider,
  LLMMessage,
} from '../../ai/llm/interfaces/llm-provider.interface';
import { CHATBOT_SYSTEM_PROMPT } from '../../ai/prompts/chatbot.system';

export class ChatService {
  constructor(private readonly llmProvider: LLMProvider) {}

  async chat(userId: string, conversationId: string | undefined, userMessage: string) {
    let conversation;

    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        select: { id: true },
      });
      if (!conversation) throw new Error('CONVERSATION_NOT_FOUND');
    } else {
      conversation = await prisma.conversation.create({
        data: { userId, title: userMessage.slice(0, 80) },
        select: { id: true },
      });
    }

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { role: true, content: true },
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
      ...history.map((message) => ({ role: message.role as LLMMessage['role'], content: message.content })),
      { role: 'user', content: userMessage },
    ];

    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'user', content: userMessage },
    });

    const response = await this.llmProvider.generateResponse(messages);

    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'assistant', content: response },
    });

    return { message: response, conversationId: conversation.id };
  }
}
