import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { env } from '../../../config/env';
import { LLMMessage, LLMProvider, LLMStreamOptions } from '../interfaces/llm-provider.interface';

export class GeminiProvider implements LLMProvider {
  private readonly model = env.geminiModel;

  private get modelInstance() {
    if (!env.geminiApiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
    return google(this.model);
  }

  private toPrompt(messages: LLMMessage[]): string {
    return messages.map((message) => {
      const label = message.role === 'system' ? 'System' : message.role === 'assistant' ? 'Assistant' : 'User';
      return `${label}: ${message.content}`;
    }).join('\n\n');
  }

  async generateResponse(messages: LLMMessage[]): Promise<string> {
    const result = await generateText({
      model: this.modelInstance,
      prompt: this.toPrompt(messages),
    });
    if (!result.text) throw new Error('LLM returned an empty response');
    return result.text;
  }

  async *streamResponse(messages: LLMMessage[], options: LLMStreamOptions = {}): AsyncIterable<string> {
    const result = streamText({
      model: this.modelInstance,
      prompt: this.toPrompt(messages),
      abortSignal: options.signal,
    });

    for await (const chunk of result.textStream) {
      if (chunk) yield chunk;
    }
  }
}
