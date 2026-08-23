import { useState } from 'react';
import { ChatMessage } from '../../types/chat';
import MarkdownContent from './MarkdownContent';

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRetry?: () => void;
  onRegenerate?: () => void;
}

export default function MessageItem({ message, isStreaming, onRetry, onRegenerate }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`message-item message-item--${message.role}`}>
      {message.role === 'assistant' && (
        <div className="assistant-label"><span className="assistant-avatar">✦</span><span>Sunvix AI</span><i /></div>
      )}
      <div className="message-content">
        {message.role === 'assistant' ? <MarkdownContent content={message.content} /> : <div className="user-message-text">{message.content}</div>}
        {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
      </div>
      {message.role === 'assistant' && !isStreaming && message.content && (
        <div className="message-actions">
          <button type="button" onClick={() => void copy()} aria-label="Copy response">{copied ? 'Copied' : 'Copy'}</button>
          {onRegenerate && <button type="button" onClick={onRegenerate}>Regenerate</button>}
        </div>
      )}
      {message.role === 'assistant' && onRetry && !isStreaming && !message.content && (
        <div className="message-actions"><button type="button" onClick={onRetry}>Retry</button></div>
      )}
    </div>
  );
}
