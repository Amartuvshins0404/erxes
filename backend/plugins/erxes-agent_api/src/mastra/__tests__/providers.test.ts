import { buildModel } from '../providers';

describe('buildModel credential resolution', () => {
  const originalKimiApiKey = process.env.KIMI_API_KEY;

  afterEach(() => {
    if (originalKimiApiKey === undefined) {
      delete process.env.KIMI_API_KEY;
    } else {
      process.env.KIMI_API_KEY = originalKimiApiKey;
    }
  });

  it('uses the user-stored key for Kimi For Coding', () => {
    process.env.KIMI_API_KEY = 'server-key';

    const model = buildModel('kimi-for-coding', 'kimi-for-coding', [
      {
        provider: 'kimi-for-coding',
        isEnabled: true,
        apiKey: 'user-key',
      },
    ]);

    expect(model).toMatchObject({ apiKey: 'user-key' });
  });

  it('does not fall back to the server environment for Kimi For Coding', () => {
    process.env.KIMI_API_KEY = 'server-key';

    const model = buildModel('kimi-for-coding', 'kimi-for-coding', []);

    expect(model).toMatchObject({ apiKey: undefined });
  });
});
