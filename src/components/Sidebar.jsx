import { Plus, MessageSquare, Trash2, Brain, Moon, Sun, X, Info, LogOut } from 'lucide-react';
import { useStore } from '../hooks/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  createChat, setActiveChat, deleteChat,
  toggleTheme, toggleSidebar,
} from '../store.js';

export default function Sidebar({ onMemoryOpen, onAboutOpen }) {
  const state = useStore();
  const { chats, activeChat, theme, sidebarOpen } = state;
  const { user, logout } = useAuth();

  const handleNew = () => {
    createChat();
    if (window.innerWidth <= 768) toggleSidebar();
  };

  const handleSelect = (id) => {
    setActiveChat(id);
    if (window.innerWidth <= 768) toggleSidebar();
  };

  return (
    <>
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}

      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">Z</div>
            Zoya AI
          </div>
          <button className="icon-btn" onClick={toggleSidebar} title="Tutup sidebar">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="sidebar-user">
            {user.photoURL
              ? <img src={user.photoURL} alt="avatar" className="sidebar-user-avatar" />
              : <div className="sidebar-user-avatar sidebar-user-initial">{user.displayName?.[0] || 'U'}</div>
            }
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.displayName || 'Pengguna'}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
        )}

        {/* New chat */}
        <button className="new-chat-btn" onClick={handleNew}>
          <Plus size={16} />
          Chat Baru
        </button>

        {/* Chat list */}
        <div className="sidebar-section">Riwayat</div>
        <div className="chat-list">
          {chats.length === 0 && (
            <div style={{ padding: '16px 12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Belum ada percakapan
            </div>
          )}
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
              onClick={() => handleSelect(chat.id)}
            >
              <MessageSquare size={14} style={{ flexShrink: 0 }} />
              <span className="chat-item-title">{chat.title}</span>
              <button
                className="chat-item-del"
                onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
                title="Hapus"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-action" onClick={onMemoryOpen}>
            <Brain size={16} />
            Memori AI
          </button>
          <button className="sidebar-action" onClick={onAboutOpen}>
            <Info size={16} />
            Tentang Zoya
          </button>
          <button className="sidebar-action" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          </button>
          {user && (
            <button className="sidebar-action sidebar-action-danger" onClick={logout}>
              <LogOut size={16} />
              Keluar
            </button>
          )}
        </div>
      </div>
    </>
  );
}
