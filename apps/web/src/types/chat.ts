/**
 * Frontend TypeScript types for the chat feature.
 *
 * NOTE ON PHASE 1 DESIGN DECISION:
 * These types mirror @ai-chatbot/shared-types but are defined locally.
 * This is intentional for Phase 1 — configuring Vite to resolve workspace
 * TypeScript packages adds complexity that isn't educational at this stage.
 *
 * In Phase 2, we'll configure the monorepo build properly and import from:
 *   import type { ChatMessage } from '@ai-chatbot/shared-types'
 *
 * For now, keeping them here means the frontend "just works" with Vite.
 *
 * FUTURE ADDITIONS (Phase 2+):
 * - timestamp: Date
 * - metadata: Record<string, unknown>
 * - sourceDocuments: Document[]  (Phase 5 — RAG)
 */

/**
 * Who sent the message.
 * "user" = the human. "assistant" = the AI.
 */
export type MessageRole = 'user' | 'assistant';

/**
 * A single message in the conversation.
 *
 * WHY AN `id` FIELD?
 * React needs a stable, unique key for each item in a list.
 * Using the array index as a key causes bugs when items reorder.
 * We generate a unique ID on the frontend when creating each message.
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetails extends ConversationSummary {
  messages: ChatMessage[];
}

/**
 * The safe error shape returned by the backend.
 * Never contains stack traces or internal details.
 */
export interface ApiError {
  code: string;
  message: string;
}
