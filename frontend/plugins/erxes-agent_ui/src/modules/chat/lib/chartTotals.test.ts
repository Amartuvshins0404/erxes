import type { ChartSpec } from '~/modules/chat/charts';
import { chartTotals } from '~/modules/chat/lib/chartTotals';

const spec = (over: Partial<ChartSpec> = {}): ChartSpec => ({
  chartType: 'bar',
  title: 'Deals',
  series: [
    { key: 'deals', label: 'Deals' },
    { key: 'quota', label: 'Quota' },
  ],
  data: [
    { label: 'Ana', deals: 15, quota: 10 },
    { label: 'Bo', deals: 9, quota: 10 },
  ],
  ...over,
});

describe('chartTotals', () => {
  it('sums each series over the filtered rows with display-ready labels', () => {
    const s = spec();
    const filtered: ChartSpec = { ...s, data: [s.data[0]] };
    expect(chartTotals(s, filtered)).toEqual([
      { label: 'Total Deals', value: 15 },
      { label: 'Total Quota', value: 10 },
    ]);
  });

  it('prepends a combined Total tile when the series stack', () => {
    const s = spec({ chartType: 'stackedBar' });
    expect(chartTotals(s, s)).toEqual([
      { label: 'Total', value: 44 },
      { label: 'Total Deals', value: 24 },
      { label: 'Total Quota', value: 20 },
    ]);
  });

  it('returns nothing for chart types where sums are meaningless', () => {
    const s = spec({ chartType: 'scatter' });
    expect(chartTotals(s, s)).toEqual([]);
    const r = spec({ chartType: 'radar' });
    expect(chartTotals(r, r)).toEqual([]);
  });
});
