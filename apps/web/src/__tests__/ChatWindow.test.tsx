import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWindow from '../components/chat/ChatWindow';
import * as chatService from '../services/chatService';

/**
 * Integration tests for the ChatUI.
 *
 * This renders the full component tree and interacts with it like a real user
 * (typing in text areas, clicking buttons). It verifies that everything wires
 * together correctly.
 */

// Mock the network layer
vi.mock('../services/chatService', () => ({
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  getConversation: vi.fn(),
  getConversations: vi.fn(),
  sendMessage: vi.fn(),
}));

describe('ChatWindow integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(chatService.getConversations).mockResolvedValue([
      {
        id: 'conversation-1',
        title: 'New chat',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(chatService.createConversation).mockResolvedValue({
      id: 'conversation-1',
      title: 'New chat',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(chatService.getConversation).mockResolvedValue({
      id: 'conversation-1',
      title: 'New chat',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: [],
    });
  });

  it('renders the empty state initially', () => {
    render(<ChatWindow />);
    
    expect(
      screen.getByText('Send a message to start the conversation.')
    ).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText(/Ask anything/i);
    expect(input).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled(); // Disabled because input is empty
  });

  it('allows user to send a message and see the AI response', async () => {
    vi.mocked(chatService.sendMessage).mockResolvedValue({
      message: 'I am an AI.',
      conversationId: 'conversation-1',
    });

    render(<ChatWindow />);

    const input = screen.getByPlaceholderText(/Ask anything/i);
    await waitFor(() => {
      expect(chatService.getConversation).toHaveBeenCalledWith('conversation-1');
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });
    const button = screen.getByRole('button', { name: /send/i });

    // 1. User types
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    expect(button).not.toBeDisabled();

    // 2. User clicks send
    fireEvent.click(button);

    // 3. User message appears immediately
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    
    // 4. Input is cleared
    expect(input).toHaveValue('');

    // 5. Typing indicator appears
    expect(screen.getByText('●')).toBeInTheDocument();

    // 6. Wait for the API to resolve and the AI message to appear
    await waitFor(() => {
      expect(screen.getByText('I am an AI.')).toBeInTheDocument();
    });

    // 7. Typing indicator disappears
    expect(screen.queryByText('●')).not.toBeInTheDocument();
  });
});
