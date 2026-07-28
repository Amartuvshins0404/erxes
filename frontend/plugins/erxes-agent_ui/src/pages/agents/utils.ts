// Agent pages render in two shells — the AI-Agents console (`/erxes-agent`) and
// generic Settings (`/settings/erxes-agent`). Resolve the agents base for the
// shell of the given pathname so navigation stays inside that shell.
export const resolveAgentsBasePath = (pathname: string): string =>
  pathname.startsWith('/settings/erxes-agent')
    ? '/settings/erxes-agent/agents'
    : '/erxes-agent/agents';

// Names aren't unique, so same-named agents render as identical picker rows.
// Return the set of names that appear more than once so those rows can be
// tagged with their unique agentId.
export const duplicatedAgentNames = (names: string[]): Set<string> => {
  const counts = new Map<string, number>();
  const duplicates = new Set<string>();
  for (const name of names) {
    const next = (counts.get(name) ?? 0) + 1;
    counts.set(name, next);
    if (next === 2) duplicates.add(name);
  }
  return duplicates;
};

// Slugify a name into an agentId. Names with no ASCII alphanumerics (e.g.
// "日本語", "!!!") would otherwise slug to an empty string and fail the
// required-field check with no visible hint — fall back to a non-empty default.
export const toSlug = (name: string, fallback = 'agent'): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || fallback;
