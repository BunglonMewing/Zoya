import { Download, History, Info, MessageSquare, Moon, Settings, Sun, Trash2, X, Brain, Plus } from 'lucide-react';
import { useStore } from '../hooks/useStore.js';
import { createChat, deleteChat, setActiveChat, setTheme } from '../store.js';
import ZoyaMark from './ZoyaMark.jsx';

const DESTINATIONS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'downloader', label: 'Unduhan', icon: Download },
  { id: 'library', label: 'Riwayat', icon: History },
  { id: 'settings', label: 'Setelan', icon: Settings },
];

function Destination({ destination, active, onNavigate }) {
  const Icon = destination.icon;
  return (
    <button
      className={`nav-item ${active ? 'is-active' : ''}`.trim()}
      onClick={() => onNavigate(destination.id)}
      aria-current={active ? 'page' : undefined}
    >
      <span className="nav-item__indicator">
        <Icon size={22} strokeWidth={active ? 2.2 : 1.9} />
      </span>
      <span className="nav-item__label">{destination.label}</span>
    </button>
  );
}

export function NavigationBar({ page, onNavigate }) {
  return (
    <nav className="nav-bar" aria-label="Navigasi utama">
      {DESTINATIONS.map(d => (
        <Destination key={d.id} destination={d} active={page === d.id} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function NavigationRail({ page, onNavigate }) {
  const { theme } = useStore();
  const nextMode = theme === 'dark' ? 'light' : 'dark';

  return (
    <nav className="nav-rail" aria-label="Navigasi utama">
      <ZoyaMark size={40} />
      {DESTINATIONS.map(d => (
        <Destination key={d.id} destination={d} active={page === d.id} onNavigate={onNavigate} />
      ))}
      <div className="nav-rail__spacer" />
      <button
        className="icon-button"
        onClick={() => setTheme(nextMode)}
        aria-label={nextMode === 'light' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
        title={nextMode === 'light' ? 'Tema terang' : 'Tema gelap'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </nav>
  );
}

export function ConversationList({ onNavigate }) {
  const { chats, activeChat } = useStore();

  if (chats.length === 0) {
    return (
      <p className="muted type-body-small" style={{ padding: '12px', lineHeight: 1.6 }}>
        Belum ada percakapan. Mulai dari chat baru.
      </p>
    );
  }

  return chats.map(chat => (
    <div key={chat.id} className={`conv-item ${activeChat === chat.id ? 'is-active' : ''}`.trim()}>
      <button
        className="conv-item__button"
        onClick={() => {
          setActiveChat(chat.id);
          onNavigate?.('chat');
        }}
        title={chat.title}
      >
        <MessageSquare size={16} style={{ flexShrink: 0 }} />
        <span className="conv-item__title">{chat.title}</span>
      </button>
      <button
        className="conv-item__delete"
        onClick={() => deleteChat(chat.id)}
        aria-label={`Hapus percakapan ${chat.title}`}
        title="Hapus"
      >
        <Trash2 size={14} />
      </button>
    </div>
  ));
}

export function NavigationDrawer({ open, onClose, onNavigate, onMemoryOpen, onAboutOpen }) {
  if (!open) return null;

  const newChat = () => {
    createChat();
    onNavigate?.('chat');
    onClose();
  };

  return (
    <div className="drawer-host">
      <button className="drawer-scrim" onClick={onClose} aria-label="Tutup panel" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Riwayat percakapan">
        <div className="drawer__header">
          <div className="drawer__brand">
            <ZoyaMark size={34} />
            Zoya
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Tutup panel">
            <X size={20} />
          </button>
        </div>

        <div className="drawer__body">
          <button className="new-chat-button" onClick={newChat}>
            <Plus size={20} />
            Percakapan baru
          </button>

          <div className="drawer__label">Percakapan</div>
          <ConversationList onNavigate={(next) => { onNavigate?.(next); onClose(); }} />
        </div>

        <div className="drawer__footer">
          <button className="drawer__action" onClick={() => { onMemoryOpen?.(); onClose(); }}>
            <Brain size={18} />
            Memori AI
          </button>
          <button className="drawer__action" onClick={() => { onAboutOpen?.(); onClose(); }}>
            <Info size={18} />
            Tentang Zoya
          </button>
        </div>
      </aside>
    </div>
  );
}
