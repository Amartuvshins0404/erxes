import { toolKind } from './uiParts';

describe('toolKind', () => {
  // The real stream names are the registry KEYS: builtins are camelCase
  // (`webSearch`), meta tools are snake_case (`execute_erxes_operation`).
  it('routes the real camelCase built-in web tools to their renderers', () => {
    expect(toolKind('webSearch')).toBe('web-search');
    expect(toolKind('fetchUrl')).toBe('fetch-url');
    expect(toolKind('calculator')).toBe('calculator');
  });

  it('matches regardless of casing/separators', () => {
    expect(toolKind('web-search')).toBe('web-search');
    expect(toolKind('web_search')).toBe('web-search');
    expect(toolKind('WebSearch')).toBe('web-search');
  });

  it('groups erxes + knowledge tools as operations', () => {
    expect(toolKind('execute_erxes_operation')).toBe('operation');
    expect(toolKind('search_erxes_operations')).toBe('operation');
    expect(toolKind('companyKnowledge')).toBe('operation');
    expect(toolKind('agentKnowledge')).toBe('operation');
  });

  it('marks artifact-producing tools so the trace can hide them', () => {
    for (const name of [
      'renderChart',
      'renderDiagram',
      'generatePdf',
      'generateDocx',
      'generatePptx',
      'generateXlsx',
    ]) {
      expect(toolKind(name)).toBe('artifact');
    }
  });

  it('falls back to generic for anything unrecognised', () => {
    expect(toolKind('someNewTool')).toBe('generic');
    expect(toolKind('fileReader')).toBe('generic');
    expect(toolKind('')).toBe('generic');
  });
});
