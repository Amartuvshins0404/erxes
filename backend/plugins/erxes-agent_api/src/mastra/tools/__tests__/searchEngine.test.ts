import { faviconFor, hostnameOf, SEARCH_ENGINE } from '../searchEngine';

describe('hostnameOf', () => {
  it('strips scheme and leading www.', () => {
    expect(hostnameOf('https://www.ycombinator.com/companies')).toBe(
      'ycombinator.com',
    );
    expect(hostnameOf('http://thevccorner.com/yc-w26')).toBe('thevccorner.com');
  });

  it('keeps sub-domains other than www', () => {
    expect(hostnameOf('https://docs.erxes.io/guide')).toBe('docs.erxes.io');
  });

  it('returns empty string for an unparseable URL', () => {
    expect(hostnameOf('not a url')).toBe('');
    expect(hostnameOf('')).toBe('');
  });
});

describe('faviconFor', () => {
  it('builds the DuckDuckGo favicon URL for a domain', () => {
    expect(faviconFor('https://www.ycombinator.com/x')).toBe(
      'https://icons.duckduckgo.com/ip3/ycombinator.com.ico',
    );
  });

  it('returns empty string when the host cannot be derived', () => {
    expect(faviconFor('garbage')).toBe('');
  });
});

describe('SEARCH_ENGINE', () => {
  it('identifies DuckDuckGo with its own real favicon', () => {
    expect(SEARCH_ENGINE.name).toBe('DuckDuckGo');
    expect(SEARCH_ENGINE.icon).toBe(
      'https://icons.duckduckgo.com/ip3/duckduckgo.com.ico',
    );
  });
});
