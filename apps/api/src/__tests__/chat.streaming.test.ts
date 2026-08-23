import { ChatService } from '../modules/chat/chat.service';
import type { LLMProvider, LLMMessage } from '../ai/llm/interfaces/llm-provider.interface';

describe('ChatService streaming', () => {
  const repository = {
    findConversationForUser: jest.fn(),
    createConversation: jest.fn(),
    getHistory: jest.fn(),
    createUserMessage: jest.fn(),
    createAssistantMessage: jest.fn(),
  };

  const provider: LLMProvider = {
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findConversationForUser.mockResolvedValue({ id: 'conversation-1' });
    repository.getHistory.mockResolvedValue([]);
    repository.createUserMessage.mockResolvedValue({ id: 'user-message-1' });
    repository.createAssistantMessage.mockResolvedValue({ id: 'assistant-message-1' });
  });

  it('validates conversation ownership before persisting or generating', async () => {
    repository.findConversationForUser.mockResolvedValueOnce(null);
    const service = new ChatService(provider, repository as never);

    await expect(service.streamChat('user-2', 'conversation-1', 'hello')).rejects.toThrow('CONVERSATION_NOT_FOUND');
    expect(repository.createUserMessage).not.toHaveBeenCalled();
    expect(provider.streamResponse).not.toHaveBeenCalled();
  });

  it('persists the user message before starting the LLM stream and persists the assistant once complete', async () => {
    const calls: string[] = [];
    repository.createUserMessage.mockImplementation(async () => { calls.push('user'); return { id: 'u1' }; });
    repository.createAssistantMessage.mockImplementation(async () => { calls.push('assistant'); return { id: 'a1' }; });
    provider.streamResponse = jest.fn((_messages: LLMMessage[]) => (async function* () {
      calls.push('token-1');
      yield 'Hello';
      calls.push('token-2');
      yield ' world';
    })());

    const service = new ChatService(provider, repository as never);
    const result = await service.streamChat('user-1', 'conversation-1', 'hello');
    const tokens: string[] = [];
    for await (const token of result.tokens) tokens.push(token);

    expect(tokens).toEqual(['Hello', ' world']);
    expect(calls).toEqual(['user', 'token-1', 'token-2', 'assistant']);
    expect(repository.createAssistantMessage).toHaveBeenCalledWith('conversation-1', 'Hello world');
  });

  it('does not persist an assistant message when generation is aborted', async () => {
    const controller = new AbortController();
    provider.streamResponse = jest.fn((_messages: LLMMessage[], options?: { signal?: AbortSignal }) => (async function* () {
      yield 'partial';
      controller.abort();
      if (options?.signal?.aborted) throw new DOMException('Generation aborted', 'AbortError');
      yield 'never';
    })());

    const service = new ChatService(provider, repository as never);
    const result = await service.streamChat('user-1', 'conversation-1', 'hello', controller.signal);
    const consume = async () => { for await (const _token of result.tokens) { /* consume */ } };

    await expect(consume()).rejects.toThrow('Generation aborted');
    expect(repository.createUserMessage).toHaveBeenCalledTimes(1);
    expect(repository.createAssistantMessage).not.toHaveBeenCalled();
  });
});
