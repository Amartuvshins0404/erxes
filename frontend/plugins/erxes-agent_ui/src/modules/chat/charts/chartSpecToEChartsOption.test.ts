import { chartSpecToEChartsOption } from './chartSpecToEChartsOption';
import type { ChartSpec } from './types';

// Drift guard for the plugin-local copy of the mapper (see ./README-WHY-LOCAL.md).
// This file is a copy of erxes-ui's chartSpecToEChartsOption; these assertions
// lock the behavior so the copy can't silently diverge from the canonical
// erxes-ui + backend mappers. The first case is the exact area/stacked shape
// that crashed in production (kimi "Bull Case" chart).

const areaStackedSpec: ChartSpec = {
  chartType: 'area',
  title: 'Bull Case',
  stacked: true,
  series: [
    { key: 'erkhet', label: 'Erkhet', color: '#2ecc71' },
    { key: 'recurring', label: 'Recurring', color: '#3498db' },
  ],
  data: [
    { label: '2026.07', erkhet: 12, recurring: 5 },
    { label: '2026.08', erkhet: 13, recurring: 5.5 },
  ],
};

describe('chartSpecToEChartsOption', () => {
  it('renders an area+stacked spec without throwing and as line+areaStyle series', () => {
    const opt = chartSpecToEChartsOption(areaStackedSpec) as any;

    // x axis carries the row labels; y axis is the value axis.
    expect(opt.xAxis.type).toBe('category');
    expect(opt.xAxis.data).toEqual(['2026.07', '2026.08']);
    expect(opt.yAxis.type).toBe('value');

    expect(opt.series).toHaveLength(2);
    // Area is line-based: each series is a smoothed line with an areaStyle, and
    // is NOT stacked (stacking only applies to bar-type series).
    for (const s of opt.series) {
      expect(s.type).toBe('line');
      expect(s.smooth).toBe(true);
      expect(s.areaStyle).toEqual({});
      expect(s.stack).toBeUndefined();
    }
    // Series carry their data and explicit colors.
    expect(opt.series[0].data).toEqual([12, 13]);
    expect(opt.series[0].itemStyle.color).toBe('#2ecc71');
  });

  it('stacks bar series with stacked:true', () => {
    const opt = chartSpecToEChartsOption({
      ...areaStackedSpec,
      chartType: 'stackedBar',
    }) as any;
    for (const s of opt.series) {
      expect(s.type).toBe('bar');
      expect(s.stack).toBe('total');
    }
  });

  it('coerces non-finite series values to 0', () => {
    const opt = chartSpecToEChartsOption({
      chartType: 'bar',
      title: 't',
      series: [{ key: 'v', label: 'V' }],
      data: [{ label: 'a', v: 5 }, { label: 'b' } as any],
    }) as any;
    expect(opt.series[0].data).toEqual([5, 0]);
  });

  it('maps pie to a single pie series', () => {
    const opt = chartSpecToEChartsOption({
      ...areaStackedSpec,
      chartType: 'pie',
    }) as any;
    expect(opt.series).toHaveLength(1);
    expect(opt.series[0].type).toBe('pie');
  });
});
