import {
  buildFallbackFromResults,
  isSearchResult,
} from '@/agent/fallback';

describe('operation discovery fallbacks', () => {
  it('recognizes Mastra catalog-navigation tools', () => {
    expect(isSearchResult({ toolName: 'search_tools' })).toBe(true);
    expect(isSearchResult({ name: 'load_tool' })).toBe(true);
    expect(isSearchResult({ toolName: 'dealsAdd' })).toBe(false);
  });

  it('does not report catalog search as completed work', () => {
    const fallback = buildFallbackFromResults([
      {
        toolName: 'search_tools',
        result: { results: [{ toolName: 'dealsAdd' }] },
      },
    ]);

    expect(fallback).toBeNull();
  });

  it('reports the direct operation result after catalog navigation', () => {
    const fallback = buildFallbackFromResults([
      {
        toolName: 'search_tools',
        result: { results: [{ toolName: 'dealsAdd' }] },
      },
      {
        toolName: 'dealsAdd',
        result: { _id: 'deal-1', name: 'Enterprise' },
      },
    ]);

    expect(fallback).toBe('"Enterprise" was created successfully.');
  });
});
