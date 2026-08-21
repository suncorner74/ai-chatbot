import {
  LLMProvider,
  LLMMessage,
} from '../../ai/llm/interfaces/llm-provider.interface';
import { CHATBOT_SYSTEM_PROMPT } from '../../ai/prompts/chatbot.system';

/**
 * ChatService — the brain of the chat feature.
 *
 * ─────────────────────────────────────────────────────────────────
 * SINGLE RESPONSIBILITY:
 * ChatService owns the BUSINESS LOGIC of chat.
 * It knows HOW to process a chat request — building the message
 * history, applying the system prompt, calling the LLM.
 *
 * What ChatService does NOT do:
 * ✗ Does NOT parse HTTP requests (that's the Controller)
 * ✗ Does NOT know which LLM is used (that's the Provider)
 * ✗ Does NOT format HTTP responses (that's the Controller)
 * ─────────────────────────────────────────────────────────────────
 *
 * DEPENDENCY INJECTION:
 * The constructor receives an LLMProvider — not an OpenAIProvider specifically.
 * This means you can inject any provider, including a mock for testing:
 *
 *   // Production:
 *   new ChatService(new OpenAIProvider())
 *
 *   // Tests:
 *   new ChatService(mockLLMProvider)
 *
 * ─────────────────────────────────────────────────────────────────
 * PHASE EVOLUTION:
 *
 * Phase 2 (Conversations):
 *   async chat(userId: string, conversationId: string, userMessage: string)
 *   → Add loadHistory() to fetch previous messages from the DB
 *   → Add saveMessage() to persist user + assistant messages
 *   → Build messages array: [system, ...history, newUserMessage]
 *
 * Phase 5 (RAG):
 *   → Add retrieveContext(userMessage) → relevant documents
 *   → Inject context into the system prompt or as a separate message
 *
 * Phase 7 (Tool calling):
 *   → Add tool definitions to the LLM call
 *   → Handle tool call responses in a loop
 * ─────────────────────────────────────────────────────────────────
 */
export class ChatService {
  constructor(private readonly llmProvider: LLMProvider) {}

  async chat(userMessage: string): Promise<string> {
    /**
     * Build the messages array the LLM will receive.
     *
     * CONTEXT WINDOW NOTE:
     * Currently we only send the system prompt + current user message.
     * In Phase 2, this array grows to include conversation history.
     * We'll need to truncate old messages to stay within the LLM's
     * context window limit (e.g., GPT-4o-mini: 128k tokens).
     */
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: CHATBOT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Delegate to whichever LLM provider was injected
    return this.llmProvider.generateResponse(messages);
  }
}
