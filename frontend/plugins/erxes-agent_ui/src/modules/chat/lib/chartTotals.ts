// The headline stat tiles rendered between a chart and its controls — one sum
// per visible numeric series over the FILTERED rows (so they live-update as
// the sliders move), plus a combined "Total" tile when the series stack.
// Labels come out display-ready ("Total Interest", "Total").
import type { ChartSpec } from '~/modules/chat/charts';

export interface ChartTotal {
  label: string;
  value: number;
}

// Chart types whose per-series sums are meaningful headline numbers.
const SUMMABLE = new Set([
  'bar',
  'horizontalBar',
  'line',
  'area',
  'stackedBar',
  'pie',
  'donut',
  'combo',
]);

export const chartTotals = (
  spec: ChartSpec,
  filtered: ChartSpec,
): ChartTotal[] => {
  if (!SUMMABLE.has(spec.chartType)) return [];

  const perSeries = filtered.series
    .slice(0, 3)
    .map((s) => {
      let sum = 0;
      let numeric = false;
      for (const row of filtered.data) {
        const v = row[s.key];
        if (typeof v === 'number' && Number.isFinite(v)) {
          sum += v;
          numeric = true;
        }
      }
      return numeric ? { label: `Total ${s.label || s.key}`, value: sum } : null;
    })
    .filter((t): t is ChartTotal => t !== null);

  const stacked =
    spec.stacked || spec.chartType === 'stackedBar' || spec.chartType === 'area';
  if (perSeries.length >= 2 && stacked) {
    return [
      { label: 'Total', value: perSeries.reduce((acc, t) => acc + t.value, 0) },
      ...perSeries,
    ];
  }
  return perSeries;
};
