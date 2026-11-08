import { useEffect, useRef } from 'react';
import { Download, MessageSquare, Search, Sparkles } from 'lucide-react';
import Message from './Message.jsx';
import InputArea from './InputArea.jsx';
import ZoyaMark from './ZoyaMark.jsx';
import { ConversationList } from './Navigation.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const SUGGESTIONS = [
  {
    icon: Download,
    label: 'Unduh video dari YouTube',
    hint: 'Tempel tautan, pilih format',
    download: true,
  },
  {
    icon: Sparkles,
    label: 'Bantu susun ide konten mingguan',
    hint: 'Cocok untuk kreator',
  },
  {
    icon: Search,
    label: 'Jelaskan sesuatu dengan singkat',
    hint: 'Tanya bebas, jawaban padat',
  },
  {
    icon: MessageSquare,
    label: 'Terjemahkan teks ke bahasa Inggris',
    hint: 'Tempel teksnya di chat',
  },
];

export default function ChatPage({ messages, loading, onSend, onDownload, onNavigate }) {
  const endRef = useRef(null);
  const { user, loginWithGoogle, authLoading } = useAuth();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, loading]);

  const handleSuggestion = (suggestion) => {
    if (suggestion.download) onNavigate?.('downloader');
    else onSend(suggestion.label);
  };

  return (
    <div className="chat-layout">
      <aside className="pane" aria-label="Daftar percakapan">
        <div className="pane__header">Percakapan</div>
        <div className="pane__body">
          <ConversationList onNavigate={onNavigate} />
        </div>
      </aside>

      <div className="chat-main">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <ZoyaMark size={64} />
            <h1 className="chat-empty__title">
              Halo, aku <em>Zoya</em>. Mau ambil media atau ngobrol dulu?
            </h1>
            <p className="chat-empty__body">
              Tempel satu tautan untuk mengunduh video, audio, atau gambar. Atau tanya apa pun — Zoya
              ingat hal penting tentangmu kalau kamu mau.
            </p>

            <div className="suggestion-grid">
              {SUGGESTIONS.map(({ icon: Icon, label, hint, download }) => (
                <button key={label} className="suggestion" onClick={() => handleSuggestion({ download, label })}>
                  <Icon size={18} />
                  <span>
                    <span style={{ display: 'block', fontWeight: 500 }}>{label}</span>
                    <span className="muted type-body-small">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-scroll">
            {!user && (
              <div className="sync-card">
                <div className="sync-card__text">
                  <div className="sync-card__title">Chat ini belum tersinkron</div>
                  <div className="sync-card__sub">Masuk supaya riwayat dan memori ikut ke perangkat lain.</div>
                </div>
                <button className="button" onClick={loginWithGoogle} disabled={authLoading}>
                  {authLoading ? 'Memuat…' : 'Masuk'}
                </button>
              </div>
            )}

            <div className="chat-stream">
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  userLabel={user?.displayName || 'K'}
                  onRetry={
                    !message.loading && message.role === 'assistant' && index === messages.length - 1
                      ? () => {
                          const previous = messages[index - 1];
                          if (previous) onSend(previous.content);
                        }
                      : null
                  }
                />
              ))}
              <div ref={endRef} />
            </div>
          </div>
        )}

        <InputArea
          onSend={onSend}
          onDownload={onDownload}
          loading={loading}
          hasChat={messages.length > 0}
        />
      </div>
    </div>
  );
}
