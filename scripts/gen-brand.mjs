// Zoya brand assets. One geometry, many outputs.
//   node scripts/gen-brand.mjs            -> svg + Android vector drawables
//   node scripts/gen-brand.mjs splash W H out.svg
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const BRAND = {
  primary: '#2b56bc',
  primaryDeep: '#143b9f',
  onPrimary: '#ffffff',
  accent: '#feb572',
  surface: '#121316',
};

const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

// The mark: a Z whose lower tray reads like a download slot.
const glyph = ({ color = BRAND.onPrimary, accent = BRAND.accent, scale = 1 } = {}) => {
  const transform =
    scale === 1 ? '' : ` transform="translate(54 54) scale(${scale}) translate(-54 -54)"`;
  return `<g${transform}>
    <path d="M69.5 33 38.5 61" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
    <rect x="31" y="25" width="46" height="10" rx="5" fill="${color}"/>
    <rect x="31" y="59" width="46" height="10" rx="5" fill="${color}"/>
    <rect x="38" y="77" width="32" height="5" rx="2.5" fill="${accent}"/>
  </g>`;
};

const gradient = `<defs>
    <linearGradient id="zoya-bg" x1="8" y1="2" x2="100" y2="106" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${BRAND.primary}"/>
      <stop offset="1" stop-color="${BRAND.primaryDeep}"/>
    </linearGradient>
  </defs>`;

const svg = (content, { width = 108, height = 108, viewBox = '0 0 108 108' } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="none">\n${content}\n</svg>\n`;

const appIcon = ({ rx = 24, width = 512 } = {}) =>
  svg(`${gradient}<rect width="108" height="108" rx="${rx}" fill="url(#zoya-bg)"/>\n${glyph()}`, {
    width,
    height: width,
  });

const roundIcon = ({ width = 192 } = {}) =>
  svg(`${gradient}<circle cx="54" cy="54" r="54" fill="url(#zoya-bg)"/>\n${glyph({ scale: 0.86 })}`, {
    width,
    height: width,
  });

const foregroundIcon = () =>
  svg(glyph(), { width: 432, height: 432 });

const maskableIcon = () =>
  svg(`${gradient}<rect width="108" height="108" fill="url(#zoya-bg)"/>\n${glyph({ scale: 0.74 })}`, {
    width: 512,
    height: 512,
  });

const splash = (w, h) => {
  const mark = Math.round(Math.min(w, h) * 0.26);
  const x = Math.round((w - mark) / 2);
  const y = Math.round((h - mark) / 2);
  return svg(
    `<rect width="${w}" height="${h}" fill="${BRAND.surface}"/>
  <g transform="translate(${x} ${y}) scale(${(mark / 108).toFixed(5)})">
    ${gradient}
    <rect width="108" height="108" rx="26" fill="url(#zoya-bg)"/>
    ${glyph()}
  </g>`,
    { width: w, height: h }
  );
};

// Android vector drawables (108dp viewport, adaptive icon layers).
const vectorDrawable = ({ accent }) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:pathData="M69.5,33 L38.5,61"
        android:strokeColor="${BRAND.onPrimary}"
        android:strokeWidth="10"
        android:strokeLineCap="round" />
    <path
        android:fillColor="${BRAND.onPrimary}"
        android:pathData="M36,25 h36 a5,5 0 0 1 0,10 h-36 a5,5 0 0 1 0,-10 z" />
    <path
        android:fillColor="${BRAND.onPrimary}"
        android:pathData="M36,59 h36 a5,5 0 0 1 0,10 h-36 a5,5 0 0 1 0,-10 z" />
    <path
        android:fillColor="${accent}"
        android:pathData="M40.5,77 h27 a2.5,2.5 0 0 1 0,5 h-27 a2.5,2.5 0 0 1 0,-5 z" />
</vector>
`;

const args = process.argv.slice(2);
if (args[0] === 'splash') {
  const [, w, h, out] = args;
  write(out, splash(Number(w), Number(h)));
} else {
  write('public/favicon.svg', appIcon({ rx: 26, width: 64 }));
  write('public/icons/icon.svg', appIcon({ width: 512 }));
  write('public/icons/icon-round.svg', roundIcon({ width: 192 }));
  write('public/icons/icon-maskable.svg', maskableIcon());
  write('assets/brand/zoya-icon.svg', appIcon({ width: 512 }));
  write('assets/brand/zoya-icon-round.svg', roundIcon({ width: 512 }));
  write('assets/brand/zoya-foreground.svg', foregroundIcon());
  write('assets/brand/zoya-maskable.svg', maskableIcon());

  const res = 'android/app/src/main/res';
  write(`${res}/drawable/ic_launcher_foreground.xml`, vectorDrawable({ accent: BRAND.accent }));
  write(`${res}/drawable/ic_launcher_monochrome.xml`, vectorDrawable({ accent: BRAND.onPrimary }));
  write(`${res}/values/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BRAND.primary}</color>
</resources>
`);
  console.log('brand svg + android vectors written');
}
