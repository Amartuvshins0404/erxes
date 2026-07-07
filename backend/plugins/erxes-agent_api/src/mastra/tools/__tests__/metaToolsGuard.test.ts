/**
 * The unknown-operation guard on execute_erxes_operation (fuzzy suggestions via
 * the shared search scorer) and the audit-error extraction helper. createTool
 * and the network executor are mocked; the scorer runs for real.
 */
jest.mock('@mastra/core/tools', () => ({ createTool: (cfg: unknown) => cfg }));
jest.mock('../erxesTools', () => ({
  executeErxesOperation: () => Promise.resolve({ ok: true }),
  graphqlTypeToString: () => 'String',
}));

import { auditErrorMessage, buildErxesMetaTools } from '../metaTools';
import type { OperationMeta, OperationRegistry } from '../operationRegistry';

const op = (
  operation: string,
  operationType: 'query' | 'mutation' = 'mutation',
): OperationMeta => ({
  operation,
  operationType,
  plugin: 'sales',
  module: 'deals',
  description: '',
  graphqlArgs: [],
  returnType: null,
});

const mkRegistry = (ops: OperationMeta[]): OperationRegistry => ({
  operations: new Map(ops.map((o) => [o.operation, o])),
  list: ops,
  inputTypesMap: {},
  objectFieldsMap: {},
});

const build = () =>
  buildErxesMetaTools({
    registry: mkRegistry([
      op('dealsAdd'),
      op('dealsEdit'),
      op('dealsRemove'),
      op('customers', 'query'),
    ]),
    settings: {},
    policy: { mode: 'all', allowed: [] },
    destructiveOps: 'allow',
  });

type ExecTool = {
  execute: (input: { operation: string; args?: unknown }) => Promise<unknown>;
};

describe('execute_erxes_operation — unknown-operation guard', () => {
  it('returns fuzzy suggestions and an instruction, without dispatching', async () => {
    const tools = build();
    const result = (await (
      tools.execute_erxes_operation as unknown as ExecTool
    ).execute({ operation: 'dealAdd' })) as {
      success: boolean;
      error: string;
      suggestions: string[];
      instruction: string;
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown operation "dealAdd"');
    expect(result.suggestions).toContain('dealsAdd');
    expect(result.suggestions.length).toBeLessThanOrEqual(5);
    expect(result.instruction).toContain('search_erxes_operations');
  });
});

describe('auditErrorMessage', () => {
  it('prefers a non-empty error string', () => {
    expect(auditErrorMessage({ success: false, error: 'boom' })).toBe('boom');
  });

  it('falls back to instruction when error is empty', () => {
    expect(
      auditErrorMessage({ success: false, error: '', instruction: 'retry' }),
    ).toBe('retry');
  });

  it('falls back to compact JSON, truncated to 500 chars', () => {
    const failure = { success: false, candidates: [{ id: 'x', name: 'X' }] };
    const message = auditErrorMessage(failure);
    expect(message).toBe(JSON.stringify(failure));
    expect(auditErrorMessage({ big: 'y'.repeat(1000) }).length).toBe(500);
  });

  it('returns an empty string for non-object results', () => {
    expect(auditErrorMessage(null)).toBe('');
    expect(auditErrorMessage(42)).toBe('');
  });
});
