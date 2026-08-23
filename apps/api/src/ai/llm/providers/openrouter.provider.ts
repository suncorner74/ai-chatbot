import OpenAI from 'openai';
import { env } from '../../../config/env';
import {
  LLMProvider,
  LLMMessage,
  LLMStreamOptions,
} from '../interfaces/llm-provider.interface';

export class OpenRouterProvider implements LLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: env.llmApiKey,
      defaultHeaders: {
        'HTTP-Referer': env.frontendUrl,
        'X-Title': 'React AI Chatbot',
      },
    });
    this.model = env.llmModel;
  }

  async generateResponse(messages: LLMMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('LLM returned an empty response');
    return content;
  }

  async *streamResponse(messages: LLMMessage[], options: LLMStreamOptions = {}): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }, { signal: options.signal });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) yield token;
    }
  }
}
