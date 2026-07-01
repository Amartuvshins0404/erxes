import type { ChartSpec, ChartType } from './types';

// Plugin-local copy of erxes-ui's chart-viz adapter — see ./README-WHY-LOCAL.md.
// Mirror of frontend/libs/erxes-ui/src/modules/charts/utils/legacyChartViz.ts.
//
// Adapter for the in-chat chart payload — the ```chart-viz``` block. The modern
// path is the render-chart tool (a chart artifact), but two cases still produce
// these text blocks: historical messages, AND live turns where the model
// declines to call the tool and dumps the chart as JSON in its reply instead
// (some models, e.g. coding-tuned ones, do this regardless of the instruction).
// Convert them to a ChartSpec so they render through the same ECharts surface.

const LEGACY_TYPES: ChartType[] = [
  'bar',
  'horizontalBar',
  'line',
  'area',
  'stackedBar',
  'pie',
  'donut',
  'radar',
  'combo',
  'scatter',
];

export function legacyPayloadToChartSpec(raw: unknown): ChartSpec | null {
  const payload = raw as
    | {
        chartType?: unknown;
        title?: unknown;
        description?: unknown;
        series?: unknown;
        data?: unknown;
        stacked?: unknown;
        horizontal?: unknown;
        xAxisLabel?: unknown;
        yAxisLabel?: unknown;
      }
    | null
    | undefined;

  if (!payload || !Array.isArray(payload.series) || !Array.isArray(payload.data)) {
    return null;
  }

  const chartType = LEGACY_TYPES.includes(payload.chartType as ChartType)
    ? (payload.chartType as ChartType)
    : 'bar';

  const series = payload.series
    .filter(
      (s): s is { key: string; label?: string; color?: string } =>
        !!s && typeof (s as { key?: unknown }).key === 'string',
    )
    .map((s) => ({
      key: s.key,
      label: typeof s.label === 'string' ? s.label : s.key,
      color: typeof s.color === 'string' ? s.color : undefined,
    }));

  if (!series.length) return null;

  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const bool = (v: unknown) => (typeof v === 'boolean' ? v : undefined);

  return {
    chartType,
    title: str(payload.title) ?? 'Chart',
    description: str(payload.description),
    series,
    data: payload.data as ChartSpec['data'],
    stacked: bool(payload.stacked),
    horizontal: bool(payload.horizontal),
    xAxisLabel: str(payload.xAxisLabel),
    yAxisLabel: str(payload.yAxisLabel),
  };
}

/**
 * Pull EVERY chart payload out of a fenced block's text and convert each to a
 * ChartSpec. A model that dumps charts as text may emit a single object, a JSON
 * array, or several objects run together (separated by newlines/commas/stray
 * punctuation) — the last breaks a naive `JSON.parse` of the whole block, which
 * is exactly why such blocks rendered as raw code. We parse defensively and
 * return every valid spec, so each one renders as a chart.
 */
export function parseChartViz(code: string): ChartSpec[] {
  const text = (code || '').trim();
  if (!text) return [];

  const raws: unknown[] = [];
  const whole = tryParseJson(text);
  if (Array.isArray(whole)) {
    raws.push(...whole);
  } else if (whole && typeof whole === 'object') {
    raws.push(whole);
  } else {
    for (const span of extractTopLevelObjects(text)) {
      const obj = tryParseJson(span);
      if (obj) raws.push(obj);
    }
  }

  return raws
    .map(legacyPayloadToChartSpec)
    .filter((s): s is ChartSpec => !!s);
}

function tryParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Extract each balanced top-level {...} object, ignoring braces inside strings,
// so concatenated objects (and any junk between them) are each recovered.
function extractTopLevelObjects(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0 && --depth === 0 && start >= 0) {
        out.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}
