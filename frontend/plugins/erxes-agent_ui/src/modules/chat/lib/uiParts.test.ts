import { toolKind, asToolPart } from './uiParts';
import type { AgentUIMessage } from '~/modules/chat/types';

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

type MessagePart = AgentUIMessage['parts'][number];

const toolPart = (overrides: Record<string, unknown>): MessagePart =>
  ({ type: 'dynamic-tool', toolName: 'do_thing', ...overrides }) as MessagePart;

describe('asToolPart isError', () => {
  it('flags a hard output-error state', () => {
    const view = asToolPart(toolPart({ state: 'output-error', errorText: 'boom' }));
    expect(view?.isError).toBe(true);
  });

  // The fix: a tool that caught its own failure returns `{error:true}` with a
  // NORMAL output-available state. It must still read as a failed call so the row
  // shows the error styling instead of a green success check.
  it('flags a soft {error:true} output on an output-available state', () => {
    const view = asToolPart(
      toolPart({ state: 'output-available', output: { error: true, message: 'nope' } }),
    );
    expect(view?.isError).toBe(true);
  });

  it('does not flag a normal successful output', () => {
    const view = asToolPart(
      toolPart({ state: 'output-available', output: { ok: true, error: false } }),
    );
    expect(view?.isError).toBe(false);
  });

  it('does not flag a non-object output', () => {
    const view = asToolPart(
      toolPart({ state: 'output-available', output: 'plain string result' }),
    );
    expect(view?.isError).toBe(false);
  });
});
