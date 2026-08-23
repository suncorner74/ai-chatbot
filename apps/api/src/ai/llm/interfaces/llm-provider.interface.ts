export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMStreamOptions {
  signal?: AbortSignal;
}

export interface LLMProvider {
  generateResponse(messages: LLMMessage[]): Promise<string>;
  streamResponse(messages: LLMMessage[], options?: LLMStreamOptions): AsyncIterable<string>;
}
