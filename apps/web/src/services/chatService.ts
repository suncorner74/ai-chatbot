import { ApiError } from '../types/chat';

export interface SendMessageResult { message: string; conversationId: string }
interface SendMessageResponse { message: string; conversationId: string }
interface SendMessageErrorResponse { error: ApiError }

export async function sendMessage(message: string, conversationId?: string): Promise<SendMessageResult> {
  const API_URL = import.meta.env.VITE_API_URL;
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
