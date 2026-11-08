import { useCallback, useEffect, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { NavigationBar, NavigationDrawer, NavigationRail } from './components/Navigation.jsx';
import ChatPage from './components/ChatPage.jsx';
import DownloaderPage from './components/DownloaderPage.jsx';
import LibraryPage from './components/LibraryPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import MemoryModal from './components/MemoryModal.jsx';
import AboutSheet from './components/AboutSheet.jsx';
import SnackbarHost from './components/SnackbarHost.jsx';
import ZoyaMark from './components/ZoyaMark.jsx';
import { useStore } from './hooks/useStore.js';
import { toast, useToasts } from './hooks/useToast.js';
import { useAuth } from './contexts/AuthContext.jsx';
import { addMemory, addMessage, createChat, store, updateMessage } from './store.js';
import { sendMessage } from './api.js';
import { extractAutoMemory } from './lib/firestoreHelpers.js';

const TITLES = {
  chat: 'Chat',
  downloader: 'Unduhan',
  library: 'Riwayat',
  settings: 'Setelan',
};

export default function App() {
  const { chats, activeChat } = useStore();
  const { user } = useAuth();
  const toasts = useToasts();

  const [page, setPage] = useState('chat');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [downloadRequest, setDownloadRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) store.connectUser(user.uid);
    else if (user === null) store.disconnectUser();
  }, [user]);

  const activeChatData = chats.find(chat => chat.id === activeChat) || null;
  const messages = activeChatData?.messages || [];
  const chatTitle = activeChatData?.title || 'Zoya';

  const ensureChat = () => activeChat || createChat();

  const rememberFacts = (message) => {
    extractAutoMemory(message).forEach((fact) => {
      const exists = store.getState().memories.some(memory =>
        memory.text.toLowerCase().includes(fact.split(':')[0].toLowerCase())
      );
      if (!exists) {
        addMemory(fact);
        toast.info(`Memori tersimpan: "${fact}"`);
      }
    });
  };

  const openDownloader = useCallback((url = '') => {
    setDownloadRequest({ url, id: Date.now() });
    setPage('downloader');
    setDrawerOpen(false);
  }, []);

  const handleSend = async (text) => {
    const chatId = ensureChat();
    const { sessionId, memories } = store.getState();

    addMessage(chatId, { role: 'user', content: text });
    const loadingId = addMessage(chatId, { role: 'assistant', content: '', loading: true });
    setLoading(true);

    rememberFacts(text);

    try {
      const result = await sendMessage(text, sessionId, memories);
      updateMessage(chatId, loadingId, { content: result.answer, loading: false });

      const lowered = text.toLowerCase();
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch && /download|unduh|ambil/.test(lowered)) {
        setTimeout(() => openDownloader(urlMatch[0]), 600);
      }
    } catch (err) {
      updateMessage(chatId, loadingId, {
        content: 'Maaf, terjadi kesalahan saat menghubungi Zoya. Coba lagi sebentar lagi.',
        loading: false,
      });
      toast.error(`Gagal menghubungi AI: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    createChat();
    setPage('chat');
    setDrawerOpen(false);
  };

  if (user === undefined) {
    return (
      <div className="boot">
        <div className="boot__inner">
          <ZoyaMark size={72} />
          <div className="typing" aria-label="Memuat Zoya">
            <span /><span /><span />
          </div>
          <span className="boot__label">MENYIAPKAN ZOYA</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell__rail">
        <NavigationRail page={page} onNavigate={setPage} />
      </div>

      <div className="app-shell__body">
        <header className="top-app-bar">
          {page === 'chat' && (
            <button
              className="icon-button chat-pane-toggle"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka daftar percakapan"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="top-app-bar__identity">
            {page === 'chat' ? (
              <>
                <ZoyaMark size={30} />
                <div style={{ minWidth: 0 }}>
                  <h1 className="top-app-bar__title">{chatTitle}</h1>
                  <div className="top-app-bar__subtitle">AI dan pengunduh media</div>
                </div>
              </>
            ) : (
              <h1 className="top-app-bar__title">{TITLES[page]}</h1>
            )}
          </div>

          <div className="top-app-bar__actions">
            {page === 'chat' && (
              <button className="icon-button" onClick={newChat} aria-label="Percakapan baru" title="Percakapan baru">
                <Plus size={22} />
              </button>
            )}
          </div>
        </header>

        <main className="app-shell__main">
          {page === 'chat' && (
            <ChatPage
              messages={messages}
              loading={loading}
              onSend={handleSend}
              onDownload={openDownloader}
              onNavigate={setPage}
            />
          )}

          {page === 'downloader' && (
            <DownloaderPage
              request={downloadRequest}
              onRequestHandled={() => setDownloadRequest(null)}
            />
          )}

          {page === 'library' && <LibraryPage />}
          {page === 'settings' && (
            <SettingsPage
              onMemoryOpen={() => setMemoryOpen(true)}
              onAboutOpen={() => setAboutOpen(true)}
            />
          )}
        </main>

        <NavigationBar page={page} onNavigate={setPage} />
      </div>

      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={setPage}
        onMemoryOpen={() => setMemoryOpen(true)}
        onAboutOpen={() => setAboutOpen(true)}
      />

      {memoryOpen && <MemoryModal onClose={() => setMemoryOpen(false)} />}
      {aboutOpen && <AboutSheet onClose={() => setAboutOpen(false)} />}

      <SnackbarHost toasts={toasts} />
    </div>
  );
}
