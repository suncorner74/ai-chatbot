/**
 * Shared TypeScript types used by both the frontend and backend.
 *
 * WHY A SHARED PACKAGE?
 * Without shared types, the frontend and backend can drift apart — one expects
 * { message: string } and the other sends { text: string }. The TypeScript
 * compiler catches this mismatch at compile time instead of at runtime.
 *
 * FUTURE EXTENSIONS (Phase 2+):
 * - Add 'system' | 'tool' roles
 * - Add metadata, timestamp, sourceDocuments
 * - These additions won't break existing code
 */

/**
 * Who sent the message.
 * - "user"      → the human typing in the chat
 * - "assistant" → the AI's response
 */
export type MessageRole = 'user' | 'assistant';

/**
 * A single message in the chat conversation.
 *
 * The `id` is generated on the frontend so React can use it as a stable key
 * for rendering lists (avoids unnecessary re-renders).
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
}

/**
 * The request body sent by the frontend to POST /api/chat
 */
export interface ChatRequest {
  message: string;
  conversationId?: string;
}

/**
 * The success response body from POST /api/chat
 */
export interface ChatResponse {
  message: string;
  conversationId: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage extends ChatMessage {
  createdAt: string;
}

export interface ConversationDetails extends ConversationSummary {
  messages: ConversationMessage[];
}

/**
 * The error response body — safe to expose to clients.
 * Never includes stack traces or internal details.
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
