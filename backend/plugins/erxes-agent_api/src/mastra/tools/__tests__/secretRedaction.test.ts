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

  it('flags secrets stored under non-secret-looking names (Gap #3)', () => {
    for (const code of [
      'MAIL_PASS',
      'SMTP_PASS',
      'dbPass',
      'AZURE_STORAGE_CONNECTION_STRING',
      'dbConnectionString',
      'SENTRY_DSN',
    ]) {
      expect(isSecretName(code)).toBe(true);
    }
  });

  it('keeps redacting PUBLIC_API_KEY-style names (apikey wins over exemption)', () => {
    for (const code of ['BLOCKADMIN_PUBLIC_API_KEY', 'MUSHOP_PUBLIC_API_KEY']) {
      expect(isSecretName(code)).toBe(true);
    }
  });

  it('does NOT flag public keys ending in "key" (Gap #6)', () => {
    for (const code of [
      'publicKey',
      'publishableKey',
      'siteKey',
      'applicationServerKey',
      'clientPortalPublicKey',
    ]) {
      expect(isSecretName(code)).toBe(false);
    }
  });

  it('does NOT flag "pass" as a substring (compass/passenger/bypass)', () => {
    for (const code of [
      'compass',
      'bypass',
      'passenger',
      'passport',
      'encompass',
    ]) {
      expect(isSecretName(code)).toBe(false);
    }
  });

  it('does NOT over-redact leading-"pass" (pass/fail) or "dsn" substrings', () => {
    for (const code of [
      'passRate',
      'passCount',
      'passMark',
      'passFail',
      'CustomFieldsNavigation',
      'IconCloudSnow',
      'buildSnapshotMetadata',
    ]) {
      expect(isSecretName(code)).toBe(false);
    }
  });

  it('flags database/broker connection codes by name (MONGO_URL, REDIS_URL)', () => {
    for (const code of [
      'MONGO_URL',
      'CORE_MONGO_URL',
      'REDIS_URL',
      'RABBITMQ_URL',
    ]) {
      expect(isSecretName(code)).toBe(true);
    }
    // benign *_URL / endpoint codes stay visible (no DB/broker token)
    for (const code of [
      'CDN_URL',
      'API_URL',
      'ELASTICSEARCH_URL',
      'MAIN_API_DOMAIN',
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

  it('redacts credentials embedded in a string under a benign field name (Gap #3)', () => {
    expect(redactSecrets({ url: 'mongodb://user:pass@host:27017/db' })).toEqual({
      url: REDACTED,
    });
    expect(
      redactSecrets({ writeUrl: 'postgres://admin:s3cr3t@db.internal:5432/app' }),
    ).toEqual({ writeUrl: REDACTED });
    expect(
      redactSecrets({ endpoint: 'https://pk_abc:sk_xyz@o1.ingest.sentry.io/1' }),
    ).toEqual({ endpoint: REDACTED });
    expect(
      redactSecrets({
        storage:
          'DefaultEndpointsProtocol=https;AccountName=acct;AccountKey=abc123def==;EndpointSuffix=core.windows.net',
      }),
    ).toEqual({ storage: REDACTED });
    expect(redactSecrets('mongodb://user:pass@host/db')).toBe(REDACTED);
  });

  it('redacts more credential value-shapes under benign names (PEM / bearer / query token)', () => {
    expect(
      redactSecrets({
        cert: '-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----',
      }),
    ).toEqual({ cert: REDACTED });
    expect(
      redactSecrets({
        authHeader: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      }),
    ).toEqual({ authHeader: REDACTED });
    expect(
      redactSecrets({ callbackUrl: 'https://api.host/cb?token=sk_live_abc123def' }),
    ).toEqual({ callbackUrl: REDACTED });
  });

  it('hides the value of a { code, value } row for embedded-credential codes', () => {
    expect(
      redactSecrets([
        { code: 'MONGO_URL', value: 'mongodb://u:p@h/db' },
        { code: 'MAIL_PASS', value: 'hunter2' },
      ]),
    ).toEqual([
      { code: 'MONGO_URL', value: REDACTED },
      { code: 'MAIL_PASS', value: REDACTED },
    ]);
  });

  it('does NOT redact benign URLs without a userinfo password', () => {
    const benign = {
      a: 'https://erkhet.biz/get-api',
      b: '${MAIN_API_DOMAIN}/telnyx/webhook',
      c: 'mongodb://mongo:27017/erxes',
      d: 'mongodb://mongo/erxes',
      e: 'https://api.example.com:8080/v1/path',
      f: 'https://user@host/path',
    };
    expect(redactSecrets(benign)).toEqual(benign);
  });

  it('does NOT redact public keys, but still hides the paired secret (Gap #6)', () => {
    expect(redactSecrets('pk_live_51ABCxyz')).toBe('pk_live_51ABCxyz');
    expect(redactSecrets({ publishableKey: 'pk_live_abc' })).toEqual({
      publishableKey: 'pk_live_abc',
    });
    expect(
      redactSecrets({ publicKey: 'pk-lf-1234', secretKey: 'sk-lf-5678' }),
    ).toEqual({ publicKey: 'pk-lf-1234', secretKey: REDACTED });
  });
});
