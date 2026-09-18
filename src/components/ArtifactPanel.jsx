import { useState } from 'react';
import { X, Download, Music, Video, Image, ExternalLink, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { setArtifact } from '../store.js';
import { fetchQuality, triggerDownload } from '../api.js';

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_COLOR = {
  youtube:    '#ff4444',
  instagram:  '#e1306c',
  tiktok:     '#fe2c55',
  twitter:    '#1da1f2',
  facebook:   '#1877f2',
  soundcloud: '#ff5500',
  spotify:    '#1db954',
  threads:    '#101010',
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

function FormatIcon({ type, size = 13 }) {
  if (type === 'audio')                    return <Music  size={size} />;
  if (type === 'image' || type === 'photo') return <Image  size={size} />;
  return <Video size={size} />;
}

// ─── Download content ─────────────────────────────────────────────────────────

function DownloadContent({ data, toast }) {
  const platform = data.platform || 'default';
  const color    = PLATFORM_COLOR[platform] || PLATFORM_COLOR.default;
  const label    = PLATFORM_LABEL[platform] || PLATFORM_LABEL.default;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [status,      setStatus]      = useState('idle');
  const [errorMsg,    setErrorMsg]    = useState('');

  const formats  = data.formats || [];
  const selected = formats[selectedIdx];

  const handleDownload = async () => {
    if (!selected) return;
    setStatus('fetching');
    setErrorMsg('');

    try {
      let dlUrl = selected.url;

      if (!dlUrl && platform === 'youtube') {
        const result = await fetchQuality(data.originalUrl, selected.quality);
        dlUrl = result.url;
      }

      if (!dlUrl) throw new Error('URL download tidak tersedia untuk format ini');

      const ext = selected.type === 'audio'
        ? 'mp3'
        : (selected.type === 'image' || selected.type === 'photo')
          ? 'jpg'
          : 'mp4';

      const filename = `${(data.title || 'download')
        .replace(/[^a-z0-9]/gi, '_')
        .slice(0, 60)}.${ext}`;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Thumbnail + badge */}
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: 'var(--bg-hover)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden', position: 'relative', flexShrink: 0,
      }}>
        {data.thumbnail
          ? <img src={data.thumbnail} alt={data.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; }} />
          : <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, opacity: 0.4,
            }}>▶</div>
        }
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: color, color: '#fff',
          padding: '3px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
      </div>

      {/* Judul */}
      <div style={{
        fontSize: 13, fontWeight: 600,
        color: 'var(--text-primary)', lineHeight: 1.4,
      }}>
        {data.title || 'Media'}
      </div>

      {/* Meta */}
      {(data.uploader || data.duration) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.uploader && (
            <span style={{
              padding: '2px 10px', background: 'var(--bg-hover)',
              borderRadius: 20, fontSize: 11, color: 'var(--text-secondary)',
            }}>{data.uploader}</span>
          )}
          {data.duration && (
            <span style={{
              padding: '2px 10px', background: 'var(--bg-hover)',
              borderRadius: 20, fontSize: 11, color: 'var(--text-secondary)',
            }}>{data.duration}</span>
          )}
        </div>
      )}

      {/* Format selector */}
      {formats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Pilih Format
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {formats.map((f, i) => (
              <button key={i} onClick={() => setSelectedIdx(i)} style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${selectedIdx === i ? color : 'var(--border)'}`,
                background: selectedIdx === i ? color + '20' : 'var(--bg-hover)',
                color: selectedIdx === i ? color : 'var(--text-secondary)',
                fontSize: 12, fontWeight: selectedIdx === i ? 700 : 400,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.12s',
              }}>
                <FormatIcon type={f.type} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div style={{
          padding: '10px 12px',
          background: 'rgba(242,139,130,0.1)',
          border: '1px solid rgba(242,139,130,0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--danger)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {errorMsg}
        </div>
      )}

      {/* Tombol download + eksternal */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleDownload}
          disabled={status === 'fetching' || !selected}
          style={{
            flex: 1, padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: status === 'done' ? '#81c995' : color,
            color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            opacity: (status === 'fetching' || !selected) ? 0.65 : 1,
            cursor: status === 'fetching' ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}>
          {status === 'fetching' && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {status === 'done'     && <CheckCircle size={14} />}
          {(status === 'idle' || status === 'error') && <Download size={14} />}
          {status === 'fetching' ? 'Menyiapkan...'
            : status === 'done'  ? 'Selesai!'
            : selected?.type === 'audio' ? 'Download Audio'
            : (selected?.type === 'image' || selected?.type === 'photo') ? 'Download Gambar'
            : 'Download Video'}
        </button>

        {data.originalUrl && (
          <a href={data.originalUrl} target="_blank" rel="noopener noreferrer"
            style={{
              width: 44, height: 44, flexShrink: 0,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', textDecoration: 'none',
            }}>
            <ExternalLink size={15} />
          </a>
        )}
      </div>

      {/* Hint */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        File tersimpan di folder <strong style={{ color: 'var(--text-secondary)' }}>Downloads</strong> perangkat kamu
      </div>

    </div>
  );
}

// ─── Bottom Sheet (mobile-first) ──────────────────────────────────────────────

export default function ArtifactPanel({ artifact, toast }) {
  if (!artifact) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setArtifact(null)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 200,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 201,
        background: 'var(--bg-secondary)',
        borderRadius: '20px 20px 0 0',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.4)',
      }}>

        {/* Drag handle */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '12px 0 4px',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 4,
            background: 'var(--border)',
            borderRadius: 2,
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 20px 14px',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 18 }}>
            {artifact.type === 'download' ? '⬇' : artifact.type === 'code' ? '💻' : '📄'}
          </span>
          <div style={{
            flex: 1, fontSize: 14, fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {artifact.title || 'Artefak'}
          </div>
          <button
            onClick={() => setArtifact(null)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-hover)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}>
          {artifact.type === 'download' && (
            <DownloadContent data={artifact.data} toast={toast} />
          )}
          {artifact.type === 'text' && (
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {artifact.data}
            </div>
          )}
          {artifact.type === 'code' && (
            <pre style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: 14, fontSize: 12,
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto', lineHeight: 1.6,
            }}>
              <code>{artifact.data}</code>
            </pre>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes spin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}
