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
vi.mock('../services/chatService');

describe('ChatWindow integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the empty state initially', () => {
    render(<ChatWindow />);

    expect(
      screen.getByText('Send a message to start the conversation.')
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Ask anything/i);
    expect(input).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('allows user to send a message and see the AI response', async () => {
    vi.mocked(chatService.streamMessage).mockImplementation(async (_message, _conversationId, onEvent) => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      onEvent({ event: 'token', data: { token: 'I am an AI.' } });
      await new Promise((resolve) => setTimeout(resolve, 0));
      onEvent({ event: 'done', data: { conversationId: 'test-conversation', ttftMs: null, latencyMs: 1 } });
    });

    render(<ChatWindow />);

    const input = screen.getByPlaceholderText(/Ask anything/i);
    const button = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    expect(input).toHaveValue('');

    await waitFor(() => {
      expect(document.querySelector('.typing-indicator')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('I am an AI.')).toBeInTheDocument();
    });

    expect(document.querySelector('.typing-indicator')).not.toBeInTheDocument();
  });
});
