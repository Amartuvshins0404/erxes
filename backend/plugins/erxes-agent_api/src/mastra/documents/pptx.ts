import pptxgen from 'pptxgenjs';
import type { DocumentChartRef } from '~/mastra/documents/markdown';
import { renderSlidePng } from './presentation/renderSlide';

// ---------------------------------------------------------------------------
// PPTX generation — designer-quality, on-brand slides rendered SERVER-SIDE with
// no headless browser. Each slide is authored as a self-contained HTML body
// using the house vocabulary (documents/presentation/theme.ts), rasterised to a
// PNG via Satori + resvg (renderSlidePng), and placed full-bleed onto a 16:9
// slide with pptxgenjs (one image per slide). The same slide PNGs are returned
// so the chat can show a Preview + Present mode.
//
// Charts referenced in a slide as <img src="chart:ID"> (or ![](chart:ID)) are
// rendered to PNG through the shared renderChartPngDataUrl path, so a chart
// looks identical in chat and in the deck.
// ---------------------------------------------------------------------------

const MAX_SLIDES = 40;

// LAYOUT_WIDE canvas in inches (16:9). Each slide PNG is placed full-bleed.
const SLIDE_W_IN = 13.33;
const SLIDE_H_IN = 7.5;

export interface PptxSlideInput {
  html: string;
}

export interface PptxRenderResult {
  pptx: Buffer;
  slidePngs: Buffer[];
}

/** Render an on-brand .pptx from agent-authored slide HTML. Returns the deck
 * bytes plus the ordered slide PNGs (for the Preview/Present panel). */
export async function renderPptxDocument(
  title: string,
  slides: PptxSlideInput[],
  charts: DocumentChartRef[] = [],
): Promise<PptxRenderResult> {
  const list = (slides || []).slice(0, MAX_SLIDES);
  if (!list.length) list.push({ html: '<div class="slide"></div>' });

  const slidePngs: Buffer[] = [];
  for (const s of list) {
    slidePngs.push(await renderSlidePng(s?.html ?? '', charts));
  }

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = title || 'Presentation';

  for (const png of slidePngs) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addImage({
      data: `data:image/png;base64,${png.toString('base64')}`,
      x: 0,
      y: 0,
      w: SLIDE_W_IN,
      h: SLIDE_H_IN,
    });
  }

  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return { pptx: buffer, slidePngs };
}
