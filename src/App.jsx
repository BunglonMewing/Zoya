import { useState, useEffect, useRef } from 'react';
import { Menu, MoreVertical } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Message from './components/Message.jsx';
import InputArea from './components/InputArea.jsx';
import ArtifactPanel from './components/ArtifactPanel.jsx';
import MemoryModal from './components/MemoryModal.jsx';
import { useStore } from './hooks/useStore.js';
import { useToast } from './hooks/useToast.js';
import {
  createChat, addMessage, updateMessage,
  setArtifact, toggleSidebar, store,
} from './store.js';
import { sendMessage, scrapeMedia, isValidUrl, detectPlatform } from './api.js';

const PLATFORM_LABEL = {
  youtube:    'YouTube',
  instagram:  'Instagram',
  tiktok:     'TikTok',
  twitter:    'Twitter / X',
  facebook:   'Facebook',
  soundcloud: 'SoundCloud',
  spotify:    'Spotify',
  threads:    'Threads',
  pinterest:  'Pinterest',
  default:    'Media',
};

const SUGGESTIONS = [
  { icon: '🌐', text: 'Jelaskan cara kerja internet' },
  { icon: '💡', text: 'Bantu aku brainstorming ide bisnis' },
  { icon: '📥', text: 'Download video dari YouTube' },
  { icon: '💬', text: 'Terjemahkan ke bahasa Inggris' },
];

export default function App() {
  const state = useStore();
  const { chats, activeChat, memories, artifactOpen, artifact, sidebarOpen } = state;
  const { toasts, toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const chatEndRef = useRef(null);

  const activeMessages = (() => {
    const chat = chats.find(c => c.id === activeChat);
    return chat?.messages || [];
  })();

  const activeTitle = (() => {
    const chat = chats.find(c => c.id === activeChat);
    return chat?.title || 'Zoya AI';
  })();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, loading]);

  const ensureChat = () => {
    if (!activeChat) return createChat();
    return activeChat;
  };

  // ─── Kirim pesan AI ──────────────────────────────────────────────────────
  const handleSend = async (text) => {
    const chatId = ensureChat();
    const { sessionId, memories: mems } = store.getState();

    addMessage(chatId, { role: 'user', content: text });
    const loadMsgId = addMessage(chatId, { role: 'assistant', content: '', loading: true });
    setLoading(true);

    try {
      const result = await sendMessage(text, sessionId, mems);
      updateMessage(chatId, loadMsgId, { content: result.answer, loading: false });

      // Auto-trigger download jika ada URL di pesan
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      const lowerText = text.toLowerCase();
      if (urlMatch && (lowerText.includes('download') || lowerText.includes('unduh') || lowerText.includes('ambil'))) {
        setTimeout(() => handleDownload(urlMatch[0]), 800);
      }
    } catch (err) {
      updateMessage(chatId, loadMsgId, {
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        loading: false,
      });
      toast.error('Gagal menghubungi AI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Download media ───────────────────────────────────────────────────────
  const handleDownload = async (url) => {
    if (!isValidUrl(url)) {
      toast.error('URL tidak valid');
      return;
    }

    const chatId = ensureChat();
    const platform = detectPlatform(url);
    const platformName = PLATFORM_LABEL[platform] || PLATFORM_LABEL.default;

    addMessage(chatId, { role: 'user', content: `Download dari: ${url}` });
    const loadMsgId = addMessage(chatId, { role: 'assistant', content: '', loading: true });
    setLoading(true);

    try {
      toast.info(`Mengambil info media dari ${platformName}...`);
      const data = await scrapeMedia(url);

      updateMessage(chatId, loadMsgId, {
        content: `Berhasil mengambil media dari **${platformName}**!\n\n**${data.title || 'Media'}**${data.uploader ? `\noleh *${data.uploader}*` : ''}\n\nPilih format dan klik Download di panel sebelah kanan.`,
        loading: false,
      });

      setArtifact({
        type: 'download',
        title: data.title || `Download dari ${platformName}`,
        data: { ...data, originalUrl: url },
      });

      toast.success('Info media berhasil diambil!');
    } catch (err) {
      updateMessage(chatId, loadMsgId, {
        content: `Gagal mengambil media.\n\n**Error:** ${err.message}\n\nPastikan URL valid dan berasal dari platform yang didukung (YouTube, TikTok, Instagram, Twitter, Facebook, dll).`,
        loading: false,
      });
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    if (text.toLowerCase().includes('download')) {
      handleSend(text);
    } else {
      handleSend(text);
    }
  };

  return (
    <div className="app">
      <Sidebar onMemoryOpen={() => setMemoryOpen(true)} />

      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <button className="icon-btn" onClick={toggleSidebar} title="Toggle sidebar">
            <Menu size={20} />
          </button>
          <div className="topbar-title">{activeTitle}</div>
          {activeMessages.length > 0 && (
            <button
              className="icon-btn"
              onClick={() => toast.info('Fitur ekspor segera hadir!')}
              title="Opsi lainnya"
            >
              <MoreVertical size={20} />
            </button>
          )}
        </div>

        {/* Chat area */}
        <div className="chat-area">
          {activeMessages.length === 0 && (
            <div className="empty-state">
              <div className="empty-logo">Z</div>
              <div className="empty-title">Halo! Aku Zoya AI</div>
              <div className="empty-subtitle">
                Aku bisa menjawab pertanyaan, membantu pekerjaan, dan download video/audio dari YouTube, TikTok, Instagram, Twitter, dan banyak lagi.
              </div>
              <div className="suggestion-chips">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => handleSuggestion(s.text)}
                  >
                    <span style={{ marginRight: 6 }}>{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeMessages.map((msg, i) => (
            <Message
              key={msg.id}
              message={msg}
              onRetry={
                !msg.loading && msg.role === 'assistant' && i === activeMessages.length - 1
                  ? () => {
                      const userMsg = activeMessages[i - 1];
                      if (userMsg) handleSend(userMsg.content);
                    }
                  : null
              }
            />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <InputArea
          onSend={handleSend}
          onDownload={handleDownload}
          loading={loading}
          hasChat={activeMessages.length > 0}
        />
      </div>

      {/* Artifact panel */}
      {artifactOpen && artifact && (
        <ArtifactPanel artifact={artifact} toast={toast} />
      )}

      {/* Memory modal */}
      {memoryOpen && <MemoryModal onClose={() => setMemoryOpen(false)} />}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && '✓ '}
            {t.type === 'error'   && '✕ '}
            {t.type === 'info'    && 'ℹ '}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
