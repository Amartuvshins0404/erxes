// Agent pages render in two shells — the AI-Agents console (`/erxes-agent`) and
// generic Settings (`/settings/erxes-agent`). Resolve the agents base for the
// shell of the given pathname so navigation stays inside that shell.
export const resolveAgentsBasePath = (pathname: string): string =>
  pathname.startsWith('/settings/erxes-agent')
    ? '/settings/erxes-agent/agents'
    : '/erxes-agent/agents';

// Names are not unique, so callers can add an account-id suffix only where
// two AI team members would otherwise render identically.
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
