// Pure logic for the AI-declared chart controls — the adaptive slider/toggle
// panel rendered under a chart artifact (ChartArtifactView). The agent's
// render-chart tool opts into controls per chart via `spec.controls`; this
// module resolves those declarations against the actual data (dropping any
// that can't mount) and applies their values as *local* filters. The spec the
// agent produced is never mutated and moving a control never re-invokes the
// AI — a narrowed copy is derived for display.
import type {
  ChartControl,
  ChartDataPoint,
  ChartSpec,
} from '~/modules/chat/charts';
import { compileFormula, type FormulaScope } from '~/modules/chat/lib/chartFormula';

export type ChartControlValue = number | [number, number] | boolean;

interface ResolvedBase {
  /** `${type}:${field}` — stable store key for the control's value. */
  id: string;
  field: string;
  label: string;
}

/** Dual-thumb window over the data rows; bounds are row indices. */
export interface RangeControl extends ResolvedBase {
  type: 'range';
  min: number;
  max: number;
  step: number;
  defaultValue: [number, number];
}

/** Single-thumb slider over a value domain — a minimum-value threshold
    ('slider') or a what-if formula variable ('param'). Same UI, different
    application: slider filters rows, param re-evaluates formulas. */
export interface NumberControl extends ResolvedBase {
  type: 'slider' | 'param';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

/** Show/hide one series. */
export interface ToggleControl extends ResolvedBase {
  type: 'toggle';
  defaultValue: boolean;
}

/** A declared control validated against the spec and given concrete bounds. */
export type ResolvedChartControl = RangeControl | NumberControl | ToggleControl;

/**
 * Charts drawn on a continuous value x-axis. Their range control windows the
 * axis via ECharts' native dataZoom action (see ChartArtifactView) instead of
 * slicing rows, so applyChartControls leaves their rows alone.
 */
export const hasContinuousXAxis = (spec: ChartSpec): boolean =>
  spec.chartType === 'scatter';

const numericMax = (rows: ChartDataPoint[], field: string): number | null => {
  let max: number | null = null;
  for (const row of rows) {
    const v = row[field];
    if (typeof v === 'number' && Number.isFinite(v)) {
      if (max === null || v > max) max = v;
    }
  }
  return max;
};

const declaredNumber = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const specFormulas = (spec: ChartSpec): Record<string, string> =>
  spec.formulas && typeof spec.formulas === 'object' ? spec.formulas : {};

/**
 * Resolve `spec.controls` into mountable controls. Declarations that don't fit
 * the data are dropped (unknown type, missing series key, nothing to filter),
 * so a chart with a bad control is still a good chart. Empty/absent controls
 * resolve to [] — the chart then renders alone.
 */
export const resolveChartControls = (
  spec: ChartSpec,
): ResolvedChartControl[] => {
  const declared = Array.isArray(spec.controls) ? spec.controls : [];
  if (!declared.length) return [];

  const seriesLabel = new Map(spec.series.map((s) => [s.key, s.label || s.key]));
  const lastIndex = spec.data.length - 1;
  const seen = new Set<string>();
  const resolved: ResolvedChartControl[] = [];
  const push = (ctl: ResolvedChartControl) => {
    resolved.push(ctl);
    seen.add(ctl.id);
  };

  for (const c of declared as ChartControl[]) {
    if (resolved.length >= 4) break;
    if (!c || typeof c !== 'object') continue;
    const field = String(c.field ?? '');
    const id = `${c.type}:${c.type === 'range' ? 'label' : field}`;
    if (seen.has(id)) continue;

    if (c.type === 'range') {
      // Dual-thumb window over the data rows (time/date/category axis).
      if (lastIndex < 1) continue;
      push({
        id,
        type: 'range',
        field: 'label',
        label: c.label || spec.xAxisLabel || 'Range',
        min: 0,
        max: lastIndex,
        step: 1,
        defaultValue: [0, lastIndex],
      });
    } else if (c.type === 'slider') {
      // Single-thumb minimum-value threshold on one numeric field.
      const dataMax = numericMax(spec.data, field);
      if (dataMax === null) continue;
      const min = declaredNumber(c.min) ?? 0;
      const declaredMax = declaredNumber(c.max);
      const max = declaredMax !== undefined && declaredMax > min ? declaredMax : dataMax;
      if (max <= min) continue;
      const step = declaredNumber(c.step);
      push({
        id,
        type: 'slider',
        field,
        label: c.label || `Min ${seriesLabel.get(field) ?? field}`,
        min,
        max,
        step: step !== undefined && step > 0 ? step : (max - min) / 100,
        defaultValue: min,
      });
    } else if (c.type === 'toggle') {
      // Show/hide one series — pointless (and chart-emptying) with only one.
      if (!seriesLabel.has(field) || spec.series.length < 2) continue;
      push({
        id,
        type: 'toggle',
        field,
        label: c.label || seriesLabel.get(field) || field,
        defaultValue: true,
      });
    } else if (c.type === 'param') {
      // What-if variable slider — only meaningful with at least one
      // compilable formula to feed.
      const hasFormula = Object.entries(specFormulas(spec)).some(
        ([key, expr]) =>
          spec.series.some((s) => s.key === key) &&
          typeof expr === 'string' &&
          compileFormula(expr) !== null,
      );
      const min = declaredNumber(c.min) ?? 0;
      // A param has no data to anchor a fallback domain — without an explicit
      // max there is nothing principled to slide over, so the control is
      // dropped (the backend sanitizer enforces the same rule).
      const max = declaredNumber(c.max);
      if (!hasFormula || !field || max === undefined || max <= min) continue;
      const fallback = declaredNumber(c.default);
      const step = declaredNumber(c.step);
      push({
        id,
        type: 'param',
        field,
        label: c.label || field,
        min,
        max,
        step: step !== undefined && step > 0 ? step : (max - min) / 100,
        defaultValue:
          fallback !== undefined ? Math.max(min, Math.min(fallback, max)) : min,
      });
    }
  }
  return resolved;
};

/** The value type a given control branch carries. */
export type ControlValueOf<C extends ResolvedChartControl> =
  C extends RangeControl
    ? [number, number]
    : C extends ToggleControl
      ? boolean
      : number;

/** Coerce a stored value into the control's domain (or its default). */
export const clampControlValue = <C extends ResolvedChartControl>(
  control: C,
  value: ChartControlValue | undefined,
): ControlValueOf<C> => {
  const clamped = ((): ChartControlValue => {
    if (control.type === 'toggle') {
      return typeof value === 'boolean' ? value : control.defaultValue;
    }
    if (control.type === 'range') {
      if (!Array.isArray(value)) return control.defaultValue;
      const a = Math.max(control.min, Math.min(value[0], control.max));
      const b = Math.min(control.max, Math.max(value[1], a));
      return [a, b];
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return control.defaultValue;
    }
    return Math.max(control.min, Math.min(value, control.max));
  })();
  // The runtime branches above track ControlValueOf exactly; TS can't follow a
  // conditional return type through narrowing, hence the one contained cast.
  return clamped as ControlValueOf<C>;
};

/**
 * The spec narrowed by the current control values, applied in a fixed order:
 * param formulas first (they rewrite values), then the range window (its
 * indices refer to the original rows), then threshold sliders, then series
 * toggles. Returns the input spec object itself when nothing is filtered, so
 * EChart's content signature sees no change at all.
 */
export const applyChartControls = (
  spec: ChartSpec,
  controls: ResolvedChartControl[],
  values: Record<string, ChartControlValue> | undefined,
): ChartSpec => {
  if (!controls.length) return spec;

  let data = spec.data;
  let series = spec.series;

  // What-if params → re-evaluate the formula-driven series per row. Only when
  // some param left its default: the untouched chart always shows exactly the
  // numbers the agent delivered, even if its formula disagrees slightly.
  const params = controls.filter((rc): rc is NumberControl => rc.type === 'param');
  if (
    params.length &&
    params.some((rc) => clampControlValue(rc, values?.[rc.id]) !== rc.defaultValue)
  ) {
    const scope: FormulaScope = {};
    for (const rc of params) scope[rc.field] = clampControlValue(rc, values?.[rc.id]);
    const compiled = Object.entries(specFormulas(spec))
      .map(([key, expr]) => ({ key, fn: compileFormula(expr) }))
      .filter((f): f is { key: string; fn: NonNullable<typeof f.fn> } => f.fn !== null);
    if (compiled.length) {
      // A row where EVERY formula returns a non-finite value is dropped — the
      // documented way for a duration param to genuinely shorten the window
      // ("if(label > years, 0/0, …)") instead of drawing a flat tail.
      const recomputed: ChartDataPoint[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const labelNum = Number(row['label']);
        const rowScope: FormulaScope = {
          ...scope,
          x: i,
          label: Number.isFinite(labelNum) ? labelNum : i,
        };
        const next: ChartDataPoint = { ...row };
        let anyFinite = false;
        for (const { key, fn } of compiled) {
          const v = fn(rowScope);
          if (Number.isFinite(v)) {
            next[key] = v;
            anyFinite = true;
          }
        }
        if (anyFinite) recomputed.push(next);
      }
      // Safety net: a broken formula (e.g. an unknown variable NaN-ing every
      // row) must degrade to the delivered data, not an empty chart.
      if (recomputed.length) data = recomputed;
    }
  }

  const range = controls.find((rc): rc is RangeControl => rc.type === 'range');
  if (range && !hasContinuousXAxis(spec)) {
    const [a, b] = clampControlValue(range, values?.[range.id]);
    if (a > 0 || b < spec.data.length - 1) data = data.slice(a, b + 1);
  }

  for (const rc of controls) {
    if (rc.type !== 'slider') continue;
    const threshold = clampControlValue(rc, values?.[rc.id]);
    if (threshold <= rc.min) continue;
    data = data.filter((row) => {
      const v = row[rc.field];
      return typeof v === 'number' && v >= threshold;
    });
  }

  for (const rc of controls) {
    if (rc.type !== 'toggle') continue;
    if (clampControlValue(rc, values?.[rc.id]) === false) {
      series = series.filter((s) => s.key !== rc.field);
    }
  }
  // All series toggled off → keep the series (so the converter and legend stay
  // valid) but show no rows. An empty plot honestly reflects "everything
  // hidden"; silently ignoring the toggles just looks broken.
  if (!series.length) {
    series = spec.series;
    data = [];
  }

  if (data === spec.data && series === spec.series) return spec;
  return { ...spec, data, series };
};

/** The category/x label of a data row (the converter reads the same key). */
export const rowLabel = (row: ChartDataPoint | undefined): string =>
  String(row?.['label'] ?? '');
