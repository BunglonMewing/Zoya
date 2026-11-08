import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ClipboardPaste, Copy, Download, ExternalLink, Film, Image as ImageIcon,
  Link2, Loader2, Music, Search, X,
} from 'lucide-react';
import { detectPlatform, isValidUrl, normalizeFormats, pickFormat, scrapeMedia } from '../api.js';
import { downloads } from '../downloads.js';
import { useDownloads } from '../hooks/useDownloads.js';
import { toast } from '../hooks/useToast.js';
import { formatBytes, platformLabel, typeLabel } from '../lib/format.js';
import DownloadRow from './DownloadRow.jsx';

const TYPE_ICON = { video: Film, audio: Music, image: ImageIcon };

export default function DownloaderPage({ request, onRequestHandled }) {
  const { queue, settings } = useDownloads();
  const [mode, setMode] = useState('single');
  const [url, setUrl] = useState('');
  const [batchText, setBatchText] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [media, setMedia] = useState(null);
  const [formats, setFormats] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [batchBusy, setBatchBusy] = useState(false);
  const handledRequest = useRef(null);

  const fetchInfo = useCallback(async (raw) => {
    const value = String(raw ?? '').trim();
    if (!isValidUrl(value)) {
      toast.error('Tautan tidak valid. Harus diawali http:// atau https://.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const data = await scrapeMedia(value);
      const list = normalizeFormats(data);
      const preferred = pickFormat(list, settings.quality);
      setMedia({ ...data, originalUrl: value, platform: data.platform || detectPlatform(value) });
      setFormats(list);
      setSelectedType(preferred?.type || 'video');
      setSelectedId(preferred?.id || '');
      setStatus('result');
    } catch (err) {
      setError(err?.message || 'Gagal mengambil info media.');
      setStatus('error');
    }
  }, [settings.quality]);

  useEffect(() => {
    if (!request || handledRequest.current === request.id) return;
    handledRequest.current = request.id;
    setMode('single');
    setUrl(request.url || '');
    onRequestHandled?.();
    if (request.url) fetchInfo(request.url);
  }, [request, fetchInfo, onRequestHandled]);

  const types = useMemo(() => [...new Set(formats.map(f => f.type))], [formats]);
  const activeType = selectedType || types[0] || 'video';
  const visibleFormats = useMemo(() => formats.filter(f => f.type === activeType), [formats, activeType]);
  const selected = visibleFormats.find(f => f.id === selectedId) || visibleFormats[0] || null;
  const finishedCount = queue.filter(item => ['completed', 'failed', 'handoff'].includes(item.status)).length;

  const chooseType = (type) => {
    setSelectedType(type);
    const next = pickFormat(formats.filter(f => f.type === type), settings.quality);
    setSelectedId(next?.id || '');
  };

  const useClipboard = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        toast.info('Papan klip kosong.');
        return;
      }
      setUrl(text);
      if (isValidUrl(text)) fetchInfo(text);
      else toast.info('Isi papan klip bukan tautan.');
    } catch {
      toast.info('Browser memblokir papan klip. Tempel manual dengan Ctrl+V.');
    }
  };

  const startDownload = () => {
    if (!media || !selected) return;
    downloads.add({
      url: media.originalUrl,
      title: media.title,
      platform: media.platform,
      thumbnail: media.thumbnail,
      uploader: media.uploader,
      duration: media.duration,
      format: selected,
    });
    toast.success(`Masuk antrean: ${selected.label}`);
  };

  const runBatch = async () => {
    const urls = batchText.split(/\s+/).map(value => value.trim()).filter(value => isValidUrl(value));
    if (urls.length === 0) {
      toast.error('Tidak ada tautan valid di kotak itu.');
      return;
    }

    setBatchBusy(true);
    let added = 0;
    let failed = 0;

    for (const value of urls) {
      try {
        const data = await scrapeMedia(value);
        const list = normalizeFormats(data);
        const format = pickFormat(list, settings.quality) || list[0];
        downloads.add({
          url: value,
          title: data.title,
          platform: data.platform || detectPlatform(value),
          thumbnail: data.thumbnail,
          uploader: data.uploader,
          format,
        });
        added += 1;
      } catch {
        failed += 1;
      }
    }

    setBatchBusy(false);
    setBatchText('');
    if (added) toast.success(`${added} tautan masuk antrean${failed ? `, ${failed} gagal` : ''}.`);
    else toast.error('Semua tautan gagal diambil.');
  };

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(media.originalUrl);
      toast.success('Tautan disalin.');
    } catch {
      toast.info('Gagal menyalin tautan.');
    }
  };

  return (
    <div className="page page--downloader">
      <div className="page__scroll">
        <div className="page__inner">
          <section className="downloader">
            <div className="downloader__hero">
              <span className="downloader__eyebrow">Pengunduh media</span>
              <h1 className="downloader__headline">
                Satu tautan, lalu <em>pilih formatnya</em>.
              </h1>
              <p className="downloader__sub">
                Video, audio, atau gambar dari platform populer. Antrean berjalan sendiri, bisa dijeda,
                dan riwayatnya tersimpan di perangkat ini.
              </p>

              <div className="segmented" role="group" aria-label="Mode jumlah tautan">
                <button
                  className={`segmented__item ${mode === 'single' ? 'is-selected' : ''}`.trim()}
                  onClick={() => setMode('single')}
                  aria-pressed={mode === 'single'}
                >
                  Satu tautan
                </button>
                <button
                  className={`segmented__item ${mode === 'batch' ? 'is-selected' : ''}`.trim()}
                  onClick={() => setMode('batch')}
                  aria-pressed={mode === 'batch'}
                >
                  Beberapa tautan
                </button>
              </div>

              {mode === 'single' ? (
                <form
                  className="downloader__form"
                  onSubmit={(event) => { event.preventDefault(); fetchInfo(url); }}
                >
                  <div className="url-field">
                    <Link2 size={20} className="url-field__icon" />
                    <label className="sr-only" htmlFor="media-url">Tautan media</label>
                    <input
                      id="media-url"
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      spellCheck="false"
                      placeholder="https://youtube.com/watch?v=…"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                    />
                    {url && (
                      <button type="button" className="icon-button" onClick={() => setUrl('')} aria-label="Kosongkan tautan">
                        <X size={18} />
                      </button>
                    )}
                    <button type="button" className="icon-button" onClick={useClipboard} aria-label="Tempel dari papan klip" title="Tempel">
                      <ClipboardPaste size={18} />
                    </button>
                  </div>

                  <button className="button button--filled button--full" type="submit" disabled={status === 'loading'}>
                    {status === 'loading'
                      ? <><Loader2 size={18} className="spin" /> Mengambil info…</>
                      : <><Search size={18} /> Ambil info media</>}
                  </button>
                </form>
              ) : (
                <div className="downloader__form">
                  <label className="sr-only" htmlFor="batch-urls">Daftar tautan</label>
                  <textarea
                    id="batch-urls"
                    className="textarea-field"
                    placeholder={'Satu tautan per baris\nhttps://tiktok.com/…\nhttps://instagram.com/…'}
                    value={batchText}
                    onChange={(event) => setBatchText(event.target.value)}
                  />
                  <button
                    className="button button--filled button--full"
                    onClick={runBatch}
                    disabled={batchBusy}
                  >
                    {batchBusy
                      ? <><Loader2 size={18} className="spin" /> Mengambil satu per satu…</>
                      : <><Download size={18} /> Unduh semua</>}
                  </button>
                </div>
              )}

              <p className="downloader__supported">
                Mendukung <strong>YouTube, TikTok, Instagram, Facebook, X, Threads, Pinterest,
                SoundCloud,</strong> dan <strong>Spotify</strong>. Kualitas terbaik mengikuti setelan default.
              </p>
            </div>

            {status === 'loading' && (
              <div className="stack" aria-hidden="true">
                <div className="skeleton skeleton--media" />
                <div className="skeleton" style={{ height: 20, width: '60%' }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            )}

            {status === 'error' && (
              <div className="notice notice--error" role="alert">
                <AlertCircle size={18} />
                <div className="notice__body">
                  {error}
                  <div style={{ marginTop: 10 }}>
                    <button className="button button--text button--sm" onClick={() => fetchInfo(url)}>
                      Coba lagi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {status === 'result' && media && (
              <article className="media-card">
                <div className="media-card__thumb">
                  {media.thumbnail
                    ? <img src={media.thumbnail} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                    : null}
                  <span className="media-card__platform">{platformLabel(media.platform)}</span>
                </div>

                <div className="media-card__body">
                  <h2 className="media-card__title">{media.title || 'Media tanpa judul'}</h2>

                  <div className="media-card__meta">
                    {media.uploader && <span>{media.uploader}</span>}
                    {media.duration && <span>{media.duration}</span>}
                    <span>{visibleFormats.length} format</span>
                  </div>

                  {types.length > 1 && (
                    <div className="segmented" role="group" aria-label="Jenis media">
                      {types.map(type => {
                        const Icon = TYPE_ICON[type] || Film;
                        return (
                          <button
                            key={type}
                            className={`segmented__item ${activeType === type ? 'is-selected' : ''}`.trim()}
                            onClick={() => chooseType(type)}
                            aria-pressed={activeType === type}
                          >
                            <Icon size={16} />
                            {typeLabel(type)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {visibleFormats.length > 1 && (
                    <div className="field-group">
                      <span className="field-group__label">Pilih kualitas</span>
                      <div className="chip-row">
                        {visibleFormats.map(format => (
                          <button
                            key={format.id}
                            className={`chip ${selected?.id === format.id ? 'is-selected' : ''}`.trim()}
                            onClick={() => setSelectedId(format.id)}
                            aria-pressed={selected?.id === format.id}
                          >
                            {format.quality}
                            {format.size ? <span className="muted">· {formatBytes(format.size)}</span> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="media-card__actions">
                    <button className="button button--filled" onClick={startDownload} disabled={!selected}>
                      <Download size={18} />
                      Unduh {selected ? selected.label.toLowerCase() : 'media'}
                    </button>
                    <button className="icon-button" onClick={copySource} aria-label="Salin tautan sumber" title="Salin tautan">
                      <Copy size={18} />
                    </button>
                    <a
                      className="icon-button"
                      href={media.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Buka tautan sumber"
                      title="Buka sumber"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </article>
            )}
          </section>

          <section className="queue" aria-label="Antrean unduhan">
            <div className="section-header">
              <h2 className="section-header__title">Antrean</h2>
              {queue.length > 0 && <span className="badge">{queue.length}</span>}
              <div className="section-header__spacer" />
              {finishedCount > 0 && (
                <button className="button button--text button--sm" onClick={() => downloads.clearFinished()}>
                  Bersihkan selesai
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="empty-panel">
                <Download size={26} />
                <div className="empty-panel__title">Belum ada unduhan</div>
                <p>
                  Tempel tautan di atas. Setelah media dikenali, pilih format lalu tekan Unduh — progres
                  muncul di sini lengkap dengan kecepatan dan sisa waktu.
                </p>
              </div>
            ) : (
              queue.map(item => <DownloadRow key={item.id} item={item} />)
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
