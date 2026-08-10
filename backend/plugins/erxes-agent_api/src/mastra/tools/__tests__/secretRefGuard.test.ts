/**
 * Two WS2.2 guards:
 *  1. The secret-reference reject-guard — executeErxesOperation refuses
 *     {{secret:CODE}} / {{keep}} syntax the model may invent, BEFORE a network
 *     call, so a literal placeholder can never be written into a credential
 *     field. A benign Handlebars template ({{customer.name}}) is NOT refused.
 *
 * createTool is unwrapped so a tool's `execute` is directly callable.
 */
jest.mock('@mastra/core/tools', () => ({ createTool: (cfg: unknown) => cfg }));
jest.mock('erxes-api-shared/utils', () => ({
  getPlugins: jest.fn(async () => []),
  getPluginAddress: jest.fn(async () => 'http://127.0.0.1:59999'),
}));

import { executeErxesOperation, type ErxesOperationRef } from '../erxesTools';
import { REDACTED } from '../secretRedaction';
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
    );
    expect(res).toMatchObject({ success: false, error: REFUSAL });
  });

  it('refuses a top-level {{keep}} reference', async () => {
    const res = await executeErxesOperation(
      mkOp('configsUpdate', 'value', 'String'),
      { value: '{{keep}}' },
    );
    expect(res).toMatchObject({ success: false, error: REFUSAL });
  });

  it('does NOT refuse a benign Handlebars template ({{customer.name}})', async () => {
    const res = await executeErxesOperation(
      mkOp('emailTemplatesAdd', 'content', 'String'),
      { content: 'Hello {{customer.name}}' },
    );
    expect(getError(res)).not.toBe(REFUSAL);
  });

  it('refuses an echoed REDACTED sentinel (read-modify-write corruption guard)', async () => {
    // The agent reads a config (value comes back as REDACTED), then writes the
    // object back — without this guard, the placeholder would overwrite the real
    // stored secret.
    const res = await executeErxesOperation(
      mkOp('configsUpdate', 'configsMap', 'JSON'),
      { configsMap: { AWS_SECRET_ACCESS_KEY: REDACTED } },
    );
    expect(res).toMatchObject({ success: false, error: REFUSAL });
  });
});
