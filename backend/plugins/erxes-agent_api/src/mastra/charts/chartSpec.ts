import { z } from 'zod';

// ---------------------------------------------------------------------------
// ChartSpec — the single, LLM-friendly chart contract.
//
// Both the chat Preview panel (frontend ECharts) and the document renderers
// (backend ECharts SSR → PNG) consume this exact shape, so a chart looks the
// same in chat and inside a generated PDF/DOCX/XLSX. It is intentionally a
// small, sanitized subset — NOT a raw ECharts option — so the model can author
// it reliably. `chartSpecToEChartsOption` turns it into a real ECharts option.
//
// Keep this schema in sync with the frontend mirror at
// frontend/libs/erxes-ui/src/modules/charts/types.ts
// ---------------------------------------------------------------------------

export const CHART_TYPES = [
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
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

// A series key must be a safe identifier (also used as an ECharts series id and,
// on the frontend, a CSS variable name) — start with a letter, ASCII only.
const SAFE_KEY = /^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/;

// Accept the common CSS color forms the UI already validates (hex / rgb / hsl).
const SAFE_COLOR =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\))$/;

export const chartSeriesSchema = z.object({
  key: z
    .string()
    .refine((value) => SAFE_KEY.test(value), {
      message:
        'key must start with a letter and contain only letters, digits, dash or underscore',
    })
    .describe('Identifier matching the numeric field on every data row.'),
  label: z.string().max(120).describe('Human label shown in legend/tooltip.'),
  color: z
    .string()
    .optional()
    .describe('Optional CSS color (#hex, rgb(), or hsl()).'),
  // combo charts only: render this single series as bars or as a line.
  type: z
    .enum(['bar', 'line'])
    .optional()
    .describe('combo charts only: draw this series as "bar" or "line".'),
});

export const chartDataPointSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()]),
);

export const chartSpecSchema = z.object({
  chartType: z.enum(CHART_TYPES).describe('The kind of chart to draw.'),
  title: z.string().max(200).describe('Title shown above the chart.'),
  description: z.string().max(200).optional().describe('Optional subtitle.'),
  series: z
    .array(chartSeriesSchema)
    .min(1)
    .max(12)
    .describe('One entry per data series (line/bar/slice group).'),
  data: z
    .array(chartDataPointSchema)
    .min(1)
    .max(200)
    .describe(
      'Rows. Each row has a "label" string and a numeric value for every series key.',
    ),
  // Optional presentation hints — safe to ignore.
  xAxisLabel: z.string().max(80).optional(),
  yAxisLabel: z.string().max(80).optional(),
  stacked: z
    .boolean()
    .optional()
    .describe('Force stacking for bar/area charts.'),
  horizontal: z.boolean().optional().describe('Swap axes (bar charts).'),
});

export type ChartSeries = z.infer<typeof chartSeriesSchema>;
export type ChartDataPoint = z.infer<typeof chartDataPointSchema>;
export type ChartSpec = z.infer<typeof chartSpecSchema>;

/**
 * Normalize a raw/model-authored spec: drop unsafe colors and series with bad
 * keys, clamp strings, coerce every series value on every row to a finite
 * number. Returns a clean ChartSpec ready for both rendering paths. Throws an
 * ExpectedError-shaped Error when nothing usable remains.
 */
export function sanitizeChartSpec(input: ChartSpec): ChartSpec {
  const series = input.series
    .filter((s) => SAFE_KEY.test(s.key))
    .map((s) => ({
      key: s.key,
      label: s.label.slice(0, 120),
      color: s.color && SAFE_COLOR.test(s.color.trim()) ? s.color.trim() : undefined,
      type: s.type,
    }));

  if (!series.length) {
    throw new Error('Chart has no valid series.');
  }

  const keys = series.map((s) => s.key);
  const data = input.data.slice(0, 200).map((row) => {
    const point: Record<string, string | number> = {
      label: typeof row['label'] === 'string' ? row['label'].slice(0, 200) : '',
    };
    for (const key of keys) {
      const value = Number((row as Record<string, unknown>)[key]);
      point[key] = Number.isFinite(value) ? value : 0;
    }
    return point;
  });

  return {
    chartType: input.chartType,
    title: input.title.slice(0, 200),
    description: input.description?.slice(0, 200),
    series,
    data,
    xAxisLabel: input.xAxisLabel?.slice(0, 80),
    yAxisLabel: input.yAxisLabel?.slice(0, 80),
    stacked: input.stacked,
    horizontal: input.horizontal,
  };
}
