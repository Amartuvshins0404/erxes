import { createModelConfig, resolveModelConnection } from '@/agents/providers';
import type { IResolvedConnection } from 'erxes-api-shared/core-modules';

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn(),
}));

const { createAnthropic: mockedCreateAnthropic } = jest.requireMock(
  '@ai-sdk/anthropic',
) as { createAnthropic: jest.Mock };

const connection = (
  type: string,
  config: Record<string, unknown> = {},
  secrets: Record<string, string> = {},
): IResolvedConnection => ({
  _id: 'conn-1',
  type,
  name: 'Team key',
  config,
  secrets,
});

const modelFactory = jest.fn((model: string) => ({ modelId: model }));

beforeEach(() => {
  jest.clearAllMocks();
  mockedCreateAnthropic.mockReturnValue(modelFactory);
});

describe('resolveModelConnection', () => {
  it('rejects unsupported providers instead of silently defaulting', () => {
    expect(() =>
      resolveModelConnection({
        connection: connection('not-a-provider', {}, { apiKey: 'k' }),
      }),
    ).toThrow('Unsupported AI provider "not-a-provider"');
  });

  it('requires an API key for direct providers and points at Connections', () => {
    expect(() =>
      resolveModelConnection({ connection: connection('openai') }),
    ).toThrow(
      'Connection "Team key" has no API key. Add it in Settings → Connections.',
    );
    expect(() =>
      resolveModelConnection({
        connection: connection('openai', {}, { apiKey: '   ' }),
      }),
    ).toThrow('has no API key');
  });

  it('requires accountId and gatewayId for the Cloudflare gateway', () => {
    expect(() =>
      resolveModelConnection({
        connection: connection('cloudflare-ai-gateway', {}, { apiKey: 'k' }),
      }),
    ).toThrow('needs an account ID and gateway ID');
  });

  it('falls back to public defaults for model and endpoint, never for credentials', () => {
    expect(
      resolveModelConnection({
        connection: connection('openai', {}, { apiKey: 'sk-test' }),
      }),
    ).toEqual({
      provider: 'openai',
      model: 'gpt-5.6-luna',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      headers: {},
    });
  });

  it('prefers connection config and the requested model over provider defaults', () => {
    const resolved = resolveModelConnection({
      connection: connection(
        'grok',
        { baseUrl: 'https://proxy.example.com/v1', headers: { 'x-trace': 'abc' } },
        { apiKey: 'xk' },
      ),
      model: 'grok-custom',
    });

    expect(resolved.model).toBe('grok-custom');
    expect(resolved.baseUrl).toBe('https://proxy.example.com/v1');
    expect(resolved.headers).toEqual({ 'x-trace': 'abc' });
  });

  it('builds the Cloudflare gateway URL per mode and trims slashes', () => {
    const base = { accountId: '/acc-1/', gatewayId: 'gw-1' };

    expect(
      resolveModelConnection({
        connection: connection('cloudflare-ai-gateway', base),
      }).baseUrl,
    ).toBe('https://gateway.ai.cloudflare.com/v1/acc-1/gw-1/compat');
    expect(
      resolveModelConnection({
        connection: connection('cloudflare-ai-gateway', {
          ...base,
          mode: 'openai-provider',
          baseUrl: 'https://gateway.example.com/',
        }),
      }).baseUrl,
    ).toBe('https://gateway.example.com/acc-1/gw-1/openai');
  });

  it('sends the Cloudflare gateway token as an authorization header', () => {
    const resolved = resolveModelConnection({
      connection: connection(
        'cloudflare-ai-gateway',
        { accountId: 'a', gatewayId: 'g' },
        { gatewayToken: 'cf-token' },
      ),
    });

    expect(resolved.headers).toEqual({
      'cf-aig-authorization': 'Bearer cf-token',
    });
  });
});

describe('createModelConfig', () => {
  it('returns Mastra’s native config object for OpenAI-compatible providers', async () => {
    const model = await createModelConfig(
      resolveModelConnection({
        connection: connection('grok', {}, { apiKey: 'xk' }),
        model: 'grok-4.5',
      }),
    );

    expect(model).toEqual({
      id: 'grok/grok-4.5',
      url: 'https://api.x.ai/v1',
      apiKey: 'xk',
      headers: {},
    });
    expect(mockedCreateAnthropic).not.toHaveBeenCalled();
  });

  it('routes OpenAI on the default endpoint through Mastra’s native gateway (no url)', async () => {
    const model = await createModelConfig(
      resolveModelConnection({
        connection: connection('openai', {}, { apiKey: 'sk-test' }),
        model: 'gpt-5.6-luna',
      }),
    );

    expect(model).toEqual({
      id: 'openai/gpt-5.6-luna',
      apiKey: 'sk-test',
      headers: {},
    });
  });

  it('keeps the openai-compatible path for an explicit OpenAI proxy endpoint', async () => {
    const model = await createModelConfig(
      resolveModelConnection({
        connection: connection(
          'openai',
          { baseUrl: 'https://proxy.example.com/v1' },
          { apiKey: 'sk-test' },
        ),
        model: 'gpt-5.6-luna',
      }),
    );

    expect(model).toEqual({
      id: 'openai/gpt-5.6-luna',
      url: 'https://proxy.example.com/v1',
      apiKey: 'sk-test',
      headers: {},
    });
  });

  it('normalizes the kimi-code base URL to the versioned layout exactly once', async () => {
    await createModelConfig(
      resolveModelConnection({
        connection: connection('kimi-code', {}, { apiKey: 'kk' }),
      }),
    );
    await createModelConfig(
      resolveModelConnection({
        connection: connection(
          'kimi-code',
          { baseUrl: 'https://proxy.example.com/coding/v1/' },
          { apiKey: 'kk' },
        ),
      }),
    );

    expect(mockedCreateAnthropic).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ baseURL: 'https://api.kimi.com/coding/v1' }),
    );
    expect(mockedCreateAnthropic).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ baseURL: 'https://proxy.example.com/coding/v1' }),
    );
  });

  it('authenticates kimi-code with both header styles, letting connection headers win, and never passes authToken', async () => {
    await createModelConfig(
      resolveModelConnection({
        connection: connection(
          'kimi-code',
          { headers: { Authorization: 'Bearer override', 'x-extra': 'v' } },
          { apiKey: 'kk' },
        ),
      }),
    );

    const config = mockedCreateAnthropic.mock.calls[0][0] as Record<string, unknown>;

    expect(config).toEqual(
      expect.objectContaining({
        apiKey: 'kk',
        headers: { Authorization: 'Bearer override', 'x-extra': 'v' },
      }),
    );
    expect(config).not.toHaveProperty('authToken');
  });

  it('builds the kimi-code language model for the resolved model id', async () => {
    const model = await createModelConfig(
      resolveModelConnection({
        connection: connection('kimi-code', {}, { apiKey: 'kk' }),
        model: 'kimi-custom',
      }),
    );

    expect(modelFactory).toHaveBeenCalledWith('kimi-custom');
    expect(model).toEqual({ modelId: 'kimi-custom' });
  });
});
