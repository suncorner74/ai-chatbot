import ChatWindow from './components/chat/ChatWindow';

/**
 * App.tsx — Minimalist ChatGPT-style Layout
 */
function App() {
  return (
    <div className="app-container">
      {/* Sidebar matching the screenshot's layout */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Sunvix AI</h2>
          <div className="header-icons">
            <span>🔍</span>
            <span>📝</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <button className="menu-item new-chat">
            <span className="icon">💬</span> New chat
          </button>
          
          <button className="menu-item"><span className="icon">🖼️</span> Images</button>
          <button className="menu-item"><span className="icon">📚</span> Library</button>
          <button className="menu-item"><span className="icon">🔌</span> Plugins</button>

          <div className="menu-section">
            <p className="section-title">Recents</p>
            <button className="menu-item active">Greeting exchange</button>
            <button className="menu-item">React Hooks Explained</button>
            <button className="menu-item">Build LLM Chatbot</button>
            <button className="menu-item">Namaste AI Course Review</button>
            <button className="menu-item">React AI Interview Prep</button>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="menu-item user-profile">
            <div className="profile-circle">S</div>
            Suraj
          </button>
        </div>
      </aside>

      <main className="app-main">
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;
