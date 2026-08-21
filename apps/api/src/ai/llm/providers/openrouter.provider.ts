import OpenAI from 'openai';
import { env } from '../../../config/env';
import {
  LLMProvider,
  LLMMessage,
} from '../interfaces/llm-provider.interface';

/**
 * OpenRouterProvider — talks to OpenRouter instead of OpenAI.
 *
 * OpenRouter provides an API that is 100% compatible with OpenAI's format.
 * This means we can still use the `openai` NPM package, we just have to
 * override the `baseURL` to point to OpenRouter's servers instead of OpenAI's.
 */
export class OpenRouterProvider implements LLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: env.llmApiKey,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5173', // Recommended by OpenRouter
        'X-Title': 'React AI Chatbot', // Recommended by OpenRouter
      },
    });
    // For OpenRouter, we need to use one of their model strings (e.g. "google/gemini-2.0-flash-lite-preview-02-05:free")
    this.model = env.llmModel;
  }

  async generateResponse(messages: LLMMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      // We can drop temperature and max_tokens here or leave them; 
      // OpenRouter accepts them normally.
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('OpenRouter returned an empty response');
    }

    return content;
  }
}
