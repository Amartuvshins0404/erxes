// Browser-side ECharts option builder.
// The backend has a parallel version (echartsOption.ts) that intentionally
// omits browser-only features (theme colors, gradients, animations) to keep
// PDF/DOCX export simple. Do not try to unify them.

import type { ChartSpec, ChartSeries } from './types';
import type { ChartThemeColors } from './chartColors';
import { CHART_FONT, chartPalette, fmtChartValue } from './chartColors';

export type { ChartThemeColors };
export type EChartsOption = Record<string, unknown>;

// Passed by EChart when rendering a single-bar-series chart with hidden bars.
// Keeps all hidden-bar concerns (color stability, ghost series, legend state)
// inside the option builder where the series structure is well-known.
export interface SingleBarRenderHints {
  // The full original label list (pre-filter), used for stable palette indices
  // and to populate the complete legend regardless of which bars are hidden.
  allLabels: string[];
  // Labels currently toggled off — ghost series are injected for these so
  // that clicking the grayed legend entry can restore the bar.
  hiddenLabels: Set<string>;
}

const colorAt = (s: ChartSeries, i: number, pal: string[]) =>
  s.color || pal[i % pal.length];

const labels   = (spec: ChartSpec) => spec.data.map((r) => String(r['label'] ?? ''));
const valuesOf = (spec: ChartSpec, key: string) =>
  spec.data.map((r) => {
    const v = Number((r as Record<string, unknown>)[key]);
    return Number.isFinite(v) ? v : 0;
  });

// Hex → gradient stop at reduced opacity (works for our fixed hex palette).
function fade(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex.slice(0, 7) + a;
}

// Vertical (or horizontal) gradient for bar fills.
function barGradient(color: string, horizontal: boolean) {
  return {
    type: 'linear',
    x: horizontal ? 1 : 0, y: 0,
    x2: 0,                  y2: horizontal ? 0 : 1,
    colorStops: [
      { offset: 0, color },
      { offset: 1, color: fade(color, 0.45) },
    ],
  };
}

// Truncates at the last word boundary that leaves room for ' ...' (4 chars).
// Falls back to a hard character-level cut for single words that exceed maxChars.
function truncateLabel(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const words = text.split(/\s+/);
  let out = '';
  for (const word of words) {
    const next = out ? `${out} ${word}` : word;
    if (next.length + 4 > maxChars) break;
    out = next;
  }
  return out ? `${out} ...` : `${text.slice(0, maxChars - 4)} ...`;
}

// Wraps at word boundaries, capped at 2 lines.
// The second line is fed through truncateLabel so overflow is ' ...' not a hard clip.
// A single word longer than maxChars is hard-truncated on line 1.
function wrapLabel(text: string, maxChars: number): string {
  const words = text.split(/\s+/);
  const line1: string[] = [];
  let i = 0;

  for (; i < words.length; i++) {
    const candidate = [...line1, words[i]].join(' ');
    if (candidate.length <= maxChars) {
      line1.push(words[i]);
    } else if (line1.length === 0) {
      line1.push(truncateLabel(words[i], maxChars));
      i++;
      break;
    } else {
      break;
    }
  }

  const firstLine = line1.join(' ');
  if (i >= words.length) return firstLine;
  return `${firstLine}\n${truncateLabel(words.slice(i).join(' '), maxChars)}`;
}

const hasDrilldown = (spec: ChartSpec, label: string) =>
  !!(spec.drilldowns && label in spec.drilldowns);

const drillEmphasis = (color: string, horizontal: boolean) => ({
  shadowBlur: 22,
  shadowColor: fade(color, 0.65),
  shadowOffsetY: horizontal ? 0 : 5,
  shadowOffsetX: horizontal ? 5 : 0,
});

// ── Shared option fragments ───────────────────────────────────────────────────

function legendBase(c: ChartThemeColors) {
  return {
    bottom: 4,
    type: 'scroll' as const,
    icon: 'roundRect',
    itemHeight: 8,
    itemWidth: 14,
    itemGap: 18,
    selectedMode: 'multiple',
    inactiveColor: c.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(100,116,139,0.3)',
    formatter: (name: string) => truncateLabel(name, 20),
    textStyle: { fontSize: 12, color: c.mutedForeground, fontFamily: CHART_FONT },
    pageTextStyle: { color: c.mutedForeground },
    pageIconColor: c.mutedForeground,
  };
}

function tooltipStyle(c: ChartThemeColors) {
  const shadow = c.isDark
    ? '0 8px 32px rgba(0,0,0,0.55)'
    : '0 8px 24px rgba(0,0,0,0.12)';
  const border = c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  return {
    backgroundColor: c.surface,
    borderColor: border,
    borderWidth: 1,
    textStyle: { color: c.foreground, fontSize: 13, fontFamily: CHART_FONT },
    extraCssText: `border-radius:10px;box-shadow:${shadow};padding:10px 14px;`,
  };
}

const baseOption = (spec: ChartSpec, c: ChartThemeColors): EChartsOption => ({
  animation: true,
  animationDuration: 700,
  animationEasing: 'cubicOut',
  animationDelay: (idx: number) => idx * 45,        // stagger bars on load
  animationDurationUpdate: 380,
  animationEasingUpdate: 'cubicInOut',
  animationDelayUpdate: (idx: number) => idx * 18,  // stagger on update
  backgroundColor: 'transparent',
  // Title is intentionally omitted here — it is rendered as an HTML element in
  // EChart.tsx so the grid layout manager always starts below it without guesswork.
  tooltip: {
    trigger: 'item',
    confine: true,
    ...tooltipStyle(c),
  },
  legend: legendBase(c),
  grid: { left: 12, right: 20, bottom: 52, top: 32, containLabel: true },
});

const axisLine  = (c: ChartThemeColors) => ({ lineStyle: { color: c.border, opacity: 0.5 } });
const splitLine = (c: ChartThemeColors) => ({
  lineStyle: { type: 'dashed' as const, color: c.border, opacity: c.isDark ? 0.3 : 0.5 },
});
const axisLabel = (c: ChartThemeColors) => ({
  fontSize: 12,
  color: c.mutedForeground,
  fontFamily: CHART_FONT,
});

const categoryAxis = (spec: ChartSpec, c: ChartThemeColors) => ({
  type: 'category' as const,
  data: labels(spec),
  name: spec.xAxisLabel,
  nameLocation: 'middle' as const,
  nameGap: 36,
  nameTextStyle: { color: c.mutedForeground, fontFamily: CHART_FONT },
  axisLine: axisLine(c),
  axisTick: { show: false },
  axisLabel: { ...axisLabel(c), hideOverlap: true },
});

const valueAxis = (spec: ChartSpec, horizontal: boolean, c: ChartThemeColors) => ({
  type: 'value' as const,
  name: spec.yAxisLabel,
  nameLocation: 'middle' as const,
  nameRotate: horizontal ? 0 : 90,
  nameGap: horizontal ? 32 : 56,
  nameTextStyle: { color: c.mutedForeground, fontFamily: CHART_FONT },
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine: splitLine(c),
  axisLabel: axisLabel(c),
});

// ── Chart builders ────────────────────────────────────────────────────────────

function cartesian(spec: ChartSpec, c: ChartThemeColors, containerWidth = 360, hints?: SingleBarRenderHints): EChartsOption {
  const horizontal = spec.chartType === 'horizontalBar' || !!spec.horizontal;
  const stacked    = spec.chartType === 'stackedBar'    || !!spec.stacked;
  const hasLine    = spec.chartType === 'line' || spec.chartType === 'area' ||
    (spec.chartType === 'combo' && spec.series.some((s) => s.type === 'line'));

  const isSingleSeries = spec.series.length === 1;
  const pal = chartPalette(c.isDark);

  const rawLabels    = labels(spec);  // visible (possibly filtered) labels
  const numPoints    = spec.data.length;
  const longestLabel = Math.max(0, ...rawLabels.map((l) => l.length));

  // Dynamic label sizing — scales with the actual rendered container width so
  // expanding the chart shows more text rather than keeping the same truncation.
  const usableWidth = Math.max(containerWidth - 44, 80); // subtract grid margins

  // Vertical X-axis: each category gets usableWidth/N pixels of horizontal room.
  const pixPerCat   = usableWidth / Math.max(numPoints, 1);
  const vLabelWidth = Math.round(Math.min(Math.max(pixPerCat * 0.85, 50), 92));
  const vMaxChars   = Math.max(6, Math.round(vLabelWidth / 6.5));
  // Use 2-line wrap when there's enough horizontal room; single-line truncate
  // otherwise to avoid two lines each ending in " ...".
  const vUseWrap    = pixPerCat >= 65;

  // Horizontal Y-axis: labels live in a fixed left slice of the container.
  const hLabelWidth = Math.round(Math.min(containerWidth * 0.26, 150));
  const hMaxChars   = Math.max(8, Math.min(Math.round(hLabelWidth / 6.5), 24));

  // Single-series bar/horizontalBar: split every data point into its own ECharts
  // series so the legend renders one toggle per bar rather than one for all bars.
  // barGap:'-100%' makes each series' bar overlap at its category position so the
  // chart still looks like a normal single-series bar chart visually.
  const singleBarSeries = isSingleSeries && !hasLine && !stacked;
  const rawValues = singleBarSeries ? valuesOf(spec, spec.series[0].key) : [];

  // For stacked bars: track which series index is topmost (last non-zero) at each
  // data row so border-radius is applied only to the visible cap. Middle segments
  // must stay square — rounded edges on inner segments create jagged visual artifacts
  // where the gradient bleeds past the segment boundary above it.
  const topSeriesAt: number[] = (!singleBarSeries && stacked)
    ? spec.data.map((row) => {
        let top = -1;
        spec.series.forEach((s, si) => {
          const v = Number((row as Record<string, unknown>)[s.key]);
          if (Number.isFinite(v) && v !== 0) top = si;
        });
        return top;
      })
    : [];

  const series = singleBarSeries
    ? rawLabels.map((rawLabel, barIdx) => {
        // Use the original (unfiltered) palette index so colors stay stable when
        // bars are hidden and the filtered data array is shorter.
        const origIdx = hints ? hints.allLabels.indexOf(rawLabel) : barIdx;
        const color = pal[(origIdx >= 0 ? origIdx : barIdx) % pal.length];

        // null is the canonical ECharts "no data" sentinel (more reliable than '-').
        const data = rawLabels.map((_l, di) => {
          if (di !== barIdx) return null;
          const v = rawValues[di];
          const base = { name: rawLabel, value: v };
          return hasDrilldown(spec, rawLabel)
            ? { ...base, cursor: 'pointer', emphasis: { itemStyle: drillEmphasis(color, horizontal) } }
            : base;
        });

        return {
          name: rawLabel,
          type: 'bar',
          silent: false,
          clip: false,
          data,
          barMaxWidth: 52,
          barGap: '-100%',
          barCategoryGap: '40%',
          itemStyle: {
            color: barGradient(color, horizontal),
            borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
          },
          emphasis: {
            focus: 'none',
            itemStyle: {
              color,
              shadowBlur: 18,
              shadowColor: fade(color, 0.55),
              shadowOffsetY: horizontal ? 0 : 5,
              shadowOffsetX: horizontal ? 5 : 0,
            },
          },
          label: {
            show: horizontal ? numPoints <= 12 : numPoints <= 8,
            position: horizontal ? 'right' : 'top',
            fontSize: 11,
            color: c.mutedForeground,
            fontFamily: CHART_FONT,
            formatter: (p: { value: number | null }) =>
              p.value != null ? fmtChartValue(p.value) : '',
          },
        };
      })
    : spec.series.map((s, index) => {
        const isLine = spec.chartType === 'line' || spec.chartType === 'area' ||
                       (spec.chartType === 'combo' && s.type === 'line');
        const isArea = spec.chartType === 'area';
        const color  = colorAt(s, index, pal);

        const data = valuesOf(spec, s.key).map((v, i) => {
          const lbl = String(spec.data[i]?.['label'] ?? '');
          const item: Record<string, unknown> = { name: lbl, value: v };
          if (stacked && topSeriesAt[i] === index) {
            item.itemStyle = { borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0] };
          }
          if (hasDrilldown(spec, lbl)) {
            item.cursor = 'pointer';
            item.emphasis = { itemStyle: drillEmphasis(color, horizontal) };
          }
          return item;
        });

        if (isLine) {
          return {
            name: s.label, id: s.key, type: 'line', smooth: true, data,
            lineStyle: { width: 2.5, color },
            itemStyle: { color, borderWidth: 2 },
            symbol: 'circle', symbolSize: 7,
            emphasis: { scale: 1.4, itemStyle: { shadowBlur: 10, shadowColor: fade(color, 0.5) } },
            ...(isArea ? { areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: fade(color, 0.28) }, { offset: 1, color: fade(color, 0.02) }] } } } : {}),
          };
        }

        return {
          name: s.label, id: s.key, type: 'bar', clip: false, data,
          barMaxWidth: 52, barCategoryGap: '40%',
          itemStyle: {
            color: barGradient(color, horizontal),
            ...(!stacked ? { borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0] } : {}),
          },
          emphasis: {
            focus: 'none',
            itemStyle: {
              color,
              shadowBlur: 18,
              shadowColor: fade(color, 0.55),
              shadowOffsetY: horizontal ? 0 : 5, shadowOffsetX: horizontal ? 5 : 0,
            },
          },
          label: {
            show: !stacked && (horizontal ? spec.data.length <= 12 : spec.data.length <= 8),
            position: horizontal ? 'right' : 'top',
            fontSize: 11, color: c.mutedForeground,
            fontFamily: CHART_FONT,
            formatter: (p: { value: number }) => fmtChartValue(p.value),
          },
          ...(stacked ? { stack: 'total' } : {}),
        };
      });

  // Ghost series: one per hidden bar, all-null data so nothing renders visually.
  // They must stay in ECharts' series registry so that clicking the grayed-out
  // legend entry fires legendselectchanged and lets the user restore the bar.
  const ghosts = (singleBarSeries && hints?.hiddenLabels.size)
    ? [...hints.hiddenLabels].map((lbl) => ({
        name: lbl,
        type: 'bar',
        data: new Array(rawLabels.length).fill(null),
        barGap: '-100%',
        barMaxWidth: 52,
        barCategoryGap: '40%',
        itemStyle: { color: 'transparent' },
        silent: true,
      }))
    : [];

  // Legend entries and selected state for single-bar-series charts.
  // Use allLabels (the full original list) so hidden items still appear in the
  // legend; mark hidden ones as unselected so their icon renders grayed out.
  const allLabels = hints?.allLabels ?? rawLabels;
  const legendSelected = (singleBarSeries && hints?.hiddenLabels.size)
    ? Object.fromEntries(allLabels.map((lbl) => [lbl, !hints!.hiddenLabels.has(lbl)]))
    : undefined;

  // Extra bottom room for multi-line wrapped labels (2 lines ≈ +36px over single-line).
  const gridBottom = horizontal ? 52 : longestLabel > 13 || numPoints >= 7 ? 92 : 68;

  const base = baseOption(spec, c);

  return {
    ...base,
    // Title is now an HTML element above the canvas (see EChart.tsx).
    // The grid only needs a small top margin for the topmost data/axis label.
    grid: { left: 20, right: 20, bottom: gridBottom, top: horizontal ? 40 : 54, containLabel: true },
    ...(singleBarSeries ? {
      legend: {
        ...legendBase(c),
        data: allLabels,
        ...(legendSelected ? { selected: legendSelected } : {}),
      },
    } : {}),
    tooltip: hasLine
      ? {
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            lineStyle: { color: c.border, opacity: 0.55, type: 'dashed' as const },
          },
          confine: true,
          ...tooltipStyle(c),
        }
      : {
          trigger: 'item',
          confine: true,
          ...tooltipStyle(c),
        },
    xAxis: horizontal
      ? { ...valueAxis(spec, true, c), name: undefined }
      : {
          ...categoryAxis(spec, c),
          axisLabel: {
            ...axisLabel(c),
            rotate: 0,
            interval: 0,
            hideOverlap: true,
            overflow: 'truncate',
            width: vLabelWidth,
            formatter: vUseWrap
              ? (value: string) => wrapLabel(value, vMaxChars)
              : (value: string) => truncateLabel(value, vMaxChars),
          },
        },
    yAxis: horizontal
      ? {
          ...categoryAxis(spec, c),
          name: undefined,
          axisLabel: {
            ...axisLabel(c),
            interval: 0,
            overflow: 'truncate',
            width: hLabelWidth,
            formatter: (value: string) => truncateLabel(value, hMaxChars),
          },
        }
      : valueAxis(spec, false, c),
    series: [...series, ...ghosts],
  };
}

function pie(spec: ChartSpec, c: ChartThemeColors): EChartsOption {
  const isDonut = spec.chartType === 'donut';
  const key     = spec.series[0]?.key;
  const pal     = chartPalette(c.isDark);

  const data = spec.data.map((row, index) => {
    const lbl      = String(row['label'] ?? '');
    const clickable = hasDrilldown(spec, lbl);
    const color     = pal[index % pal.length];
    return {
      name: lbl,
      value: key ? Number((row as Record<string, unknown>)[key]) || 0 : 0,
      itemStyle: { color },
      emphasis: clickable
        ? { scaleSize: 10, itemStyle: { shadowBlur: 16, shadowColor: fade(color, 0.55) } }
        : { scaleSize: 6,  itemStyle: { shadowBlur:  8, shadowColor: fade(color, 0.35) } },
      ...(clickable ? { cursor: 'pointer' } : {}),
    };
  });

  return {
    ...baseOption(spec, c),
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <b>{c}</b> ({d}%)',
      confine: true,
      ...tooltipStyle(c),
    },
    series: [{
      type: 'pie',
      name: spec.series[0]?.label ?? spec.title,
      radius: isDonut ? ['40%', '68%'] : '62%',
      center: ['50%', '52%'],
      data,
      avoidLabelOverlap: true,
      label: {
        fontSize: 11,
        color: c.foreground,
        fontFamily: CHART_FONT,
        formatter: '{b}\n{d}%',
        overflow: 'truncate',
        width: 80,
      },
      labelLine: { length: 10, length2: 6, lineStyle: { color: c.border } },
      ...(isDonut ? {
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 700, color: c.foreground } },
      } : {}),
    }],
  };
}

function radar(spec: ChartSpec, c: ChartThemeColors): EChartsOption {
  const pal = chartPalette(c.isDark);
  const indicators = spec.data.map((r) => ({ name: String(r['label'] ?? '') }));
  const series = spec.series.map((s, i) => {
    const color = colorAt(s, i, pal);
    return {
      name: s.label,
      value: valuesOf(spec, s.key),
      itemStyle: { color },
      lineStyle: { color, width: 2.5 },
      areaStyle: { color: fade(color, 0.18) },
    };
  });

  return {
    ...baseOption(spec, c),
    tooltip: { trigger: 'item', ...tooltipStyle(c) },
    radar: {
      indicator: indicators,
      splitLine: { lineStyle: { color: c.border, opacity: c.isDark ? 0.25 : 0.4 } },
      axisLine:  { lineStyle: { color: c.border, opacity: c.isDark ? 0.2 : 0.3 } },
      splitArea: { show: true, areaStyle: {
        color: c.isDark
          ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)']
          : ['rgba(0,0,0,0.01)',       'rgba(0,0,0,0.03)'],
      }},
      name: { textStyle: { color: c.mutedForeground, fontFamily: CHART_FONT } },
    },
    series: [{ type: 'radar', data: series }],
  };
}

function scatter(spec: ChartSpec, c: ChartThemeColors): EChartsOption {
  const pal = chartPalette(c.isDark);
  const series = spec.series.flatMap((s, i) => {
    const color = colorAt(s, i, pal);
    const data = spec.data.map((row, ri) => {
      const x = Number.isFinite(Number(row['label'])) ? Number(row['label']) : ri;
      return [x, Number((row as Record<string, unknown>)[s.key]) || 0];
    });
    return [
      // Scatter dots first so the legend derives its icon and color from this
      // series. The line sits behind via z-index, not array order.
      {
        name: s.label,
        type: 'scatter',
        symbolSize: 9,
        itemStyle: { color, opacity: 0.85 },
        emphasis: { itemStyle: { opacity: 1, shadowBlur: 10, shadowColor: fade(color, 0.5) } },
        data,
        z: 2,
      },
      // Connecting line shares the same name so the legend toggle hides both.
      {
        name: s.label,
        type: 'line',
        data,
        showSymbol: false,
        lineStyle: { color, width: 1.5, opacity: 0.45 },
        itemStyle: { color },
        silent: true,
        legendHoverLink: false,
        emphasis: { disabled: true },
        z: 1,
      },
    ];
  });

  const sharedAxis = {
    nameTextStyle: { color: c.mutedForeground, fontFamily: CHART_FONT },
    axisLabel: axisLabel(c),
    axisTick: { show: false },
  };

  return {
    ...baseOption(spec, c),
    tooltip: { trigger: 'item', confine: true, ...tooltipStyle(c) },
    xAxis: { type: 'value', name: spec.xAxisLabel, nameLocation: 'middle', nameGap: 32, axisLine: axisLine(c), splitLine: splitLine(c), ...sharedAxis },
    yAxis: { type: 'value', name: spec.yAxisLabel, nameLocation: 'middle', nameRotate: 90, nameGap: 56, axisLine: { show: false }, splitLine: splitLine(c), ...sharedAxis },
    series,
  };
}

export function chartSpecToEChartsOption(
  spec: ChartSpec,
  colors?: ChartThemeColors,
  containerWidth = 360,
  hints?: SingleBarRenderHints,
): EChartsOption {
  const c: ChartThemeColors = colors ?? {
    foreground: '#0f172a', mutedForeground: '#64748b', border: '#e2e8f0',
    surface: '#ffffff', isDark: false,
  };
  switch (spec.chartType) {
    case 'pie':
    case 'donut':   return pie(spec, c);
    case 'radar':   return radar(spec, c);
    case 'scatter': return scatter(spec, c);
    default:        return cartesian(spec, c, containerWidth, hints);
  }
}
