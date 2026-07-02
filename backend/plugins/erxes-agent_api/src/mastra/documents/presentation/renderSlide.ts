import * as fs from 'node:fs';
import satori, { init as initSatoriYoga } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';
import { Resvg } from '@resvg/resvg-js';
import { renderChartPngDataUrl } from '~/mastra/charts/renderPng';
import type { DocumentChartRef } from '~/mastra/documents/markdown';
import {
  BRAND,
  CLASS_STYLES,
  getFonts,
  RENDER_SCALE,
  SLIDE_H,
  SLIDE_W,
  type Style,
} from './theme';

// ---------------------------------------------------------------------------
// One slide of branded HTML -> PNG, browser-free:
//
//   slide HTML (house vocabulary)
//     -> chart refs (<img src="chart:ID"> / ![](chart:ID)) swapped for PNG data URLs
//     -> parseHtml: a small, tolerant HTML -> Satori-VDOM parser
//     -> house classes resolved to inline styles + display normalised
//     -> satori (HTML/CSS -> SVG, real flexbox via yoga)
//     -> @resvg/resvg-js -> PNG buffer @2x
//
// Satori ignores external/`<style>` CSS, so theme.ts ships the house classes as
// a class -> inline-style map and we resolve them here before rendering.
//
// We parse the HTML in-house (rather than via satori-html) because satori-html
// is ESM-only and its transitive `ultrahtml/transformers/inline` default-import
// breaks under the repo's CommonJS Jest transform. The slide vocabulary is a
// small, well-formed subset, so a compact tolerant parser is both reliable and
// dependency-light, and it emits the exact { type, props } shape Satori wants.
//
// We use satori/wasm + an explicitly-initialised yoga instance (loaded from the
// bundled yoga.wasm bytes) instead of the default `satori` entry. The default
// entry lazily `import()`s yoga, which works at runtime but breaks under Jest's
// CommonJS VM ("dynamic import callback without --experimental-vm-modules").
// Loading the wasm bytes ourselves keeps the render synchronous-to-init and
// works identically in dev, the compiled build, and the test runner.
// ---------------------------------------------------------------------------

interface VProps {
  style?: Style;
  class?: string;
  className?: string;
  children?: unknown;
  src?: string;
  [k: string]: unknown;
}
interface VElement {
  type: string;
  props: VProps;
}

const CHART_MD = /!\[[^\]]*\]\(\s*chart:([a-zA-Z0-9_-]+)\s*\)/g;
// Scoped to an <img src> attribute only — a bare `chart:ID` in slide *text*
// must not be rewritten into a giant data URL inside a text node.
const CHART_IMG_SRC = /(\bsrc\s*=\s*)(["'])chart:([a-zA-Z0-9_-]+)\2/gi;

/** Replace every chart reference in the raw HTML with the chart's PNG data URL.
 * Markdown image refs become a framed <img>; unknown ids resolve to an empty
 * src so resolveNode drops the img. Substitution is scoped to image/markdown-
 * image contexts so literal `chart:ID` in slide text is left untouched. */
function substituteCharts(rawHtml: string, charts: DocumentChartRef[]): string {
  const urlById = new Map<string, string>();
  for (const c of charts) {
    if (!urlById.has(c.id)) urlById.set(c.id, renderChartPngDataUrl(c.spec));
  }
  return rawHtml
    .replace(CHART_MD, (_m, id: string) => {
      const url = urlById.get(id);
      return url
        ? `<div class="chart-frame"><img class="chart" src="${url}" /></div>`
        : '';
    })
    .replace(CHART_IMG_SRC, (_m, pre: string, q: string, id: string) => {
      const url = urlById.get(id);
      return url ? `${pre}${q}${url}${q}` : `${pre}${q}${q}`;
    });
}

/** Strip markup Satori can't use and that could inject noise. */
function sanitizeHtml(rawHtml: string): string {
  return (rawHtml || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(script|style|link|meta|head)[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|link|meta)[^>]*\/?>/gi, '')
    .trim();
}

// HTML elements that never have children / closing tags.
const VOID_TAGS = new Set([
  'img',
  'br',
  'hr',
  'input',
  'meta',
  'link',
  'source',
  'wbr',
  'col',
]);

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#34': '"',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#?[a-zA-Z0-9]+);/g, (m, name: string) => {
    if (name in ENTITIES) return ENTITIES[name];
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X'
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return m;
  });
}

const camel = (k: string) =>
  k.trim().replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

// CSS that can make Satori fetch a remote resource server-side (SSRF). Any
// declaration whose value contains url(...) is dropped, and these fetch-capable
// properties are blocked outright, so the inline-style path can never reach the
// network — charts already arrive inlined as data: URLs via substituteCharts.
const STYLE_FETCH_PROPS = new Set([
  'background',
  'backgroundImage',
  'mask',
  'maskImage',
  'borderImage',
  'borderImageSource',
  'src',
  'content',
  'cursor',
  'listStyleImage',
  'filter',
]);
const isFetchingDecl = (key: string, val: string): boolean =>
  STYLE_FETCH_PROPS.has(key) || /url\s*\(/i.test(val);

const ATTR_RE =
  /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

function parseAttrs(raw: string): VProps {
  const props: VProps = {};
  if (!raw) return props;
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(raw)) !== null) {
    const name = m[1];
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    if (name === 'style') {
      const style: Style = {};
      for (const decl of value.split(';')) {
        const idx = decl.indexOf(':');
        if (idx === -1) continue;
        const key = camel(decl.slice(0, idx).trim());
        const val = decl.slice(idx + 1).trim();
        if (key && val && !isFetchingDecl(key, val)) style[key] = val;
      }
      props.style = style;
    } else {
      props[name] = decodeEntities(value);
    }
  }
  return props;
}

const TAG_RE = /<(\/)?([a-zA-Z][a-zA-Z0-9-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;

/** Tolerant HTML -> Satori VDOM. Returns a single root element that wraps every
 * top-level node; unknown/void tags and stray text are handled gracefully. */
function parseHtml(input: string): VElement {
  const root: VElement = { type: 'div', props: { children: [] } };
  const stack: VElement[] = [root];
  const push = (node: unknown) => {
    const top = stack[stack.length - 1];
    (top.props.children as unknown[]).push(node);
  };

  let last = 0;
  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(input)) !== null) {
    const text = input.slice(last, m.index);
    if (text) {
      const decoded = decodeEntities(text).replace(/\s+/g, ' ');
      if (decoded.trim()) push(decoded);
    }
    last = TAG_RE.lastIndex;

    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const selfClose = m[4] === '/' || VOID_TAGS.has(tag);

    if (closing) {
      // Pop to the matching open tag if present; ignore stray closes.
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].type === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const node: VElement = {
      type: tag,
      props: { ...parseAttrs(m[3]), children: [] },
    };
    push(node);
    if (!selfClose) stack.push(node);
  }

  const tail = input.slice(last);
  if (tail) {
    const decoded = decodeEntities(tail).replace(/\s+/g, ' ');
    if (decoded.trim()) push(decoded);
  }
  return root;
}

function isElement(node: unknown): node is VElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    typeof (node as VElement).type === 'string' &&
    typeof (node as VElement).props === 'object'
  );
}

function classStyle(classes: string | undefined): Style {
  const out: Style = {};
  if (!classes) return out;
  for (const token of classes.split(/\s+/)) {
    const s = CLASS_STYLES[token];
    if (s) Object.assign(out, s);
  }
  return out;
}

/** Resolve house classes to inline styles and make the tree Satori-safe. */
function resolveNode(node: unknown): unknown {
  if (!isElement(node)) {
    // Primitive text/number children pass through; nullish is dropped upstream.
    return node;
  }
  const props = node.props || {};
  const classes = (props.class ?? props.className) as string | undefined;
  // Class styles first, inline `style` wins on conflicting keys.
  const merged: Style = { ...classStyle(classes), ...(props.style || {}) };
  delete props.class;
  delete props.className;

  const rawChildren = props.children;
  const childList = Array.isArray(rawChildren)
    ? rawChildren
    : rawChildren == null
      ? []
      : [rawChildren];
  const resolved = childList.map(resolveNode).filter((c) => c != null && c !== '');
  const hasElementChild = resolved.some((c) => isElement(c));

  // Satori requires an explicit display on any node with multiple children;
  // default such containers to a vertical flexbox (the common slide layout).
  if (merged.display == null && (resolved.length > 1 || hasElementChild)) {
    merged.display = 'flex';
    if (merged.flexDirection == null) merged.flexDirection = 'column';
  }

  if (node.type === 'img') {
    // Allow ONLY data: URLs. Charts arrive inlined as data: via substituteCharts;
    // a remote http(s) src would make Satori fetch it server-side, bypassing the
    // repo's safeFetch SSRF guard. Drop anything that isn't a data: URL (also
    // drops unresolved chart:ID / empty src — Satori throws on a missing source).
    const src = typeof props.src === 'string' ? props.src : '';
    if (!src.startsWith('data:')) return null;
    if (merged.display == null) merged.display = 'flex';
    if (merged.width == null) merged.width = '100%';
    if (merged.height == null) merged.height = '100%';
  }

  props.style = merged;
  // Satori exempts a node from the explicit-display rule only when its children
  // is a bare string (not a single-element array), so collapse a lone text
  // child the way satori-html does. An empty container must drop to undefined —
  // satori rejects a bare `children: []` on a node without explicit display.
  props.children =
    resolved.length === 0
      ? undefined
      : resolved.length === 1 && typeof resolved[0] === 'string'
        ? resolved[0]
        : resolved;
  return node;
}

/** Guarantee the root fills the 16:9 canvas with a sane on-brand default. */
function normaliseRoot(node: unknown): VElement {
  const root = isElement(node)
    ? node
    : { type: 'div', props: { children: node } as VProps };
  const style = (root.props.style = root.props.style || {});
  if (style.display == null) style.display = 'flex';
  if (style.flexDirection == null) style.flexDirection = 'column';
  if (style.width == null) style.width = `${SLIDE_W}px`;
  if (style.height == null) style.height = `${SLIDE_H}px`;
  if (style.backgroundColor == null) style.backgroundColor = BRAND.white;
  if (style.fontFamily == null) style.fontFamily = 'Noto Sans';
  if (style.color == null) style.color = BRAND.ink;
  return root;
}

// Initialise Satori's yoga layout engine once, from the bundled wasm bytes.
let yogaReady: Promise<void> | null = null;
function ensureYoga(): Promise<void> {
  if (!yogaReady) {
    yogaReady = (async () => {
      const wasm = fs.readFileSync(require.resolve('yoga-wasm-web/dist/yoga.wasm'));
      const yoga = await initYoga(wasm);
      initSatoriYoga(yoga);
    })().catch((err) => {
      // Don't cache a rejected promise — a transient FS/init failure would
      // otherwise wedge every later render. Reset so the next call retries.
      yogaReady = null;
      throw err;
    });
  }
  return yogaReady;
}

/** Render one slide's HTML to a PNG Buffer at RENDER_SCALE. */
export async function renderSlidePng(
  slideHtml: string,
  charts: DocumentChartRef[] = [],
): Promise<Buffer> {
  await ensureYoga();
  const prepared = sanitizeHtml(substituteCharts(slideHtml, charts));
  const tree = parseHtml(prepared || '<div></div>');
  const root = normaliseRoot(resolveNode(tree));

  const svg = await satori(root as unknown as Parameters<typeof satori>[0], {
    width: SLIDE_W,
    height: SLIDE_H,
    fonts: getFonts(),
    embedFont: true,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: SLIDE_W * RENDER_SCALE },
    background: BRAND.white,
    font: { loadSystemFonts: false },
  });
  return Buffer.from(resvg.render().asPng());
}
