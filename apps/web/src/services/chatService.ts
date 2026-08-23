import { ApiError } from '../types/chat';

interface SendMessageSuccessResponse { message: string }
interface SendMessageErrorResponse { error: ApiError }

export async function sendMessage(message: string): Promise<string> {
  const API_URL = import.meta.env.VITE_API_URL;
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as SendMessageErrorResponse | null;
    throw new Error(errorData?.error?.message ?? 'Something went wrong. Please try again.');
  }

  const data = (await response.json()) as SendMessageSuccessResponse;
  return data.message;
}
