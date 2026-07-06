import { resolveAgentsBasePath, duplicatedAgentNames } from './utils';

describe('resolveAgentsBasePath', () => {
  it('keeps the AI-Agents console shell for console routes', () => {
    expect(resolveAgentsBasePath('/erxes-agent/agents')).toBe(
      '/erxes-agent/agents',
    );
    expect(resolveAgentsBasePath('/erxes-agent/agents/new')).toBe(
      '/erxes-agent/agents',
    );
    expect(resolveAgentsBasePath('/erxes-agent/agents/edit/abc')).toBe(
      '/erxes-agent/agents',
    );
  });

  it('keeps the Settings shell for settings routes', () => {
    expect(resolveAgentsBasePath('/settings/erxes-agent/agents')).toBe(
      '/settings/erxes-agent/agents',
    );
    expect(resolveAgentsBasePath('/settings/erxes-agent/agents/new')).toBe(
      '/settings/erxes-agent/agents',
    );
  });

  it('defaults to the console shell for unrelated paths', () => {
    expect(resolveAgentsBasePath('/erxes-agent/chat')).toBe(
      '/erxes-agent/agents',
    );
  });
});

describe('duplicatedAgentNames', () => {
  it('returns only names that appear more than once', () => {
    const dupes = duplicatedAgentNames(['Support', 'Sales', 'Support', 'Ops']);
    expect(dupes.has('Support')).toBe(true);
    expect(dupes.has('Sales')).toBe(false);
    expect(dupes.has('Ops')).toBe(false);
    expect(dupes.size).toBe(1);
  });

  it('is empty when all names are unique', () => {
    expect(duplicatedAgentNames(['A', 'B', 'C']).size).toBe(0);
  });

  it('handles an empty list', () => {
    expect(duplicatedAgentNames([]).size).toBe(0);
  });
});
