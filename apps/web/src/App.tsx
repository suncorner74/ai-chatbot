import ChatWindow from './components/chat/ChatWindow';
import AuthScreen from './components/auth/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useState } from 'react';

function App() {
  const auth = useAuth();
  const chat = useChat();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches
  );

  if (auth.loading) {
    return <main className="auth-screen"><div className="auth-card"><p>Loading your account…</p></div></main>;
  }

  if (!auth.user) {
    return <AuthScreen onLogin={auth.login} onRegister={auth.register} />;
  }

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="ai-landscape" aria-hidden="true">
        <div className="ai-halo"><span>INTELLIGENCE</span></div>
        <div className="ai-core"><span className="ai-core-sun" /><strong>SUNVIX AI</strong></div>
        <span className="ai-node ai-node--one">AI</span>
        <span className="ai-node ai-node--two">AI</span>
        <span className="ai-node ai-node--three">AI</span>
        <span className="ai-node ai-node--four">AI</span>
      </div>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img className="brand-logo" src="/sunvix-logo.svg" alt="" />
          <h2>Sunvix AI</h2>
          <div className="header-icons">
            <button className="sidebar-toggle" type="button" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>
              {sidebarCollapsed ? '›' : '‹'}
            </button>
          </div>
        </div>
        <div className="sidebar-menu">
          <button className="menu-item new-chat" onClick={chat.newChat}><span className="icon">💬</span> New chat</button>
          <button className="menu-item"><span className="icon">🖼️</span> Images</button>
          <button className="menu-item"><span className="icon">📚</span> Library</button>
          <button className="menu-item"><span className="icon">🔌</span> Plugins</button>
          <div className="menu-section">
            <p className="section-title">Recents</p>
            {chat.conversations.map((conversation) => (
              <button className={`menu-item recent-item ${conversation.id === chat.activeConversationId ? 'active' : ''}`} key={conversation.id} onClick={() => chat.selectConversation(conversation.id)}>
                <span className="recent-icon" aria-hidden="true">◷</span>
                <span className="recent-title">{conversation.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="menu-item user-profile" onClick={() => void auth.logout()} title="Sign out">
            <div className="profile-circle">{(auth.user.name || auth.user.email)[0].toUpperCase()}</div>
            <span className="profile-name">{auth.user.name || auth.user.email}</span>
          </button>
        </div>
      </aside>
      <main className="app-main">
        <button className="mobile-sidebar-toggle" type="button" aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>
          {sidebarCollapsed ? '☰' : '×'}
        </button>
        <ChatWindow chat={chat} />
      </main>
    </div>
  );
}

export default App;
