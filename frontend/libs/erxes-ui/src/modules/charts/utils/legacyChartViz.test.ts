import { parseChartViz, legacyPayloadToChartSpec } from './legacyChartViz';

const line = {
  type: 'chart-viz',
  chartType: 'line',
  title: 'Forecast',
  series: [{ key: 'base', label: 'Base', color: '#3498db' }],
  data: [
    { label: 'Jul', base: 13 },
    { label: 'Aug', base: 14 },
  ],
};
const area = {
  type: 'chart-viz',
  chartType: 'area',
  title: 'Bull Case',
  stacked: true,
  series: [{ key: 'erkhet', label: 'ERP' }],
  data: [{ label: 'Jul', erkhet: 12 }],
};

describe('parseChartViz', () => {
  it('parses a single chart-viz object', () => {
    const specs = parseChartViz(JSON.stringify(line));
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({ chartType: 'line', title: 'Forecast' });
  });

  it('parses a JSON array of charts', () => {
    const specs = parseChartViz(JSON.stringify([line, area]));
    expect(specs.map((s) => s.chartType)).toEqual(['line', 'area']);
  });

  // The production failure mode: several objects run together in one fence
  // (newline/period separators) — a naive JSON.parse of the whole block throws.
  it('recovers multiple objects run together with stray punctuation', () => {
    const blob =
      JSON.stringify(line) + '.\n' + JSON.stringify(area) + '\n' + JSON.stringify(line);
    const specs = parseChartViz(blob);
    expect(specs).toHaveLength(3);
    expect(specs.map((s) => s.chartType)).toEqual(['line', 'area', 'line']);
  });

  it('passes the stacked flag through for area/stacked charts', () => {
    const [spec] = parseChartViz(JSON.stringify(area));
    expect(spec.stacked).toBe(true);
    expect(spec.chartType).toBe('area');
  });

  it('returns [] for non-chart or malformed content', () => {
    expect(parseChartViz('{ not json')).toEqual([]);
    expect(parseChartViz(JSON.stringify({ hello: 'world' }))).toEqual([]);
    expect(parseChartViz('')).toEqual([]);
  });
});

describe('legacyPayloadToChartSpec', () => {
  it('defaults an unknown chartType to bar and keeps series/data', () => {
    const spec = legacyPayloadToChartSpec({ ...line, chartType: 'bogus' });
    expect(spec?.chartType).toBe('bar');
    expect(spec?.series).toHaveLength(1);
  });

  it('rejects payloads without series/data arrays', () => {
    expect(legacyPayloadToChartSpec({ chartType: 'line' })).toBeNull();
  });
});
