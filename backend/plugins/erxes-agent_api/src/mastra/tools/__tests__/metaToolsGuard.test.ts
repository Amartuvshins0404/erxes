import { auditErrorMessage } from '../metaTools';

describe('auditErrorMessage', () => {
  it('prefers a non-empty error string', () => {
    expect(auditErrorMessage({ success: false, error: 'boom' })).toBe('boom');
  });

  it('falls back to instruction when error is empty', () => {
    expect(
      auditErrorMessage({ success: false, error: '', instruction: 'retry' }),
    ).toBe('retry');
  });

  it('falls back to bounded JSON for structured failures', () => {
    const failure = { success: false, candidates: [{ id: 'x', name: 'X' }] };
    expect(auditErrorMessage(failure)).toBe(JSON.stringify(failure));
    expect(auditErrorMessage({ big: 'y'.repeat(1000) }).length).toBe(500);
  });

  it('returns an empty string for non-object results', () => {
    expect(auditErrorMessage(null)).toBe('');
    expect(auditErrorMessage(42)).toBe('');
  });
});
