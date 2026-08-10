import { runAgentTurn, synthesizeFromToolResults } from '@/agent/run';

const teams = [
  { _id: 'team-1', name: 'Demo Team' },
  { _id: 'team-2', name: 'Sales' },
];

describe('tool result synthesis', () => {
  it('replaces blocking progress text with the completed operation result', async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        text: 'I’ll pull up the teams on your system now.',
        toolResults: [{ toolName: 'getTeams', result: teams }],
      })
      .mockResolvedValueOnce({
        text: 'The system has Demo Team and Sales.',
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
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        activeTools: [],
        toolChoice: 'none',
      }),
    );
  });

  it('keeps progress-like text from providers that do not need the guard', async () => {
    const generate = jest.fn().mockResolvedValue({
      text: 'I’ll build another report if requested. The current total is 12.',
      toolResults: [{ toolName: 'getTeams', result: teams }],
    });

    const reply = await runAgentTurn({
      agent: { generate } as never,
      convo: [{ role: 'user', content: 'What is the current total?' }],
      message: 'What is the current total?',
      authCtx: {},
      activeTools: ['search_tools'],
      turnInstructions: '',
      guardProviderCompletion: false,
    });

    expect(reply).toBe(
      'I’ll build another report if requested. The current total is 12.',
    );
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
