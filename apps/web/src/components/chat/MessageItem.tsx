import { ChatMessage } from '../../types/chat';

interface MessageItemProps {
  message: ChatMessage;
}

/**
 * Renders a single message in the chat.
 * 
 * In this minimalist layout:
 * - NO avatars are used.
 * - Both user and AI messages use the same rounded pill treatment.
 * - Alignment identifies who sent each message.
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
