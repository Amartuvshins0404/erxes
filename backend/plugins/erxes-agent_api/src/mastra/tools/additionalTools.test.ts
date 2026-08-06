import {
  DEFAULT_ADDITIONAL_TOOL_KEYS,
  normalizeAdditionalToolKeys,
} from './additionalTools';

describe('additional tool selection', () => {
  it('enables safe capabilities when a tool selection is missing', () => {
    expect(normalizeAdditionalToolKeys(undefined)).toEqual(
      DEFAULT_ADDITIONAL_TOOL_KEYS,
    );
    expect(normalizeAdditionalToolKeys(undefined)).not.toContain('webSearch');
    expect(normalizeAdditionalToolKeys(undefined)).not.toContain('terminal');
  });

  it('honors an explicit empty or selected allowlist', () => {
    expect(normalizeAdditionalToolKeys([], [])).toEqual([]);
    expect(
      normalizeAdditionalToolKeys(
        ['terminal', 'webSearch', 'terminal'],
        [],
      ),
    ).toEqual(['webSearch', 'terminal']);
  });

  it('rejects unknown tool names instead of granting or silently persisting them', () => {
    expect(() => normalizeAdditionalToolKeys(['terminal', 'hostShell'], [])).toThrow(
      'Unknown additional tool: hostShell',
    );
  });
});
