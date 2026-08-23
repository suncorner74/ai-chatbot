import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { ChatPhase } from '../../hooks/useChat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  phase: ChatPhase;
  onRetry: () => void;
  onRegenerate: () => void;
}

export default function MessageList({ messages, phase, onRetry, onRegenerate }: MessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [nearBottom, setNearBottom] = useState(true);
  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const isStreaming = phase === 'streaming' && lastAssistant?.content !== undefined;

  const updateScrollState = () => {
    const element = messagesContainerRef.current;
    if (!element) return;
    setNearBottom(element.scrollHeight - element.scrollTop - element.clientHeight < 120);
  };

  useEffect(() => {
    const element = messagesContainerRef.current;
    if (!element || !nearBottom) return;
    element.scrollTo({ top: element.scrollHeight, behavior: phase === 'streaming' ? 'auto' : 'smooth' });
  }, [messages, nearBottom, phase]);

  const jumpToLatest = () => {
    const element = messagesContainerRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    setNearBottom(true);
  };

  if (messages.length === 0) {
    return <div ref={messagesContainerRef} className="chat-messages chat-empty"><p>Send a message to start the conversation.</p></div>;
  }

  return (
    <div className="chat-messages-wrapper">
      <div ref={messagesContainerRef} className="chat-messages" onScroll={updateScrollState}>
        {messages.map((msg, index) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && index === messages.length - 1 && msg.role === 'assistant'}
            onRetry={index === messages.length - 1 && phase === 'error' ? onRetry : undefined}
            onRegenerate={index === messages.length - 1 && msg.role === 'assistant' && phase === 'complete' ? onRegenerate : undefined}
          />
        ))}
        {phase === 'waiting' && (
          <div className="message-item message-item--assistant">
            <div className="message-content typing-indicator" aria-label="Waiting for response"><span>●</span><span>●</span><span>●</span></div>
          </div>
        )}
      </div>
      {!nearBottom && <button type="button" className="jump-to-latest" onClick={jumpToLatest}>↓ Jump to latest</button>}
    </div>
  );
}
