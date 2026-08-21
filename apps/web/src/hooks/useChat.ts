import { useCallback, useState } from 'react';
import { sendMessage } from '../services/chatService';
import { ChatMessage } from '../types/chat';

/**
 * Generates a simple unique ID for each message.
 * Using timestamp + random string avoids the need for an external library.
 * In Phase 2, the backend will generate real IDs from the database.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * The return type of useChat — explicit interface makes usage self-documenting.
 */
export interface UseChatReturn {
  messages: ChatMessage[];
  conversations: ChatConversation[];
  activeConversationId: string;
  input: string;
  loading: boolean;
  error: string | null;
  setInput: (value: string) => void;
  handleSend: () => Promise<void>;
  newChat: () => void;
  selectConversation: (conversationId: string) => void;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

/**
 * useChat — custom hook that owns all chat state and logic.
 *
 * ─────────────────────────────────────────────────────────────────
 * WHY A CUSTOM HOOK?
 *
 * The alternative is putting all this state directly in ChatWindow:
 *   const [messages, setMessages] = useState([]);
 *   const [loading, setLoading] = useState(false);
 *   ... all logic mixed with JSX ...
 *
 * Problems:
 * - ChatWindow becomes a huge, hard-to-read file
 * - You can't reuse the chat logic in another component
 * - Tests for logic are tangled with rendering tests
 *
 * With useChat():
 * - ChatWindow is clean JSX (just renders what the hook gives it)
 * - Logic is isolated and independently testable
 * - Any component can use useChat() to get chat capabilities
 * ─────────────────────────────────────────────────────────────────
 *
 * STATE EXPLANATION:
 *
 * messages — the full conversation history (displayed in MessageList)
 *
 * input — what the user is currently typing (controlled textarea)
 *
 * loading — true while waiting for the AI response
 *   → Disables the input and send button
 *   → Shows the typing indicator
 *
 * error — the last error message (null if no error)
 *   → Set when the API call fails
 *   → Cleared before each new request
 */
export function useChat(): UseChatReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    const id = generateId();
    return [{ id, title: 'New chat', messages: [] }];
  });
  const [activeConversationId, setActiveConversationId] = useState(
    () => conversations[0].id
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messages =
    conversations.find(({ id }) => id === activeConversationId)?.messages ?? [];

  const newChat = useCallback(() => {
    const id = generateId();
    setConversations((previous) => [
      ...previous,
      { id, title: 'New chat', messages: [] },
    ]);
    setActiveConversationId(id);
    setInput('');
    setError(null);
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    setInput('');
    setError(null);
  }, []);

  /**
   * useCallback prevents handleSend from being recreated on every render.
   * It only changes when its dependencies (input, loading) change.
   * This is important for performance when passing handleSend as a prop.
   */
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();

    // Guard: don't send empty messages or double-send while loading
    if (!trimmed || loading) return;

    // 1. Add the user's message to the conversation immediately
    //    (optimistic UI — show the message before the API responds)
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
    };

    setConversations((previous) => previous.map((conversation) => {
      if (conversation.id !== activeConversationId) return conversation;

      return {
        ...conversation,
        title: conversation.messages.length === 0
          ? trimmed.slice(0, 32) || 'New chat'
          : conversation.title,
        messages: [...conversation.messages, userMessage],
      };
    }));
    setInput('');      // Clear the input box
    setLoading(true);  // Show the typing indicator
    setError(null);    // Clear any previous error

    try {
      // 2. Send to the backend and wait for the AI's response
      const responseText = await sendMessage(trimmed);

      // 3. Add the AI's response to the conversation
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
      };

      setConversations((previous) => previous.map((conversation) => (
        conversation.id === activeConversationId
          ? { ...conversation, messages: [...conversation.messages, assistantMessage] }
          : conversation
      )));
    } catch (err) {
      // Show a user-friendly error message
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      // Always stop loading, whether success or failure
      setLoading(false);
    }
  }, [activeConversationId, input, loading]);

  return {
    messages,
    conversations,
    activeConversationId,
    input,
    loading,
    error,
    setInput,
    handleSend,
    newChat,
    selectConversation,
  };
}
