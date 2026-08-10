import type { ChartSpec } from '~/modules/chat/charts';
import {
  applyChartControls,
  clampControlValue,
  resolveChartControls,
} from '~/modules/chat/lib/chartControls';
import { compileFormula } from '~/modules/chat/lib/chartFormula';

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
    { label: 'Cy', deals: 3, quota: 10 },
  ],
  ...over,
});

describe('compileFormula', () => {
  it('evaluates arithmetic with precedence, ^ right-assoc, and functions', () => {
    expect(compileFormula('1 + 2 * 3')!({})).toBe(7);
    expect(compileFormula('2^3^2')!({})).toBe(512);
    expect(compileFormula('-(2^2)')!({})).toBe(-4);
    expect(compileFormula('min(3, 2) + max(1, 4)')!({})).toBe(6);
    expect(compileFormula('round(sqrt(2) * 100)')!({})).toBe(141);
  });

  it('reads variables from the scope and NaNs unknowns', () => {
    const fn = compileFormula('principal*(1+rate/100)^x')!;
    expect(fn({ principal: 1000, rate: 7, x: 2 })).toBeCloseTo(1144.9);
    expect(fn({ principal: 1000, rate: 7 })).toBeNaN();
  });

  it('rejects anything outside the whitelist', () => {
    expect(compileFormula('alert(1)')).toBeNull();
    expect(compileFormula('a.b')).toBeNull();
    expect(compileFormula('1 +')).toBeNull();
    expect(compileFormula('constructor')).not.toBeNull(); // plain ident → scope lookup
    expect(compileFormula('constructor')!({})).toBeNaN();
  });

  it('supports comparisons and if() for row gating', () => {
    expect(compileFormula('3 > 2')!({})).toBe(1);
    expect(compileFormula('2 >= 3')!({})).toBe(0);
    expect(compileFormula('if(x > 5, 100, 0)')!({ x: 7 })).toBe(100);
    expect(compileFormula('if(x > 5, 100, 0)')!({ x: 3 })).toBe(0);
    const gated = compileFormula('if(label > years, 0/0, label * 10)')!;
    expect(gated({ label: 3, years: 5 })).toBe(30);
    expect(gated({ label: 8, years: 5 })).toBeNaN();
  });
});

describe('resolveChartControls', () => {
  it('resolves declared controls with data-derived bounds', () => {
    const s = spec({
      controls: [
        { type: 'range', field: 'label' },
        { type: 'slider', field: 'deals' },
        { type: 'toggle', field: 'quota' },
      ],
    });
    const resolved = resolveChartControls(s);
    expect(resolved.map((r) => r.type)).toEqual(['range', 'slider', 'toggle']);
    expect(resolved[0]).toMatchObject({ min: 0, max: 2, defaultValue: [0, 2] });
    expect(resolved[1]).toMatchObject({ min: 0, max: 15, defaultValue: 0 });
    expect(resolved[2]).toMatchObject({ defaultValue: true });
  });

  it('drops controls that cannot mount and returns [] without declarations', () => {
    expect(resolveChartControls(spec())).toEqual([]);
    const s = spec({
      controls: [
        { type: 'slider', field: 'nope' },
        { type: 'toggle', field: 'deals' },
        { type: 'toggle', field: 'deals' }, // duplicate
        { type: 'param', field: 'rate', min: 1, max: 12 }, // no formulas
      ],
    });
    expect(resolveChartControls(s).map((r) => r.id)).toEqual(['toggle:deals']);
  });

  it('resolves param controls only alongside a compilable formula', () => {
    const s = spec({
      controls: [{ type: 'param', field: 'rate', min: 1, max: 12, default: 7 }],
      formulas: { deals: 'rate * (x + 1)' },
    });
    expect(resolveChartControls(s)[0]).toMatchObject({
      type: 'param',
      min: 1,
      max: 12,
      defaultValue: 7,
    });
    const bad = spec({
      controls: [{ type: 'param', field: 'rate', min: 1, max: 12 }],
      formulas: { deals: 'rate ***' },
    });
    expect(resolveChartControls(bad)).toEqual([]);
  });

  it('drops param controls without an explicit max — no invented domain', () => {
    const s = spec({
      controls: [{ type: 'param', field: 'rate', min: 1 }],
      formulas: { deals: 'rate * (x + 1)' },
    });
    expect(resolveChartControls(s)).toEqual([]);
  });
});

describe('applyChartControls', () => {
  it('returns the same spec object when every control sits at its default', () => {
    const s = spec({
      controls: [
        { type: 'range', field: 'label' },
        { type: 'slider', field: 'deals' },
      ],
    });
    const resolved = resolveChartControls(s);
    expect(applyChartControls(s, resolved, undefined)).toBe(s);
  });

  it('windows, thresholds, and toggles', () => {
    const s = spec({
      controls: [
        { type: 'range', field: 'label' },
        { type: 'slider', field: 'deals' },
        { type: 'toggle', field: 'quota' },
      ],
    });
    const resolved = resolveChartControls(s);
    const out = applyChartControls(s, resolved, {
      'range:label': [0, 1],
      'slider:deals': 5,
      'toggle:quota': false,
    });
    expect(out.data.map((r) => r['label'])).toEqual(['Ana', 'Bo']);
    expect(out.series.map((se) => se.key)).toEqual(['deals']);
  });

  it('empties the rows (not the series) when every series is toggled off', () => {
    const s = spec({
      controls: [
        { type: 'toggle', field: 'deals' },
        { type: 'toggle', field: 'quota' },
      ],
    });
    const resolved = resolveChartControls(s);
    const out = applyChartControls(s, resolved, {
      'toggle:deals': false,
      'toggle:quota': false,
    });
    expect(out.series).toHaveLength(2);
    expect(out.data).toHaveLength(0);
  });

  it('re-evaluates formula series when a param moves, and not before', () => {
    const s = spec({
      controls: [{ type: 'param', field: 'rate', min: 0, max: 12, default: 7 }],
      formulas: { deals: 'rate * (x + 1)' },
    });
    const resolved = resolveChartControls(s);
    // At the default the delivered numbers win, even if the formula disagrees.
    expect(applyChartControls(s, resolved, { 'param:rate': 7 })).toBe(s);
    const out = applyChartControls(s, resolved, { 'param:rate': 10 });
    expect(out.data.map((r) => r['deals'])).toEqual([10, 20, 30]);
    // Non-formula series keep their delivered values.
    expect(out.data.map((r) => r['quota'])).toEqual([10, 10, 10]);
  });

  it('drops rows where every formula returns NaN (duration collapse)', () => {
    const s = spec({
      controls: [{ type: 'param', field: 'years', min: 1, max: 3, default: 3 }],
      formulas: { deals: 'if(x > years, 0/0, x * 10)' },
    });
    const resolved = resolveChartControls(s);
    const out = applyChartControls(s, resolved, { 'param:years': 1 });
    // Rows at index 2 (x=2 > years=1) vanish instead of flattening.
    expect(out.data.map((r) => r['label'])).toEqual(['Ana', 'Bo']);
    expect(out.data.map((r) => r['deals'])).toEqual([0, 10]);
  });

  it('falls back to delivered data when a formula NaNs every row', () => {
    const s = spec({
      controls: [{ type: 'param', field: 'years', min: 1, max: 3, default: 3 }],
      formulas: { deals: 'unknown_variable * 2' },
    });
    const resolved = resolveChartControls(s);
    const out = applyChartControls(s, resolved, { 'param:years': 1 });
    expect(out.data).toHaveLength(3);
    expect(out.data.map((r) => r['deals'])).toEqual([15, 9, 3]);
  });

  it('leaves scatter rows intact for the range control (native dataZoom windows the axis)', () => {
    const s = spec({
      chartType: 'scatter',
      controls: [{ type: 'range', field: 'label' }],
    });
    const resolved = resolveChartControls(s);
    expect(applyChartControls(s, resolved, { 'range:label': [0, 1] })).toBe(s);
  });

  it('clamps stored values into the control domain', () => {
    const s = spec({ controls: [{ type: 'range', field: 'label' }] });
    const [range] = resolveChartControls(s);
    expect(clampControlValue(range, [5, 99])).toEqual([2, 2]);
    expect(clampControlValue(range, 3 as never)).toEqual([0, 2]);
  });
});
