import * as echarts from 'echarts';
import { Resvg } from '@resvg/resvg-js';
import type { ChartSpec } from './chartSpec';
import { sanitizeChartSpec } from './chartSpec';
import { chartSpecToEChartsOption } from './echartsOption';

// ---------------------------------------------------------------------------
// Server-side chart rendering for embedding in generated documents.
//
//   ChartSpec → ECharts SSR (SVG string, pure JS — no DOM, no canvas)
//             → @resvg/resvg-js → PNG buffer
//
// All three document renderers (PDF/DOCX/XLSX) embed the resulting PNG via a
// data URL, so a chart looks identical to the interactive one in the Preview
// panel (same ChartSpec → same ECharts option).
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 520;

export interface RenderChartPngOptions {
  width?: number;
  height?: number;
  /** Upscale factor for crisper raster output in print. */
  scale?: number;
}

/** Render a chart spec to a PNG buffer. Never throws DOM/runtime noise — it
 * sanitizes first and lets resvg/echarts errors propagate to the caller. */
export function renderChartPng(
  rawSpec: ChartSpec,
  options: RenderChartPngOptions = {},
): Buffer {
  const spec = sanitizeChartSpec(rawSpec);
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const scale = options.scale ?? 2;

  // SSR SVG mode: no browser, no canvas — pure string output.
  const chart = echarts.init(null, undefined, {
    renderer: 'svg',
    ssr: true,
    width,
    height,
  });
  try {
    chart.setOption({
      backgroundColor: '#ffffff',
      animation: false,
      ...chartSpecToEChartsOption(spec),
    });
    const svg = chart.renderToSVGString();

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: Math.round(width * scale) },
      background: '#ffffff',
      font: { loadSystemFonts: true },
    });
    return Buffer.from(resvg.render().asPng());
  } finally {
    chart.dispose();
  }
}

/** Convenience: a `data:image/png;base64,…` URL for embedding in HTML/Office. */
export function renderChartPngDataUrl(
  spec: ChartSpec,
  options?: RenderChartPngOptions,
): string {
  const png = renderChartPng(spec, options);
  return `data:image/png;base64,${png.toString('base64')}`;
}
