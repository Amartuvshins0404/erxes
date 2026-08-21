import { duplicatedAgentNames, resolveAgentsBasePath } from './utils';

describe('resolveAgentsBasePath', () => {
  it('keeps agent CRUD inside settings', () => {
    expect(resolveAgentsBasePath('/settings/erxes-agent/agents')).toBe(
      '/settings/erxes-agent/agents',
    );
  });

  it('uses the main agent module outside settings', () => {
    expect(resolveAgentsBasePath('/erxes-agent/agents')).toBe(
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
