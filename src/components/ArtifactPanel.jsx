import { useState } from 'react';
import { X, Download, Music, Video, Image, ExternalLink, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { setArtifact } from '../store.js';
import { fetchQuality, triggerDownload, detectPlatform } from '../api.js';

// ─── Platform config ────────────────────────────────────────────────────────
const PLATFORM_COLOR = {
  youtube:    '#ff4444',
  instagram:  '#e1306c',
  tiktok:     '#010101',
  twitter:    '#1da1f2',
  facebook:   '#1877f2',
  soundcloud: '#ff5500',
  spotify:    '#1db954',
  threads:    '#000000',
  pinterest:  '#e60023',
  default:    'var(--accent)',
};

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

const PLATFORM_EMOJI = {
  youtube:    '▶',
  instagram:  '📷',
  tiktok:     '🎵',
  twitter:    '🐦',
  facebook:   '📘',
  soundcloud: '☁',
  spotify:    '🎧',
  threads:    '🧵',
  pinterest:  '📌',
  default:    '🔗',
};

function FormatIcon({ type, size = 12 }) {
  if (type === 'audio') return <Music size={size} />;
  if (type === 'image' || type === 'photo') return <Image size={size} />;
  return <Video size={size} />;
}

// ─── Download Card ────────────────────────────────────────────────────────────
function DownloadArtifact({ data, toast }) {
  const platform = data.platform || 'default';
  const color   = PLATFORM_COLOR[platform] || PLATFORM_COLOR.default;
  const label   = PLATFORM_LABEL[platform] || PLATFORM_LABEL.default;
  const emoji   = PLATFORM_EMOJI[platform] || PLATFORM_EMOJI.default;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | fetching | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const formats = data.formats || [];
  const selected = formats[selectedIdx];

  const handleDownload = async () => {
    if (!selected) return;
    setStatus('fetching');
    setErrorMsg('');

    try {
      let dlUrl = selected.url;

      // YouTube butuh re-fetch per format karena URL-nya fresh
      if (!dlUrl && platform === 'youtube') {
        const result = await fetchQuality(data.originalUrl, selected.quality);
        dlUrl = result.url;
      }

      if (!dlUrl) throw new Error('URL download tidak tersedia untuk format ini');

      const ext = selected.type === 'audio' ? 'mp3'
                : selected.type === 'image' || selected.type === 'photo' ? 'jpg'
                : 'mp4';
      const filename = `${(data.title || 'download').replace(/[^a-z0-9]/gi, '_').slice(0, 60)}.${ext}`;

      triggerDownload(dlUrl, filename);
      setStatus('done');
      toast?.success('Download dimulai, cek folder Downloads kamu!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
      toast?.error('Gagal download: ' + err.message);
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Thumbnail */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: 'var(--bg-hover)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}>
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt={data.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, opacity: 0.5,
          }}>
            {emoji}
          </div>
        )}

        {/* Platform badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: color,
          color: '#fff',
          padding: '3px 10px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Title */}
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {data.title || 'Media'}
        </div>

        {/* Meta chips */}
        {(data.uploader || data.duration) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.uploader && (
              <span style={{
                padding: '3px 10px', background: 'var(--bg-hover)',
                borderRadius: 20, fontSize: 11, color: 'var(--text-secondary)',
              }}>
                {data.uploader}
              </span>
            )}
            {data.duration && (
              <span style={{
                padding: '3px 10px', background: 'var(--bg-hover)',
                borderRadius: 20, fontSize: 11, color: 'var(--text-secondary)',
              }}>
                {data.duration}
              </span>
            )}
          </div>
        )}

        {/* Format selector */}
        {formats.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Pilih Format
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {formats.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selectedIdx === i ? color : 'var(--border)'}`,
                    background: selectedIdx === i ? color + '22' : 'var(--bg-hover)',
                    color: selectedIdx === i ? color : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: selectedIdx === i ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.12s',
                  }}
                >
                  <FormatIcon type={f.type} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {status === 'error' && errorMsg && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(242,139,130,0.1)',
            border: '1px solid rgba(242,139,130,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {errorMsg}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDownload}
            disabled={status === 'fetching' || !selected}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 'var(--radius-sm)',
              background: status === 'done' ? 'var(--success)' : color,
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              cursor: status === 'fetching' ? 'not-allowed' : 'pointer',
              opacity: status === 'fetching' || !selected ? 0.7 : 1,
              transition: 'all 0.15s',
            }}
          >
            {status === 'fetching' && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {status === 'done'     && <CheckCircle size={14} />}
            {status === 'idle' || status === 'error'
              ? <Download size={14} />
              : null
            }
            {status === 'fetching' ? 'Menyiapkan...'
              : status === 'done' ? 'Selesai!'
              : selected?.type === 'audio' ? 'Download Audio'
              : selected?.type === 'image' || selected?.type === 'photo' ? 'Download Gambar'
              : 'Download Video'
            }
          </button>

          {data.originalUrl && (
            <a
              href={data.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di platform asli"
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0,
                textDecoration: 'none',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>

        {/* Download hint */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          File akan tersimpan di folder <strong>Downloads</strong> perangkat kamu
        </div>

      </div>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────
export default function ArtifactPanel({ artifact, toast }) {
  if (!artifact) return null;

  const typeIcon = artifact.type === 'download' ? '⬇' : artifact.type === 'code' ? '💻' : '📄';

  return (
    <div className="artifact-panel">
      {/* Header */}
      <div className="artifact-header">
        <span style={{ fontSize: 18, lineHeight: 1 }}>{typeIcon}</span>
        <div className="artifact-title">{artifact.title || 'Artefak'}</div>
        <button
          className="icon-btn"
          onClick={() => setArtifact(null)}
          title="Tutup"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="artifact-content">
        {artifact.type === 'download' && (
          <DownloadArtifact data={artifact.data} toast={toast} />
        )}

        {artifact.type === 'text' && (
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {artifact.data}
          </div>
        )}

        {artifact.type === 'code' && (
          <pre style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            lineHeight: 1.6,
          }}>
            <code>{artifact.data}</code>
          </pre>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
