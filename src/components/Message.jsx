import { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="msg-action-btn" onClick={handle} title="Salin">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Tersalin' : 'Salin'}
    </button>
  );
}

export default function Message({ message, onRetry }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-group ${isUser ? 'user-group' : 'ai-group'}`}>
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
        {isUser ? 'K' : 'Z'}
      </div>

      <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
        {message.loading ? (
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        ) : isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>

      {!isUser && !message.loading && (
        <div className="message-actions">
          <CopyButton text={message.content} />
          <button className="msg-action-btn" title="Bagus">
            <ThumbsUp size={13} />
          </button>
          <button className="msg-action-btn" title="Kurang bagus">
            <ThumbsDown size={13} />
          </button>
          {onRetry && (
            <button className="msg-action-btn" onClick={onRetry} title="Coba lagi">
              <RotateCcw size={13} />
              Coba lagi
            </button>
          )}
        </div>
      )}
    </div>
  );
}
