// Simple global store with localStorage persistence (no zustand dependency)

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

class Store {
  constructor() {
    this._listeners = [];
    this._state = this._load();
  }

  _load() {
    try {
      const saved = localStorage.getItem('zoya-store');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          chats: parsed.chats || [],
          activeChat: null,
          memories: parsed.memories || [],
          theme: parsed.theme || 'dark',
          sidebarOpen: window.innerWidth > 768,
          artifactOpen: false,
          artifact: null,
          loading: false,
          sessionId: parsed.sessionId || generateId(),
        };
      }
    } catch {}
    return {
      chats: [],
      activeChat: null,
      memories: [],
      theme: 'dark',
      sidebarOpen: window.innerWidth > 768,
      artifactOpen: false,
      artifact: null,
      loading: false,
      sessionId: generateId(),
    };
  }

  _save() {
    try {
      const { chats, memories, theme, sessionId } = this._state;
      localStorage.setItem('zoya-store', JSON.stringify({ chats, memories, theme, sessionId }));
    } catch {}
  }

  getState() { return this._state; }

  setState(updater) {
    this._state = typeof updater === 'function' ? updater(this._state) : { ...this._state, ...updater };
    this._save();
    this._listeners.forEach(l => l(this._state));
  }

  subscribe(listener) {
    this._listeners.push(listener);
    return () => { this._listeners = this._listeners.filter(l => l !== listener); };
  }
}

export const store = new Store();

export function createChat(title = 'Chat Baru') {
  const id = generateId();
  const chat = { id, title, messages: [], createdAt: Date.now() };
  store.setState(s => ({ ...s, chats: [chat, ...s.chats], activeChat: id }));
  return id;
}

export function setActiveChat(id) {
  store.setState(s => ({ ...s, activeChat: id }));
}

export function deleteChat(id) {
  store.setState(s => ({
    ...s,
    chats: s.chats.filter(c => c.id !== id),
    activeChat: s.activeChat === id
      ? (s.chats.find(c => c.id !== id)?.id || null)
      : s.activeChat,
  }));
}

export function addMessage(chatId, message) {
  const msg = { id: generateId(), timestamp: Date.now(), ...message };
  store.setState(s => ({
    ...s,
    chats: s.chats.map(c =>
      c.id === chatId
        ? {
            ...c,
            messages: [...c.messages, msg],
            title: c.messages.length === 0
              ? (message.content?.slice(0, 40) || c.title)
              : c.title,
          }
        : c
    ),
  }));
  return msg.id;
}

export function updateMessage(chatId, msgId, updates) {
  store.setState(s => ({
    ...s,
    chats: s.chats.map(c =>
      c.id === chatId
        ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, ...updates } : m) }
        : c
    ),
  }));
}

export function addMemory(text) {
  const id = generateId();
  store.setState(s => ({ ...s, memories: [...s.memories, { id, text, createdAt: Date.now() }] }));
}

export function deleteMemory(id) {
  store.setState(s => ({ ...s, memories: s.memories.filter(m => m.id !== id) }));
}

export function setArtifact(artifact) {
  store.setState(s => ({ ...s, artifact, artifactOpen: !!artifact }));
}

export function toggleTheme() {
  store.setState(s => {
    const theme = s.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    return { ...s, theme };
  });
}

export function toggleSidebar() {
  store.setState(s => ({ ...s, sidebarOpen: !s.sidebarOpen }));
}

// Apply saved theme on load
const { theme } = store.getState();
document.documentElement.setAttribute('data-theme', theme);
