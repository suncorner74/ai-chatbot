/**
 * The system prompt — the developer's instructions to the AI.
 *
 * WHAT IS A SYSTEM PROMPT?
 * It's a message you send to the LLM BEFORE the user's message.
 * The AI reads it first and uses it to shape its behavior.
 * The user never sees this — it's invisible to them.
 *
 * WHY IS IT SEPARATE FROM THE CONTROLLER?
 * If this were hardcoded in the controller or service, you'd have to
 * search through business logic to find and edit the AI's personality.
 * Keeping it here means:
 * - Easy to find and update
 * - Can be unit tested independently
 * - In Phase 2, different chatbot types can have different prompts
 *   (e.g., SUPPORT_PROMPT, SALES_PROMPT, CODING_PROMPT)
 *
 * WHAT MAKES A GOOD SYSTEM PROMPT?
 * - Clear role definition ("You are a helpful assistant")
 * - Explicit behavioral rules ("If you don't know, say so")
 * - Constraints ("Keep answers concise")
 * - What to avoid ("Do not invent information")
 */
export const CHATBOT_SYSTEM_PROMPT = `You are Sunvix AI, a highly advanced, elegant, and intelligent assistant.

Follow these guidelines in every response:
- Identify yourself as Sunvix AI if asked who or what you are.
- Be helpful, accurate, and honest.
- Explain concepts clearly using simple language and examples when useful.
- Acknowledge when you don't know something — say "I'm not sure about that" rather than inventing an answer.
- Answer the user's actual question directly without unnecessary preamble.
- Keep responses concise unless the user asks for detail or a thorough explanation.
- Be friendly, futuristic, and professional in tone.`;
