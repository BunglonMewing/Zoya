import { useState } from 'react';
import { X, Download, Music, Video, ExternalLink, Loader, CheckCircle } from 'lucide-react';
import { setArtifact } from '../store.js';
import { fetchQuality, triggerDownload } from '../api.js';

function DownloadArtifact({ data, toast }) {
  const [selectedFormat, setSelectedFormat] = useState(data.formats?.[0]);
  const [status, setStatus] = useState('idle'); // idle | fetching | downloading | done
  const [progress, setProgress] = useState(0);

  const platformColors = {
    youtube: '#ff4444',
    instagram: '#e1306c',
    tiktok: '#010101',
    twitter: '#1da1f2',
    facebook: '#1877f2',
    soundcloud: '#ff5500',
    spotify: '#1db954',
    default: 'var(--accent)',
  };

  const platformEmoji = {
    youtube: '▶',
    instagram: '📷',
    tiktok: '🎵',
    twitter: '🐦',
    facebook: '📘',
    soundcloud: '☁',
    spotify: '🎧',
    reddit: '🤖',
    vimeo: '🎬',
    default: '🔗',
  };

  const handleDownload = async () => {
    if (!selectedFormat) return;
    setStatus('fetching');
    setProgress(10);

    try {
      let dlUrl = selectedFormat.url;

      // If needs cobalt re-fetch
      if (!dlUrl || data.needsCobalt) {
        setProgress(30);
        const audioOnly = selectedFormat.type === 'audio';
        dlUrl = await fetchQuality(data.originalUrl, selectedFormat.quality, audioOnly);
      }

      setProgress(70);
      setStatus('downloading');

      const ext = selectedFormat.type === 'audio' ? 'mp3' : 'mp4';
      const filename = `${(data.title || 'download').replace(/[^a-z0-9]/gi, '_')}.${ext}`;

      triggerDownload(dlUrl, filename);
      setProgress(100);
      setStatus('done');
      toast?.success('Download dimulai!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('idle');
      toast?.error('Gagal download: ' + err.message);
    }
  };

  const color = platformColors[data.platform] || platformColors.default;
  const emoji = platformEmoji[data.platform] || platformEmoji.default;

  return (
    <div className="download-card">
      {/* Thumbnail */}
      <div className="download-thumb">
        {data.thumbnail ? (
          <img src={data.thumbnail} alt={data.title} onError={e => e.target.style.display = 'none'} />
        ) : (
          <div className="download-thumb-placeholder" style={{ color }}>
            {emoji}
          </div>
        )}
        {/* Platform badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: color, color: '#fff',
          padding: '3px 8px', borderRadius: 20,
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        }}>
          {data.platform || 'media'}
        </div>
      </div>

      <div className="download-info">
        {/* Title */}
        <div className="download-title">{data.title || 'Media'}</div>

        {/* Meta */}
        <div className="download-meta">
          {data.uploader && <span className="meta-tag">{data.uploader}</span>}
          {data.duration && <span className="meta-tag">{data.duration}</span>}
          {data.platform && <span className="meta-tag" style={{ background: color + '22', color }}>{data.platform}</span>}
        </div>

        {/* Format selector */}
        {data.formats?.length > 0 && (
          <div className="quality-selector">
            <div className="quality-label">Pilih Format</div>
            <div className="quality-grid">
              {data.formats.map((f, i) => (
                <button
                  key={i}
                  className={`quality-btn ${selectedFormat === f ? 'selected' : ''}`}
                  onClick={() => setSelectedFormat(f)}
                >
                  {f.type === 'audio' ? <Music size={10} style={{ display: 'inline', marginRight: 3 }} /> : <Video size={10} style={{ display: 'inline', marginRight: 3 }} />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {(status === 'fetching' || status === 'downloading') && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {status === 'fetching' ? 'Menyiapkan download...' : 'Mengunduh...'}
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="download-actions">
          <button
            className="dl-btn dl-btn-primary"
            onClick={handleDownload}
            disabled={status !== 'idle' && status !== 'done'}
          >
            {status === 'fetching' || status === 'downloading'
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Memproses...</>
              : status === 'done'
              ? <><CheckCircle size={14} /> Selesai</>
              : <><Download size={14} /> Download {selectedFormat?.type === 'audio' ? 'Audio' : 'Video'}</>
            }
          </button>
          {data.originalUrl && (
            <a
              href={data.originalUrl || data.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dl-btn dl-btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtifactPanel({ artifact, toast }) {
  if (!artifact) return null;

  return (
    <div className="artifact-panel">
      {/* Header */}
      <div className="artifact-header">
        <div style={{ fontSize: 18 }}>
          {artifact.type === 'download' ? '⬇' : artifact.type === 'code' ? '💻' : '📄'}
        </div>
        <div className="artifact-title">{artifact.title || 'Artefak'}</div>
        <button className="icon-btn" onClick={() => setArtifact(null)} title="Tutup">
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
            background: 'var(--bg-tertiary)',
            padding: 16,
            borderRadius: 'var(--radius-sm)',
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
