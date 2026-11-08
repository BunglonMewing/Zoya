// Generates src/theme.css: Material 3 tonal palettes mapped to color roles.
// Tones follow the design-system convention (tone 40 = light primary, tone 80 = dark primary).
// Run: node scripts/gen-theme.mjs
import { writeFileSync } from 'node:fs';

// ─── Color math ─────────────────────────────────────────────────────────────

const lstarToY = (l) => (l > 8 ? ((l + 16) / 116) ** 3 : l / 903.3);
const toneToOkL = (t) => Math.cbrt(lstarToY(t));

function oklchToLinearRgb(L, C, hueDeg) {
  const h = (hueDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = ([r, g, b]) => [r, g, b].every((v) => v >= -1e-4 && v <= 1 + 1e-4);
const encode = (v) => {
  const c = Math.min(1, Math.max(0, v));
  return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
};
const hex = (rgb) => '#' + rgb.map((v) => encode(v).toString(16).padStart(2, '0')).join('');

function toneColor(tone, chroma, hue) {
  const L = toneToOkL(tone);
  let c = tone === 0 || tone === 100 ? 0 : chroma;
  for (let i = 0; i < 80; i++) {
    const rgb = oklchToLinearRgb(L, c, hue);
    if (inGamut(rgb)) return hex(rgb);
    c *= 0.96;
  }
  return '#000000';
}

function luminance(hexColor) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hexColor.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// ─── Brand palette ───────────────────────────────────────────────────────────
// Indigo signal for the "AI" side, marigold for the "grab it" side.
const HUES = {
  primary: { hue: 264, chroma: 0.168 },
  secondary: { hue: 276, chroma: 0.042 },
  tertiary: { hue: 62, chroma: 0.135 },
  neutral: { hue: 268, chroma: 0.006 },
  neutralVariant: { hue: 268, chroma: 0.014 },
  error: { hue: 27, chroma: 0.19 },
};

const TONES = [0, 6, 10, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100];

const palettes = Object.fromEntries(
  Object.entries(HUES).map(([name, { hue, chroma }]) => [
    name,
    Object.fromEntries(TONES.map((t) => [t, toneColor(t, chroma, hue)])),
  ])
);

const roleSet = (mode) => {
  const dark = mode === 'dark';
  const P = palettes.primary;
  const S = palettes.secondary;
  const T = palettes.tertiary;
  const N = palettes.neutral;
  const NV = palettes.neutralVariant;
  const E = palettes.error;

  const roles = {
    primary: dark ? P[80] : P[40],
    'on-primary': dark ? P[20] : P[100],
    'primary-container': dark ? P[30] : P[90],
    'on-primary-container': dark ? P[90] : P[10],
    secondary: dark ? S[80] : S[40],
    'on-secondary': dark ? S[20] : S[100],
    'secondary-container': dark ? S[30] : S[90],
    'on-secondary-container': dark ? S[90] : S[10],
    tertiary: dark ? T[80] : T[40],
    'on-tertiary': dark ? T[20] : T[100],
    'tertiary-container': dark ? T[30] : T[90],
    'on-tertiary-container': dark ? T[90] : T[10],
    error: dark ? E[80] : E[40],
    'on-error': dark ? E[20] : E[100],
    'error-container': dark ? E[30] : E[90],
    'on-error-container': dark ? E[90] : E[10],
    background: dark ? N[6] : N[98],
    'on-background': dark ? N[90] : N[10],
    surface: dark ? N[6] : N[98],
    'on-surface': dark ? N[90] : N[10],
    'surface-variant': dark ? NV[30] : NV[90],
    'on-surface-variant': dark ? NV[80] : NV[30],
    outline: dark ? NV[60] : NV[50],
    'outline-variant': dark ? NV[30] : NV[80],
    'inverse-surface': dark ? N[90] : N[20],
    'inverse-on-surface': dark ? N[20] : N[95],
    'inverse-primary': dark ? P[40] : P[80],
    scrim: N[0],
    'surface-dim': dark ? N[6] : N[87],
    'surface-bright': dark ? N[24] : N[98],
    'surface-container-lowest': dark ? N[6] : N[100],
    'surface-container-low': dark ? N[10] : N[96],
    'surface-container': dark ? N[17] : N[94],
    'surface-container-high': dark ? N[22] : N[92],
    'surface-container-highest': dark ? N[24] : N[90],
    'primary-fixed': P[90],
    'primary-fixed-dim': P[80],
    'on-primary-fixed': P[10],
    'on-primary-fixed-variant': P[30],
    'tertiary-fixed': T[90],
    'tertiary-fixed-dim': T[80],
    'on-tertiary-fixed': T[10],
    'on-tertiary-fixed-variant': T[30],
  };
  return roles;
};

const light = roleSet('light');
const dark = roleSet('dark');

const toBlock = (selector, roles) =>
  `${selector} {\n` +
  Object.entries(roles)
    .map(([k, v]) => `  --m3-${k}: ${v};`)
    .join('\n') +
  '\n}\n';

const css = `/* Generated by scripts/gen-theme.mjs — Material 3 color roles.
   Seed: indigo 264° / marigold 62°. Do not edit by hand. */
${toBlock(':root, [data-theme="dark"]', dark)}
${toBlock('[data-theme="light"]', light)}`;

writeFileSync(new URL('../src/theme.css', import.meta.url), css);

// ─── Contrast audit ─────────────────────────────────────────────────────────
const audit = [
  ['light primary / on-primary', light.primary, light['on-primary'], 4.5],
  ['light surface / on-surface', light.surface, light['on-surface'], 7],
  ['light surface / on-surface-variant', light.surface, light['on-surface-variant'], 4.5],
  ['light primary-container / on-primary-container', light['primary-container'], light['on-primary-container'], 4.5],
  ['light tertiary-container / on-tertiary-container', light['tertiary-container'], light['on-tertiary-container'], 4.5],
  ['light surface / primary', light.surface, light.primary, 3],
  ['light surface / tertiary', light.surface, light.tertiary, 3],
  ['dark primary / on-primary', dark.primary, dark['on-primary'], 4.5],
  ['dark surface / on-surface', dark.surface, dark['on-surface'], 7],
  ['dark surface / on-surface-variant', dark.surface, dark['on-surface-variant'], 4.5],
  ['dark primary-container / on-primary-container', dark['primary-container'], dark['on-primary-container'], 4.5],
  ['dark tertiary-container / on-tertiary-container', dark['tertiary-container'], dark['on-tertiary-container'], 4.5],
  ['dark surface / primary', dark.surface, dark.primary, 3],
  ['dark surface / tertiary', dark.surface, dark.tertiary, 3],
];

let failed = 0;
console.log('Material 3 contrast audit');
for (const [label, fg, bg, min] of audit) {
  const ratio = contrast(fg, bg);
  const ok = ratio >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${ratio.toFixed(2).padStart(5)} (min ${min})  ${label}  ${fg} on ${bg}`);
}
console.log('\nmeta theme-color:', `light=${light['surface-container']} dark=${dark['surface-container']}`);
if (failed) {
  console.error(`\n${failed} contrast pair(s) below target`);
  process.exitCode = 1;
}
