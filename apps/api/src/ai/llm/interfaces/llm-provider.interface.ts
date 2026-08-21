/**
 * LLMMessage — the shape of a message sent to any LLM.
 *
 * This is DIFFERENT from the frontend's ChatMessage:
 * - No `id` field (LLMs don't need identifiers)
 * - Includes 'system' role (the developer's instructions to the AI)
 *
 * This type lives here because only the backend LLM layer needs it.
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLMProvider — the contract every LLM provider must implement.
 *
 * ─────────────────────────────────────────────────────────────────
 * WHY AN INTERFACE? (Dependency Inversion Principle)
 * ─────────────────────────────────────────────────────────────────
 * Without an interface:
 *   ChatService → OpenAI directly
 *
 * To switch to Gemini, you'd rewrite ChatService.
 *
 * With an interface:
 *   ChatService → LLMProvider interface ← OpenAIProvider
 *                                       ← GeminiProvider  (Phase 9)
 *                                       ← ClaudeProvider  (Phase 9)
 *                                       ← MockProvider    (tests)
 *
 * ChatService NEVER changes. You just swap which class is injected.
 * This is the Dependency Inversion Principle: high-level modules
 * (ChatService) depend on abstractions (LLMProvider), not
 * on low-level details (OpenAI SDK).
 * ─────────────────────────────────────────────────────────────────
 *
 * PHASE 4 EVOLUTION:
 * Add streamResponse(messages: LLMMessage[]): AsyncIterable<string>
 * The interface grows, but existing implementations still work.
 */
export interface LLMProvider {
  generateResponse(messages: LLMMessage[]): Promise<string>;
}
