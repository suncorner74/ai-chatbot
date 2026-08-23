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
    // 1. Mock the API success response
    vi.mocked(chatService.sendMessage).mockResolvedValue({ message: 'AI reply', conversationId: 'test-conversation' });

    const { result } = renderHook(() => useChat());

    // 2. User types a message
    act(() => {
      result.current.setInput('Hi AI');
    });

    // 3. User clicks Send
    await act(async () => {
      await result.current.handleSend();
    });

    // 4. Verify state after send
    expect(chatService.sendMessage).toHaveBeenCalledWith('Hi AI');
    expect(result.current.input).toBe(''); // Input cleared
    expect(result.current.loading).toBe(false); // Loading stopped
    expect(result.current.error).toBeNull(); // No error

    // 5. Verify conversation history (User message + AI message)
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
    // 1. Mock the API failure
    vi.mocked(chatService.sendMessage).mockRejectedValue(
      new Error('API failed')
    );

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInput('Hi AI');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    // Verify error state
    expect(result.current.error).toBe('API failed');
    expect(result.current.loading).toBe(false);
    
    // User message is still added, but no AI message
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
  });

  it('does not send empty messages', async () => {
    const { result } = renderHook(() => useChat());

    // Send without setting input first
    await act(async () => {
      await result.current.handleSend();
    });

    expect(chatService.sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });
});
