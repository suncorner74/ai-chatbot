import { ApiError } from '../types/chat';

/**
 * chatService.ts — all HTTP communication with the backend lives here.
 *
 * ─────────────────────────────────────────────────────────────────
 * WHY ISOLATE API CALLS IN A SERVICE?
 *
 * Without this service, you'd write fetch() directly in a component:
 *
 *   // ❌ In ChatInput.tsx:
 *   const res = await fetch('/api/chat', { ... });
 *
 * Problems:
 * - Can't reuse the same call from multiple components
 * - Can't mock it in tests without mocking fetch globally
 * - When the API URL changes, you search through every component
 * - Component logic is polluted with HTTP concerns
 *
 * With this service:
 *   // ✅ In useChat.ts:
 *   const response = await sendMessage(text);
 *
 * - One place to change if the API moves
 * - Easy to mock in tests (just mock this module)
 * - Components stay focused on UI
 * ─────────────────────────────────────────────────────────────────
 *
 * API URL:
 * The frontend reads the backend origin from VITE_API_URL. This value is a
 * URL only; provider credentials remain on the backend.
 *
 * PHASE 3 (Auth):
 * Add Authorization header here — one change covers all API calls:
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${getToken()}`,
 *   }
 */

interface SendMessageSuccessResponse {
  message: string;
}

interface SendMessageErrorResponse {
  error: ApiError;
}

/**
 * Sends a user message to the backend and returns the AI's response.
 *
 * @throws {Error} with the backend's error message if the request fails
 */
export async function sendMessage(message: string): Promise<string> {
  const API_URL = import.meta.env.VITE_API_URL;
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    // Parse the error response from the backend
    const errorData = (await response.json()) as SendMessageErrorResponse;
    throw new Error(
      errorData.error?.message ?? 'Something went wrong. Please try again.'
    );
  }

  const data = (await response.json()) as SendMessageSuccessResponse;
  return data.message;
}
