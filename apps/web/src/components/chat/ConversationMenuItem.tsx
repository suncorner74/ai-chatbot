import React, { useState, useRef, useEffect } from 'react';

interface ConversationMenuItemProps {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, title: string) => Promise<void>;
}

export default function ConversationMenuItem({ id, title, isActive, onSelect, onDelete, onRename }: ConversationMenuItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editTitle.trim() && editTitle !== title) {
      await onRename(id, editTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditTitle(title);
      setIsRenaming(false);
    }
  };

  return (
    <div className="conversation-item-container" style={{ position: 'relative' }}>
      {isRenaming ? (
        <form onSubmit={handleRenameSubmit} className="menu-item recent-item active">
          <span className="recent-icon" aria-hidden="true">✎</span>
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => handleRenameSubmit()}
            onKeyDown={handleKeyDown}
            className="rename-input"
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: 'inherit', padding: 0 }}
          />
        </form>
      ) : (
        <button
          className={`menu-item recent-item ${isActive ? 'active' : ''} ${menuOpen ? 'menu-open' : ''}`}
          onClick={onSelect}
        >
          <span className="recent-icon" aria-hidden="true">◷</span>
          <span className="recent-title">{title}</span>
          
          <div 
            className="conversation-options-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Options"
          >
            •••
          </div>
        </button>
      )}

      {menuOpen && !isRenaming && (
        <div className="conversation-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button className="conversation-menu-item" onClick={() => { setMenuOpen(false); }}>
            <span className="icon">↑</span> Share
          </button>
          <button className="conversation-menu-item" onClick={() => { setMenuOpen(false); setIsRenaming(true); setEditTitle(title); }}>
            <span className="icon">✎</span> Rename
          </button>
          <button className="conversation-menu-item" onClick={() => { setMenuOpen(false); }}>
            <span className="icon">📌</span> Pin chat
          </button>
          <button className="conversation-menu-item" onClick={() => { setMenuOpen(false); }}>
            <span className="icon">🗃️</span> Archive
          </button>
          <div className="conversation-menu-divider" />
          <button className="conversation-menu-item danger" onClick={() => { setMenuOpen(false); onDelete(id); }}>
            <span className="icon">🗑️</span> Delete
          </button>
        </div>
      )}
    </div>
  );
}
