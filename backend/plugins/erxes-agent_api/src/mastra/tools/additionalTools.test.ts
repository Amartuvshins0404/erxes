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
    expect(normalizeAdditionalToolKeys(undefined)).not.toContain('runCode');
  });

  it('honors an explicit empty or selected allowlist', () => {
    expect(normalizeAdditionalToolKeys([], [])).toEqual([]);
    expect(
      normalizeAdditionalToolKeys(['runCode', 'webSearch', 'runCode'], []),
    ).toEqual(['webSearch', 'runCode']);
  });

  it('drops retired or unknown tool names instead of granting them', () => {
    expect(normalizeAdditionalToolKeys(['terminal', 'hostShell'], [])).toEqual(
      [],
    );
    expect(
      normalizeAdditionalToolKeys(['terminal', 'webSearch'], []),
    ).toEqual(['webSearch']);
  });
});
