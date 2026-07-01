import type { ChartSpec, ChartSeries } from './chartSpec';

// ---------------------------------------------------------------------------
// chartSpecToEChartsOption — server-side (PDF/DOCX/XLSX export) option builder.
//
// This is intentionally simpler than the browser version at
// frontend/libs/erxes-ui/src/modules/charts/chartSpecToEChartsOption.ts.
// The browser version adds theme-aware colors, gradients, animations,
// drilldown emphasis, and label rotation that only make sense in a live DOM.
// This version produces clean, static options suited for canvas/PNG rendering
// in a Node.js context. Do NOT try to unify them.
// ---------------------------------------------------------------------------

export type EChartsOption = Record<string, unknown>;

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

const baseOption = (spec: ChartSpec): EChartsOption => ({
  animation: false,
  title: {
    text: spec.title,
    left: 'center',
    top: 10,
    textStyle: { fontSize: 14, fontWeight: 600 },
  },
  tooltip: { trigger: 'item' },
  legend: {
    bottom: 4,
    type: 'scroll',
    icon: 'circle',
    itemHeight: 8,
    itemGap: 16,
    textStyle: { fontSize: 12 },
  },
  grid: { left: 8, right: 16, bottom: 52, top: 56, containLabel: true },
});

const axisLine = { lineStyle: { opacity: 0.25 } };
const axisTick = { show: false };
const splitLine = { lineStyle: { type: 'dashed' as const, opacity: 0.35 } };

const categoryAxis = (spec: ChartSpec) => ({
  type: 'category' as const,
  data: labels(spec),
  name: spec.xAxisLabel,
  nameLocation: 'middle' as const,
  nameGap: 36,
  axisLine,
  axisTick,
  axisLabel: { hideOverlap: true, fontSize: 12 },
});

const valueAxis = (spec: ChartSpec, horizontal: boolean) => ({
  type: 'value' as const,
  name: spec.yAxisLabel,
  nameLocation: 'middle' as const,
  nameRotate: horizontal ? 0 : 90,
  nameGap: horizontal ? 32 : 56,
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine,
  axisLabel: { fontSize: 12 },
});

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
    const color = colorAt(s, index);

    const base = {
      name: s.label,
      id: s.key,
      type: isLine ? 'line' : 'bar',
      data: valuesOf(spec, s.key),
      itemStyle: {
        color,
        borderRadius: isLine
          ? 0
          : horizontal
            ? [0, 6, 6, 0]
            : [6, 6, 0, 0],
      },
    };

    if (isLine) {
      return {
        ...base,
        smooth: true,
        lineStyle: { width: 2.5, color },
        symbol: 'circle',
        symbolSize: 6,
        ...(isArea
          ? { areaStyle: { color, opacity: 0.12 } }
          : {}),
      };
    }

    return {
      ...base,
      barMaxWidth: 64,
      ...(stacked ? { stack: 'total' } : {}),
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
  // A pie/donut reads only the FIRST series — extra series are ignored.
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
        radius: isDonut ? ['42%', '68%'] : '62%',
        center: ['50%', '52%'],
        data,
        label: { formatter: '{b}: {d}%', fontSize: 12 },
        labelLine: { length: 12, length2: 8 },
        emphasis: { scaleSize: 6 },
      },
    ],
  };
}

function radar(spec: ChartSpec): EChartsOption {
  const indicators = spec.data.map((row) => ({
    name: String(row['label'] ?? ''),
  }));
  const series = spec.series.map((s, index) => {
    const color = colorAt(s, index);
    return {
      name: s.label,
      value: valuesOf(spec, s.key),
      itemStyle: { color },
      lineStyle: { color, width: 2 },
      areaStyle: { color, opacity: 0.1 },
    };
  });

  return {
    ...baseOption(spec),
    tooltip: { trigger: 'item' },
    radar: {
      indicator: indicators,
      splitLine: { lineStyle: { opacity: 0.3 } },
      axisLine: { lineStyle: { opacity: 0.25 } },
    },
    series: [{ type: 'radar', data: series }],
  };
}

function scatter(spec: ChartSpec): EChartsOption {
  const series = spec.series.map((s, index) => ({
    name: s.label,
    type: 'scatter',
    symbolSize: 8,
    itemStyle: { color: colorAt(s, index), opacity: 0.85 },
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
      nameGap: 32,
      axisLine,
      axisTick,
      splitLine,
    },
    yAxis: {
      type: 'value',
      name: spec.yAxisLabel,
      nameLocation: 'middle',
      nameRotate: 90,
      nameGap: 56,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine,
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
