import { ChatMessage } from '../../types/chat';

interface MessageItemProps {
  message: ChatMessage;
}

/**
 * Renders a single message in the chat.
 * 
 * In this minimalist layout:
 * - NO avatars are used.
 * - User messages are wrapped in a rounded pill.
 * - AI messages are raw plain text.
 */
export default function MessageItem({ message }: MessageItemProps) {
  return (
    <div className={`message-item message-item--${message.role}`}>
      <div className="message-content">
        {message.content}
      </div>
    </div>
  );
}
