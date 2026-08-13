import type { ProcessInputStepArgs } from '@mastra/core/processors';
import { ErxesToolSearchProcessor } from '../toolSearch';

// The real @mastra/core processor module pulls ESM-only dependencies Jest
// cannot parse, so the base class is replaced with a stub that reproduces the
// exact wording the real ToolSearchProcessor emits ("on your next turn").
// The test then proves the subclass corrects every emission site.
jest.mock('@mastra/core/processors', () => ({
  ToolSearchProcessor: class {
    async processInputStep(args: {
      messageList: { addSystem(message: unknown): unknown };
    }) {
      args.messageList.addSystem(
        'To discover available tools, call search_tools with a keyword query. Matching tools are loaded automatically and become available on your next turn — there is no separate load step.',
      );
      return {
        tools: {
          search_tools: {
            id: 'search_tools',
            description:
              'Search for available tools by keyword. Returns a list of matching tools, which are loaded automatically and become available on your next turn — no separate load step is required.',
            execute: async () => ({
              results: [],
              message:
                'Found and loaded 1 tool(s): deals. They are available on your next turn — call them directly.',
            }),
          },
        },
      };
    }
  },
}));

function buildProcessor() {
  return new ErxesToolSearchProcessor({
    tools: {},
    search: { topK: 3, minScore: 0.1, autoLoad: true },
    storage: 'context',
  });
}

function stepArgs(systemMessages: string[]): ProcessInputStepArgs {
  return {
    messages: [],
    messageList: {
      addSystem(message: unknown) {
        if (typeof message === 'string') systemMessages.push(message);
        return this;
      },
    },
  } as unknown as ProcessInputStepArgs;
}

describe('ErxesToolSearchProcessor', () => {
  it('describes tool availability as the next step, not the next turn', async () => {
    const systemMessages: string[] = [];
    const result = await buildProcessor().processInputStep(
      stepArgs(systemMessages),
    );

    expect(result.tools.search_tools.description).toContain(
      'on your next step',
    );
    expect(result.tools.search_tools.description).not.toContain('next turn');

    expect(systemMessages.join('\n')).toContain('on your next step');
    expect(systemMessages.join('\n')).not.toContain('next turn');
  });

  it('corrects the search result message wording', async () => {
    const result = await buildProcessor().processInputStep(stepArgs([]));
    const execute = result.tools.search_tools.execute;
    if (!execute) throw new Error('search_tools execute missing');

    const output = (await execute({ query: 'deals' }, {} as never)) as {
      message: string;
    };

    expect(output.message).toContain('on your next step');
    expect(output.message).not.toContain('next turn');
  });
});
