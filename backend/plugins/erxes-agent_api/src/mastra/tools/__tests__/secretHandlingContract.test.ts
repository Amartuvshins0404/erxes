/**
 * BLACK-BOX contract tests for erxes-agent secret handling.
 *
 * These tests are derived ONLY from the behavioral security contract, not from
 * the implementation source. Expected values come from the contract + adversarial
 * security reasoning. If an assertion fails, it is recorded as a candidate defect
 * (see the report), NOT edited to match observed behavior.
 *
 * Security goal under test: the LLM agent must NEVER see raw secret VALUES in
 * GraphQL results, and must never be able to write secret placeholders back.
 */

// --- Harness mocks (plumbing only; do not encode expected behavior) -----------
// createTool is identity so a built tool === the config object (has .execute).
jest.mock('@mastra/core/tools', () => ({ createTool: (config: unknown) => config }));

// erxes-api-shared is mocked so nothing hits a live core. sendTRPCMessage is a
// jest.fn() created INSIDE the factory (avoids TDZ/hoist issues); we grab the
// mocked reference via the import below and drive it per-test.
jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: jest.fn(),
  getPlugins: jest.fn(async () => []),
  getPluginAddress: jest.fn(async () => ''),
}));

import {
  isSecretName,
  redactSecrets,
  REDACTED,
} from '../secretRedaction';
import {
  executeErxesOperation,
  type ErxesOperationRef,
  type GqlArgDef,
} from '../erxesTools';
import { buildErxesSupportTools } from '../metaTools';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { runWithAuth } from '../../requestContext';

const mockSend = sendTRPCMessage as unknown as jest.Mock;

// Unreachable gateway: a real network attempt fails fast AFTER the code runs.
const SETTINGS = { erxesApiUrl: 'http://127.0.0.1:59999', erxesApiToken: '' };

// -----------------------------------------------------------------------------
// SECTION 3 (foundational): isSecretName — the name-level predicate.
// -----------------------------------------------------------------------------
describe('isSecretName — name-level predicate', () => {
  const SECRET_NAMES = [
    'AWS_SECRET_ACCESS_KEY',
    'CLOUDFLARE_API_TOKEN',
    'apiKey',
    'apiToken',
    'apiSecret',
    'MAIL_PASS',
    'SMTP_PASS',
    'MONGO_URL',
    'SENTRY_DSN',
    'AZURE_STORAGE_CONNECTION_STRING',
    'password',
    'clientSecret',
    'privateKey',
    'accessToken',
    'serviceAccountKey',
    'secretKey',
    // "public" but still secret because they embed api key material:
    'BLOCKADMIN_PUBLIC_API_KEY',
    'MUSHOP_PUBLIC_API_KEY',
  ];

  const BENIGN_NAMES = [
    'bucket',
    'region',
    'accountId',
    'url',
    'endpoint',
    'username',
    'hostname',
    // public keys by design:
    'publishableKey',
    'publicKey',
    'siteKey',
    // benign names that merely contain a secret substring:
    'compass',
    'bypass',
    'passenger',
    'passRate',
    'passCount',
    'CustomFieldsNavigation',
  ];

  it.each(SECRET_NAMES)('treats %s as SECRET', (name) => {
    expect(isSecretName(name)).toBe(true);
  });

  it.each(BENIGN_NAMES)('treats %s as NON-secret', (name) => {
    expect(isSecretName(name)).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// SECTION 1: redactSecrets MUST hide secret values (structure/keys preserved).
// -----------------------------------------------------------------------------
describe('redactSecrets — hides secret values', () => {
  // (b) code/value & key/value rows whose code/key names a credential.
  interface SecretRow {
    code?: string;
    key?: string;
    value: string;
  }

  const secretRows: SecretRow[] = [
    { code: 'AWS_SECRET_ACCESS_KEY', value: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
    { code: 'CLOUDFLARE_API_TOKEN', value: 'cf-token-abc123' },
    { key: 'apiKey', value: 'sk_test_deadbeef' },
    { key: 'apiToken', value: 'tok-123' },
    { key: 'apiSecret', value: 'shhh' },
    { code: 'MAIL_PASS', value: 'hunter2' },
    { code: 'SMTP_PASS', value: 'p@ssw0rd' },
    { code: 'SENTRY_DSN', value: 'https://pub:secret@o1.ingest.sentry.io/1' },
    { code: 'MONGO_URL', value: 'mongodb://u:p@host/db' },
    { code: 'AZURE_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=x;AccountKey=abc123==;EndpointSuffix=core.windows.net' },
    { code: 'BLOCKADMIN_PUBLIC_API_KEY', value: 'zzz-secret' },
    { code: 'MUSHOP_PUBLIC_API_KEY', value: 'yyy-secret' },
  ];

  it.each(secretRows)('redacts row value for %o', (row) => {
    const out = redactSecrets(row);
    expect(out.value).toBe(REDACTED);
    // code/key label stays visible (truthful about WHICH key is set):
    if (row.code !== undefined) expect(out.code).toBe(row.code);
    if (row.key !== undefined) expect(out.key).toBe(row.key);
  });

  // Adversarial isolation: a credential CODE whose value has NO inline password.
  // The value-scanner alone won't catch `mongodb://host:port/db` (proven benign
  // when under a non-secret key elsewhere), so ONLY the name-level predicate can
  // hide it. Per contract, MONGO_URL names a credential -> value hidden.
  it('redacts a MONGO_URL row even when the value has no inline password (name-level protection)', () => {
    const out = redactSecrets({ code: 'MONGO_URL', value: 'mongodb://plainhost:27017/appdb' });
    expect(out.value).toBe(REDACTED);
  });

  // (a) property whose NAME denotes a secret → value redacted.
  const secretProps: Array<[string, unknown]> = [
    ['password', 'hunter2'],
    ['clientSecret', 'cs-abc'],
    ['privateKey', '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----'],
    ['accessToken', 'ya29.a0AfB_xyz'],
    ['serviceAccountKey', '{"type":"service_account","private_key":"x"}'],
    ['secretKey', 'sk-1234'],
  ];

  it.each(secretProps)('redacts property named %s', (name, val) => {
    const input: Record<string, unknown> = { [name]: val, bucket: 'keep-me' };
    const out = redactSecrets(input);
    expect(out[name]).toBe(REDACTED);
    expect(out.bucket).toBe('keep-me'); // sibling non-secret untouched
  });

  // (c) string VALUE embeds a credential regardless of (benign) field name.
  it('redacts a mongodb URI with embedded credentials under a benign key', () => {
    const out = redactSecrets({ note: 'mongodb://user:pass@host/db' });
    expect(JSON.stringify(out)).not.toContain('user:pass@host');
    expect(out.note).toBe(REDACTED);
  });

  it('redacts a postgres URI with embedded credentials under a benign key', () => {
    const out = redactSecrets({ conn: 'postgres://u:p@h:5432/db' });
    expect(JSON.stringify(out)).not.toContain('u:p@h');
    expect(out.conn).toBe(REDACTED);
  });

  it('redacts a Sentry DSN under a benign key', () => {
    const out = redactSecrets({ description: 'https://abc123:def456@o1.ingest.sentry.io/1' });
    expect(JSON.stringify(out)).not.toContain('abc123:def456');
  });

  it('redacts an Azure AccountKey blob under a benign key', () => {
    const out = redactSecrets({ blob: 'Endpoint=sb://x;SharedAccessKeyName=y;AccountKey=SUPERSECRETKEY==;EntityPath=z' });
    expect(JSON.stringify(out)).not.toContain('SUPERSECRETKEY');
  });

  it('redacts a credential embedded inside a JSON-string blob', () => {
    const out = redactSecrets({ data: '{"MONGO_URL":"mongodb://user:pass@host/db","ok":1}' });
    expect(JSON.stringify(out)).not.toContain('user:pass@host');
  });

  it('redacts secrets nested in objects and arrays (deep traversal)', () => {
    const input = {
      level1: {
        list: [
          { code: 'MAIL_PASS', value: 'topsecret' },
          { bucket: 'safe' },
        ],
        deep: { password: 'nested-pw' },
      },
    };
    const out = redactSecrets(input);
    expect(out.level1.list[0].value).toBe(REDACTED);
    expect(out.level1.list[0].code).toBe('MAIL_PASS');
    expect(out.level1.list[1].bucket).toBe('safe');
    expect(out.level1.deep.password).toBe(REDACTED);
    expect(JSON.stringify(out)).not.toContain('topsecret');
    expect(JSON.stringify(out)).not.toContain('nested-pw');
  });

  it('does NOT mutate the input object', () => {
    const input = { code: 'MAIL_PASS', value: 'hunter2', nested: { password: 'x' } };
    const snapshot = JSON.parse(JSON.stringify(input));
    redactSecrets(input);
    expect(input).toEqual(snapshot); // original untouched -> returns NEW structure
  });
});

// -----------------------------------------------------------------------------
// SECTION 2: redactSecrets MUST NOT redact benign data (truthfulness + no over-redaction).
// -----------------------------------------------------------------------------
describe('redactSecrets — keeps benign data visible', () => {
  it('keeps infra identifiers/urls/usernames visible', () => {
    const input = {
      bucket: 'my-bucket',
      region: 'us-east-1',
      accountId: '123456789012',
      url: 'https://example.com/path',
      endpoint: 'https://api.example.com',
      username: 'admin',
      hostname: 'db.example.com',
    };
    const out = redactSecrets(input);
    expect(out).toEqual(input);
  });

  it('keeps empty/unset secret values truthful (NOT redacted)', () => {
    const emptyRow = redactSecrets({ code: 'MAIL_PASS', value: '' });
    expect(emptyRow.value).toBe(''); // "not configured" must stay truthful
    const nullRow = redactSecrets({ code: 'AWS_SECRET_ACCESS_KEY', value: null });
    expect(nullRow.value).toBeNull();
    const nullProp = redactSecrets({ password: null, apiKey: '' });
    expect(nullProp.password).toBeNull();
    expect(nullProp.apiKey).toBe('');
  });

  it('keeps benign URLs that carry NO embedded password', () => {
    const input = {
      a: 'https://host/path',
      b: 'mongodb://host:27017/db', // no user:pass@
      c: 'https://user@host/x', // username only, no password
    };
    const out = redactSecrets(input);
    expect(out).toEqual(input);
  });

  it('keeps PUBLIC keys visible by design', () => {
    const input = {
      publishableKey: 'pk_live_ABC123',
      publicKey: 'pk-lf-123', // Langfuse public key
      siteKey: 'recaptcha-site-key',
    };
    const out = redactSecrets(input);
    expect(out).toEqual(input);
  });

  it('does NOT over-redact benign names containing a secret substring', () => {
    const input = {
      compass: 'v1',
      bypass: 'v2',
      passenger: 'v3',
      passRate: 0.9,
      passCount: 5,
      CustomFieldsNavigation: 'v4',
    };
    const out = redactSecrets(input);
    expect(out).toEqual(input);
  });
});

// -----------------------------------------------------------------------------
// SECTION 4: executeErxesOperation reject-guard.
//   Must return a structured { success:false } (NOT throw, NOT reach gateway)
//   for secret references / redaction markers, at top level and nested.
//   Must NOT refuse benign Handlebars (those pass the guard and fail at network).
// -----------------------------------------------------------------------------
describe('executeErxesOperation — secret-reference reject-guard', () => {
  const STRING_ARG: GqlArgDef[] = [
    { name: 'value', type: { kind: 'SCALAR', name: 'String' } },
  ];
  const JSON_ARG: GqlArgDef[] = [
    { name: 'configsMap', type: { kind: 'SCALAR', name: 'JSON' } },
  ];

  const opString: ErxesOperationRef = {
    operation: 'configsUpdate',
    operationType: 'mutation',
    plugin: 'core',
    graphqlArgs: STRING_ARG,
    returnType: { kind: 'SCALAR', name: 'String' },
  };
  const opJson: ErxesOperationRef = {
    operation: 'configsUpdate',
    operationType: 'mutation',
    plugin: 'core',
    graphqlArgs: JSON_ARG,
    returnType: { kind: 'SCALAR', name: 'String' },
  };
  const mockFetch = jest.fn<
    Promise<Response>,
    [input: string | URL | Request, init?: RequestInit]
  >();

  beforeEach(() => {
    // Track "did we reach the gateway?" via global fetch. The impl uses global
    // fetch (Node 22, no fetch-lib dep). Rejecting keeps tests fast.
    mockFetch
      .mockReset()
      .mockRejectedValue(
        new Error('ECONNREFUSED connect 127.0.0.1:59999 fetch failed'),
      );
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  const looksNetworky = (result: unknown) =>
    /econnrefused|fetch failed|econn|network|connect|59999|socket|und_err|failed to fetch|request to/i.test(
      JSON.stringify(result ?? {}),
    );

  // Run a single op and capture whether THAT call touched the gateway (per-call
  // fetch delta; global fetch call-count is otherwise cumulative across a test).
  const runOp = async (
    op: ErxesOperationRef,
    args: Record<string, unknown>,
  ) => {
    mockFetch.mockClear();
    const result = await runWithAuth(
      {
        token: 'test-token',
        userHeader: Buffer.from('{"_id":"u1"}').toString('base64'),
        principalUserId: 'u1',
        subdomain: 'os',
      },
      () => executeErxesOperation(op, args, SETTINGS),
    );
    return { result, fetched: mockFetch.mock.calls.length > 0 };
  };
  interface OperationRun {
    result: unknown;
    fetched: boolean;
  }
  const reachedGateway = (run: OperationRun) =>
    run.fetched || looksNetworky(run.result);
  const isGuardRefusal = (run: OperationRun) =>
    typeof run.result === 'object' &&
    run.result !== null &&
    'success' in run.result &&
    run.result.success === false &&
    !reachedGateway(run);

  // --- Self-validating controls: confirm the classifier discriminates. --------
  it('classifier controls: guard-refusal vs network-failure are distinguishable', async () => {
    const guardCtl = await runOp(opString, { value: REDACTED });
    const netCtl = await runOp(opString, { value: 'plain benign value 123' });
    expect(isGuardRefusal(guardCtl)).toBe(true); // secret marker -> refused pre-gateway
    expect(isGuardRefusal(netCtl)).toBe(false); // plain value -> reaches gateway, fails there
  });

  const secretTopLevel: Array<[string, Record<string, unknown>]> = [
    ['{{secret:CODE}} reference', { value: '{{secret:MAIL_PASS}}' }],
    ['{{keep}} sentinel', { value: '{{keep}}' }],
    ['equals REDACTED marker', { value: REDACTED }],
    ['contains REDACTED marker', { value: `prefix ${REDACTED} suffix` }],
  ];

  it.each(secretTopLevel)(
    'refuses (success:false, no gateway) for top-level %s',
    async (_label, args) => {
      const r = await runOp(opString, args);
      expect(r.result).toMatchObject({ success: false });
      expect(reachedGateway(r)).toBe(false);
    },
  );

  const secretNested: Array<[string, Record<string, unknown>]> = [
    ['secret ref nested in JSON object', { configsMap: { MAIL_PASS: '{{secret:MAIL_PASS}}' } }],
    ['secret ref nested in array', { configsMap: { list: ['ok', '{{secret:AWS_SECRET_ACCESS_KEY}}'] } }],
    ['{{keep}} nested deep', { configsMap: { a: { b: { c: '{{keep}}' } } } }],
    ['REDACTED marker nested in array', { configsMap: { arr: ['fine', REDACTED] } }],
    ['REDACTED marker nested deep', { configsMap: { a: { b: REDACTED } } }],
  ];

  it.each(secretNested)(
    'refuses (success:false, no gateway) for %s',
    async (_label, args) => {
      const r = await runOp(opJson, args);
      expect(r.result).toMatchObject({ success: false });
      expect(reachedGateway(r)).toBe(false);
    },
  );

  const benignHandlebars: Array<[string, Record<string, unknown>]> = [
    ['{{customer.name}}', { value: '{{customer.name}}' }],
    ['{{ user_name }} with spaces', { value: '{{ user_name }}' }],
  ];

  it.each(benignHandlebars)(
    'does NOT refuse benign Handlebars %s (passes guard, fails at network)',
    async (_label, args) => {
      const r = await runOp(opString, args);
      // Must NOT be a pre-gateway guard refusal.
      expect(isGuardRefusal(r)).toBe(false);
      // It should actually have reached the (unreachable) gateway.
      expect(reachedGateway(r)).toBe(true);
    },
  );
});

// -----------------------------------------------------------------------------
// SECTION 5: names-only configuration support tool.
//   - list_config_keys returns NAMES only; PRESENT for mode 'all', ABSENT for 'custom'.
//   - support failure is explicit, never misreported as an empty config set.
// -----------------------------------------------------------------------------
describe('buildErxesSupportTools / list_config_keys', () => {
  interface ExecutableTool {
    execute(input: Record<string, never>): Promise<unknown>;
  }

  const build = (mode: 'all' | 'custom') =>
    buildErxesSupportTools({
      policy: { mode, allowed: [] },
      destructiveOps: 'ask',
    });
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('keeps approval support in both policy modes', () => {
    expect(build('all').request_approval).toBeTruthy();
    expect(build('custom').request_approval).toBeTruthy();
  });

  it('list_config_keys PRESENT for mode "all", ABSENT for mode "custom"', () => {
    const all = build('all');
    const custom = build('custom');
    expect(all.list_config_keys).toBeTruthy();
    expect(custom.list_config_keys).toBeUndefined();
  });

  it('list_config_keys returns ONLY config code NAMES (no secret values)', async () => {
    mockSend.mockResolvedValue(['CLOUDFLARE_API_TOKEN', 'MAIL_HOST']);
    const tool = build('all').list_config_keys as unknown as
      | ExecutableTool
      | undefined;
    expect(tool).toBeDefined();
    if (!tool) throw new Error('list_config_keys tool missing');
    const r = await tool.execute({});
    const s = JSON.stringify(r);
    expect(s).toContain('CLOUDFLARE_API_TOKEN');
    expect(s).toContain('MAIL_HOST');
    // No value / redaction marker should ever be present in a names-only listing:
    expect(s).not.toContain(REDACTED);
    // Not a failure result on the happy path:
    if (r && typeof r === 'object' && 'success' in r) {
      expect(r.success).not.toBe(false);
    }
  });

  it('list_config_keys reports FAILURE (not "nothing configured") when core returns null', async () => {
    mockSend.mockResolvedValue(null); // configured default -> core unreachable/empty
    const tool = build('all').list_config_keys as unknown as
      | ExecutableTool
      | undefined;
    expect(tool).toBeDefined();
    if (!tool) throw new Error('list_config_keys tool missing');
    const r = await tool.execute({});
    expect(r).toMatchObject({ success: false });
  });

  it('list_config_keys reports FAILURE when core rejects', async () => {
    mockSend.mockRejectedValue(new Error('core down'));
    const tool = build('all').list_config_keys as unknown as
      | ExecutableTool
      | undefined;
    expect(tool).toBeDefined();
    if (!tool) throw new Error('list_config_keys tool missing');
    const r = await tool.execute({});
    expect(r).toMatchObject({ success: false });
  });
});
