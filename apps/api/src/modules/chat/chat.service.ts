import {
  LLMProvider,
  LLMMessage,
} from '../../ai/llm/interfaces/llm-provider.interface';
import { CHATBOT_SYSTEM_PROMPT } from '../../ai/prompts/chatbot.system';
import { ChatRepository } from './chat.repository';

export interface ChatStreamResult {
  conversationId: string;
  tokens: AsyncIterable<string>;
}

export class ChatService {
  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly repository = new ChatRepository(),
  ) {}

  async chat(userId: string, conversationId: string | undefined, userMessage: string) {
    const conversation = await this.resolveConversation(userId, conversationId, userMessage);
    const messages = await this.buildMessages(conversation.id, userMessage);

    await this.repository.createUserMessage(conversation.id, userMessage);
    const response = await this.llmProvider.generateResponse(messages);
    await this.repository.createAssistantMessage(conversation.id, response);

    return { message: response, conversationId: conversation.id };
  }

  async streamChat(
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
    signal?: AbortSignal,
  ): Promise<ChatStreamResult> {
    const conversation = await this.resolveConversation(userId, conversationId, userMessage);
    const messages = await this.buildMessages(conversation.id, userMessage);
    await this.repository.createUserMessage(conversation.id, userMessage);

    const llmStream = this.llmProvider.streamResponse(messages, { signal });
    const repository = this.repository;
    const conversationIdValue = conversation.id;
    const startedAt = performance.now();

    async function* tokens(): AsyncIterable<string> {
      let response = '';
      let ttftMs: number | null = null;

      try {
        for await (const token of llmStream) {
          if (signal?.aborted) throw new DOMException('Generation aborted', 'AbortError');
          if (ttftMs === null) ttftMs = Math.round(performance.now() - startedAt);
          response += token;
          yield token;
        }

        if (!response) throw new Error('LLM_EMPTY_RESPONSE');
        await repository.createAssistantMessage(conversationIdValue, response);
      } finally {
        // The assistant message is intentionally persisted only after the stream completes.
      }
    }

    return { conversationId: conversationIdValue, tokens: tokens() };
  }

  private async resolveConversation(userId: string, conversationId: string | undefined, userMessage: string) {
    if (conversationId) {
      const conversation = await this.repository.findConversationForUser(conversationId, userId);
      if (!conversation) throw new Error('CONVERSATION_NOT_FOUND');
      return conversation;
    }
    return this.repository.createConversation(userId, userMessage);
  }

  private async buildMessages(conversationId: string, userMessage: string): Promise<LLMMessage[]> {
    const history = await this.repository.getHistory(conversationId);
    return [
      { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
      ...history.map((message) => ({
        role: message.role as LLMMessage['role'],
        content: message.content,
      })),
      { role: 'user', content: userMessage },
    ];
  }
}
