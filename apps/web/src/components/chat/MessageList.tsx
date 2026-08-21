import { useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/chat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
}

/**
 * MessageList — renders the conversation history.
 *
 * AUTO-SCROLL LOGIC:
 * We want the chat to automatically scroll to the bottom whenever a new
 * message arrives (like WhatsApp or ChatGPT).
 *
 * How it works:
 * 1. We create a `messagesEndRef` attached to an empty div at the bottom.
 * 2. `useEffect` runs whenever the `messages` array changes.
 * 3. Inside `useEffect`, we call `.scrollIntoView()` on that empty div.
 */
export default function MessageList({ messages, loading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="chat-messages chat-empty">
        <p>Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      
      {/* 
        TYPING INDICATOR:
        Shows a temporary animated dot sequence while waiting for the API.
      */}
      {loading && (
        <div className="message-item message-item--assistant">
          <div className="message-content typing-indicator">
            <span style={{ fontSize: '1.2rem' }}>●</span>
          </div>
        </div>
      )}

      {/* Invisible element used for auto-scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
}
