import { selectTurnActiveTools } from '../turnToolScope';

const available = [
  'deals',
  'generatePptx',
  'webSearch',
  'fetchUrl',
  'calculator',
  'fileReader',
];

describe('selectTurnActiveTools', () => {
  it('keeps every approved tool active so the model decides', () => {
    const active = selectTurnActiveTools({ availableToolNames: available });

    expect(active).toEqual(expect.arrayContaining(available));
  });

  it('adds operation search only when the agent has erxes operations', () => {
    const withOps = selectTurnActiveTools({
      availableToolNames: available,
      hasErxesOperations: true,
    });
    const withoutOps = selectTurnActiveTools({
      availableToolNames: available,
    });

    expect(withOps).toEqual(
      expect.arrayContaining([...available, 'search_tools']),
    );
    expect(withoutOps).not.toContain('search_tools');
  });

  it('adds skill tools only when runtime skills are enabled', () => {
    const withSkills = selectTurnActiveTools({
      availableToolNames: available,
      skillsEnabled: true,
    });
    const withoutSkills = selectTurnActiveTools({
      availableToolNames: available,
    });

    expect(withSkills).toEqual(
      expect.arrayContaining(['skill', 'skill_search', 'skill_read']),
    );
    expect(withoutSkills).not.toContain('skill_read');
  });
});
