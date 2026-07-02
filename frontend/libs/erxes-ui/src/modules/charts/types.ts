// Frontend mirror of the backend ChartSpec
// (backend/plugins/erxes-agent_api/src/mastra/charts/chartSpec.ts). The agent's
// render-chart tool emits this shape inside a chart artifact; the Preview panel
// renders it with ECharts. Keep the field names identical to the backend so the
// same spec produces the same chart in chat and inside generated documents.

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

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
  type?: 'bar' | 'line';
}

export type ChartDataPoint = Record<string, string | number>;

// Shared fields between a top-level chart and a drill-down sub-chart.
interface ChartSpecBase {
  chartType: ChartType;
  title: string;
  description?: string;
  series: ChartSeries[];
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  stacked?: boolean;
  horizontal?: boolean;
}

/** A sub-chart shown when the user drills into a slice or bar. */
export type DrilldownSpec = ChartSpecBase;

// Interactive controls the AI opts into per chart — rendered under the chart
// by consumers that support them (the agent chat) and ignored elsewhere
// (e.g. document rendering). Mirrors chartControlSchema on the backend.
export const CHART_CONTROL_TYPES = ['range', 'slider', 'toggle', 'param'] as const;
export type ChartControlType = (typeof CHART_CONTROL_TYPES)[number];

export interface ChartControl {
  type: ChartControlType;
  field: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  default?: number;
}

export interface ChartSpec extends ChartSpecBase {
  /** Label → sub-chart. Clicking a matching slice/bar navigates into that view. */
  drilldowns?: Record<string, DrilldownSpec>;
  /** Controls to mount under the chart; absent/empty → chart renders alone. */
  controls?: ChartControl[];
  /** Series key → arithmetic expression re-evaluated per row when a `param`
      control moves (variables: param fields, x = row index, label as number). */
  formulas?: Record<string, string>;
}

/** Narrow an unknown value (e.g. a tool result spec) to a ChartSpec. */
export const isChartSpec = (value: unknown): value is ChartSpec => {
  const v = value as ChartSpec | null | undefined;
  return (
    !!v &&
    typeof v === 'object' &&
    typeof v.chartType === 'string' &&
    Array.isArray(v.series) &&
    Array.isArray(v.data)
  );
};
