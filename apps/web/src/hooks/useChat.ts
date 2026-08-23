import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatRequestError, getConversationMessages, getConversations, streamMessage } from '../services/chatService';
import { ChatMessage } from '../types/chat';

function generateId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function isLocalConversationId(id: string) { return /^\d+-[a-z0-9]+$/.test(id); }
const latestConversationKey = (userId: string) => `ai-chatbot:latest-conversation:${userId}`;

export type ChatPhase = 'idle' | 'sending' | 'waiting' | 'streaming' | 'complete' | 'error' | 'aborted';
export interface UseChatReturn {
  messages: ChatMessage[]; conversations: ChatConversation[]; activeConversationId: string; input: string;
  loading: boolean; phase: ChatPhase; error: string | null; setInput: (value: string) => void;
  handleSend: () => Promise<void>; stopGeneration: () => void; retry: () => Promise<void>; regenerate: () => Promise<void>;
  newChat: () => void; selectConversation: (conversationId: string) => Promise<void>; reset: () => void;
}
export interface ChatConversation { id: string; title: string; messages: ChatMessage[]; }

export function useChat(userId?: string): UseChatReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<ChatPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messages = conversations.find(({ id }) => id === activeConversationId)?.messages ?? [];
  const loading = phase === 'sending' || phase === 'waiting' || phase === 'streaming';

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      const id = generateId();
      setConversations([{ id, title: 'New chat', messages: [] }]); setActiveConversationId(id);
      setInput(''); setError(null); setPhase('idle');
      return () => { cancelled = true; abortRef.current?.abort(); };
    }
    setPhase('sending'); setError(null);
    void getConversations().then(({ conversations: remoteConversations }) => {
      if (cancelled) return;
      const loaded = remoteConversations.map((conversation) => ({ id: conversation.id, title: conversation.title || 'New chat', messages: [] }));
      const savedId = window.localStorage.getItem(latestConversationKey(userId));
      const activeId = loaded.some(({ id }) => id === savedId) ? savedId! : loaded[0]?.id ?? '';
      setConversations(loaded); setActiveConversationId(activeId);
      if (activeId) window.localStorage.setItem(latestConversationKey(userId), activeId);
      if (activeId) return getConversationMessages(activeId).then((result) => {
        if (!cancelled) setConversations((previous) => previous.map((conversation) => conversation.id === activeId ? { ...conversation, messages: result.messages } : conversation));
      });
      return undefined;
    }).catch((err: unknown) => {
      if (!cancelled) { setError(err instanceof Error ? err.message : 'Unable to load conversations.'); setPhase('error'); }
    }).finally(() => { if (!cancelled) setPhase((current) => current === 'sending' ? 'idle' : current); });
    return () => { cancelled = true; abortRef.current?.abort(); };
  }, [userId]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    const id = generateId();
    setConversations((previous) => [...previous, { id, title: 'New chat', messages: [] }]);
    setActiveConversationId(id); setInput(''); setError(null); setPhase('idle');
  }, []);

  const selectConversation = useCallback(async (conversationId: string) => {
    abortRef.current?.abort();
    setActiveConversationId(conversationId); setInput(''); setError(null); setPhase('idle');
    if (userId) window.localStorage.setItem(latestConversationKey(userId), conversationId);
    const conversation = conversations.find(({ id }) => id === conversationId);
    if (!conversation || isLocalConversationId(conversationId) || conversation.messages.length > 0) return;
    setPhase('sending');
    try {
      const result = await getConversationMessages(conversationId);
      setConversations((previous) => previous.map((item) => item.id === conversationId ? { ...item, messages: result.messages } : item));
      setPhase('idle');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load messages.'); setPhase('error'); }
  }, [conversations, userId]);

  const sendPrompt = useCallback(async (prompt: string, conversationId: string, addUserMessage: boolean) => {
    const assistantId = generateId();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null); setPhase('sending');
    setConversations((previous) => previous.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      const messagesToUse = addUserMessage ? [...conversation.messages, { id: generateId(), role: 'user' as const, content: prompt }] : conversation.messages;
      return { ...conversation, title: conversation.messages.length === 0 ? prompt.slice(0, 32) || 'New chat' : conversation.title, messages: [...messagesToUse, { id: assistantId, role: 'assistant' as const, content: '' }] };
    }));

    let completed = false;
    try {
      setPhase('waiting');
      await streamMessage(prompt, isLocalConversationId(conversationId) ? undefined : conversationId, (event) => {
        if (event.event === 'token') {
          setPhase('streaming');
          setConversations((previous) => previous.map((conversation) => conversation.id === conversationId
            ? { ...conversation, messages: conversation.messages.map((item) => item.id === assistantId ? { ...item, content: item.content + event.data.token } : item) }
            : conversation));
        } else if (event.event === 'done') {
          completed = true;
          const remoteId = event.data.conversationId;
          setConversations((previous) => previous.map((conversation) => conversation.id === conversationId ? { ...conversation, id: remoteId } : conversation));
          setActiveConversationId(remoteId);
          if (userId) window.localStorage.setItem(latestConversationKey(userId), remoteId);
          setPhase('complete');
        } else {
          throw new ChatRequestError(500, event.data.code, event.data.message);
        }
      }, controller.signal);
      if (!completed) throw new ChatRequestError(500, 'STREAM_INCOMPLETE', 'The response ended unexpectedly. Please try again.');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('aborted');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setPhase('error');
      }
      setConversations((previous) => previous.map((conversation) => conversation.id === conversationId ? { ...conversation, messages: conversation.messages.filter((item) => item.id !== assistantId) } : conversation));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [userId]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !activeConversationId) return;
    setInput('');
    await sendPrompt(trimmed, activeConversationId, true);
  }, [activeConversationId, input, loading, sendPrompt]);

  const stopGeneration = useCallback(() => { abortRef.current?.abort(); }, []);

  const retry = useCallback(async () => {
    if (loading) return;
    const current = conversations.find(({ id }) => id === activeConversationId);
    const lastUser = [...(current?.messages ?? [])].reverse().find((item) => item.role === 'user');
    if (lastUser) await sendPrompt(lastUser.content, activeConversationId, true);
  }, [activeConversationId, conversations, loading, sendPrompt]);

  const regenerate = useCallback(async () => {
    if (loading) return;
    const current = conversations.find(({ id }) => id === activeConversationId);
    const lastUser = [...(current?.messages ?? [])].reverse().find((item) => item.role === 'user');
    const lastAssistantIndex = current ? [...current.messages].map((item) => item.role).lastIndexOf('assistant') : -1;
    if (!lastUser) return;
    if (lastAssistantIndex >= 0) setConversations((previous) => previous.map((conversation) => conversation.id === activeConversationId
      ? { ...conversation, messages: conversation.messages.filter((_, index) => index !== lastAssistantIndex) } : conversation));
    await sendPrompt(lastUser.content, activeConversationId, false);
  }, [activeConversationId, conversations, loading, sendPrompt]);

  const reset = useCallback(() => {
    abortRef.current?.abort(); setConversations([]); setActiveConversationId(''); setInput(''); setPhase('idle'); setError(null);
  }, []);

  return { messages, conversations, activeConversationId, input, loading, phase, error, setInput, handleSend, stopGeneration, retry, regenerate, newChat, selectConversation, reset };
}
