const AI_ENDPOINT = 'https://zoyanz-api.vercel.app/ai/claude';
const DL_ENDPOINT = 'https://zoyanz-api.vercel.app/api/download';

// ─── AI Chat ─────────────────────────────────────────────────────────────────

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

// ─── Platform Detection ────────────────────────────────────────────────────────

export function detectPlatform(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.replace('www.', '');
    if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube';
    if (h.includes('instagram.com')) return 'instagram';
    if (h.includes('tiktok.com')) return 'tiktok';
    if (h.includes('twitter.com') || h.includes('x.com')) return 'twitter';
    if (h.includes('facebook.com') || h.includes('fb.watch')) return 'facebook';
    if (h.includes('threads.net')) return 'threads';
    if (h.includes('pinterest.com') || h.includes('pin.it')) return 'pinterest';
    if (h.includes('soundcloud.com')) return 'soundcloud';
    if (h.includes('spotify.com')) return 'spotify';
    if (h.includes('douyin.com')) return 'douyin';
    return 'unknown';
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

// ─── Downloader ────────────────────────────────────────────────────────────────

// Ambil info media dari backend
export async function scrapeMedia(url) {
  const res = await fetch(`${DL_ENDPOINT}?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!data.status) throw new Error(data.error || 'Gagal mengambil media');
  return data.data;
}

// Ambil URL download untuk format/kualitas tertentu (khusus YouTube)
export async function fetchQuality(url, format) {
  const res = await fetch(`${DL_ENDPOINT}?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`);
  const data = await res.json();
  if (!data.status) throw new Error(data.error || 'Gagal mengambil URL download');
  return { url: data.url, title: data.title };
}

// Trigger download ke folder Downloads browser
export function triggerDownload(url, filename = 'download') {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
