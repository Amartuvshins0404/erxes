import {
  isSecretName,
  redactSecrets,
  REDACTED,
} from '../secretRedaction';

describe('isSecretName', () => {
  it('flags real erxes secret config codes', () => {
    for (const code of [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_SES_ACCESS_KEY_ID',
      'AWS_SES_SECRET_ACCESS_KEY',
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCESS_KEY_ID',
      'CLOUDFLARE_SECRET_ACCESS_KEY',
      'ApiKey',
      'ApiSecret',
      'ApiToken',
      'apiKey',
      'apiSecret',
      'apiToken',
      'password',
      'clientSecret',
      'privateKey',
    ]) {
      expect(isSecretName(code)).toBe(true);
    }
  });

  it('does not flag benign config codes', () => {
    for (const code of [
      'UPLOAD_SERVICE_TYPE',
      'AWS_BUCKET',
      'AWS_REGION',
      'AWS_SES_CONFIG_SET',
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_BUCKET_NAME',
      'CLOUDFLARE_ACCOUNT_HASH',
      'COMPANY_EMAIL_FROM',
      'DEFAULT_EMAIL_SERVICE',
      'TIMEZONE',
      'username',
      'getRemainderUrl',
      'mainCurrency',
    ]) {
      expect(isSecretName(code)).toBe(false);
    }
  });
});

describe('redactSecrets', () => {
  it('hides value of a { code, value } row whose code is a secret, keeping the code', () => {
    const out = redactSecrets([
      { _id: '1', code: 'AWS_SECRET_ACCESS_KEY', value: 'CMckk7a8crDvbl' },
      { _id: '2', code: 'AWS_BUCKET', value: 'erxes' },
    ]);
    expect(out).toEqual([
      { _id: '1', code: 'AWS_SECRET_ACCESS_KEY', value: REDACTED },
      { _id: '2', code: 'AWS_BUCKET', value: 'erxes' },
    ]);
  });

  it('handles the { key, value } row shape used by some modules', () => {
    const out = redactSecrets([
      { key: 'apiToken', value: 'sales-secret' },
      { key: 'title', value: 'My Config' },
    ]);
    expect(out).toEqual([
      { key: 'apiToken', value: REDACTED },
      { key: 'title', value: 'My Config' },
    ]);
  });

  it('redacts secret sub-keys nested inside a non-secret config value', () => {
    // Mirrors the real ERKHET / MSDynamic config rows: the code itself is not a
    // secret, but the value object nests credentials.
    const out = redactSecrets([
      {
        code: 'ERKHET',
        value: {
          apiKey: '0.3171120525513116',
          apiSecret: '0.03827845745455993',
          apiToken: 'sales',
          getRemainderUrl: 'https://erkhet.biz/get-api',
          userEmail: 'secheikheno@gmail.com',
        },
      },
      {
        code: 'DYNAMIC',
        value: { username: 'user@example.com', password: 'Opod@1999' },
      },
    ]);
    expect(out).toEqual([
      {
        code: 'ERKHET',
        value: {
          apiKey: REDACTED,
          apiSecret: REDACTED,
          apiToken: REDACTED,
          getRemainderUrl: 'https://erkhet.biz/get-api',
          userEmail: 'secheikheno@gmail.com',
        },
      },
      {
        code: 'DYNAMIC',
        value: { username: 'user@example.com', password: REDACTED },
      },
    ]);
  });

  it('preserves empty/unset secrets so "not configured" stays truthful', () => {
    const out = redactSecrets([
      { code: 'AWS_SECRET_ACCESS_KEY', value: '' },
      { code: 'ERKHET', value: { apiKey: null, apiSecret: 'real' } },
    ]);
    expect(out).toEqual([
      { code: 'AWS_SECRET_ACCESS_KEY', value: '' },
      { code: 'ERKHET', value: { apiKey: null, apiSecret: REDACTED } },
    ]);
  });

  it('leaves non-secret results and primitives untouched', () => {
    const input = {
      _id: 'abc',
      name: 'Acme',
      amount: 42,
      tags: ['a', 'b'],
      nested: { region: 'us-east-1', count: 3 },
    };
    expect(redactSecrets(input)).toEqual(input);
    expect(redactSecrets(null)).toBeNull();
    expect(redactSecrets('plain string')).toBe('plain string');
  });

  it('does not mutate its input', () => {
    const input = [{ code: 'apiKey', value: 'secret' }];
    const copy = JSON.parse(JSON.stringify(input));
    redactSecrets(input);
    expect(input).toEqual(copy);
  });
});
