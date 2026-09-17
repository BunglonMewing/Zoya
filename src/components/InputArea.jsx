import { useState, useRef, useEffect } from 'react';
import { Send, Download, Brain, Paperclip } from 'lucide-react';
import { isValidUrl, detectPlatform } from '../api.js';

export default function InputArea({ onSend, onDownload, loading, hasChat }) {
  const [text, setText] = useState('');
  const [dlMode, setDlMode] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [text]);

  // Detect URL in text and auto-toggle dl mode
  useEffect(() => {
    if (isValidUrl(text.trim()) && detectPlatform(text.trim()) !== 'unknown') {
      setDlMode(true);
    }
  }, [text]);

  const handleSend = () => {
    const val = text.trim();
    if (!val || loading) return;

    if (dlMode && isValidUrl(val)) {
      onDownload(val);
    } else {
      onSend(val);
    }
    setText('');
    setDlMode(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = dlMode
    ? 'Tempel link YouTube, TikTok, Instagram, dll...'
    : hasChat
    ? 'Tanya apa saja...'
    : 'Halo! Apa yang bisa aku bantu?';

  const canSend = text.trim() && !loading;

  return (
    <div className="input-area">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder={placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <div className="input-toolbar">
          {/* Downloader toggle */}
          <button
            className={`input-tool-btn dl-input-toggle ${dlMode ? 'active' : ''}`}
            onClick={() => setDlMode(v => !v)}
            title="Mode Downloader"
          >
            <Download size={14} />
            Downloader
          </button>

          <div className="input-spacer" />

          {/* Send */}
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!canSend}
            title="Kirim (Enter)"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      <div className="input-hint">
        {dlMode
          ? 'Mode downloader aktif — tempel link lalu tekan Enter'
          : 'Tekan Enter untuk kirim, Shift+Enter untuk baris baru'
        }
      </div>
    </div>
  );
}
