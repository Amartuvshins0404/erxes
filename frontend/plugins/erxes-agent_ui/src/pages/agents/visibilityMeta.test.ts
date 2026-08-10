import { getVisibilityMeta } from './visibilityMeta';

describe('getVisibilityMeta', () => {
  it('returns the matching meta for known visibilities', () => {
    expect(getVisibilityMeta('org')).toEqual({ label: 'Org-wide', variant: 'success' });
    expect(getVisibilityMeta('team').label).toBe('Branch');
  });

  it('falls back to private meta for missing values', () => {
    expect(getVisibilityMeta(undefined)).toEqual({ label: 'Private', variant: 'secondary' });
    expect(getVisibilityMeta(null)).toEqual({ label: 'Private', variant: 'secondary' });
  });

  // Regression: a bad enum value from the API must not crash the Agents list.
  it('falls back to private meta for an unknown value instead of returning undefined', () => {
    const meta = getVisibilityMeta('superadmin');
    expect(meta).toBeDefined();
    expect(() => meta.label).not.toThrow();
    expect(meta).toEqual({ label: 'Private', variant: 'secondary' });
  });
});
