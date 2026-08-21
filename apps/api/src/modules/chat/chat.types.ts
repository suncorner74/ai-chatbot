/**
 * Internal types for the chat module.
 *
 * These are backend-only types — not shared with the frontend.
 * Public API types (ChatMessage, ChatRequest, ChatResponse) live in shared-types.
 */

/**
 * Maximum character length for a single user message.
 *
 * WHY THIS LIMIT?
 * LLMs are charged per token. A 10,000-word message costs significantly more
 * than a 500-word message. This limit protects against:
 * - Accidental huge pastes
 * - Malicious users trying to rack up API costs
 *
 * In Phase 5 (RAG), this limit will be reviewed alongside context window limits.
 */
export const MAX_MESSAGE_LENGTH = 4000;
