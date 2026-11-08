import { useState } from 'react';
import {
  ExternalLink, Film, HardDrive, Image as ImageIcon, Inbox, Music,
  RotateCcw, Search, Trash2,
} from 'lucide-react';
import { downloads } from '../downloads.js';
import { useDownloads } from '../hooks/useDownloads.js';
import { toast } from '../hooks/useToast.js';
import { formatBytes, formatClock, groupByDay, platformLabel } from '../lib/format.js';
import { Dialog } from './Sheet.jsx';

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'image', label: 'Gambar' },
  { id: 'failed', label: 'Gagal' },
];

function TypeIcon({ type, size = 20 }) {
  if (type === 'audio') return <Music size={size} />;
  if (type === 'image') return <ImageIcon size={size} />;
  return <Film size={size} />;
}

export default function LibraryPage() {
  const { history } = useDownloads();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const totalSize = history.reduce((sum, record) => sum + (record.size || 0), 0);

  const needle = query.trim().toLowerCase();
  const filtered = history.filter((record) => {
    if (filter === 'failed' && record.status !== 'failed') return false;
    if (['video', 'audio', 'image'].includes(filter) && record.type !== filter) return false;
    if (needle && !record.title?.toLowerCase().includes(needle)) return false;
    return true;
  });

  const groups = groupByDay(filtered);

  const removeRecord = (record) => {
    downloads.deleteHistory(record.id);
    toast.info('Riwayat dihapus', {
      actionLabel: 'Urungkan',
      onAction: () => downloads.restoreHistory(record),
    });
  };

  const downloadAgain = (record) => {
    downloads.again(record);
    toast.success('Ditambahkan ke antrean');
  };

  return (
    <div className="page page--library">
      <div className="page__scroll">
        <div className="page__inner">
          <section className="library__summary">
            <div className="library__summary-icon">
              <HardDrive size={24} />
            </div>
            <div>
              <div className="library__summary-value">{formatBytes(totalSize)}</div>
              <div className="library__summary-label">
                {history.length} unduhan tersimpan di perangkat ini
              </div>
            </div>
            <div className="spacer" />
            {history.length > 0 && (
              <button className="button button--text button--sm" onClick={() => setConfirmClear(true)}>
                Hapus semua
              </button>
            )}
          </section>

          <div className="library__tools">
            <div className="search-field">
              <Search size={18} />
              <label className="sr-only" htmlFor="history-search">Cari riwayat</label>
              <input
                id="history-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari judul unduhan…"
              />
            </div>

            <div className="chip-row" role="group" aria-label="Filter riwayat">
              {FILTERS.map(item => (
                <button
                  key={item.id}
                  className={`chip ${filter === item.id ? 'is-selected' : ''}`.trim()}
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="empty-panel">
              <Inbox size={28} />
              <div className="empty-panel__title">Riwayat masih kosong</div>
              <p>Setiap unduhan yang selesai atau gagal akan tercatat di sini, lengkap dengan ukuran filenya.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-panel">
              <Search size={26} />
              <div className="empty-panel__title">Tidak ada yang cocok</div>
              <p>Coba kata kunci lain atau ganti filter.</p>
            </div>
          ) : (
            <div>
              {groups.map(group => (
                <section key={group.label} aria-label={group.label}>
                  <h2 className="day-header">{group.label}</h2>
                  {group.items.map(record => (
                    <article key={record.id} className="history-row">
                      <div className="history-row__thumb">
                        {record.thumbnail
                          ? <img
                              src={record.thumbnail}
                              alt=""
                              loading="lazy"
                              onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                          : <TypeIcon type={record.type} />}
                      </div>

                      <div className="history-row__body">
                        <h3 className="history-row__title" title={record.title}>{record.title}</h3>
                        <div className="history-row__meta">
                          <span>{platformLabel(record.platform)}</span>
                          <span>{formatBytes(record.size)}</span>
                          <span>{formatClock(record.at)}</span>
                          {record.status === 'failed' && <span className="is-error">Gagal</span>}
                          {record.status === 'handoff' && <span>Di browser</span>}
                        </div>
                      </div>

                      <div className="history-row__actions">
                        {record.sourceUrl && (
                          <a
                            className="icon-button"
                            href={record.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Buka sumber ${record.title}`}
                            title="Buka sumber"
                          >
                            <ExternalLink size={17} />
                          </a>
                        )}
                        <button
                          className="icon-button"
                          onClick={() => downloadAgain(record)}
                          aria-label={`Unduh lagi ${record.title}`}
                          title="Unduh lagi"
                        >
                          <RotateCcw size={17} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => removeRecord(record)}
                          aria-label={`Hapus ${record.title} dari riwayat`}
                          title="Hapus"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={confirmClear}
        title="Hapus semua riwayat?"
        actions={{
          onClose: () => setConfirmClear(false),
          buttons: (
            <>
              <button className="button button--text" onClick={() => setConfirmClear(false)}>Batal</button>
              <button
                className="button button--danger"
                onClick={() => {
                  downloads.clearHistory();
                  setConfirmClear(false);
                  toast.success('Riwayat unduhan dihapus.');
                }}
              >
                Hapus semua
              </button>
            </>
          ),
        }}
      >
        Catatan unduhan akan hilang dari perangkat ini. File yang sudah terunduh tidak terpengaruh.
      </Dialog>
    </div>
  );
}
