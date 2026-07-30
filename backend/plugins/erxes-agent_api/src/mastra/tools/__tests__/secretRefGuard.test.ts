/**
 * Two WS2.2 guards:
 *  1. The secret-reference reject-guard — executeErxesOperation refuses
 *     {{secret:CODE}} / {{keep}} syntax the model may invent, BEFORE a network
 *     call, so a literal placeholder can never be written into a credential
 *     field. A benign Handlebars template ({{customer.name}}) is NOT refused.
 *  2. list_config_keys — names-only config discovery (core returns codes only).
 *
 * createTool is unwrapped so a tool's `execute` is directly callable; the
 * erxes-api-shared surface is stubbed (sendTRPCMessage for discovery; the plugin
 * discovery helpers are never called on these paths).
 */
jest.mock('@mastra/core/tools', () => ({ createTool: (cfg: unknown) => cfg }));

const mockSendTRPC = jest.fn<Promise<unknown>, unknown[]>();
jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => mockSendTRPC(...args),
  getPlugins: jest.fn(async () => []),
  getPluginAddress: jest.fn(async () => 'http://127.0.0.1:59999'),
}));

import { executeErxesOperation, type ErxesOperationRef } from '../erxesTools';
import { REDACTED } from '../secretRedaction';
import { buildErxesSupportTools } from '../metaTools';

// A direct subgraph address that fails fast (ECONNREFUSED) when the guard allows.
const UNREACHABLE = {
  erxesApiUrl: 'http://gateway.invalid',
  erxesApiToken: '',
};

const mkOp = (
  name: string,
  argName: string,
  typeName: string,
): ErxesOperationRef => ({
  operation: name,
  operationType: 'mutation',
  plugin: 'core',
  graphqlArgs: [{ name: argName, type: { kind: 'SCALAR', name: typeName } }],
  returnType: null,
});

const getError = (result: unknown): unknown =>
  typeof result === 'object' && result !== null && 'error' in result
    ? result.error
    : undefined;

const REFUSAL = 'Secret references are not supported.';

describe('secret-reference reject-guard', () => {
  it('refuses a {{secret:CODE}} reference nested inside configsMap, before a network call', async () => {
    const res = await executeErxesOperation(
      mkOp('configsUpdate', 'configsMap', 'JSON'),
      {
        configsMap: { CLOUDFLARE_API_TOKEN: '{{secret:CLOUDFLARE_API_TOKEN}}' },
      },
      UNREACHABLE,
    );
    expect(res).toMatchObject({ success: false, error: REFUSAL });
  });

  it('refuses a top-level {{keep}} reference', async () => {
    const res = await executeErxesOperation(
      mkOp('configsUpdate', 'value', 'String'),
      { value: '{{keep}}' },
      UNREACHABLE,
    );
    expect(res).toMatchObject({ success: false, error: REFUSAL });
  });

  it('does NOT refuse a benign Handlebars template ({{customer.name}})', async () => {
    const res = await executeErxesOperation(
      mkOp('emailTemplatesAdd', 'content', 'String'),
      { content: 'Hello {{customer.name}}' },
      UNREACHABLE,
    );
    // Passed the guard → attempted execution → failed on the unreachable gateway,
    // which is NOT the secret-reference refusal.
    expect(getError(res)).not.toBe(REFUSAL);
  });

  it('refuses an echoed REDACTED sentinel (read-modify-write corruption guard)', async () => {
    // The agent reads a config (value comes back as REDACTED), then writes the
    // object back — without this guard, the placeholder would overwrite the real
    // stored secret.
    const res = await executeErxesOperation(
      mkOp('configsUpdate', 'configsMap', 'JSON'),
      { configsMap: { AWS_SECRET_ACCESS_KEY: REDACTED } },
      UNREACHABLE,
    );
    expect(res).toMatchObject({ success: false, error: REFUSAL });
  });
});

interface ExecutableTool {
  execute(input: Record<string, never>): Promise<unknown>;
}

describe('list_config_keys discovery tool', () => {
  const buildTools = (mode: 'all' | 'custom' = 'all') =>
    buildErxesSupportTools({
      policy: { mode, allowed: [] },
      destructiveOps: 'ask',
    });

  beforeEach(() => mockSendTRPC.mockReset());

  const getListConfigKeysTool = (): ExecutableTool => {
    const tool = buildTools().list_config_keys;
    if (!tool) throw new Error('list_config_keys tool missing');
    return tool as unknown as ExecutableTool;
  };

  it('returns config CODES only (never values) via configs.getCodes', async () => {
    mockSendTRPC.mockResolvedValue(['CLOUDFLARE_API_TOKEN', 'MAIL_HOST']);
    const res = await getListConfigKeysTool().execute({});

    expect(mockSendTRPC).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginName: 'core',
        module: 'configs',
        action: 'getCodes',
        method: 'query',
      }),
    );
    expect(res).toMatchObject({
      total: 2,
      codes: ['CLOUDFLARE_API_TOKEN', 'MAIL_HOST'],
    });
    // Structurally value-free: no "value" ever appears in the payload.
    expect(JSON.stringify(res)).not.toContain('"value"');
  });

  it('reports failure (not "nothing configured") when core returns the null default', async () => {
    // sendTRPCMessage returns its defaultValue (null) on an internal failure —
    // must be distinguished from a genuinely empty config set.
    mockSendTRPC.mockResolvedValue(null);
    const res = await getListConfigKeysTool().execute({});
    expect(res).toMatchObject({ success: false });
  });

  it('degrades gracefully when core throws', async () => {
    mockSendTRPC.mockRejectedValue(new Error('core down'));
    const res = await getListConfigKeysTool().execute({});
    expect(res).toMatchObject({ success: false });
  });

  it('is NOT bound for a restricted (mode:custom) agent', () => {
    expect(buildTools('custom').list_config_keys).toBeUndefined();
    expect(buildTools('custom').request_approval).toBeDefined();
  });
});
