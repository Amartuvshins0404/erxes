import { selectTurnActiveTools } from '../turnToolScope';

const available = [
  'deals',
  'generatePptx',
  'generatePdf',
  'generateDocx',
  'generateXlsx',
  'webSearch',
  'fetchUrl',
  'calculator',
  'renderChart',
  'terminal',
  'workspaceWrite',
  'publishWebsite',
  'fileReader',
  'workflowGuide',
  'workflowValidate',
  'workflowSave',
  'list_config_keys',
];

describe('selectTurnActiveTools', () => {
  it('reduces a PowerPoint turn to the requested generator and dynamic operations', () => {
    const active = selectTurnActiveTools({
      message: 'erxes 3.0 iin taniltsuulgiig power point report deer beldee og',
      attachmentCount: 0,
      availableToolNames: available,
      hasErxesOperations: true,
    });

    expect(active).toEqual(
      expect.arrayContaining(['deals', 'search_tools', 'generatePptx']),
    );
    for (const hidden of [
      'generatePdf',
      'generateXlsx',
      'terminal',
      'publishWebsite',
      'fileReader',
      'workflowGuide',
      'list_config_keys',
    ]) {
      expect(active).not.toContain(hidden);
    }
  });

  it('activates the file reader only when a turn has a file', () => {
    const active = selectTurnActiveTools({
      message: 'Import these contacts',
      attachmentCount: 1,
      availableToolNames: available,
    });

    expect(active).toContain('fileReader');
  });

  it('activates the complete website pack for a landing page', () => {
    const active = selectTurnActiveTools({
      message: 'Build and publish a landing page website',
      attachmentCount: 0,
      availableToolNames: available,
    });

    expect(active).toEqual(
      expect.arrayContaining(['terminal', 'workspaceWrite', 'publishWebsite']),
    );
    expect(active).not.toContain('generatePptx');
  });

  it('keeps analytical helpers narrow', () => {
    const active = selectTurnActiveTools({
      message: 'Calculate a sales forecast and visualize it as a chart',
      attachmentCount: 0,
      availableToolNames: available,
    });

    expect(active).toEqual(
      expect.arrayContaining(['calculator', 'renderChart']),
    );
    expect(active).not.toContain('webSearch');
  });

  it('activates configuration lookup only for a settings request', () => {
    const active = selectTurnActiveTools({
      message: 'Which API key settings are configured?',
      attachmentCount: 0,
      availableToolNames: available,
      hasErxesOperations: true,
    });

    expect(active).toContain('list_config_keys');
  });

  it('recognizes common web, document, and presentation synonyms', () => {
    const cases = [
      ['Look up the current USD exchange rate', 'webSearch'],
      ['Make an editable proposal', 'generateDocx'],
      ['Create a deck for the board', 'generatePptx'],
    ] as const;

    for (const [message, expected] of cases) {
      const active = selectTurnActiveTools({
        message,
        attachmentCount: 0,
        availableToolNames: available,
      });

      expect(active).toContain(expected);
    }
  });

  it('preserves standalone capabilities for an ambiguous unmatched request', () => {
    const active = selectTurnActiveTools({
      message: 'Prepare a board pack',
      attachmentCount: 0,
      availableToolNames: available,
    });

    expect(active).toEqual(
      expect.arrayContaining(['webSearch', 'generatePptx']),
    );
  });

  it('keeps a matched erxes read narrow and small talk tool-free', () => {
    const read = selectTurnActiveTools({
      message: 'Show deals',
      attachmentCount: 0,
      availableToolNames: available,
      hasErxesOperations: true,
      hasIntentOperation: true,
    });
    const greeting = selectTurnActiveTools({
      message: 'Hello!',
      attachmentCount: 0,
      availableToolNames: available,
      hasErxesOperations: true,
    });

    expect(read).toEqual(expect.arrayContaining(['deals', 'search_tools']));
    expect(read).not.toContain('generatePptx');
    expect(greeting).toEqual(expect.arrayContaining(['deals', 'search_tools']));
    expect(greeting).not.toContain('generatePptx');
  });
});
