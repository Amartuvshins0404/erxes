import pptxgen from 'pptxgenjs';
import { renderChartPngDataUrl } from '~/mastra/charts/renderPng';
import type { DocumentChartRef } from '~/mastra/documents/markdown';

// ---------------------------------------------------------------------------
// PPTX generation. The agent authors the deck as Markdown (same authoring model
// as the PDF/DOCX tools); we split it into slides and build a .pptx with
// pptxgenjs. Charts referenced as ![Alt](chart:ID) are rendered to PNG (the same
// renderChartPngDataUrl path the PDF/DOCX renderers use) and dropped onto the
// slide, so a chart looks identical in chat and in the deck.
//
// Slide boundaries (first match wins):
//   1. a line that is exactly `---` (thematic break) between slides, else
//   2. each top-level `#`/`##` heading starts a new slide, else
//   3. the whole document is one slide.
// ---------------------------------------------------------------------------

// 16:9 widescreen (13.33 x 7.5in) — the modern default.
const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const MARGIN = 0.6;

interface Bullet {
  text: string;
  level: number;
}

interface SlideModel {
  title?: string;
  bullets: Bullet[];
  chartIds: string[];
}

const CHART_IMG = /!\[[^\]]*\]\(\s*chart:([a-zA-Z0-9_-]+)\s*\)/g;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/;

/** Split the markdown into one string block per slide. */
function splitIntoSlideBlocks(markdown: string): string[] {
  const text = (markdown || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [''];

  // 1. Explicit `---` thematic breaks.
  if (/^\s*---\s*$/m.test(text)) {
    return text
      .split(/^\s*---\s*$/m)
      .map((b) => b.trim())
      .filter(Boolean);
  }

  // 2. Top-level (# / ##) headings as slide starts.
  const lines = text.split('\n');
  const headingStarts = lines.some((l) => /^#{1,2}\s+/.test(l));
  if (headingStarts) {
    const blocks: string[] = [];
    let current: string[] = [];
    for (const line of lines) {
      if (/^#{1,2}\s+/.test(line) && current.length) {
        blocks.push(current.join('\n').trim());
        current = [];
      }
      current.push(line);
    }
    if (current.length) blocks.push(current.join('\n').trim());
    return blocks.filter(Boolean);
  }

  // 3. Single slide.
  return [text];
}

/** Strip inline markdown emphasis/code/link markup down to plain text. */
function plain(text: string): string {
  return text
    .replace(CHART_IMG, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // other images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → label
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .trim();
}

/** Parse one slide block into a title + bullets + referenced chart ids. */
function parseSlideBlock(block: string): SlideModel {
  const model: SlideModel = { bullets: [], chartIds: [] };

  let match: RegExpExecArray | null;
  CHART_IMG.lastIndex = 0;
  while ((match = CHART_IMG.exec(block)) !== null) {
    if (!model.chartIds.includes(match[1])) model.chartIds.push(match[1]);
  }

  for (const raw of block.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (CHART_IMG.test(line) && !plain(line)) {
      CHART_IMG.lastIndex = 0;
      continue; // a standalone chart image line — handled above
    }
    CHART_IMG.lastIndex = 0;

    const heading = line.match(HEADING);
    if (heading) {
      const text = plain(heading[2]);
      if (!model.title) model.title = text;
      else model.bullets.push({ text, level: 0 });
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      const indent = bullet[1].replace(/\t/g, '  ').length;
      const text = plain(bullet[2]);
      if (text) model.bullets.push({ text, level: Math.min(4, Math.floor(indent / 2)) });
      continue;
    }

    const text = plain(line);
    if (text) model.bullets.push({ text, level: 0 });
  }

  if (!model.title && model.bullets.length) {
    // No heading — promote the first line to the slide title.
    model.title = model.bullets.shift()?.text;
  }
  return model;
}

/** Build one slide from its model, rendering any referenced charts to images. */
function buildSlide(
  pptx: pptxgen,
  model: SlideModel,
  chartById: Map<string, DocumentChartRef>,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  if (model.title) {
    slide.addText(model.title, {
      x: MARGIN,
      y: 0.4,
      w: SLIDE_W - MARGIN * 2,
      h: 1,
      fontSize: 28,
      bold: true,
      color: '1F2937',
      align: 'left',
    });
  }

  const charts = model.chartIds
    .map((id) => chartById.get(id))
    .filter((c): c is DocumentChartRef => !!c);

  const bodyTop = model.title ? 1.6 : 0.6;
  const bodyHeight = SLIDE_H - bodyTop - MARGIN;
  // When a chart is present, the bullets take the left half and the chart the right.
  const hasChart = charts.length > 0;
  const bodyWidth = hasChart
    ? (SLIDE_W - MARGIN * 2) * 0.46
    : SLIDE_W - MARGIN * 2;

  if (model.bullets.length) {
    slide.addText(
      model.bullets.map((b) => ({
        text: b.text,
        options: { bullet: { indent: 12 }, indentLevel: b.level, breakLine: true },
      })),
      {
        x: MARGIN,
        y: bodyTop,
        w: bodyWidth,
        h: bodyHeight,
        fontSize: 16,
        color: '374151',
        valign: 'top',
        lineSpacingMultiple: 1.15,
      },
    );
  }

  if (hasChart) {
    // Render the first referenced chart large on the right; stack extras below.
    const imgX = hasChart && model.bullets.length ? SLIDE_W * 0.5 : MARGIN;
    const imgW = hasChart && model.bullets.length ? SLIDE_W * 0.5 - MARGIN : SLIDE_W - MARGIN * 2;
    const each = Math.min(bodyHeight / charts.length, bodyHeight);
    charts.forEach((chart, i) => {
      slide.addImage({
        data: renderChartPngDataUrl(chart.spec),
        x: imgX,
        y: bodyTop + i * each,
        w: imgW,
        h: each - 0.15,
        sizing: { type: 'contain', w: imgW, h: each - 0.15 },
      });
    });
  }
}

/**
 * Render a downloadable .pptx from agent-authored Markdown. Charts referenced as
 * ![Alt](chart:ID) are embedded as images. Returns the .pptx file bytes.
 */
export async function renderPptxDocument(
  title: string,
  markdown: string,
  charts: DocumentChartRef[] = [],
): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // built-in 13.33 x 7.5in (16:9)
  pptx.title = title || 'Presentation';

  const chartById = new Map<string, DocumentChartRef>();
  for (const c of charts) if (!chartById.has(c.id)) chartById.set(c.id, c);

  const blocks = splitIntoSlideBlocks(markdown);
  for (const block of blocks) {
    buildSlide(pptx, parseSlideBlock(block), chartById);
  }

  // 'nodebuffer' yields a Node Buffer in the API runtime.
  return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
}
