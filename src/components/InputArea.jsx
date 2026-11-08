import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Download } from 'lucide-react';
import { detectPlatform, isValidUrl } from '../api.js';

export default function InputArea({ onSend, onDownload, loading, hasChat }) {
  const [text, setText] = useState('');
  const [downloadMode, setDownloadMode] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const area = textareaRef.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${Math.min(area.scrollHeight, 180)}px`;
  }, [text]);

  const handleChange = (event) => {
    const value = event.target.value;
    setText(value);
    const trimmed = value.trim();
    if (isValidUrl(trimmed) && detectPlatform(trimmed) !== 'unknown') setDownloadMode(true);
  };

  const send = () => {
    const value = text.trim();
    if (!value || loading) return;

    if (downloadMode && isValidUrl(value)) onDownload(value);
    else onSend(value);

    setText('');
    setDownloadMode(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const placeholder = downloadMode
    ? 'Tempel tautan YouTube, TikTok, Instagram…'
    : hasChat
      ? 'Tanya apa saja…'
      : 'Halo, ada yang bisa Zoya bantu?';

  const canSend = Boolean(text.trim()) && !loading;

  return (
    <div className="composer">
      <div className="composer__inner">
        <div className="composer__field">
          <label className="sr-only" htmlFor="composer-input">Pesan untuk Zoya</label>
          <textarea
            id="composer-input"
            ref={textareaRef}
            rows={1}
            placeholder={placeholder}
            value={text}
            onChange={handleChange}
            onKeyDown={onKeyDown}
          />
          <div className="composer__toolbar">
            <button
              type="button"
              className={`mode-toggle ${downloadMode ? 'is-active' : ''}`.trim()}
              onClick={() => setDownloadMode(value => !value)}
              aria-pressed={downloadMode}
            >
              <Download size={15} />
              Mode unduhan
            </button>
            <div className="spacer" />
            <button
              type="button"
              className="icon-button icon-button--filled"
              onClick={send}
              disabled={!canSend}
              aria-label="Kirim pesan"
              title="Kirim (Enter)"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
        <p className="composer__hint">
          {downloadMode
            ? 'Tautan akan dibuka di halaman Unduhan — pilih format di sana.'
            : 'Enter untuk kirim · Shift+Enter untuk baris baru'}
        </p>
      </div>
    </div>
  );
}
