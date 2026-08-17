import { buildSystemPrompt } from '../instructions/routing';

describe('buildSystemPrompt', () => {
  it('omits document and chart manuals from an unrelated turn', () => {
    const prompt = buildSystemPrompt('', {
      hasErxesTools: false,
      scopeLine: '',
      builtins: [
        { id: 'calculator', name: 'calculator', description: 'Calculate' },
      ],
    });

    expect(prompt).toContain('Configured capabilities: calculator');
    expect(prompt).not.toContain('Charts:');
  });

  it('adds only the relevant optional guidance', () => {
    const prompt = buildSystemPrompt('', {
      hasErxesTools: false,
      scopeLine: '',
      builtins: [
        {
          id: 'renderChart',
          name: 'renderChart',
          description: 'Render a chart',
        },
      ],
    });

    expect(prompt).toContain('Charts:');
    expect(prompt.length).toBeLessThan(10_000);
  });
});
