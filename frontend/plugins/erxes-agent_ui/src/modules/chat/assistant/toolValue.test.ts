import {
  compactInline,
  formatScalar,
  humanizeKey,
  isEmptyEnvelope,
  isFailureResult,
  isFlatRowArray,
  failureMessage,
  pickPrimaryArray,
  tableColumns,
} from './toolValue';

describe('failure envelopes', () => {
  it('flags { success:false, error } results', () => {
    const value = { success: false, error: 'Not permitted' };
    expect(isFailureResult(value)).toBe(true);
    expect(failureMessage(value)).toBe('Not permitted');
  });

  it('ignores successes and non-envelope shapes', () => {
    expect(isFailureResult({ success: true, list: [] })).toBe(false);
    expect(isFailureResult({ error: 'no success flag' })).toBe(false);
    expect(isFailureResult('boom')).toBe(false);
    expect(isFailureResult(null)).toBe(false);
  });
});

describe('empty-result envelope', () => {
  it('flags the zero-records envelope', () => {
    expect(
      isEmptyEnvelope({ success: true, resultCount: 0, data: null }),
    ).toBe(true);
  });

  it('ignores non-empty results', () => {
    expect(isEmptyEnvelope({ success: true, resultCount: 3 })).toBe(false);
    expect(isEmptyEnvelope([])).toBe(false);
  });
});

describe('humanizeKey', () => {
  it('sentence-cases camelCase and snake_case keys', () => {
    expect(humanizeKey('totalCount')).toBe('Total count');
    expect(humanizeKey('created_at')).toBe('Created at');
    expect(humanizeKey('_id')).toBe('Id');
  });
});

describe('isFlatRowArray', () => {
  it('accepts arrays of flat objects', () => {
    expect(
      isFlatRowArray([
        { _id: '1', name: 'Deal', amount: 100 },
        { _id: '2', name: 'Other', amount: 200, tags: ['a', 'b'] },
      ]),
    ).toBe(true);
  });

  it('rejects nested rows, empty arrays, and scalar arrays', () => {
    expect(isFlatRowArray([{ a: { b: 1 } }])).toBe(false);
    expect(isFlatRowArray([])).toBe(false);
    expect(isFlatRowArray([1, 2, 3])).toBe(false);
  });
});

describe('tableColumns', () => {
  const rows = [
    { _id: '1', total: 5, name: 'Alpha' },
    { _id: '2', status: 'won', name: 'Beta' },
  ];

  it('unions keys with name-ish columns first and ids last', () => {
    expect(tableColumns(rows)).toEqual(['name', 'total', 'status', '_id']);
  });

  it('caps the column count', () => {
    expect(tableColumns(rows, 2)).toEqual(['name', 'total']);
  });
});

describe('formatScalar', () => {
  it('formats nulls, booleans, numbers, and strings', () => {
    expect(formatScalar(null)).toBe('—');
    expect(formatScalar(true)).toBe('Yes');
    expect(formatScalar(false)).toBe('No');
    expect(formatScalar(1234567.891)).toBe('1,234,567.891');
    expect(formatScalar('hi')).toBe('hi');
  });
});

describe('compactInline', () => {
  it('renders one-line capped text for nested values', () => {
    expect(compactInline({ a: 1 })).toBe('{"a":1}');
    expect(compactInline([1, 'x'])).toBe('[1, x]');
    const long = { note: 'x'.repeat(200) };
    expect(compactInline(long).length).toBeLessThanOrEqual(91);
  });
});

describe('pickPrimaryArray', () => {
  it('unwraps the { list, totalCount } envelope', () => {
    const record = {
      list: [
        { _id: '1', name: 'A' },
        { _id: '2', name: 'B' },
      ],
      totalCount: 2,
    };
    const picked = pickPrimaryArray(record);
    expect(picked?.key).toBe('list');
    expect(picked?.rows).toHaveLength(2);
    expect(picked?.meta).toEqual([['totalCount', 2]]);
  });

  it('rejects records with no or multiple record-lists', () => {
    expect(pickPrimaryArray({ a: 1 })).toBeNull();
    expect(
      pickPrimaryArray({
        one: [{ x: 1 }],
        two: [{ y: 2 }],
      }),
    ).toBeNull();
  });
});
