import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export function streamGeminiText(prompt: string) {
  return streamText({
    model: google(GEMINI_MODEL),
    prompt,
  });
}
