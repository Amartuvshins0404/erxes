// Proves the provider READ path is secret-free: the raw apiKey never appears in
// the GraphQL-facing object, only `hasApiKey` + a masked last-4 `apiKeyHint`.
import { maskApiKey, toPublicProvider } from '@/provider/utils/mask';

describe('maskApiKey', () => {
  it('returns null when there is no key', () => {
    expect(maskApiKey(undefined)).toBeNull();
    expect(maskApiKey(null)).toBeNull();
    expect(maskApiKey('')).toBeNull();
  });

  it('fully masks short keys so nothing recoverable leaks', () => {
    expect(maskApiKey('ab')).toBe('••••');
    expect(maskApiKey('abcd')).toBe('••••');
  });

  it('keeps only the last 4 chars as a recognition hint', () => {
    expect(maskApiKey('sk-secret-1234')).toBe('••••1234');
    expect(maskApiKey('sk-proj-abcd-efgh')).toBe('••••efgh');
  });
});

describe('toPublicProvider', () => {
  const RAW_KEY = 'sk-super-secret-a1b2';
  const SECRET_HEADER = 'Bearer super-secret-header-token';

  it('strips apiKey + header values, exposes hasApiKey, hint, headerKeys', () => {
    const doc = {
      toObject: () => ({
        _id: 'p1',
        provider: 'openai',
        label: 'OpenAI',
        apiKey: RAW_KEY,
        headers: {
          Authorization: SECRET_HEADER,
          'User-Agent': 'claude-cli/1.0',
        },
        baseUrl: '',
        isEnabled: true,
      }),
    };

    const pub = toPublicProvider(doc);

    expect(pub).not.toBeNull();
    expect(pub).not.toHaveProperty('apiKey');
    expect(pub).not.toHaveProperty('headers');
    expect(pub?.hasApiKey).toBe(true);
    expect(pub?.apiKeyHint).toBe('••••a1b2');
    // Only header NAMES are exposed, never their (potentially secret) values.
    expect(pub?.headerKeys).toEqual(['Authorization', 'User-Agent']);
    // The acceptance proof: neither secret appears anywhere in the output.
    expect(JSON.stringify(pub)).not.toContain(RAW_KEY);
    expect(JSON.stringify(pub)).not.toContain('super-secret');
    expect(JSON.stringify(pub)).not.toContain(SECRET_HEADER);
  });

  it('reports hasApiKey=false, null hint, empty headerKeys when none set', () => {
    const pub = toPublicProvider({
      _id: 'p2',
      provider: 'custom',
      envKey: 'MY_KEY',
    });

    expect(pub?.hasApiKey).toBe(false);
    expect(pub?.apiKeyHint).toBeNull();
    expect(pub?.headerKeys).toEqual([]);
    expect(pub).not.toHaveProperty('apiKey');
    expect(pub).not.toHaveProperty('headers');
  });

  it('handles a plain object (no toObject) and still strips both secrets', () => {
    const pub = toPublicProvider({
      _id: 'p3',
      provider: 'anthropic',
      apiKey: RAW_KEY,
      headers: { 'x-api-key': SECRET_HEADER },
    });

    expect(pub).not.toHaveProperty('apiKey');
    expect(pub).not.toHaveProperty('headers');
    expect(pub?.hasApiKey).toBe(true);
    expect(pub?.headerKeys).toEqual(['x-api-key']);
    expect(JSON.stringify(pub)).not.toContain(RAW_KEY);
    expect(JSON.stringify(pub)).not.toContain(SECRET_HEADER);
  });

  it('returns null for null/undefined input', () => {
    expect(toPublicProvider(null)).toBeNull();
    expect(toPublicProvider(undefined)).toBeNull();
  });
});
