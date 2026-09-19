// Simple global store — state lokal + sync ke Firestore saat user login

import {
  saveChat as fsaveChat,
  deleteChat as fdeleteChat,
  saveMemory as fsaveMemory,
  deleteMemory as fdeleteMemory,
  subscribeChats,
  subscribeMemories,
} from './lib/firestoreHelpers.js';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

class Store {
  constructor() {
    this._listeners = [];
    this._state = this._load();
    this._uid = null;
    this._unsubs = [];
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

  // ─── Firebase sync ──────────────────────────────────────────────────────────

  /**
   * Panggil saat user login — subscribe realtime dari Firestore
   * dan merge dengan data lokal (hindari duplikat)
   */
  connectUser(uid) {
    this._uid = uid;
    this._unsubs.forEach(u => u());
    this._unsubs = [];

    // Subscribe chats
    const unsubChats = subscribeChats(uid, remoteChats => {
      this.setState(s => {
        // Merge: remote wins untuk chat yang ada di keduanya
        const localOnlyChats = s.chats.filter(
          lc => !remoteChats.find(rc => rc.id === lc.id)
        );
        const merged = [...remoteChats, ...localOnlyChats].sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        return { ...s, chats: merged };
      });
    });

    // Subscribe memories
    const unsubMems = subscribeMemories(uid, remoteMems => {
      this.setState(s => {
        const localOnly = s.memories.filter(
          lm => !remoteMems.find(rm => rm.id === lm.id)
        );
        const merged = [...remoteMems, ...localOnly].sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        return { ...s, memories: merged };
      });
    });

    this._unsubs = [unsubChats, unsubMems];
  }

  disconnectUser() {
    this._unsubs.forEach(u => u());
    this._unsubs = [];
    this._uid = null;
    // Reset ke state bersih saat logout
    this.setState(s => ({
      ...s,
      chats: [],
      activeChat: null,
      memories: [],
      sessionId: generateId(),
    }));
  }

  getUid() { return this._uid; }
}

export const store = new Store();

// ─── Chat actions ─────────────────────────────────────────────────────────────

export function createChat(title = 'Chat Baru') {
  const id = generateId();
  const chat = { id, title, messages: [], createdAt: Date.now() };
  store.setState(s => ({ ...s, chats: [chat, ...s.chats], activeChat: id }));
  const uid = store.getUid();
  if (uid) fsaveChat(uid, chat).catch(() => {});
  return id;
}

export function setActiveChat(id) {
  store.setState(s => ({ ...s, activeChat: id }));
}

export function deleteChat(id) {
  const uid = store.getUid();
  if (uid) fdeleteChat(uid, id).catch(() => {});
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

  // Sync chat terbaru ke Firestore setelah update selesai
  const uid = store.getUid();
  if (uid) {
    const chat = store.getState().chats.find(c => c.id === chatId);
    if (chat) fsaveChat(uid, chat).catch(() => {});
  }
}

// ─── Memory actions ───────────────────────────────────────────────────────────

export function addMemory(text) {
  const id = generateId();
  const mem = { id, text, createdAt: Date.now() };
  store.setState(s => ({ ...s, memories: [mem, ...s.memories] }));
  const uid = store.getUid();
  if (uid) fsaveMemory(uid, mem).catch(() => {});
  return id;
}

export function deleteMemory(id) {
  const uid = store.getUid();
  if (uid) fdeleteMemory(uid, id).catch(() => {});
  store.setState(s => ({ ...s, memories: s.memories.filter(m => m.id !== id) }));
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

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
