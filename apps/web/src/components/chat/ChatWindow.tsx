import { useChat } from '../../hooks/useChat';
import ChatInput from './ChatInput';
import './ChatWindow.css';
import MessageList from './MessageList';

/**
 * ChatWindow — the smart container for the chat feature.
 *
 * This component acts as the "glue" between the state (useChat)
 * and the presentation components (MessageList, ChatInput).
 *
 * Because we extracted all the complex state logic into useChat(),
 * this component is incredibly simple. It just passes props down.
 */
export default function ChatWindow() {
  const { messages, input, loading, error, setInput, handleSend } = useChat();

  return (
    <div className="chat-window">
      {error && (
        <div className="chat-error" role="alert">
          {error}
        </div>
      )}
      
      <MessageList messages={messages} loading={loading} />
      
      <ChatInput
        input={input}
        setInput={setInput}
        loading={loading}
        onSend={handleSend}
      />
    </div>
  );
}
