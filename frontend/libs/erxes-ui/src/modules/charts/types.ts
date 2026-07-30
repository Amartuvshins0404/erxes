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

export interface ChartSpec {
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
