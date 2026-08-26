import { useChat, UseChatReturn } from '../../hooks/useChat';
import ChatInput from './ChatInput';
import './ChatWindow.css';
import './ChatWindow.mobile.css';
import MessageList from './MessageList';

interface ChatWindowProps { chat?: UseChatReturn; }

export default function ChatWindow({ chat }: ChatWindowProps) {
  const localChat = useChat();
  const activeChat = chat ?? localChat;
  const { messages, input, phase, error, provider, setProvider, setInput, handleSend, stopGeneration, retry, regenerate } = activeChat;

  return (
    <div className="chat-window">
      {error && (
        <div className="chat-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void retry()}>Retry</button>
        </div>
      )}
      <MessageList messages={messages} phase={phase} onRetry={() => void retry()} onRegenerate={() => void regenerate()} />
      <ChatInput input={input} setInput={setInput} phase={phase} provider={provider} setProvider={setProvider} onSend={() => void handleSend()} onStop={stopGeneration} />
    </div>
  );
}
