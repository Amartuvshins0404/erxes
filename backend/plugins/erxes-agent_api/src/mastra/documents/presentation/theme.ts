import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// erxes presentation theme — brand tokens, slide canvas, fonts, and the "house
// class vocabulary" the slide author writes against.
//
// Satori does NOT apply external <style> sheets or arbitrary CSS class names. It
// honours inline `style` attributes and a Tailwind subset (`tw`) only. So the
// house theme is delivered as a fixed class -> inline-style map (CLASS_STYLES):
// renderSlide.ts walks the parsed VDOM and resolves every house class on a node
// into merged inline styles before handing the tree to Satori. The model can
// therefore author clean, semantic HTML using a small, documented vocabulary
// and still get on-brand, flexbox-only layout that actually renders.
//
// Brand palette mirrors the chat chart colors: indigo #6366f1 primary, dark
// neutrals #1f2937 / #374151 / #6b7280, light canvas. Fonts are the already
// bundled Noto Sans TTFs (full Cyrillic + Mongolian Cyrillic coverage), loaded
// as Buffers for Satori.
// ---------------------------------------------------------------------------

// 16:9 canvas. Satori renders at this logical size; renderSlide rasterises @2x.
export const SLIDE_W = 1280;
export const SLIDE_H = 720;
export const RENDER_SCALE = 2;

export const BRAND = {
  indigo: '#6366f1',
  indigoDark: '#4f46e5',
  indigoDarker: '#4338ca',
  indigoSoft: '#eef2ff',
  ink: '#1f2937',
  body: '#374151',
  muted: '#6b7280',
  faint: '#9ca3af',
  line: '#e5e7eb',
  soft: '#f9fafb',
  soft2: '#f3f4f6',
  white: '#ffffff',
} as const;

const FONT_DIR = path.join(__dirname, '..', 'fonts');

export interface SatoriFont {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: 'normal' | 'italic';
}

let cachedFonts: SatoriFont[] | null = null;

/** Load the bundled Noto Sans TTFs as Satori font descriptors (cached). */
export function getFonts(): SatoriFont[] {
  if (cachedFonts) return cachedFonts;
  const read = (file: string) => fs.readFileSync(path.join(FONT_DIR, file));
  cachedFonts = [
    { name: 'Noto Sans', data: read('NotoSans-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Noto Sans', data: read('NotoSans-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Noto Sans', data: read('NotoSans-Italic.ttf'), weight: 400, style: 'italic' },
    { name: 'Noto Sans', data: read('NotoSans-BoldItalic.ttf'), weight: 700, style: 'italic' },
  ];
  return cachedFonts;
}

export type Style = Record<string, string | number>;

// The house vocabulary. Each class resolves to inline styles. Flexbox only — no
// grid/float (Satori does not support them). Authors compose these on plain
// <div>/<span>/<img>. Later classes on the same element win on conflicting keys.
export const CLASS_STYLES: Record<string, Style> = {
  // --- root canvas variants ---------------------------------------------
  slide: {
    display: 'flex',
    flexDirection: 'column',
    width: `${SLIDE_W}px`,
    height: `${SLIDE_H}px`,
    padding: '72px 80px',
    backgroundColor: BRAND.white,
    color: BRAND.ink,
    fontFamily: 'Noto Sans',
    fontSize: '24px',
    position: 'relative',
  },
  'slide-indigo': { backgroundColor: BRAND.indigo, color: BRAND.white },
  'slide-dark': { backgroundColor: BRAND.ink, color: BRAND.white },
  'slide-soft': { backgroundColor: BRAND.soft },
  'slide-center': { justifyContent: 'center' },

  // --- flex helpers ------------------------------------------------------
  row: { display: 'flex', flexDirection: 'row' },
  col: { display: 'flex', flexDirection: 'column' },
  // `grow`/`grow2` only carry flex sizing so they compose with `row`/`col`
  // without clobbering direction; the renderer defaults their own children to a
  // column when no direction is set.
  grow: { flex: '1 1 0%', minWidth: '0px' },
  grow2: { flex: '2 1 0%', minWidth: '0px' },
  center: { alignItems: 'center', justifyContent: 'center' },
  'items-center': { alignItems: 'center' },
  'items-start': { alignItems: 'flex-start' },
  'items-end': { alignItems: 'flex-end' },
  between: { justifyContent: 'space-between' },
  'justify-center': { justifyContent: 'center' },
  'justify-end': { justifyContent: 'flex-end' },
  wrap: { flexWrap: 'wrap' },
  'gap-xs': { gap: '8px' },
  'gap-sm': { gap: '16px' },
  'gap-md': { gap: '28px' },
  'gap-lg': { gap: '44px' },
  'full-h': { height: '100%' },
  'full-w': { width: '100%' },
  'flex-1': { flex: '1 1 0%' },
  'mt-auto': { marginTop: 'auto' },

  // --- spacing -----------------------------------------------------------
  'mt-sm': { marginTop: '12px' },
  'mt-md': { marginTop: '24px' },
  'mt-lg': { marginTop: '40px' },
  'mb-sm': { marginBottom: '12px' },
  'mb-md': { marginBottom: '24px' },
  'mb-lg': { marginBottom: '40px' },

  // --- typography --------------------------------------------------------
  eyebrow: {
    color: BRAND.indigo,
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  title: { fontSize: '68px', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-1px' },
  h1: { fontSize: '48px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px' },
  h2: { fontSize: '36px', fontWeight: 700, lineHeight: 1.15 },
  h3: { fontSize: '28px', fontWeight: 700, lineHeight: 1.2 },
  lead: { fontSize: '28px', fontWeight: 400, lineHeight: 1.4, color: BRAND.body },
  body: { fontSize: '24px', fontWeight: 400, lineHeight: 1.4, color: BRAND.body },
  small: { fontSize: '20px', fontWeight: 400, lineHeight: 1.4, color: BRAND.muted },
  bold: { fontWeight: 700 },
  'text-white': { color: BRAND.white },
  'text-indigo': { color: BRAND.indigo },
  'text-ink': { color: BRAND.ink },
  'text-muted': { color: BRAND.muted },
  'text-soft': { color: 'rgba(255,255,255,0.82)' },
  'text-center': { textAlign: 'center' },

  // --- decorative --------------------------------------------------------
  'accent-bar': {
    display: 'flex',
    width: '72px',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: BRAND.indigo,
  },
  'accent-bar-white': { backgroundColor: BRAND.white },

  // --- bullets -----------------------------------------------------------
  bullets: { display: 'flex', flexDirection: 'column', gap: '20px' },
  bullet: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    fontSize: '26px',
    lineHeight: 1.35,
    color: BRAND.body,
  },
  dot: {
    display: 'flex',
    width: '12px',
    height: '12px',
    borderRadius: '999px',
    backgroundColor: BRAND.indigo,
    marginTop: '11px',
    marginRight: '18px',
    flexShrink: 0,
  },
  'dot-white': { backgroundColor: BRAND.white },

  // --- cards / surfaces --------------------------------------------------
  card: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BRAND.soft,
    borderRadius: '20px',
    padding: '32px',
  },
  'card-outline': {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BRAND.white,
    border: `1px solid ${BRAND.line}`,
    borderRadius: '20px',
    padding: '32px',
  },
  'card-indigo': {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BRAND.indigo,
    color: BRAND.white,
    borderRadius: '20px',
    padding: '32px',
  },
  'card-soft-indigo': {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BRAND.indigoSoft,
    borderRadius: '20px',
    padding: '32px',
  },

  // --- stats -------------------------------------------------------------
  stat: { fontSize: '96px', fontWeight: 700, lineHeight: 1, color: BRAND.indigo, letterSpacing: '-2px' },
  'stat-label': { fontSize: '24px', fontWeight: 400, color: BRAND.muted, marginTop: '8px' },

  // --- pills / badges ----------------------------------------------------
  pill: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: BRAND.indigoSoft,
    color: BRAND.indigoDarker,
    padding: '8px 20px',
    borderRadius: '999px',
    fontSize: '20px',
    fontWeight: 700,
  },
  'pill-white': { backgroundColor: 'rgba(255,255,255,0.18)', color: BRAND.white },

  // --- footer ------------------------------------------------------------
  footer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '24px',
    fontSize: '18px',
    color: BRAND.faint,
  },

  // --- charts ------------------------------------------------------------
  'chart-frame': {
    display: 'flex',
    width: '100%',
    height: '360px',
    backgroundColor: BRAND.white,
    borderRadius: '16px',
    overflow: 'hidden',
  },
  chart: { display: 'flex', width: '100%', height: '100%', objectFit: 'contain' },
};
