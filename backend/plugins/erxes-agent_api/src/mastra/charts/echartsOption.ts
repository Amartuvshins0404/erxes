import type { ChartSpec, ChartSeries } from './chartSpec';

// ---------------------------------------------------------------------------
// chartSpecToEChartsOption — the single mapping from our small ChartSpec to a
// real ECharts `option`. Duplicated verbatim on the frontend
// (frontend/libs/erxes-ui/src/modules/charts/chartSpecToEChartsOption.ts) so a
// chart renders identically in the Preview panel and inside generated files.
// Keep both copies in sync (a shared JSON fixture asserts equality in tests).
// ---------------------------------------------------------------------------

// ECharts options are deeply dynamic; model the return as a plain JSON object
// rather than pulling the full echarts type surface into this module.
export type EChartsOption = Record<string, unknown>;

// Default qualitative palette (used when a series has no explicit color).
const PALETTE = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
  '#0ea5e9',
  '#a3e635',
];

const colorAt = (series: ChartSeries, index: number): string =>
  series.color || PALETTE[index % PALETTE.length];

const labels = (spec: ChartSpec): string[] =>
  spec.data.map((row) => String(row['label'] ?? ''));

const valuesOf = (spec: ChartSpec, key: string): number[] =>
  spec.data.map((row) => {
    const value = Number((row as Record<string, unknown>)[key]);
    return Number.isFinite(value) ? value : 0;
  });

// Title is the chart title only — the (often long) description is shown in the
// Preview header / surrounding document text, never as a subtitle that collides
// with the axis name.
const baseOption = (spec: ChartSpec): EChartsOption => ({
  title: {
    text: spec.title,
    left: 'center',
    top: 6,
    textStyle: { fontSize: 15, fontWeight: 600 },
  },
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, type: 'scroll' },
  grid: { left: 8, right: 24, bottom: 48, top: 48, containLabel: true },
});

const categoryAxis = (spec: ChartSpec) => ({
  type: 'category' as const,
  data: labels(spec),
  name: spec.xAxisLabel,
  nameLocation: 'middle' as const,
  nameGap: 34,
  axisLabel: { hideOverlap: true },
});

// The value-axis name runs along the axis (vertical when on Y) so it never
// overlaps the title; containLabel keeps it inside the grid.
const valueAxis = (spec: ChartSpec, horizontal: boolean) => ({
  type: 'value' as const,
  name: spec.yAxisLabel,
  nameLocation: 'middle' as const,
  nameRotate: horizontal ? 0 : 90,
  nameGap: horizontal ? 28 : 52,
});

// bar / horizontalBar / line / area / stackedBar / combo all share the same
// cartesian skeleton; the per-series styling is what differs.
function cartesian(spec: ChartSpec): EChartsOption {
  const horizontal = spec.chartType === 'horizontalBar' || spec.horizontal;
  const stacked = spec.chartType === 'stackedBar' || spec.stacked;
  const category = categoryAxis(spec);
  const value = valueAxis(spec, !!horizontal);

  const series = spec.series.map((s, index) => {
    const isLine =
      spec.chartType === 'line' ||
      spec.chartType === 'area' ||
      (spec.chartType === 'combo' && s.type === 'line');
    const isArea = spec.chartType === 'area';

    return {
      name: s.label,
      id: s.key,
      type: isLine ? 'line' : 'bar',
      data: valuesOf(spec, s.key),
      itemStyle: { color: colorAt(s, index) },
      ...(isArea ? { areaStyle: {} } : {}),
      ...(isLine ? { smooth: true } : {}),
      ...(stacked && !isLine ? { stack: 'total' } : {}),
    };
  });

  return {
    ...baseOption(spec),
    tooltip: { trigger: 'axis' },
    xAxis: horizontal ? value : category,
    yAxis: horizontal ? category : value,
    series,
  };
}

function pie(spec: ChartSpec): EChartsOption {
  const isDonut = spec.chartType === 'donut';
  // A pie reads the FIRST series across the category labels.
  const key = spec.series[0]?.key;
  const data = spec.data.map((row, index) => ({
    name: String(row['label'] ?? ''),
    value: key ? Number((row as Record<string, unknown>)[key]) || 0 : 0,
    itemStyle: { color: PALETTE[index % PALETTE.length] },
  }));

  return {
    ...baseOption(spec),
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        name: spec.series[0]?.label ?? spec.title,
        radius: isDonut ? ['45%', '70%'] : '65%',
        center: ['50%', '52%'],
        data,
        label: { formatter: '{b}: {d}%' },
      },
    ],
  };
}

function radar(spec: ChartSpec): EChartsOption {
  const indicators = spec.data.map((row) => ({
    name: String(row['label'] ?? ''),
  }));
  const series = spec.series.map((s, index) => ({
    name: s.label,
    value: valuesOf(spec, s.key),
    itemStyle: { color: colorAt(s, index) },
    areaStyle: { opacity: 0.1 },
  }));

  return {
    ...baseOption(spec),
    tooltip: { trigger: 'item' },
    radar: { indicator: indicators },
    series: [{ type: 'radar', data: series }],
  };
}

function scatter(spec: ChartSpec): EChartsOption {
  const series = spec.series.map((s, index) => ({
    name: s.label,
    type: 'scatter',
    itemStyle: { color: colorAt(s, index) },
    // x = row index (or numeric label), y = the series value.
    data: spec.data.map((row, rowIndex) => {
      const rawLabel = Number(row['label']);
      const x = Number.isFinite(rawLabel) ? rawLabel : rowIndex;
      const y = Number((row as Record<string, unknown>)[s.key]) || 0;
      return [x, y];
    }),
  }));

  return {
    ...baseOption(spec),
    tooltip: { trigger: 'item' },
    xAxis: {
      type: 'value',
      name: spec.xAxisLabel,
      nameLocation: 'middle',
      nameGap: 28,
    },
    yAxis: {
      type: 'value',
      name: spec.yAxisLabel,
      nameLocation: 'middle',
      nameRotate: 90,
      nameGap: 52,
    },
    series,
  };
}

export function chartSpecToEChartsOption(spec: ChartSpec): EChartsOption {
  switch (spec.chartType) {
    case 'pie':
    case 'donut':
      return pie(spec);
    case 'radar':
      return radar(spec);
    case 'scatter':
      return scatter(spec);
    case 'bar':
    case 'horizontalBar':
    case 'line':
    case 'area':
    case 'stackedBar':
    case 'combo':
    default:
      return cartesian(spec);
  }
}
