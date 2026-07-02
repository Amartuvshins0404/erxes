import { sanitizeChartSpec, type ChartSpec } from '../chartSpec';

const raw = (over: Partial<ChartSpec> = {}): ChartSpec =>
  ({
    chartType: 'bar',
    title: 'Deals',
    series: [{ key: 'deals', label: 'Deals' }],
    data: [{ label: 'Q1', deals: 9 }],
    ...over,
  }) as ChartSpec;

describe('sanitizeChartSpec', () => {
  it('slugifies unsafe series keys and remaps rows, controls and formulas', () => {
    const spec = sanitizeChartSpec(
      raw({
        series: [
          { key: 'Customer Support', label: 'Support' },
          { key: 'deals', label: 'Deals' },
        ],
        data: [{ label: 'Q1', 'Customer Support': 4, deals: 9 }],
        controls: [
          { type: 'slider', field: 'Customer Support' },
          { type: 'toggle', field: 'deals' },
        ],
        formulas: { 'Customer Support': 'rate * x' },
      }),
    );
    expect(spec.series.map((s) => s.key)).toEqual(['customer_support', 'deals']);
    expect(spec.data[0]).toMatchObject({ customer_support: 4, deals: 9 });
    expect(spec.controls).toEqual([
      expect.objectContaining({ type: 'slider', field: 'customer_support' }),
      expect.objectContaining({ type: 'toggle', field: 'deals' }),
    ]);
    expect(Object.keys(spec.formulas ?? {})).toEqual(['customer_support']);
  });

  it('keeps only the first series when original keys are duplicated', () => {
    const spec = sanitizeChartSpec(
      raw({
        series: [
          { key: 'deals', label: 'First' },
          { key: 'deals', label: 'Second' },
        ],
        data: [{ label: 'Q1', deals: 9 }],
      }),
    );
    expect(spec.series).toEqual([
      expect.objectContaining({ key: 'deals', label: 'First' }),
    ]);
    expect(spec.data[0]).toMatchObject({ deals: 9 });
  });

  it('drops param controls without an explicit max', () => {
    const spec = sanitizeChartSpec(
      raw({
        controls: [{ type: 'param', field: 'rate', min: 1 }],
        formulas: { deals: 'rate * x' },
      }),
    );
    expect(spec.controls).toBeUndefined();
  });

  it('dedupes colliding slugs instead of dropping series', () => {
    const spec = sanitizeChartSpec(
      raw({
        series: [
          { key: 'North Region', label: 'North' },
          { key: 'north region', label: 'north' },
        ],
        data: [{ label: 'Q1', 'North Region': 1, 'north region': 2 }],
      }),
    );
    expect(spec.series.map((s) => s.key)).toEqual([
      'north_region',
      'north_region_2',
    ]);
    expect(spec.data[0]).toMatchObject({ north_region: 1, north_region_2: 2 });
  });

  it('drops param controls when no formula survives, keeps them otherwise', () => {
    const without = sanitizeChartSpec(
      raw({ controls: [{ type: 'param', field: 'rate', min: 1, max: 12 }] }),
    );
    expect(without.controls).toBeUndefined();

    const withFormula = sanitizeChartSpec(
      raw({
        controls: [{ type: 'param', field: 'rate', min: 1, max: 12, default: 7 }],
        formulas: { deals: 'rate * (x + 1)' },
      }),
    );
    expect(withFormula.controls).toEqual([
      expect.objectContaining({ type: 'param', field: 'rate', default: 7 }),
    ]);
    expect(withFormula.formulas).toEqual({ deals: 'rate * (x + 1)' });
  });

  it('drops controls that reference unknown series and caps at 4', () => {
    const spec = sanitizeChartSpec(
      raw({
        controls: [
          { type: 'slider', field: 'nope' },
          { type: 'range', field: 'label' },
          { type: 'range', field: 'label' }, // duplicate
        ],
      }),
    );
    expect(spec.controls).toEqual([
      expect.objectContaining({ type: 'range', field: 'label' }),
    ]);
  });

  it('still throws when nothing usable remains', () => {
    expect(() => raw({ series: [] })).toBeTruthy();
    expect(() =>
      sanitizeChartSpec(raw({ series: [{ key: '   ', label: 'blank' }] })),
    ).toThrow('no valid series');
  });
});
