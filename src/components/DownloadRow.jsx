import { Download, Film, Image as ImageIcon, Music, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import { downloads } from '../downloads.js';
import { formatBytes, formatEta, formatSpeed, percent, platformLabel, typeLabel } from '../lib/format.js';

const STATUS = {
  queued: { label: 'Menunggu', className: '' },
  resolving: { label: 'Menyiapkan', className: 'status--active' },
  downloading: { label: 'Mengunduh', className: 'status--active' },
  paused: { label: 'Dijeda', className: '' },
  completed: { label: 'Selesai', className: 'status--done' },
  failed: { label: 'Gagal', className: 'status--error' },
  handoff: { label: 'Di browser', className: 'status--done' },
};

function TypeIcon({ type, size = 22 }) {
  if (type === 'audio') return <Music size={size} />;
  if (type === 'image') return <ImageIcon size={size} />;
  return <Film size={size} />;
}

export default function DownloadRow({ item }) {
  const status = STATUS[item.status] || STATUS.queued;
  const pct = percent(item);
  const active = item.status === 'downloading' || item.status === 'resolving';
  const indeterminate = active && pct === null;

  return (
    <article className={`dl-row ${item.status === 'failed' ? 'is-failed' : ''}`.trim()}>
      <div className="dl-row__thumb">
        {item.thumbnail
          ? <img src={item.thumbnail} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
          : <TypeIcon type={item.type} />}
      </div>

      <div className="dl-row__body">
        <div className="dl-row__top">
          <h3 className="dl-row__title">{item.title}</h3>
          <span className={`status ${status.className}`.trim()}>{status.label}</span>
        </div>

        <div className="dl-row__meta">
          {platformLabel(item.platform)} · {typeLabel(item.type)} · {item.formatLabel} · {item.ext.toUpperCase()}
        </div>

        {(active || item.status === 'paused') && (
          <div
            className={`progress ${indeterminate ? 'progress--indeterminate' : ''}`.trim()}
            role="progressbar"
            aria-label={`Unduhan ${item.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={indeterminate ? undefined : pct ?? 0}
          >
            <div className="progress__track">
              <div className="progress__fill" style={{ width: `${indeterminate ? 40 : pct ?? 0}%` }} />
            </div>
            <span className="progress__stop" aria-hidden="true" />
          </div>
        )}

        <div className="dl-row__stats">
          {active && (
            <>
              <span>{formatSpeed(item.speed)}</span>
              <span>
                {formatBytes(item.received)}
                {item.total ? ` / ${formatBytes(item.total)}` : ''}
              </span>
              {item.total > 0 && <span>sisa {formatEta(item.eta)}</span>}
            </>
          )}
          {item.status === 'queued' && <span>Menunggu giliran</span>}
          {item.status === 'paused' && (
            <span>
              {pct ?? 0}% · {formatBytes(item.received)} terunduh · lanjutkan kapan saja
            </span>
          )}
          {item.status === 'completed' && (
            <span>{formatBytes(item.received)} · tersimpan ke folder Downloads</span>
          )}
          {item.status === 'handoff' && <span>{item.note || 'Diteruskan ke pengunduh browser'}</span>}
          {item.status === 'failed' && <span className="is-error">{item.error}</span>}
        </div>
      </div>

      <div className="dl-row__actions">
        {active && (
          <button
            className="icon-button"
            onClick={() => downloads.pause(item.id)}
            aria-label={`Jeda unduhan ${item.title}`}
            title="Jeda"
          >
            <Pause size={18} />
          </button>
        )}

        {item.status === 'paused' && (
          <button
            className="icon-button icon-button--tonal"
            onClick={() => downloads.resume(item.id)}
            aria-label={`Lanjutkan unduhan ${item.title}`}
            title="Lanjutkan"
          >
            <Play size={18} />
          </button>
        )}

        {item.status === 'failed' && (
          <button
            className="icon-button"
            onClick={() => downloads.retry(item.id)}
            aria-label={`Coba unduh lagi ${item.title}`}
            title="Coba lagi"
          >
            <RotateCcw size={18} />
          </button>
        )}

        {item.status === 'completed' && (
          <span className="icon-button" aria-hidden="true" title="Tersimpan">
            <Download size={18} />
          </span>
        )}

        <button
          className="icon-button"
          onClick={() => downloads.remove(item.id)}
          aria-label={`Hapus ${item.title} dari antrean`}
          title="Hapus dari antrean"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
}
