import { toAiAgentView } from '../aiAgent';

describe('toAiAgentView', () => {
  it('keeps only the connection reference of an agent stored with a legacy embedded key', () => {
    const plain = {
      _id: 'agent-1',
      name: 'Support',
      connection: {
        connectionId: 'conn-1',
        model: 'gpt-5-mini',
        provider: 'openai',
        config: { apiKey: 'legacy-secret', gatewayToken: 'legacy-token' },
      },
    };
    const legacyStored = { ...plain, toObject: () => plain };

    const view = toAiAgentView<{
      name: string;
      connection: Record<string, unknown>;
    }>(legacyStored);

    expect(view.name).toBe('Support');
    expect(view.connection).toEqual({
      connectionId: 'conn-1',
      model: 'gpt-5-mini',
    });
    expect(JSON.stringify(view)).not.toContain('legacy-secret');
    expect(JSON.stringify(view)).not.toContain('legacy-token');
  });
});
