// Plugin-local copy of erxes-ui's ChartSpec contract — see ./README-WHY-LOCAL.md.
// Mirror of frontend/libs/erxes-ui/src/modules/charts/types.ts and the backend
// ChartSpec (backend/plugins/erxes-agent_api/src/mastra/charts/chartSpec.ts).
// Keep field names identical across all three so the same spec produces the
// same chart in chat, the Preview panel, and generated documents.

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

export interface ChartSpec extends ChartSpecBase {
  /** Label → sub-chart. Clicking a matching slice/bar navigates into that view. */
  drilldowns?: Record<string, DrilldownSpec>;
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
