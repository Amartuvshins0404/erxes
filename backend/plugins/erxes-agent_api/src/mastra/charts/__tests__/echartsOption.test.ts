import { sanitizeChartSpec, type ChartSpec } from '../chartSpec';
import { chartSpecToEChartsOption } from '../echartsOption';

// These pure functions are the shared chart contract: the same mapping drives
// the interactive Preview chart (frontend mirror) and the chart images embedded
// in generated PDF/DOCX/XLSX. Keep this in sync with the frontend test fixture
// at frontend/libs/erxes-ui/src/modules/charts/__tests__/chartSpecToEChartsOption.test.ts

// Structural view of the fields these tests read off an ECharts option — keeps
// the assertions `any`-free while indexing a deeply-dynamic object.
interface OptionView {
  xAxis?: { type?: string; data?: unknown[] };
  yAxis?: { type?: string };
  radar?: { indicator?: unknown[] };
  series?: Array<Record<string, unknown>>;
}

const asOption = (spec: ChartSpec): OptionView =>
  chartSpecToEChartsOption(spec) as unknown as OptionView;

const baseSpec = (overrides: Partial<ChartSpec> = {}): ChartSpec => ({
  chartType: 'bar',
  title: 'Revenue',
  series: [
    { key: 'sales', label: 'Sales' },
    { key: 'cost', label: 'Cost' },
  ],
  data: [
    { label: 'Jan', sales: 10, cost: 4 },
    { label: 'Feb', sales: 14, cost: 6 },
  ],
  ...overrides,
});

describe('sanitizeChartSpec', () => {
  it('drops series with unsafe keys and coerces values to finite numbers', () => {
    const spec = sanitizeChartSpec({
      chartType: 'bar',
      title: 'T',
      series: [
        { key: 'ok', label: 'Ok' },
        { key: '1bad', label: 'Bad key' },
      ],
      data: [{ label: 'A', ok: '12', '1bad': 5 }],
    } as ChartSpec);

    expect(spec.series).toHaveLength(1);
    expect(spec.series[0].key).toBe('ok');
    expect(spec.data[0].ok).toBe(12);
    expect('1bad' in spec.data[0]).toBe(false);
  });

  it('strips invalid colors but keeps valid ones', () => {
    const spec = sanitizeChartSpec({
      chartType: 'line',
      title: 'T',
      series: [
        { key: 'a', label: 'A', color: '#ff0000' },
        { key: 'b', label: 'B', color: 'javascript:alert(1)' },
      ],
      data: [{ label: 'x', a: 1, b: 2 }],
    } as ChartSpec);

    expect(spec.series[0].color).toBe('#ff0000');
    expect(spec.series[1].color).toBeUndefined();
  });

  it('throws when no usable series remain', () => {
    expect(() =>
      sanitizeChartSpec({
        chartType: 'bar',
        title: 'T',
        series: [{ key: '9nope', label: 'X' }],
        data: [{ label: 'a', '9nope': 1 }],
      } as ChartSpec),
    ).toThrow();
  });
});

describe('chartSpecToEChartsOption', () => {
  it('builds a multi-series bar option with category x-axis', () => {
    const option = asOption(baseSpec());
    expect(option.xAxis?.type).toBe('category');
    expect(option.xAxis?.data).toEqual(['Jan', 'Feb']);
    expect(option.series).toHaveLength(2);
    expect(option.series?.[0].type).toBe('bar');
    expect(option.series?.[0].data).toEqual([10, 14]);
  });

  it('swaps axes for horizontalBar', () => {
    const option = asOption(baseSpec({ chartType: 'horizontalBar' }));
    expect(option.yAxis?.type).toBe('category');
    expect(option.xAxis?.type).toBe('value');
  });

  it('stacks bars for stackedBar', () => {
    const option = asOption(baseSpec({ chartType: 'stackedBar' }));
    expect(option.series?.[0].stack).toBe('total');
  });

  it('renders line series as smoothed lines for line/area', () => {
    const line = asOption(baseSpec({ chartType: 'line' }));
    expect(line.series?.[0].type).toBe('line');
    expect(line.series?.[0].smooth).toBe(true);

    const area = asOption(baseSpec({ chartType: 'area' }));
    expect(area.series?.[0].areaStyle).toBeDefined();
  });

  it('honors per-series type in combo charts', () => {
    const option = asOption(
      baseSpec({
        chartType: 'combo',
        series: [
          { key: 'sales', label: 'Sales', type: 'bar' },
          { key: 'cost', label: 'Cost', type: 'line' },
        ],
      }),
    );
    expect(option.series?.[0].type).toBe('bar');
    expect(option.series?.[1].type).toBe('line');
  });

  it('builds a donut as a pie with an inner radius', () => {
    const option = asOption(baseSpec({ chartType: 'donut' }));
    expect(option.series?.[0].type).toBe('pie');
    expect(Array.isArray(option.series?.[0].radius)).toBe(true);
    expect(option.series?.[0].data).toHaveLength(2);
  });

  it('maps radar indicators from labels', () => {
    const option = asOption(baseSpec({ chartType: 'radar' }));
    expect(option.radar?.indicator).toEqual([{ name: 'Jan' }, { name: 'Feb' }]);
    expect(option.series?.[0].type).toBe('radar');
  });

  it('emits [x,y] points for scatter', () => {
    const option = asOption(baseSpec({ chartType: 'scatter' }));
    expect(option.series?.[0].type).toBe('scatter');
    expect((option.series?.[0].data as unknown[])[0]).toEqual([0, 10]);
  });
});
