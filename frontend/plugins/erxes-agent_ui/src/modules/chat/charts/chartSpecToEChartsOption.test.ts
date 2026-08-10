import { chartSpecToEChartsOption } from './chartSpecToEChartsOption';
import type { ChartSpec } from './types';

// Smoke tests for the browser-side ECharts option builder.
// This file is a copy of erxes-ui's chartSpecToEChartsOption; keeping a test
// here ensures the local copy doesn't silently diverge from the canonical one.
// Note: the browser mapper intentionally differs from the backend mapper
// (echartsOption.ts) in theme handling, gradients, and animations — do not
// assert structural equality between them. See README-WHY-LOCAL.md.

const twoSeriesSpec: ChartSpec = {
  chartType: 'area',
  title: 'Bull Case',
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
  it('renders an area spec as line+areaStyle series with correct axes', () => {
    const opt = chartSpecToEChartsOption(twoSeriesSpec) as any;

    expect(opt.xAxis.type).toBe('category');
    expect(opt.xAxis.data).toEqual(['2026.07', '2026.08']);
    expect(opt.yAxis.type).toBe('value');

    expect(opt.series).toHaveLength(2);
    for (const s of opt.series) {
      expect(s.type).toBe('line');
      expect(s.smooth).toBe(true);
      // Browser mapper renders area series with a gradient areaStyle.
      expect(s.areaStyle).toBeDefined();
      expect(s.areaStyle).not.toEqual({});
      // Area series are never stacked in the browser mapper.
      expect(s.stack).toBeUndefined();
    }

    // Data items are name+value objects in the browser mapper.
    expect(opt.series[0].data[0]).toEqual(expect.objectContaining({ name: '2026.07', value: 12 }));
    expect(opt.series[0].data[1]).toEqual(expect.objectContaining({ name: '2026.08', value: 13 }));

    // Explicit series color is passed through.
    expect(opt.series[0].itemStyle.color).toBe('#2ecc71');
  });

  it('stacks bar series with stackedBar chartType', () => {
    const opt = chartSpecToEChartsOption({
      ...twoSeriesSpec,
      chartType: 'stackedBar',
    }) as any;
    for (const s of opt.series) {
      expect(s.type).toBe('bar');
      expect(s.stack).toBe('total');
    }
  });

  it('coerces non-finite series values to 0', () => {
    // Use two series to avoid the single-bar-per-label path.
    const opt = chartSpecToEChartsOption({
      chartType: 'bar',
      title: 't',
      series: [
        { key: 'v', label: 'V' },
        { key: 'w', label: 'W' },
      ],
      data: [{ label: 'a', v: 5, w: 1 }, { label: 'b', w: 2 } as any],
    }) as any;
    const vSeries = opt.series.find((s: any) => s.name === 'V' || s.id === 'v');
    expect(vSeries.data[0]).toEqual(expect.objectContaining({ value: 5 }));
    expect(vSeries.data[1]).toEqual(expect.objectContaining({ value: 0 }));
  });

  it('maps pie chartType to a single pie series', () => {
    const opt = chartSpecToEChartsOption({
      ...twoSeriesSpec,
      chartType: 'pie',
    }) as any;
    expect(opt.series).toHaveLength(1);
    expect(opt.series[0].type).toBe('pie');
  });

  it('maps donut chartType to a pie series with inner radius', () => {
    const opt = chartSpecToEChartsOption({
      ...twoSeriesSpec,
      chartType: 'donut',
    }) as any;
    expect(opt.series[0].type).toBe('pie');
    expect(Array.isArray(opt.series[0].radius)).toBe(true);
  });

  it('maps radar chartType to a radar series', () => {
    const opt = chartSpecToEChartsOption({
      ...twoSeriesSpec,
      chartType: 'radar',
    }) as any;
    expect(opt.series[0].type).toBe('radar');
    expect(Array.isArray(opt.radar.indicator)).toBe(true);
  });
});
