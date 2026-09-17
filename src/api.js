const AI_ENDPOINT = 'https://zoyanz-api.vercel.app/ai/claude';

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export async function sendMessage(userMessage, sessionId, memories = []) {
  // Build context prompt with memories
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

// ─── Downloader (scraping via public APIs + yt-dlp proxy services) ───────────

const CORS_PROXY = 'https://corsproxy.io/?';

// Detect platform from URL
export function detectPlatform(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.replace('www.', '');
    if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube';
    if (h.includes('instagram.com')) return 'instagram';
    if (h.includes('tiktok.com')) return 'tiktok';
    if (h.includes('twitter.com') || h.includes('x.com')) return 'twitter';
    if (h.includes('facebook.com') || h.includes('fb.watch')) return 'facebook';
    if (h.includes('soundcloud.com')) return 'soundcloud';
    if (h.includes('spotify.com')) return 'spotify';
    if (h.includes('reddit.com')) return 'reddit';
    if (h.includes('vimeo.com')) return 'vimeo';
    if (h.includes('dailymotion.com')) return 'dailymotion';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Validate URL
export function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Main scrape function using cobalt.tools API (free, open source)
export async function scrapeMedia(url) {
  const platform = detectPlatform(url);

  // Primary: cobalt.tools
  try {
    const cobaltResult = await scrapeWithCobalt(url);
    if (cobaltResult) return { ...cobaltResult, platform };
  } catch {}

  // Fallback: rapidapi ytdl or platform-specific
  if (platform === 'youtube') {
    try {
      const ytResult = await scrapeYouTube(url);
      if (ytResult) return { ...ytResult, platform };
    } catch {}
  }

  throw new Error('Tidak bisa mengambil media dari URL ini. Coba URL yang berbeda.');
}

async function scrapeWithCobalt(url) {
  const res = await fetch('https://api.cobalt.tools/api/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      url,
      vCodec: 'h264',
      vQuality: '720',
      aFormat: 'mp3',
      filenamePattern: 'pretty',
      isAudioOnly: false,
      disableMetadata: false,
    }),
  });

  if (!res.ok) throw new Error('Cobalt API error');
  const data = await res.json();

  if (data.status === 'error') throw new Error(data.text || 'Cobalt error');

  if (data.status === 'redirect' || data.status === 'stream' || data.status === 'success') {
    return {
      title: extractTitleFromUrl(url),
      thumbnail: null,
      duration: null,
      uploader: null,
      downloadUrl: data.url,
      audioUrl: null,
      formats: [
        { label: '720p', quality: '720p', type: 'video', url: data.url },
        { label: 'Audio MP3', quality: 'audio', type: 'audio', url: data.url },
      ],
    };
  }

  if (data.status === 'picker' && data.picker?.length) {
    return {
      title: extractTitleFromUrl(url),
      thumbnail: data.picker[0]?.thumb || null,
      duration: null,
      uploader: null,
      downloadUrl: data.picker[0]?.url,
      formats: data.picker.map((p, i) => ({
        label: p.type === 'photo' ? `Foto ${i + 1}` : `Video ${i + 1}`,
        quality: p.type,
        type: p.type,
        url: p.url,
      })),
    };
  }

  throw new Error('Format tidak dikenali');
}

async function scrapeYouTube(url) {
  // Use yt-dlp JSON endpoint via noembed for metadata
  const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
  const res = await fetch(noembedUrl);
  if (!res.ok) throw new Error();
  const data = await res.json();

  // Cobalt fallback for actual download
  return {
    title: data.title || extractTitleFromUrl(url),
    thumbnail: data.thumbnail_url || null,
    duration: null,
    uploader: data.author_name || null,
    downloadUrl: null,
    formats: [
      { label: '1080p', quality: '1080p', type: 'video', url: null },
      { label: '720p', quality: '720p', type: 'video', url: null },
      { label: '480p', quality: '480p', type: 'video', url: null },
      { label: 'Audio MP3', quality: 'audio', type: 'audio', url: null },
    ],
    needsCobalt: true,
    originalUrl: url,
  };
}

// Fetch specific quality via cobalt
export async function fetchQuality(originalUrl, quality, audioOnly = false) {
  const res = await fetch('https://api.cobalt.tools/api/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      url: originalUrl,
      vCodec: 'h264',
      vQuality: quality.replace('p', ''),
      aFormat: 'mp3',
      filenamePattern: 'pretty',
      isAudioOnly: audioOnly,
      disableMetadata: false,
    }),
  });

  if (!res.ok) throw new Error('Cobalt error');
  const data = await res.json();
  if (data.url) return data.url;
  throw new Error('Tidak dapat mengambil URL download');
}

function extractTitleFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.split('/').filter(Boolean).pop() || 'media';
    return decodeURIComponent(path).replace(/[-_]/g, ' ');
  } catch {
    return 'Media';
  }
}

// Trigger browser download
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

// Extract download intent from AI message
export function extractUrlFromText(text) {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}
