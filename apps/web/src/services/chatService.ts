import { ApiError } from '../types/chat';

export interface SendMessageResult { message: string; conversationId: string }
interface SendMessageResponse { message: string; conversationId: string }
interface SendMessageErrorResponse { error: ApiError }

export interface ConversationSummary { id: string; title: string | null; createdAt: string; updatedAt: string }
interface ConversationsResponse { conversations: ConversationSummary[] }
interface MessagesResponse { messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }> }

const API_URL = import.meta.env.VITE_API_URL;

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as SendMessageErrorResponse | null;
    throw new Error(errorData?.error?.message ?? 'Something went wrong. Please try again.');
  }
  return response.json() as Promise<T>;
}

export async function getConversations() {
  return request<ConversationsResponse>('/api/conversations');
}

export async function getConversationMessages(conversationId: string) {
  const result = await request<MessagesResponse>(`/api/conversations/${conversationId}/messages`);
  return { ...result, messages: [...result.messages].reverse() };
}

export async function sendMessage(message: string, conversationId?: string): Promise<SendMessageResult> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as SendMessageErrorResponse | null;
    throw new Error(errorData?.error?.message ?? 'Something went wrong. Please try again.');
  }

  return (await response.json()) as SendMessageResponse;
}
