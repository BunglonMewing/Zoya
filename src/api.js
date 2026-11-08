const AI_ENDPOINT = 'https://zoyanz-api.vercel.app/ai/claude';
const DL_ENDPOINT = 'https://zoya-dl.vercel.app/download';

// ─── AI chat ─────────────────────────────────────────────────────────────────

export async function sendMessage(userMessage, sessionId, memories = []) {
  let contextPrompt = '';
  if (memories.length > 0) {
    contextPrompt = '[Memori pengguna: ' + memories.map(m => m.text).join(' | ') + ']\n\n';
  }
  const fullQuery = contextPrompt + userMessage;
  const url = `${AI_ENDPOINT}?q=${encodeURIComponent(fullQuery)}&session_id=${encodeURIComponent(sessionId)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (!data.status) throw new Error('AI API error');
  return {
    answer: data.result.answer,
    sessionId: data.result.session_id,
  };
}

// ─── Platform detection ──────────────────────────────────────────────────────

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be', 'music.youtube.com'] },
  { key: 'instagram', label: 'Instagram', hosts: ['instagram.com'] },
  { key: 'tiktok', label: 'TikTok', hosts: ['tiktok.com', 'vt.tiktok.com'] },
  { key: 'twitter', label: 'X', hosts: ['twitter.com', 'x.com'] },
  { key: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.watch'] },
  { key: 'threads', label: 'Threads', hosts: ['threads.net'] },
  { key: 'pinterest', label: 'Pinterest', hosts: ['pinterest.com', 'pin.it'] },
  { key: 'soundcloud', label: 'SoundCloud', hosts: ['soundcloud.com'] },
  { key: 'spotify', label: 'Spotify', hosts: ['spotify.com'] },
  { key: 'douyin', label: 'Douyin', hosts: ['douyin.com'] },
];

export function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const match = PLATFORMS.find(p => p.hosts.some(h => host === h || host.endsWith(`.${h}`)));
    return match ? match.key : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── Downloader ──────────────────────────────────────────────────────────────

export async function scrapeMedia(url) {
  const res = await fetch(`${DL_ENDPOINT}?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Layanan unduhan menolak permintaan (HTTP ${res.status})`);
  const data = await res.json().catch(() => ({}));
  if (!data.status || !data.data) throw new Error(data.error || 'Info media tidak tersedia untuk tautan ini');
  return data.data;
}

export async function fetchQuality(url, format) {
  const res = await fetch(`${DL_ENDPOINT}?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`);
  const data = await res.json().catch(() => ({}));
  if (!data.status) throw new Error(data.error || 'Tautan unduhan untuk format ini tidak tersedia');
  return { url: data.url, title: data.title };
}

export function triggerDownload(url, filename = 'zoya-media') {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Format normalisation ────────────────────────────────────────────────────
// The downloader service returns slightly different shapes per platform, so the
// UI only ever sees the normalised list below.

const TYPE_ALIASES = {
  audio: 'audio', music: 'audio', mp3: 'audio', m4a: 'audio', sound: 'audio',
  image: 'image', photo: 'image', picture: 'image', jpg: 'image', jpeg: 'image', png: 'image',
  video: 'video', mp4: 'video', reel: 'video', clip: 'video',
};

export function normalizeType(type) {
  return TYPE_ALIASES[String(type || '').toLowerCase()] || 'video';
}

export function normalizeFormats(data) {
  const raw = Array.isArray(data?.formats) ? data.formats : [];
  const formats = raw.map((f, i) => {
    const type = normalizeType(f.type || f.format || f.ext);
    const quality = String(f.quality ?? f.label ?? f.resolution ?? '');
    return {
      id: `${type}-${quality || 'best'}-${i}`,
      type,
      quality: quality || 'best',
      label: f.label || [quality, type === 'audio' ? 'Audio' : type === 'image' ? 'Gambar' : 'Video']
        .filter(Boolean).join(' · '),
      url: f.url || f.link || f.download || null,
      ext: String(f.ext || f.extension || '').replace(/^\./, '') || null,
      size: Number(f.size || f.filesize || f.bytes) || 0,
    };
  });

  if (formats.length === 0) {
    return [{
      id: 'video-best-0',
      type: 'video',
      quality: 'best',
      label: 'Kualitas terbaik',
      url: null,
      ext: null,
      size: 0,
    }];
  }
  return formats;
}

// Pick a sensible default: the requested quality first, then the sharpest video.
export function pickFormat(formats, preferred = '1080') {
  if (!formats.length) return null;
  const exact = formats.find(f => f.type === 'video' && f.quality === String(preferred));
  if (exact) return exact;

  const rank = (q) => {
    const n = parseInt(String(q).replace(/\D/g, ''), 10);
    if (Number.isFinite(n)) return n;
    return /best|high|hd|max/i.test(String(q)) ? 9999 : 0;
  };
  const videos = formats.filter(f => f.type === 'video');
  const pool = videos.length ? videos : formats;
  return [...pool].sort((a, b) => rank(b.quality) - rank(a.quality))[0];
}
