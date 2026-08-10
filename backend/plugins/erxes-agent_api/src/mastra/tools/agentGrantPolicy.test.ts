const sendTRPCMessage = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

jest.mock('./builtins', () => ({
  BUILTIN_TOOLS: {
    calculator: {},
    webSearch: {},
  },
}));

import type { OperationMeta, OperationRegistry } from './operationRegistry';
import { resolveAgentGrantPolicy } from './agentGrantPolicy';

const dealQuery: OperationMeta = {
  operation: 'deals',
  operationType: 'query',
  plugin: 'sales',
  module: 'deal',
  description: '',
  graphqlArgs: [],
  returnType: null,
};

const registry = {
  list: [dealQuery],
  operations: new Map([[dealQuery.operation, dealQuery]]),
} as unknown as OperationRegistry;

beforeEach(() => sendTRPCMessage.mockReset());

describe('resolveAgentGrantPolicy', () => {
  it('allows only built-ins when the agent has no profile', async () => {
    const policy = await resolveAgentGrantPolicy({
      subdomain: 'tenant',
      grantGroupId: null,
      registry,
    });

    expect(policy).toEqual({
      mode: 'custom',
      allowed: ['builtin:calculator', 'builtin:webSearch'],
    });
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it('derives operation tools from an agent profile', async () => {
    sendTRPCMessage.mockResolvedValue([
      {
        principalType: 'agent',
        permissions: [
          {
            plugin: 'sales',
            module: 'deal',
            actions: ['showDeals'],
            scope: 'own',
          },
        ],
      },
    ]);

    const policy = await resolveAgentGrantPolicy({
      subdomain: 'tenant',
      grantGroupId: 'profile-1',
      registry,
    });

    expect(policy).toEqual({
      mode: 'custom',
      allowed: ['deals', 'builtin:calculator', 'builtin:webSearch'],
    });
  });

  it('fails closed to built-ins for a human permission group', async () => {
    sendTRPCMessage.mockResolvedValue([
      { principalType: 'human', permissions: [] },
    ]);

    const policy = await resolveAgentGrantPolicy({
      subdomain: 'tenant',
      grantGroupId: 'human-group',
      registry,
    });

    expect(policy.allowed).toEqual(['builtin:calculator', 'builtin:webSearch']);
  });

  it('fails closed to built-ins when the profile no longer exists', async () => {
    sendTRPCMessage.mockResolvedValue([]);

    const policy = await resolveAgentGrantPolicy({
      subdomain: 'tenant',
      grantGroupId: 'missing',
      registry,
    });

    expect(policy.allowed).toEqual(['builtin:calculator', 'builtin:webSearch']);
  });
});
