import { useCallback, useState } from 'react';
import { sendMessage } from '../services/chatService';
import { ChatMessage } from '../types/chat';

function generateId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
export interface UseChatReturn { messages: ChatMessage[]; conversations: ChatConversation[]; activeConversationId: string; input: string; loading: boolean; error: string | null; setInput: (value: string) => void; handleSend: () => Promise<void>; newChat: () => void; selectConversation: (conversationId: string) => void; }
export interface ChatConversation { id: string; title: string; messages: ChatMessage[]; }
function isLocalConversationId(id: string) { return /^\d+-[a-z0-9]+$/.test(id); }

export function useChat(): UseChatReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => { const id = generateId(); return [{ id, title: 'New chat', messages: [] }]; });
  const [activeConversationId, setActiveConversationId] = useState(() => conversations[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messages = conversations.find(({ id }) => id === activeConversationId)?.messages ?? [];

  const newChat = useCallback(() => { const id = generateId(); setConversations((previous) => [...previous, { id, title: 'New chat', messages: [] }]); setActiveConversationId(id); setInput(''); setError(null); }, []);
  const selectConversation = useCallback((conversationId: string) => { setActiveConversationId(conversationId); setInput(''); setError(null); }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const currentId = activeConversationId;
    const userMessage: ChatMessage = { id: generateId(), role: 'user', content: trimmed };
    setConversations((previous) => previous.map((conversation) => conversation.id === currentId ? { ...conversation, title: conversation.messages.length === 0 ? trimmed.slice(0, 32) || 'New chat' : conversation.title, messages: [...conversation.messages, userMessage] } : conversation));
    setInput(''); setLoading(true); setError(null);
    try {
      const result = await sendMessage(trimmed, isLocalConversationId(currentId) ? undefined : currentId);
      setConversations((previous) => previous.map((conversation) => conversation.id === currentId ? { ...conversation, id: result.conversationId } : conversation));
      setActiveConversationId(result.conversationId);
      const assistantMessage: ChatMessage = { id: generateId(), role: 'assistant', content: result.message };
      setConversations((previous) => previous.map((conversation) => conversation.id === result.conversationId ? { ...conversation, messages: [...conversation.messages, assistantMessage] } : conversation));
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  }, [activeConversationId, input, loading]);

  return { messages, conversations, activeConversationId, input, loading, error, setInput, handleSend, newChat, selectConversation };
}
