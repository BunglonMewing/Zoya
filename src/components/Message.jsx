import { useState } from 'react';
import { Check, Copy, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ZoyaMark from './ZoyaMark.jsx';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button className="msg-action" onClick={copy} title="Salin jawaban">
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Tersalin' : 'Salin'}
    </button>
  );
}

export default function Message({ message, userLabel = 'K', onRetry }) {
  const isUser = message.role === 'user';

  return (
    <article className={`message ${isUser ? 'message--user' : 'message--ai'}`}>
      <div className="message__avatar" aria-hidden="true">
        {isUser ? userLabel.slice(0, 1).toUpperCase() : <ZoyaMark size={26} />}
      </div>

      <div className="message__body">
        <div className={`message__bubble ${isUser ? '' : 'markdown'}`.trim()}>
          {message.loading ? (
            <div className="typing" role="status" aria-label="Zoya sedang menulis">
              <span /><span /><span />
            </div>
          ) : isUser ? (
            message.content
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {!isUser && !message.loading && (
          <div className="message__actions">
            <CopyButton text={message.content} />
            {onRetry && (
              <button className="msg-action" onClick={onRetry} title="Coba lagi">
                <RotateCcw size={14} />
                Ulangi
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
