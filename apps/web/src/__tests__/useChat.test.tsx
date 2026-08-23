import { act, renderHook } from '@testing-library/react';
import { useChat } from '../hooks/useChat';
import * as chatService from '../services/chatService';

/**
 * Unit tests for the useChat hook.
 *
 * WHY TEST THE HOOK INSTEAD OF JUST THE UI?
 * State logic (loading true/false, clearing inputs, appending arrays)
 * is often the source of bugs. Testing the hook directly without the DOM
 * makes tests faster and highly focused on the business logic.
 */

// Mock the chatService so we don't make real network calls in tests
vi.mock('../services/chatService');

describe('useChat hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('starts with default state', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.input).toBe('');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates input state', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInput('Hello!');
    });

    expect(result.current.input).toBe('Hello!');
  });

  it('handles a successful chat flow', async () => {
    vi.mocked(chatService.streamMessage).mockImplementation(async (_message, _conversationId, onEvent) => {
      onEvent({ event: 'token', data: { token: 'AI reply' } });
      onEvent({ event: 'done', data: { conversationId: 'test-conversation', ttftMs: null, latencyMs: 1 } });
    });

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInput('Hi AI');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(chatService.streamMessage).toHaveBeenCalledWith(
      'Hi AI',
      undefined,
      expect.any(Function),
      expect.any(AbortSignal),
      'new'
    );
    expect(result.current.input).toBe('');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Hi AI',
    });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'AI reply',
    });
  });

  it('handles an API error', async () => {
    vi.mocked(chatService.streamMessage).mockRejectedValue(new Error('API failed'));

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInput('Hi AI');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.error).toBe('API failed');
    expect(result.current.loading).toBe(false);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
  });

  it('does not send empty messages', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.handleSend();
    });

    expect(chatService.streamMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });
});
