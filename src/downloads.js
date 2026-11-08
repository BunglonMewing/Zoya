// Download engine: queue, concurrent transfers, byte-accurate progress,
// pause/resume via Range requests, history and settings.
import { fetchQuality, triggerDownload } from './api.js';

const STORAGE_KEY = 'zoya-downloads-v1';
const HISTORY_LIMIT = 250;

export const DEFAULT_SETTINGS = {
  quality: '1080',
  concurrency: 2,
  saveHistory: true,
};

const EXT_FALLBACK = { video: 'mp4', audio: 'mp3', image: 'jpg' };

const MIME = {
  mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mov: 'video/quicktime',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return {
      history: Array.isArray(raw?.history) ? raw.history : [],
      settings: { ...DEFAULT_SETTINGS, ...(raw?.settings || {}) },
    };
  } catch {
    return { history: [], settings: { ...DEFAULT_SETTINGS } };
  }
}

function slugify(text) {
  return String(text || 'zoya-media')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60) || 'zoya-media';
}

const mimeFor = (item) => MIME[item.ext] || (item.type === 'audio' ? 'audio/mpeg' : item.type === 'image' ? 'image/jpeg' : 'video/mp4');

export class DownloadStore {
  constructor() {
    const { history, settings } = load();
    this._state = { queue: [], history, settings };
    this._listeners = new Set();
    this._transfers = new Map(); // id -> { chunks: Uint8Array[], received: number }
    this._runs = new Map();      // id -> { controller, intent }
  }

  getState() { return this._state; }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  _notify() { this._listeners.forEach(l => l(this._state)); }

  _persist() {
    try {
      const { history, settings } = this._state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: history.slice(0, HISTORY_LIMIT), settings }));
    } catch {}
  }

  _item(id) { return this._state.queue.find(i => i.id === id); }

  _patch(id, patch) {
    const exists = this._item(id);
    if (!exists) return;
    this._state = {
      ...this._state,
      queue: this._state.queue.map(i => (i.id === id ? { ...i, ...patch } : i)),
    };
    this._notify();
  }

  _pushHistory(record) {
    if (!this._state.settings.saveHistory) return;
    this._state = { ...this._state, history: [record, ...this._state.history].slice(0, HISTORY_LIMIT) };
    this._persist();
    this._notify();
  }

  // ─── Public actions ────────────────────────────────────────────────────────

  add({ url, title, platform, thumbnail, uploader, duration, format }) {
    const fmt = format || {};
    const type = fmt.type || 'video';
    const ext = (fmt.ext || EXT_FALLBACK[type] || 'mp4').replace(/^\./, '');
    const entry = {
      id: uid(),
      url,
      title: (title || 'Media tanpa judul').trim(),
      platform: platform || 'unknown',
      thumbnail: thumbnail || null,
      uploader: uploader || null,
      duration: duration || null,
      type,
      quality: fmt.quality || 'best',
      formatLabel: fmt.label || fmt.quality || 'Kualitas terbaik',
      ext,
      directUrl: fmt.url || null,
      expectedSize: Number(fmt.size) || 0,
      filename: `${slugify(title)}.${ext}`,
      status: 'queued',
      progress: 0,
      received: 0,
      total: Number(fmt.size) || 0,
      speed: 0,
      eta: null,
      error: null,
      note: null,
      addedAt: Date.now(),
      finishedAt: null,
    };
    this._state = { ...this._state, queue: [...this._state.queue, entry] };
    this._notify();
    this._pump();
    return entry.id;
  }

  pause(id) {
    const run = this._runs.get(id);
    if (!run) return;
    run.intent = 'pause';
    run.controller.abort();
  }

  resume(id) {
    const item = this._item(id);
    if (!item || item.status !== 'paused') return;
    this._patch(id, { status: 'queued', error: null, speed: 0, eta: null });
    this._pump();
  }

  retry(id) {
    const item = this._item(id);
    if (!item || !['failed', 'canceled', 'handoff'].includes(item.status)) return;
    this._transfers.delete(id);
    this._patch(id, {
      status: 'queued', received: 0, progress: 0, speed: 0, eta: null,
      error: null, note: null, finishedAt: null,
    });
    this._pump();
  }

  remove(id) {
    const run = this._runs.get(id);
    if (run) {
      run.intent = 'cancel';
      run.controller.abort();
      this._runs.delete(id);
    }
    this._transfers.delete(id);
    this._state = { ...this._state, queue: this._state.queue.filter(i => i.id !== id) };
    this._notify();
    this._pump();
  }

  clearFinished() {
    this._state = {
      ...this._state,
      queue: this._state.queue.filter(i => ['queued', 'resolving', 'downloading', 'paused'].includes(i.status)),
    };
    this._notify();
  }

  again(record) {
    return this.add({
      url: record.sourceUrl,
      title: record.title,
      platform: record.platform,
      thumbnail: record.thumbnail,
      format: {
        type: record.type,
        quality: record.quality,
        label: record.quality,
        ext: record.ext,
        url: record.directUrl || null,
      },
    });
  }

  deleteHistory(id) {
    const record = this._state.history.find(h => h.id === id);
    this._state = { ...this._state, history: this._state.history.filter(h => h.id !== id) };
    this._persist();
    this._notify();
    return record;
  }

  restoreHistory(record) {
    if (!record) return;
    this._state = { ...this._state, history: [record, ...this._state.history].slice(0, HISTORY_LIMIT) };
    this._persist();
    this._notify();
  }

  clearHistory() {
    this._state = { ...this._state, history: [] };
    this._persist();
    this._notify();
  }

  updateSettings(patch) {
    this._state = { ...this._state, settings: { ...this._state.settings, ...patch } };
    this._persist();
    this._notify();
    this._pump();
  }

  // ─── Engine ────────────────────────────────────────────────────────────────

  _pump() {
    const { queue } = this._state;
    const limit = Math.max(1, Number(this._state.settings.concurrency) || 1);
    const slots = limit - this._runs.size;
    if (slots <= 0) return;
    queue
      .filter(i => i.status === 'queued' && !this._runs.has(i.id))
      .slice(0, slots)
      .forEach(i => { this._run(i.id); });
  }

  async _resolve(item) {
    if (item.directUrl) return item.directUrl;
    if (item.quality) {
      const result = await fetchQuality(item.url, item.quality);
      if (result?.url) return result.url;
    }
    throw new Error('Sumber ini tidak menyediakan tautan unduhan langsung.');
  }

  async _run(id) {
    const item = this._item(id);
    if (!item) return;

    const controller = new AbortController();
    this._runs.set(id, { controller, intent: null });
    this._patch(id, { status: 'resolving', error: null, note: null, speed: 0, eta: null });

    try {
      const remote = await this._resolve(item);
      this._patch(id, { status: 'downloading', directUrl: remote });
      await this._transfer(id, remote, controller);
    } catch (err) {
      const run = this._runs.get(id);
      const intent = run?.intent;
      this._runs.delete(id);

      if (intent === 'pause') {
        this._patch(id, { status: 'paused', speed: 0, eta: null });
        this._pump();
        return;
      }
      if (intent === 'cancel' || err?.name === 'AbortError') {
        this._pump();
        return;
      }

      const current = this._item(id);
      const received = this._transfers.get(id)?.received || 0;
      const looksBlocked = err instanceof TypeError || /failed to fetch|network|cors|load failed/i.test(err?.message || '');

      // Streaming fetch is often blocked by the media CDN. Hand the resolved
      // URL to the browser/Android downloader instead of failing the item.
      if (looksBlocked && current?.directUrl && received === 0) {
        triggerDownload(current.directUrl, current.filename);
        this._finish(id, {
          status: 'handoff',
          size: 0,
          note: 'Diteruskan ke pengunduh browser — progres tidak bisa dipantau di sini.',
        });
        return;
      }
      this._fail(id, err);
    }
  }

  async _transfer(id, remote, controller) {
    const transfer = this._transfers.get(id) || { chunks: [], received: 0 };
    this._transfers.set(id, transfer);

    const headers = transfer.received > 0 ? { Range: `bytes=${transfer.received}-` } : {};
    const res = await fetch(remote, { signal: controller.signal, headers });
    if (!res.ok && res.status !== 206) throw new Error(`Sumber menolak unduhan (HTTP ${res.status})`);
    if (!res.body) throw new Error('Perangkat ini tidak mendukung unduhan bertahap.');

    if (transfer.received > 0 && res.status !== 206) {
      // Server ignored the Range header; start over from byte 0.
      transfer.chunks = [];
      transfer.received = 0;
    }

    const item = this._item(id);
    const declared = Number(res.headers.get('content-length')) || 0;
    const total = declared
      ? (res.status === 206 ? transfer.received + declared : declared)
      : (item?.expectedSize || 0);

    this._patch(id, { status: 'downloading', total, progress: total ? transfer.received / total : null });

    const reader = res.body.getReader();
    let lastPaint = performance.now();
    let lastBytes = transfer.received;
    let speed = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      transfer.chunks.push(value);
      transfer.received += value.byteLength;

      const now = performance.now();
      if (now - lastPaint >= 180) {
        const seconds = Math.max((now - lastPaint) / 1000, 0.001);
        const instant = (transfer.received - lastBytes) / seconds;
        speed = speed ? speed * 0.72 + instant * 0.28 : instant;
        lastPaint = now;
        lastBytes = transfer.received;
        this._patch(id, {
          received: transfer.received,
          total,
          progress: total ? Math.min(transfer.received / total, 0.999) : null,
          speed,
          eta: total && speed ? Math.max((total - transfer.received) / speed, 0) : null,
        });
      }
    }

    const live = this._item(id);
    if (!live) return;

    const blob = new Blob(transfer.chunks, { type: mimeFor(live) });
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, live.filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);

    this._finish(id, { status: 'completed', size: transfer.received });
  }

  _finish(id, { status, size = 0, note = null }) {
    const item = this._item(id);
    if (!item) return;
    const finishedAt = Date.now();
    this._runs.delete(id);
    this._transfers.delete(id);

    this._patch(id, {
      status,
      progress: 1,
      received: size || item.received,
      total: item.total || size,
      speed: 0,
      eta: 0,
      note,
      finishedAt,
    });

    this._pushHistory({
      id: uid(),
      title: item.title,
      platform: item.platform,
      thumbnail: item.thumbnail,
      type: item.type,
      quality: item.quality,
      ext: item.ext,
      size: size || item.received,
      filename: item.filename,
      sourceUrl: item.url,
      directUrl: item.directUrl,
      status,
      note,
      at: finishedAt,
    });

    this._pump();
  }

  _fail(id, err) {
    const item = this._item(id);
    if (!item) return;
    const message = err?.message || 'Unduhan gagal. Coba lagi.';
    this._runs.delete(id);
    this._transfers.delete(id);

    this._patch(id, {
      status: 'failed',
      error: message,
      speed: 0,
      eta: null,
      finishedAt: Date.now(),
    });

    this._pushHistory({
      id: uid(),
      title: item.title,
      platform: item.platform,
      thumbnail: item.thumbnail,
      type: item.type,
      quality: item.quality,
      ext: item.ext,
      size: item.received || 0,
      filename: item.filename,
      sourceUrl: item.url,
      directUrl: item.directUrl,
      status: 'failed',
      note: message,
      at: Date.now(),
    });

    this._pump();
  }
}

export const downloads = new DownloadStore();
