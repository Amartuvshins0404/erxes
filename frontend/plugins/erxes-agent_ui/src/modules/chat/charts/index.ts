// Plugin-local charts barrel — bundled into erxes-agent_ui so chart rendering
// never depends on the host's shared `erxes-ui` version. See ./README-WHY-LOCAL.md.
// Mirrors the public surface of erxes-ui's charts module so call sites only
// change the import path, not their usage.
export { EChart } from './EChart';
export type { EChartHandle } from './EChart';
export { chartSpecToEChartsOption } from './chartSpecToEChartsOption';
export type { EChartsOption, SingleBarRenderHints } from './chartSpecToEChartsOption';
export { CHART_FONT, useChartColors, useAppChartColors, chartPalette, fmtChartValue } from './chartColors';
export type { ChartThemeColors } from './chartColors';
export { legacyPayloadToChartSpec, parseChartViz } from './legacyChartViz';
export { CHART_TYPES, isChartSpec } from './types';
export type { ChartType, ChartSeries, ChartDataPoint, ChartSpec, DrilldownSpec } from './types';
