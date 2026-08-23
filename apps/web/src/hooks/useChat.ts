import { useCallback, useEffect, useState } from 'react';
import { getConversationMessages, getConversations, sendMessage } from '../services/chatService';
import { ChatMessage } from '../types/chat';

function generateId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
export interface UseChatReturn { messages: ChatMessage[]; conversations: ChatConversation[]; activeConversationId: string; input: string; loading: boolean; error: string | null; setInput: (value: string) => void; handleSend: () => Promise<void>; newChat: () => void; selectConversation: (conversationId: string) => Promise<void>; reset: () => void; }
export interface ChatConversation { id: string; title: string; messages: ChatMessage[]; }
function isLocalConversationId(id: string) { return /^\d+-[a-z0-9]+$/.test(id); }
const latestConversationKey = (userId: string) => `ai-chatbot:latest-conversation:${userId}`;

export function useChat(userId?: string): UseChatReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messages = conversations.find(({ id }) => id === activeConversationId)?.messages ?? [];

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      const id = generateId();
      setConversations([{ id, title: 'New chat', messages: [] }]); setActiveConversationId(id); setInput(''); setError(null);
      return;
    }
    setLoading(true); setError(null);
    void getConversations().then(({ conversations: remoteConversations }) => {
      if (cancelled) return;
      const loaded = remoteConversations.map((conversation) => ({ id: conversation.id, title: conversation.title || 'New chat', messages: [] }));
      const savedId = window.localStorage.getItem(latestConversationKey(userId));
      const activeId = loaded.some(({ id }) => id === savedId) ? savedId! : loaded[0]?.id ?? '';
      setConversations(loaded); setActiveConversationId(activeId);
      if (activeId) window.localStorage.setItem(latestConversationKey(userId), activeId);
      if (activeId) {
        return getConversationMessages(activeId).then((result) => {
          if (!cancelled) setConversations((previous) => previous.map((conversation) => conversation.id === activeId ? { ...conversation, messages: result.messages } : conversation));
        });
      }
    }).catch((err: unknown) => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load conversations.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const newChat = useCallback(() => { const id = generateId(); setConversations((previous) => [...previous, { id, title: 'New chat', messages: [] }]); setActiveConversationId(id); setInput(''); setError(null); }, []);
  const selectConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId); setInput(''); setError(null);
    if (userId) window.localStorage.setItem(latestConversationKey(userId), conversationId);
    const conversation = conversations.find(({ id }) => id === conversationId);
    if (!conversation || isLocalConversationId(conversationId) || conversation.messages.length > 0) return;
    setLoading(true);
    try {
      const result = await getConversationMessages(conversationId);
      setConversations((previous) => previous.map((item) => item.id === conversationId ? { ...item, messages: result.messages } : item));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load messages.'); }
    finally { setLoading(false); }
  }, [conversations, userId]);
  const reset = useCallback(() => { setConversations([]); setActiveConversationId(''); setInput(''); setLoading(false); setError(null); }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const currentId = activeConversationId;
    const userMessage: ChatMessage = { id: generateId(), role: 'user', content: trimmed };
    setConversations((previous) => previous.map((conversation) => conversation.id === currentId ? { ...conversation, title: conversation.messages.length === 0 ? trimmed.slice(0, 32) || 'New chat' : conversation.title, messages: [...conversation.messages, userMessage] } : conversation));
    setInput(''); setLoading(true); setError(null);
    try {
      const result = isLocalConversationId(currentId) ? await sendMessage(trimmed) : await sendMessage(trimmed, currentId);
      const response = typeof result === 'string' ? { message: result, conversationId: currentId } : result;
      setConversations((previous) => previous.map((conversation) => conversation.id === currentId ? { ...conversation, id: response.conversationId } : conversation));
      setActiveConversationId(response.conversationId);
      if (userId) window.localStorage.setItem(latestConversationKey(userId), response.conversationId);
      const assistantMessage: ChatMessage = { id: generateId(), role: 'assistant', content: response.message };
      setConversations((previous) => previous.map((conversation) => conversation.id === response.conversationId ? { ...conversation, messages: [...conversation.messages, assistantMessage] } : conversation));
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  }, [activeConversationId, input, loading, userId]);

  return { messages, conversations, activeConversationId, input, loading, error, setInput, handleSend, newChat, selectConversation, reset };
}
