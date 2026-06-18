#!/usr/bin/env node
// Minimal Zenn book cover generator: builds an SVG and rasterizes it to a
// 500x700 PNG with @resvg/resvg-js, loading M PLUS Rounded 1c Light explicitly
// so rendering does not depend on system fonts.
//
// Design intent: minimal / clean cover suited for a book jacket.
//  - soft pastel gradient background (selectable theme)
//  - title set in M PLUS Rounded 1c Light with a soft glow for legibility
//  - line breaks chosen at phrase / particle boundaries (book-quality wrapping),
//    with kinsoku handling; manual breaks via "|" are honored for full control
//
// Usage:
//   node generate.mjs --title "..." [--subtitle "..."] [--author "..."]
//                     [--theme lavender] --out path/cover.png [--keep-svg]
//   Put "|" in --title to force line breaks, e.g. "Android アプリ|Google Play|公開ガイド".
import { Resvg } from '@resvg/resvg-js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// --- font: M PLUS Rounded 1c Light (weight 300) ---
const FONT_FAMILY = 'M PLUS Rounded 1c';
const FONT_DIR = join(HERE, 'fonts');
const FONT_PATH = join(FONT_DIR, 'MPLUSRounded1c-Light.ttf');
const FONT_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/mplusrounded1c/MPLUSRounded1c-Light.ttf';

async function ensureFont() {
  if (existsSync(FONT_PATH)) return;
  mkdirSync(FONT_DIR, { recursive: true });
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`font download failed: ${res.status} ${FONT_URL}`);
  writeFileSync(FONT_PATH, Buffer.from(await res.arrayBuffer()));
}

// --- text measurement (Japanese-aware) ---
function isWide(cp) {
  return (
    (cp >= 0x3000 && cp <= 0x30ff) ||
    (cp >= 0x3400 && cp <= 0x9fff) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xff00 && cp <= 0xffef)
  );
}
const HALF_RATIO = 0.54;
const SPACE_RATIO = 0.36;
function textWidth(s, fs) {
  let w = 0;
  for (const ch of s) w += (ch === ' ' ? SPACE_RATIO : isWide(ch.codePointAt(0)) ? 1 : HALF_RATIO) * fs;
  return w;
}

// --- segmentation: keep Latin/digit runs whole, break only between segments ---
function segments(s) {
  const segs = [];
  let buf = '';
  let space = false;
  const flush = () => {
    if (buf) {
      segs.push({ text: buf, space });
      buf = '';
      space = false;
    }
  };
  for (const ch of s) {
    if (ch === ' ') {
      flush();
      space = true;
    } else if (isWide(ch.codePointAt(0))) {
      flush();
      segs.push({ text: ch, space });
      space = false;
    } else {
      buf += ch;
    }
  }
  flush();
  return segs;
}
function lineWidth(segs, a, b, fs) {
  let w = 0;
  for (let k = a; k <= b; k++) {
    if (k > a && segs[k].space) w += SPACE_RATIO * fs;
    w += textWidth(segs[k].text, fs);
  }
  return w;
}
function lineText(segs, a, b) {
  let s = '';
  for (let k = a; k <= b; k++) {
    if (k > a && segs[k].space) s += ' ';
    s += segs[k].text;
  }
  return s;
}

// Good places to END a line (after particles / punctuation).
const BREAK_AFTER = new Set([
  ...'のはをにへとがもやでだねよわ', '、', '・', '。', '，', '）', '」', '』', '】', '！', '？', '〜', '…',
]);
// Characters that must NOT START a line (kinsoku: small kana, prolonged mark,
// closing brackets, trailing punctuation).
const NO_START = new Set([
  ...'ぁぃぅぇぉっゃゅょゎ', ...'ァィゥェォッャュョ',
  'ー', '、', '。', '・', '，', '）', '」', '』', '】', '’', '”', '：', '；', '！', '？', '〜', '…',
]);
const lastCh = (t) => [...t][[...t].length - 1];
const firstCh = (t) => [...t][0];

// Book-quality wrapping via DP: minimize raggedness + penalties for breaking at
// non-phrase boundaries and for kinsoku violations.
function wrapDP(s, fs, maxW) {
  const segs = segments(s);
  const n = segs.length;
  if (n === 0) return [''];
  const INF = 1e15;
  const dp = new Array(n + 1).fill(INF);
  const nxt = new Array(n + 1).fill(-1);
  dp[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      const w = lineWidth(segs, i, j, fs);
      if (w > maxW && j > i) break;
      const isLast = j === n - 1;
      let cost = isLast ? 0 : Math.pow(maxW - w, 2) / 1000;
      if (!isLast) {
        if (!BREAK_AFTER.has(lastCh(segs[j].text))) cost += 320;
        if (NO_START.has(firstCh(segs[j + 1].text))) cost += 6000;
      }
      const total = cost + dp[j + 1];
      if (total < dp[i]) {
        dp[i] = total;
        nxt[i] = j;
      }
    }
  }
  const lines = [];
  let i = 0;
  while (i < n && nxt[i] >= 0) {
    lines.push(lineText(segs, i, nxt[i]));
    i = nxt[i] + 1;
  }
  return lines;
}

// Title layout: honor manual "|" breaks; otherwise wrap with DP and pick the
// largest font in [lo, hi] that fits within maxLines.
function layoutTitle(title, maxW, maxLines, hi, lo) {
  if (title.includes('|')) {
    const lines = title.split('|').map((s) => s.trim()).filter(Boolean);
    let fs = hi;
    for (; fs > lo; fs--) if (lines.every((l) => textWidth(l, fs) <= maxW)) break;
    return { fs, lines };
  }
  for (let fs = hi; fs >= lo; fs--) {
    const lines = wrapDP(title, fs, maxW);
    if (lines.length <= maxLines && lines.every((l) => textWidth(l, fs) <= maxW)) {
      return { fs, lines };
    }
  }
  return { fs: lo, lines: wrapDP(title, lo, maxW) };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- gradient themes (color + shape) ---
const INK_DEFAULT = { title: '#3a3a48', subtitle: '#5f5f6c', author: '#9a9aa6' };
const THEMES = {
  lavender: {
    base: '#f4f3fb',
    ink: INK_DEFAULT,
    layers: [
      { type: 'radial', cx: '20%', cy: '14%', r: '85%', color: '#d3dbf6' },
      { type: 'radial', cx: '80%', cy: '20%', r: '72%', color: '#ddd6f3' },
      { type: 'radial', cx: '80%', cy: '84%', r: '88%', color: '#f1cbdd' },
    ],
  },
  aurora: {
    base: '#f1f6fc',
    ink: { title: '#33414a', subtitle: '#5a6770', author: '#92a1a9' },
    layers: [
      { type: 'radial', cx: '18%', cy: '14%', r: '82%', color: '#c9e1f8' },
      { type: 'radial', cx: '86%', cy: '82%', r: '84%', color: '#c7ecdc' },
      { type: 'radial', cx: '60%', cy: '44%', r: '66%', color: '#ddd7f3' },
    ],
  },
  sunset: {
    base: '#fcf2ec',
    ink: { title: '#46404a', subtitle: '#6b6068', author: '#a89aa0' },
    layers: [
      {
        type: 'linear',
        x1: '0%', y1: '0%', x2: '100%', y2: '100%',
        stops: [['0%', '#fbdbc3'], ['52%', '#f4d2e0'], ['100%', '#ddd6f3']],
      },
      { type: 'radial', cx: '82%', cy: '16%', r: '58%', color: '#f9d1bb' },
    ],
  },
  cornerglow: {
    base: '#f3f7f6',
    ink: { title: '#35424a', subtitle: '#5c6870', author: '#96a2aa' },
    layers: [
      { type: 'radial', cx: '8%', cy: '10%', r: '60%', color: '#b6e1d8' },
      { type: 'radial', cx: '92%', cy: '90%', r: '64%', color: '#ccccf6' },
    ],
  },
  peach: {
    base: '#fcf6ee',
    ink: { title: '#4a4138', subtitle: '#6f6256', author: '#ab9d90' },
    layers: [
      { type: 'radial', cx: '30%', cy: '12%', r: '84%', color: '#fbe6c8' },
      { type: 'radial', cx: '82%', cy: '84%', r: '84%', color: '#f8d2bd' },
      { type: 'radial', cx: '74%', cy: '40%', r: '60%', color: '#f4d1de' },
    ],
  },
  monoblue: {
    base: '#edf3fd',
    ink: { title: '#33405a', subtitle: '#5a6884', author: '#93a0bb' },
    layers: [
      {
        type: 'linear',
        x1: '0%', y1: '0%', x2: '0%', y2: '100%',
        stops: [['0%', '#dce9fb'], ['100%', '#c0d6f5']],
      },
      { type: 'radial', cx: '24%', cy: '16%', r: '62%', color: '#d2e4fa' },
    ],
  },
};

function buildBackground(theme, W, H) {
  let defs = '';
  let rects = `  <rect width="${W}" height="${H}" fill="${theme.base}"/>\n`;
  theme.layers.forEach((ly, i) => {
    const id = `bg${i}`;
    if (ly.type === 'radial') {
      defs += `    <radialGradient id="${id}" cx="${ly.cx}" cy="${ly.cy}" r="${ly.r}"><stop offset="0%" stop-color="${ly.color}"/><stop offset="100%" stop-color="${ly.color}" stop-opacity="0"/></radialGradient>\n`;
    } else {
      const stops = ly.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
      defs += `    <linearGradient id="${id}" x1="${ly.x1}" y1="${ly.y1}" x2="${ly.x2}" y2="${ly.y2}">${stops}</linearGradient>\n`;
    }
    rects += `  <rect width="${W}" height="${H}" fill="url(#${id})"/>\n`;
  });
  return { defs, rects };
}

// Soft glow behind text = blurred light copies stacked under the sharp glyphs.
// Stacking several copies makes the halo dense enough to read on a light
// pastel background; tune titleRepeat / titleStd to taste.
const GLOW = {
  color: '#ffffff',
  titleStd: 7, titleRepeat: 4, titleOpacity: 1,
  subStd: 4.5, subRepeat: 3, subOpacity: 0.98,
};

function textPair(x, y, anchor, fs, fill, str, kind) {
  const common = `font-family="${FONT_FAMILY}" font-weight="300" font-size="${fs}" letter-spacing="0.5"${anchor ? ` text-anchor="${anchor}"` : ''}`;
  const filt = kind === 'title' ? 'glowT' : 'glowS';
  const op = kind === 'title' ? GLOW.titleOpacity : GLOW.subOpacity;
  const reps = kind === 'title' ? GLOW.titleRepeat : GLOW.subRepeat;
  let out = '';
  for (let i = 0; i < reps; i++) {
    out += `  <text x="${x}" y="${y}" ${common} fill="${GLOW.color}" opacity="${op}" filter="url(#${filt})">${esc(str)}</text>\n`;
  }
  out += `  <text x="${x}" y="${y}" ${common} fill="${fill}">${esc(str)}</text>\n`;
  return out;
}

function buildSVG({ title, subtitle, author, theme }) {
  const W = 500;
  const H = 700;
  const mL = 52;
  const mR = 42;
  const mB = 46;
  const maxW = W - mL - mR;
  const ink = theme.ink || INK_DEFAULT;

  const { fs: titleFS, lines: titleLines } = layoutTitle(title, maxW, 3, 52, 30);
  const lineH = titleFS * 1.36;
  const blockH = titleLines.length * lineH;
  const centerY = 366;
  const top = centerY - blockH / 2;

  let texts = '';
  titleLines.forEach((ln, i) => {
    const y = (top + i * lineH + titleFS).toFixed(1);
    texts += textPair(mL, y, null, titleFS, ink.title, ln, 'title');
  });

  if (subtitle) {
    let subFS = 20;
    while (subFS > 14 && textWidth(subtitle, subFS) > maxW) subFS--;
    const subLines = wrapDP(subtitle, subFS, maxW);
    const start = top + blockH + 36 + subFS;
    subLines.forEach((ln, i) => {
      const y = (start + i * (subFS * 1.5)).toFixed(1);
      texts += textPair(mL, y, null, subFS, ink.subtitle, ln, 'sub');
    });
  }

  if (author) {
    texts += textPair(W - mR, H - mB, 'end', 17, ink.author, author, 'sub');
  }

  const { defs, rects } = buildBackground(theme, W, H);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="glowT" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="${GLOW.titleStd}"/></filter>
    <filter id="glowS" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="${GLOW.subStd}"/></filter>
${defs}  </defs>
${rects}${texts}</svg>`;
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) continue;
    const key = k.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      a[key] = true;
    } else {
      a[key] = next;
      i++;
    }
  }
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.title || !a.out) {
    console.error(
      `usage: node generate.mjs --title "..." [--subtitle "..."] [--author "..."] [--theme ${Object.keys(THEMES).join('|')}] --out path/cover.png [--keep-svg]`
    );
    process.exit(1);
  }
  const theme = THEMES[a.theme || 'lavender'];
  if (!theme) throw new Error(`unknown theme: ${a.theme} (have: ${Object.keys(THEMES).join(', ')})`);
  await ensureFont();
  const svg = buildSVG({ title: a.title, subtitle: a.subtitle || '', author: a.author || '', theme });
  const outPng = resolve(a.out);
  mkdirSync(dirname(outPng), { recursive: true });
  if (a['keep-svg']) writeFileSync(outPng.replace(/\.png$/, '.svg'), svg);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 500 },
    font: { fontFiles: [FONT_PATH], loadSystemFonts: false, defaultFontFamily: FONT_FAMILY },
  });
  const png = resvg.render().asPng();
  writeFileSync(outPng, png);
  console.log(`wrote ${outPng} (${(png.length / 1024).toFixed(1)} KB, theme=${a.theme || 'lavender'})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
