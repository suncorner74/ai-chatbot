import { env } from '../../../config/env';
import { LLMMessage, LLMProvider, LLMStreamOptions } from '../interfaces/llm-provider.interface';

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export class GeminiProvider implements LLMProvider {
  private readonly model = env.geminiModel;

  private get apiKey(): string {
    if (!env.geminiApiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
    return env.geminiApiKey;
  }

  private payload(messages: LLMMessage[]) {
    const system = messages.find((message) => message.role === 'system');
    return {
      ...(system ? { systemInstruction: { parts: [{ text: system.content }] } } : {}),
      contents: messages.filter((message) => message.role !== 'system').map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
    };
  }

  private async request(operation: string, messages: LLMMessage[], signal?: AbortSignal) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:${operation}?key=${encodeURIComponent(this.apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.payload(messages)),
      signal,
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
    return response;
  }

  async generateResponse(messages: LLMMessage[]): Promise<string> {
    const response = await this.request('generateContent', messages);
    const data = await response.json() as GeminiResponse;
    const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!content) throw new Error('LLM returned an empty response');
    return content;
  }

  async *streamResponse(messages: LLMMessage[], options: LLMStreamOptions = {}): AsyncIterable<string> {
    const response = await this.request('streamGenerateContent?alt=sse', messages, options.signal);
    if (!response.body) throw new Error('Gemini streaming response is unavailable');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const event of events) {
          const dataLine = event.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) continue;
          const json = dataLine.slice(5).trim();
          if (!json || json === '[DONE]') continue;
          const data = JSON.parse(json) as GeminiResponse;
          const token = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
          if (token) yield token;
        }
      }
    } finally {
      try { await reader.cancel(); } catch { /* stream already closed */ }
      reader.releaseLock();
    }
  }
}
