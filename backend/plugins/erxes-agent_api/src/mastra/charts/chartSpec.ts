import { z } from 'zod';
import { ExpectedError } from 'erxes-api-shared/utils';

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
  // Deliberately NOT hard-validated against SAFE_KEY: a model that names a key
  // "Customer Support" must not lose the whole chart to schema rejection.
  // sanitizeChartSpec slugifies unsafe keys and remaps rows/controls/formulas.
  key: z
    .string()
    .min(1)
    .max(50)
    .describe(
      'Identifier matching the numeric field on every data row. Prefer a safe ' +
        'identifier (letter first, then letters/digits/_/-).',
    ),
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

// Base fields shared by both a top-level chart and a drill-down sub-chart.
// DrilldownSpec = ChartSpecBase (no drilldowns — one level deep only).
const chartSpecBaseSchema = z.object({
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
  xAxisLabel: z.string().max(80).optional(),
  yAxisLabel: z.string().max(80).optional(),
  stacked: z
    .boolean()
    .optional()
    .describe('Force stacking for bar/area charts.'),
  horizontal: z.boolean().optional().describe('Swap axes (bar charts).'),
});

// A drill-down is exactly a ChartSpec without nested drilldowns.
export const drilldownSpecSchema = chartSpecBaseSchema;

// ── Interactive controls (adaptive per chart) ───────────────────────────────
// Optional UI controls the chat renders directly under the chart. They act
// purely client-side — moving a control never triggers a new tool call — so
// include them only when local exploration adds value.
export const CHART_CONTROL_TYPES = [
  'range',
  'slider',
  'toggle',
  'param',
] as const;
export type ChartControlType = (typeof CHART_CONTROL_TYPES)[number];

// NOTE: keep these describe() strings terse field contracts. The policy —
// when to add controls, the param+formulas calculator pattern, worked
// examples — lives in ONE place: RENDER_CHART_HINT (instructions/routing.ts).
export const chartControlSchema = z.object({
  type: z.enum(CHART_CONTROL_TYPES).describe(
    '"range": dual-thumb window over the data rows. "slider": minimum-value ' +
      'threshold on one numeric series. "toggle": show/hide one series. ' +
      '"param": what-if variable slider driving the top-level `formulas` field.',
  ),
  field: z
    .string()
    .max(50)
    .describe(
      'What the control acts on: "label" (the row axis) for range; a series ' +
        'key for slider/toggle; a variable name (used in `formulas`) for param.',
    ),
  label: z
    .string()
    .max(80)
    .optional()
    .describe('Caption shown beside the control; defaults to the field/series label.'),
  min: z.number().optional().describe('slider/param: lower bound (default 0).'),
  max: z
    .number()
    .optional()
    .describe(
      'slider/param: upper bound (slider default: the largest value in the data; ' +
        'param: required to be > min).',
    ),
  step: z.number().positive().optional().describe('slider/param: step size.'),
  default: z
    .number()
    .optional()
    .describe('param only: the initial value (should reproduce the delivered data).'),
});

export type ChartControl = z.infer<typeof chartControlSchema>;

export const chartSpecSchema = chartSpecBaseSchema.extend({
  drilldowns: z
    .record(z.string(), drilldownSpecSchema)
    .optional()
    .describe(
      'Optional map of data-row label → a sub-chart shown when the user clicks that slice/bar. ' +
        'Use this to add a detail breakdown: e.g. clicking "Engineering" on a department pie ' +
        'opens a bar chart of Frontend/Backend/DevOps headcount.',
    ),
  controls: z
    .array(chartControlSchema)
    .max(4)
    .optional()
    .describe(
      'Optional interactive controls (max 4) rendered under the chart, applied ' +
        'to the delivered data client-side — moving one never re-invokes you. ' +
        'Omit (or pass []) for a simple static read; the chart keeps its ' +
        'interactive legend either way.',
    ),
  formulas: z
    .record(z.string(), z.string().max(300))
    .optional()
    .describe(
      'Series key → arithmetic expression re-evaluated on every data row when ' +
        'a "param" control moves. Variables: each param control\'s `field`, ' +
        'plus x (0-based row index) and label (the row label parsed as a ' +
        'number). Operators + - * / % ^, comparisons < <= > >= == != ' +
        '(yielding 1/0), functions min, max, pow, sqrt, abs, round, floor, ' +
        'ceil, log, exp, if(cond, a, b). Closed-form only (no recursion). A ' +
        'row where EVERY formula returns NaN is hidden — gate with ' +
        '"if(label > years, 0/0, <expr>)" so a duration param shortens the ' +
        'window. Keep `data` filled with values computed at the param ' +
        'defaults; formulas only take over when a param moves.',
    ),
});

export type ChartSeries = z.infer<typeof chartSeriesSchema>;
export type ChartDataPoint = z.infer<typeof chartDataPointSchema>;
export type DrilldownSpec = z.infer<typeof drilldownSpecSchema>;
export type ChartSpec = z.infer<typeof chartSpecSchema>;

// Derive a SAFE_KEY-conformant slug for a model-authored series key, unique
// within `taken`. "Customer Support" → "customer_support"; a key with nothing
// salvageable falls back to "series".
function slugKey(raw: string, taken: Set<string>): string {
  let base = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+$/, '')
    .slice(0, 40);
  if (!base) base = 'series';
  let key = base;
  let n = 2;
  while (taken.has(key)) key = `${base}_${n++}`;
  return key;
}

// Shared sanitizer for both top-level and drill-down specs. Never drops a
// series over its key shape — unsafe keys are slugified and `keyMap` records
// original → safe so the caller can remap controls/formulas that referenced
// the original spelling. Rows are read via the ORIGINAL key and written under
// the safe one.
function sanitizeBase(
  input: DrilldownSpec,
): { spec: DrilldownSpec; keyMap: Map<string, string> } | null {
  const taken = new Set<string>();
  const keyMap = new Map<string, string>();
  const series: DrilldownSpec['series'] = [];
  for (const s of input.series) {
    // Duplicate original keys: first declaration wins — keyMap is keyed by the
    // original spelling, so a second entry would silently rebind the first
    // series' rows to a different slug.
    if (typeof s.key !== 'string' || !s.key.trim() || keyMap.has(s.key)) continue;
    const key =
      SAFE_KEY.test(s.key) && !taken.has(s.key) ? s.key : slugKey(s.key, taken);
    taken.add(key);
    keyMap.set(s.key, key);
    series.push({
      key,
      label: s.label.slice(0, 120),
      color: s.color && SAFE_COLOR.test(s.color.trim()) ? s.color.trim() : undefined,
      type: s.type,
    });
  }
  if (!series.length) return null;

  const data = input.data.slice(0, 200).map((row) => {
    const point: Record<string, string | number> = {
      label: typeof row['label'] === 'string' ? row['label'].slice(0, 200) : '',
    };
    for (const [original, key] of keyMap) {
      const value = Number((row as Record<string, unknown>)[original]);
      point[key] = Number.isFinite(value) ? value : 0;
    }
    return point;
  });

  return {
    spec: {
      chartType: input.chartType,
      title: input.title.slice(0, 200),
      description: input.description?.slice(0, 200),
      series,
      data,
      xAxisLabel: input.xAxisLabel?.slice(0, 80),
      yAxisLabel: input.yAxisLabel?.slice(0, 80),
      stacked: input.stacked,
      horizontal: input.horizontal,
    },
    keyMap,
  };
}

// Keep only controls the frontend can actually mount: a valid type, a valid
// field (range → the row axis; slider/toggle → a surviving series key; param →
// a safe identifier usable as a formula variable), no duplicates, at most 4.
// Invalid entries are dropped silently — a chart with a bad control is still a
// good chart.
function sanitizeControls(
  input: ChartControl[] | undefined,
  spec: DrilldownSpec,
  keyMap: Map<string, string>,
): ChartControl[] {
  if (!input?.length) return [];
  const seriesKeys = new Set(spec.series.map((s) => s.key));
  const seen = new Set<string>();
  const clean: ChartControl[] = [];
  for (const c of input) {
    if (!CHART_CONTROL_TYPES.includes(c.type)) continue;
    // Follow the slug remap so a control declared against the model's original
    // key spelling still lands on the sanitized series.
    const field =
      c.type === 'range' ? 'label' : (keyMap.get(c.field) ?? c.field);
    if (c.type === 'slider' || c.type === 'toggle') {
      if (!seriesKeys.has(field)) continue;
    }
    if (c.type === 'param') {
      if (!SAFE_KEY.test(field)) continue;
      // A param has no data to anchor a fallback domain — an explicit max
      // above min is required or there is nothing principled to slide over.
      const min = typeof c.min === 'number' && Number.isFinite(c.min) ? c.min : 0;
      if (!(typeof c.max === 'number' && Number.isFinite(c.max) && c.max > min)) {
        continue;
      }
    }
    const id = `${c.type}:${field}`;
    if (seen.has(id)) continue;
    seen.add(id);
    clean.push({
      type: c.type,
      field,
      label: c.label?.slice(0, 80),
      min: typeof c.min === 'number' && Number.isFinite(c.min) ? c.min : undefined,
      max: typeof c.max === 'number' && Number.isFinite(c.max) ? c.max : undefined,
      step: typeof c.step === 'number' && c.step > 0 ? c.step : undefined,
      default:
        typeof c.default === 'number' && Number.isFinite(c.default)
          ? c.default
          : undefined,
    });
    if (clean.length >= 4) break;
  }
  return clean;
}

// Keep only formulas that target a surviving series — anything else can never
// render. Expression syntax is validated on the frontend (an uncompilable
// formula simply leaves the delivered values untouched).
function sanitizeFormulas(
  input: Record<string, string> | undefined,
  spec: DrilldownSpec,
  keyMap: Map<string, string>,
): Record<string, string> {
  if (!input) return {};
  const seriesKeys = new Set(spec.series.map((s) => s.key));
  const clean: Record<string, string> = {};
  for (const [key, expr] of Object.entries(input)) {
    const mapped = keyMap.get(key) ?? key;
    if (!seriesKeys.has(mapped) || typeof expr !== 'string') continue;
    const trimmed = expr.trim().slice(0, 300);
    if (trimmed) clean[mapped] = trimmed;
  }
  return clean;
}

/**
 * Normalize a raw/model-authored spec: drop unsafe colors and series with bad
 * keys, clamp strings, coerce every series value on every row to a finite
 * number, keep only mountable controls. Returns a clean ChartSpec ready for
 * both rendering paths. Throws an Error when nothing usable remains.
 */
export function sanitizeChartSpec(input: ChartSpec): ChartSpec {
  const result = sanitizeBase(input);
  if (!result) throw new ExpectedError('Chart has no valid series.');
  const { spec: base, keyMap } = result;

  const drilldowns: ChartSpec['drilldowns'] = {};
  for (const [label, sub] of Object.entries(input.drilldowns ?? {})) {
    const clean = sanitizeBase(sub);
    if (clean) drilldowns[label] = clean.spec;
  }

  const controls = sanitizeControls(input.controls, base, keyMap);
  const formulas = sanitizeFormulas(input.formulas, base, keyMap);
  // Param controls without formulas can't do anything — drop them.
  const usable = Object.keys(formulas).length
    ? controls
    : controls.filter((c) => c.type !== 'param');

  return {
    ...base,
    ...(Object.keys(drilldowns).length ? { drilldowns } : {}),
    ...(usable.length ? { controls: usable } : {}),
    ...(Object.keys(formulas).length ? { formulas } : {}),
  };
}
