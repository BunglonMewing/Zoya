// Chat + memory store. Local first, mirrored to Firestore when signed in.

import {
  saveChat as fsaveChat,
  deleteChat as fdeleteChat,
  saveMemory as fsaveMemory,
  deleteMemory as fdeleteMemory,
  subscribeChats,
  subscribeMemories,
} from './lib/firestoreHelpers.js';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Theme ───────────────────────────────────────────────────────────────────

const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
export const THEME_MODES = ['system', 'light', 'dark'];

function resolveTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return lightQuery.matches ? 'light' : 'dark';
}

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', resolveTheme(mode));
}

class Store {
  constructor() {
    this._listeners = [];
    this._state = this._load();
    this._uid = null;
    this._unsubs = [];
    applyTheme(this._state.theme);
    lightQuery.addEventListener?.('change', () => {
      if (this._state.theme === 'system') applyTheme('system');
    });
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
          theme: THEME_MODES.includes(parsed.theme) ? parsed.theme : 'system',
          sessionId: parsed.sessionId || generateId(),
        };
      }
    } catch {}
    return {
      chats: [],
      activeChat: null,
      memories: [],
      theme: 'system',
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

  // ─── Firebase sync ────────────────────────────────────────────────────────

  connectUser(uid) {
    this._uid = uid;
    this._unsubs.forEach(u => u());
    this._unsubs = [];

    const unsubChats = subscribeChats(uid, remoteChats => {
      this.setState(s => {
        const localOnlyChats = s.chats.filter(lc => !remoteChats.find(rc => rc.id === lc.id));
        const merged = [...remoteChats, ...localOnlyChats].sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        return { ...s, chats: merged };
      });
    });

    const unsubMems = subscribeMemories(uid, remoteMems => {
      this.setState(s => {
        const localOnly = s.memories.filter(lm => !remoteMems.find(rm => rm.id === lm.id));
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

// ─── Chat actions ────────────────────────────────────────────────────────────

export function createChat(title = 'Chat baru') {
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

  const uid = store.getUid();
  if (uid) {
    const chat = store.getState().chats.find(c => c.id === chatId);
    if (chat) fsaveChat(uid, chat).catch(() => {});
  }
}

export function clearChats() {
  const uid = store.getUid();
  store.getState().chats.forEach(c => { if (uid) fdeleteChat(uid, c.id).catch(() => {}); });
  store.setState(s => ({ ...s, chats: [], activeChat: null }));
}

// ─── Memory actions ──────────────────────────────────────────────────────────

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

// ─── Settings ────────────────────────────────────────────────────────────────

export function setTheme(mode) {
  if (!THEME_MODES.includes(mode)) return;
  applyTheme(mode);
  store.setState(s => ({ ...s, theme: mode }));
}
