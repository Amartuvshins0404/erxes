import { runAgentTurn, synthesizeFromToolResults } from '@/agent/run';

const teams = [
  { _id: 'team-1', name: 'Demo Team' },
  { _id: 'team-2', name: 'Sales' },
];

describe('tool result synthesis', () => {
  it('keeps reply text when the turn produced real tool results', async () => {
    const generate = jest.fn().mockResolvedValue({
      text: 'The system has Demo Team and Sales.',
      toolResults: [{ toolName: 'getTeams', result: teams }],
    });

    const reply = await runAgentTurn({
      agent: { generate } as never,
      convo: [{ role: 'user', content: 'What teams exist?' }],
      message: 'What teams exist?',
      authCtx: {},
      activeTools: ['search_tools'],
      turnInstructions: '',
      guardProviderCompletion: true,
    });

    expect(reply).toBe('The system has Demo Team and Sales.');
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('replaces a reply that stalls right after a tool search', async () => {
    const searchResult = {
      results: [{ name: 'getTeams', description: 'teams query', score: 9 }],
      message: 'Found and loaded 1 tool(s): getTeams.',
    };
    const generate = jest.fn().mockResolvedValue({
      text: 'I will look up the teams next.',
      toolResults: [{ toolName: 'search_tools', result: searchResult }],
    });

    const reply = await runAgentTurn({
      agent: { generate } as never,
      convo: [{ role: 'user', content: 'What teams exist?' }],
      message: 'What teams exist?',
      authCtx: {},
      activeTools: ['search_tools'],
      turnInstructions: '',
      guardProviderCompletion: true,
    });

    expect(reply).toBe('Something went wrong. Please try again.');
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('keeps search-stalled text from providers that do not need the guard', async () => {
    const searchResult = {
      results: [{ name: 'getTeams', description: 'teams query', score: 9 }],
      message: 'Found and loaded 1 tool(s): getTeams.',
    };
    const generate = jest.fn().mockResolvedValue({
      text: 'I will look up the teams next.',
      toolResults: [{ toolName: 'search_tools', result: searchResult }],
    });

    const reply = await runAgentTurn({
      agent: { generate } as never,
      convo: [{ role: 'user', content: 'What teams exist?' }],
      message: 'What teams exist?',
      authCtx: {},
      activeTools: ['search_tools'],
      turnInstructions: '',
      guardProviderCompletion: false,
    });

    expect(reply).toBe('I will look up the teams next.');
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('disables tools while turning operation results into the final answer', async () => {
    const generate = jest.fn().mockResolvedValue({
      text: 'The system has Demo Team and Sales.',
    });

    const reply = await synthesizeFromToolResults({
      agent: { generate } as never,
      message: 'What teams exist on this system?',
      authCtx: {},
      toolResults: [{ toolName: 'getTeams', result: teams }],
    });

    expect(reply).toBe('The system has Demo Team and Sales.');
    expect(generate).toHaveBeenCalledWith(expect.any(Array), {
      maxSteps: 1,
      activeTools: [],
      toolChoice: 'none',
      instructions:
        'Summarize supplied tool results accurately in one or two sentences. Never call tools.',
    });
  });

  it('sends one copy of repeated operation data to the synthesis model', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'Two teams exist.' });

    await synthesizeFromToolResults({
      agent: { generate } as never,
      message: 'What teams exist on this system?',
      authCtx: {},
      toolResults: [
        { toolName: 'getTeams', result: teams },
        { toolName: 'getTeams', result: teams },
      ],
    });

    const messages = generate.mock.calls[0][0] as Array<{ content: string }>;
    expect(messages[0].content.match(/\[getTeams\]:/g)).toHaveLength(1);
  });
});
