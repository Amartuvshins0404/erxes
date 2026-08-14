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

import type { AgentToolDescriptor } from 'erxes-api-shared/utils';
import type { NativeToolRegistry } from './nativeTools';
import { resolveAgentGrantPolicy } from './agentGrantPolicy';

const dealFind: AgentToolDescriptor = {
  id: 'sales.model.Deals.find',
  kind: 'model',
  plugin: 'sales',
  module: 'deals',
  method: 'query',
  destructive: false,
  description: '',
  inputFields: null,
  modelName: 'Deals',
  op: 'find',
  permission: { module: 'deals', action: 'dealsShow' },
};

const registry = {
  list: [dealFind],
  tools: new Map([[dealFind.id, dealFind]]),
  byPlugin: new Map([['sales', [dealFind]]]),
} as unknown as NativeToolRegistry;

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
            actions: ['dealsShow'],
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
      allowed: ['sales.model.Deals.find', 'builtin:calculator', 'builtin:webSearch'],
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
