import {
  RepeatedToolCallFilter,
  USE_CURRENT_TOOL_RESULT_INSTRUCTION,
} from '../repeatedToolCallFilter';
import { runToolOnce, runWithAuth } from '../requestContext';

const makeStep = (toolName: string, input: unknown, toolCallId = 'call-id') =>
  ({
    toolCalls: [{ toolName, toolCallId, input }],
    toolResults: [{ toolName, toolCallId, input, output: 1 }],
  } as never);

const makeResultOnlyStep = (
  toolName: string,
  input: unknown,
  toolCallId = 'call-id',
) =>
  ({
    toolCalls: [],
    toolResults: [{ toolName, toolCallId, input, output: 1 }],
  } as never);

function runFilter(params: {
  steps: unknown[];
  state?: Record<string, unknown>;
  activeTools?: string[];
  toolChoice?: 'auto' | 'required' | 'none';
}) {
  const addSystem = jest.fn();
  const tools = {
    dealsTotalCount: { id: 'dealsTotalCount' },
    search_tools: { id: 'search_tools' },
  };
  const filter = new RepeatedToolCallFilter();
  const result = filter.processInputStep({
    steps: params.steps,
    state: params.state ?? {},
    tools,
    activeTools: params.activeTools ?? Object.keys(tools),
    toolChoice: params.toolChoice,
    messageList: { addSystem },
  } as never);
  return { result, addSystem };
}

describe('RepeatedToolCallFilter', () => {
  it('tells the model to use the first completed result', () => {
    const { result, addSystem } = runFilter({
      steps: [makeStep('dealsTotalCount', {})],
    });

    expect(result).toEqual({});
    expect(addSystem).toHaveBeenCalledWith(
      expect.stringContaining(USE_CURRENT_TOOL_RESULT_INSTRUCTION),
    );
    expect(addSystem).not.toHaveBeenCalledWith(
      expect.stringContaining('"output":1'),
    );
  });

  it('removes a tool after an exact call repeats', () => {
    const { result } = runFilter({
      steps: [
        makeStep('dealsTotalCount', {}, 'call-1'),
        makeStep('dealsTotalCount', {}, 'call-2'),
      ],
      toolChoice: 'required',
    });

    expect(result).toEqual({
      tools: {},
      activeTools: [],
      toolChoice: 'none',
    });
  });

  it('detects repeats from result-only provider steps', () => {
    const { result } = runFilter({
      steps: [
        makeResultOnlyStep('dealsTotalCount', {}, 'call-1'),
        makeResultOnlyStep('dealsTotalCount', {}, 'call-2'),
      ],
    });

    expect(result).toEqual({
      tools: {},
      activeTools: [],
      toolChoice: 'none',
    });
  });

  it('recognizes reordered object keys as the same exact call', () => {
    const { result } = runFilter({
      steps: [
        makeStep('dealsTotalCount', { filter: { b: 2, a: 1 } }, 'call-1'),
        makeStep('dealsTotalCount', { filter: { a: 1, b: 2 } }, 'call-2'),
      ],
    });

    expect(result).toEqual({
      tools: {},
      activeTools: [],
      toolChoice: 'none',
    });
  });

  it('keeps the same tool available for genuinely different queries', () => {
    const { result } = runFilter({
      steps: [
        makeStep('dealsTotalCount', { status: 'open' }, 'call-1'),
        makeStep('dealsTotalCount', { status: 'won' }, 'call-2'),
      ],
    });

    expect(result).toEqual({});
  });

  it('forces an answer after the interactive read-turn budget', async () => {
    await runWithAuth(
      { turnId: 'turn-budget', toolAnswerLimit: 2 },
      async () => {
        await runToolOnce('deals', { limit: 3 }, async () => ['first']);
        await runToolOnce('search_tools', { query: 'deals' }, async () => [
          'second',
        ]);

        const { result, addSystem } = runFilter({
          steps: [makeStep('deals', { limit: 3 })],
        });

        expect(result).toEqual({
          tools: {},
          activeTools: [],
          toolChoice: 'none',
        });
        expect(addSystem).toHaveBeenCalledWith(
          expect.stringContaining('preceding tool-result messages'),
        );
      },
    );
  });

  it('adds the result reminder only once per request', () => {
    const state: Record<string, unknown> = {};
    const first = runFilter({
      steps: [makeStep('dealsTotalCount', {})],
      state,
    });
    const second = runFilter({
      steps: [makeStep('dealsTotalCount', {})],
      state,
    });

    expect(first.addSystem).toHaveBeenCalledTimes(1);
    expect(second.addSystem).not.toHaveBeenCalled();
  });
});
