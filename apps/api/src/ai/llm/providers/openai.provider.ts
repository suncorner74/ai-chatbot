import OpenAI from 'openai';
import { env } from '../../../config/env';
import {
  LLMProvider,
  LLMMessage,
} from '../interfaces/llm-provider.interface';

/**
 * OpenAIProvider — the ONLY file in the entire codebase that knows about OpenAI.
 *
 * Everything above this layer (ChatService, Controller, Routes) talks to the
 * LLMProvider interface. They have no idea this file exists.
 *
 * PHASE 9: Adding Gemini support means creating gemini.provider.ts that
 * implements LLMProvider the same way. Zero changes anywhere else.
 *
 * WHAT HAPPENS INSIDE generateResponse():
 * 1. We format our LLMMessage[] into OpenAI's expected format
 * 2. We call OpenAI's /chat/completions endpoint
 * 3. OpenAI returns a completion object with multiple "choices"
 * 4. We extract the text from the first choice and return it
 *
 * ABOUT TEMPERATURE (0.7):
 * Controls how "creative" or "random" the output is.
 * 0.0 = deterministic (same question → same answer every time)
 * 0.7 = balanced (our default — helpful but not boring)
 * 2.0 = very creative (can become incoherent)
 *
 * ABOUT MAX_TOKENS (1000):
 * Limits how long the response can be. Prevents runaway responses
 * that cost money. 1000 tokens ≈ 750 words.
 */
export class OpenAIProvider implements LLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: env.llmApiKey });
    this.model = env.llmModel;
  }

  async generateResponse(messages: LLMMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      // This shouldn't happen under normal conditions,
      // but we handle it explicitly rather than returning undefined
      throw new Error('OpenAI returned an empty response');
    }

    return content;
  }
}
