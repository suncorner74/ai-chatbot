import { FormEvent, KeyboardEvent } from 'react';
import { ChatPhase } from '../../hooks/useChat';
import { ChatProvider } from '../../services/chatService';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  phase: ChatPhase;
  provider: ChatProvider;
  setProvider: (provider: ChatProvider) => void;
  onSend: () => void;
  onStop: () => void;
}

export default function ChatInput({ input, setInput, phase, provider, setProvider, onSend, onStop }: ChatInputProps) {
  const loading = phase === 'sending' || phase === 'waiting' || phase === 'streaming';
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (!loading) onSend(); };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  return (
    <div className="chat-input-container">
      <form className="chat-form" onSubmit={handleSubmit}>
        <span style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>+</span>
        <textarea className="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything" disabled={loading} rows={1} />
        <div className="chat-input-actions">
          <select
            className="chat-model-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as ChatProvider)}
            disabled={loading}
            aria-label="Select AI model"
          >
            <option value="gemini">✨ Gemini 2.5 Flash</option>
            <option value="openrouter">🔀 OpenRouter</option>
          </select>
          {loading ? (
            <button type="button" className="chat-submit chat-stop" onClick={onStop} aria-label="Stop generation">■</button>
          ) : (
            <button type="submit" className="chat-submit" disabled={input.trim() === ''} aria-label="Send message">↑</button>
          )}
        </div>
      </form>
      <div className="chat-status" aria-live="polite">
        {phase === 'sending' && 'Sending…'}
        {phase === 'waiting' && 'Waiting for the first token…'}
        {phase === 'streaming' && 'Generating…'}
        {phase === 'complete' && 'Response complete'}
        {phase === 'aborted' && 'Generation stopped'}
        {phase === 'error' && 'Generation failed'}
      </div>
      <div className="input-disclaimer">Sunvix AI can make mistakes. Check important info.</div>
    </div>
  );
}
