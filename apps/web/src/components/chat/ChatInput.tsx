import { FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSend: () => void;
}

export default function ChatInput({
  input,
  setInput,
  loading,
  onSend,
}: ChatInputProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-container">
      <form className="chat-form" onSubmit={handleSubmit}>
        <span style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>+</span>
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          className="chat-submit"
          disabled={loading || input.trim() === ''}
          aria-label="Send message"
        >↑</button>
      </form>
      <div className="input-disclaimer">
        Sunvix AI can make mistakes. Check important info.
      </div>
    </div>
  );
}
