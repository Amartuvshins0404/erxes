// ── Search-engine presentation (favicons + engine identity) ──────────────────
// Icons are sourced at the tool-data level, never faked in the UI: every web
// result carries the real favicon URL for its own domain, and the search card
// carries the engine's identity, so the chat renders whatever the provider
// returns. We search via DuckDuckGo, so we use DDG's own favicon service. Swap
// the search engine later → edit only this file; the UI is untouched and the
// icons follow automatically.

/** The bare hostname of a URL (no leading www.), or '' when unparseable. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** DuckDuckGo's favicon for a URL's domain — real and dynamic, never faked. */
export function faviconFor(url: string): string {
  const host = hostnameOf(url);
  return host ? `https://icons.duckduckgo.com/ip3/${host}.ico` : '';
}

/** The active search engine's identity, shown as the result-card header. */
export const SEARCH_ENGINE = {
  name: 'DuckDuckGo',
  icon: faviconFor('https://duckduckgo.com'),
};
