import { resolveConnection } from 'erxes-api-shared/core-modules';
import { resolveAiAgentConnection } from '../agentConnection';

jest.mock('erxes-api-shared/core-modules', () => ({
  resolveConnection: jest.fn(),
}));

const resolveConnectionMock = resolveConnection as jest.MockedFunction<
  typeof resolveConnection
>;

const subdomain = 'localhost';

const resolveAgent = (connectionId = 'conn-1', model = 'gpt-5-mini') =>
  resolveAiAgentConnection({
    subdomain,
    connection: { connectionId, model },
  });

describe('resolveAiAgentConnection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resolveConnectionMock.mockReset();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('maps a resolved openai connection to the provider config', async () => {
    resolveConnectionMock.mockResolvedValue({
      _id: 'conn-1',
      type: 'openai',
      name: 'Support OpenAI',
      config: { headers: { 'x-team': 'support' } },
      secrets: { apiKey: 'test-key-value' },
    });

    const result = await resolveAgent();

    expect(resolveConnectionMock).toHaveBeenCalledWith({
      subdomain,
      connectionId: 'conn-1',
    });
    expect(result).toMatchObject({
      provider: 'openai',
      model: 'gpt-5-mini',
      config: {
        apiKey: 'test-key-value',
        baseUrl: 'https://api.openai.com/v1',
        headers: { 'x-team': 'support' },
      },
    });
  });

  it('builds the cloudflare gateway url and auth header from the connection', async () => {
    resolveConnectionMock.mockResolvedValue({
      _id: 'conn-2',
      type: 'cloudflare-ai-gateway',
      name: 'Gateway',
      config: { accountId: 'acc1', gatewayId: 'gw1', mode: 'compat' },
      secrets: { gatewayToken: 'gate-token', apiKey: 'provider-key' },
    });

    const result = await resolveAgent('conn-2', 'openai/gpt-5-mini');

    expect(result.provider).toBe('cloudflare-ai-gateway');
    expect(result.config.baseUrl).toBe(
      'https://gateway.ai.cloudflare.com/v1/acc1/gw1/compat',
    );
    expect(result.config.apiKey).toBe('provider-key');
    expect(result.config.headers).toEqual({
      'cf-aig-authorization': 'Bearer gate-token',
    });
  });

  it('fails with the connection name when the api key is missing, ignoring env keys', async () => {
    process.env.OPENAI_API_KEY = 'env-key-must-not-be-used';
    resolveConnectionMock.mockResolvedValue({
      _id: 'conn-1',
      type: 'openai',
      name: 'Support OpenAI',
      config: {},
      secrets: {},
    });

    await expect(resolveAgent()).rejects.toThrow(
      'AI connection "Support OpenAI" has no API key',
    );
  });

  it('fails clearly when the agent has no connection selected', async () => {
    await expect(resolveAgent('')).rejects.toThrow(
      'no AI connection selected',
    );
    expect(resolveConnectionMock).not.toHaveBeenCalled();
  });

  it('reports a connection that is removed or not shared with automations', async () => {
    resolveConnectionMock.mockRejectedValue(new Error('Connection not found'));

    await expect(resolveAgent()).rejects.toThrow(
      'removed or is not shared with automations',
    );
  });

  it('reports a service authentication failure instead of a missing connection', async () => {
    resolveConnectionMock.mockRejectedValue(
      new Error('Invalid service authentication'),
    );

    await expect(resolveAgent()).rejects.toThrow(
      'could not authenticate with core',
    );
  });

  it('rejects connection types automations cannot use', async () => {
    resolveConnectionMock.mockResolvedValue({
      _id: 'conn-3',
      type: 'smtp',
      name: 'Mailer',
      config: {},
      secrets: {},
    });

    await expect(resolveAgent('conn-3')).rejects.toThrow(
      'which automations cannot use',
    );
  });
});
