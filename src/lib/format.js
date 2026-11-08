export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  const fixed = value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace('.', ',');
  return `${fixed} ${units[i]}`;
}

export function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond <= 0) return '—';
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatEta(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  if (seconds < 1) return 'sebentar';
  const s = Math.round(seconds);
  if (s < 60) return `${s} dtk`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return `${m} mnt ${rest.toString().padStart(2, '0')} dtk`;
  const h = Math.floor(m / 60);
  return `${h} jam ${(m % 60).toString().padStart(2, '0')} mnt`;
}

export function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function dayLabel(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function groupByDay(records) {
  const groups = [];
  for (const record of records) {
    const label = dayLabel(record.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(record);
    else groups.push({ label, items: [record] });
  }
  return groups;
}

const PLATFORM_LABELS = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'X',
  facebook: 'Facebook',
  threads: 'Threads',
  pinterest: 'Pinterest',
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  douyin: 'Douyin',
  unknown: 'Media',
};

export function platformLabel(platform) {
  return PLATFORM_LABELS[platform] || 'Media';
}

export function typeLabel(type) {
  if (type === 'audio') return 'Audio';
  if (type === 'image') return 'Gambar';
  return 'Video';
}

export function percent(item) {
  if (Number.isFinite(item.progress) && item.progress !== null) return Math.round(item.progress * 100);
  if (item.total && item.received) return Math.round((item.received / item.total) * 100);
  return null;
}
