const sendTRPCMessage = jest.fn();
class ExpectedError extends Error {}

jest.mock('erxes-api-shared/utils', () => ({
  ExpectedError,
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

const canGroup = jest.fn();
jest.mock('erxes-api-shared/core-modules', () => ({
  canGroup: (...args: unknown[]) => canGroup(...args),
}));

const requireScopedAgent = jest.fn();
jest.mock('@/agent/authorization', () => ({
  requireScopedAgent: (...args: unknown[]) => requireScopedAgent(...args),
}));

const requireActionScope = jest.fn();
jest.mock('@/_shared/authorization', () => ({
  requireActionScope: (...args: unknown[]) => requireActionScope(...args),
}));

const syncServiceUserGroup = jest.fn();
const deactivateServiceUser = jest.fn();
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  syncServiceUserGroup: (...args: unknown[]) => syncServiceUserGroup(...args),
  deactivateServiceUser: (...args: unknown[]) => deactivateServiceUser(...args),
}));

jest.mock('@/agent/utils', () => ({
  getAgentQuotaStatus: jest.fn(),
}));

jest.mock('./agentErrors', () => ({
  toUserFacingAgentError: (error: unknown) => error,
}));

import type { IContext } from '~/connectionResolvers';
import { agentMutations } from './agent';

const makeContext = () => {
  const updateAgent = jest.fn().mockResolvedValue({
    _id: 'agent-document-id',
    agentId: 'support-agent',
    createdBy: 'creator-1',
    serviceUserId: 'service-user-1',
  });
  const checkPermission = jest.fn().mockResolvedValue(undefined);
  const context = {
    models: { MastraAgent: { updateAgent } },
    subdomain: 'tenant',
    user: { _id: 'admin-1' },
    checkPermission,
  } as unknown as IContext;

  return { checkPermission, context, updateAgent };
};

beforeEach(() => {
  sendTRPCMessage.mockReset();
  canGroup.mockReset();
  requireScopedAgent.mockReset();
  requireActionScope.mockReset();
  syncServiceUserGroup.mockReset();
  deactivateServiceUser.mockReset();

  canGroup.mockImplementation((_subdomain: string, action: string) =>
    Promise.resolve(action === 'permissionsAgentProfilesManage'),
  );
  requireScopedAgent.mockResolvedValue({
    agent: {
      createdBy: 'creator-1',
      serviceUserId: 'service-user-1',
    },
    scope: 'all',
  });
});

describe('mastraAgentSetGrant', () => {
  it('validates an agent profile, persists it, and syncs the service user', async () => {
    sendTRPCMessage.mockResolvedValue([
      { _id: 'profile-1', principalType: 'agent' },
    ]);
    const { checkPermission, context, updateAgent } = makeContext();

    await agentMutations.mastraAgentSetGrant(
      undefined,
      { _id: 'agent-document-id', grantGroupId: ' profile-1 ' },
      context,
    );

    expect(canGroup).toHaveBeenCalledWith(
      'tenant',
      'permissionsAgentProfilesManage',
      context.user,
    );
    expect(checkPermission).toHaveBeenCalledWith('erxesAgentAgentsUpdate');
    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginName: 'core',
        module: 'permissionGroups',
        action: 'find',
        input: { query: { _id: 'profile-1' } },
      }),
    );
    expect(updateAgent).toHaveBeenCalledWith(
      'agent-document-id',
      { grantGroupId: 'profile-1' },
      'creator-1',
    );
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'service-user-1',
      groupId: 'profile-1',
      subdomain: 'tenant',
    });
  });

  it('rejects a human permission group', async () => {
    sendTRPCMessage.mockResolvedValue([
      { _id: 'human-group', principalType: 'human' },
    ]);
    const { context, updateAgent } = makeContext();

    await expect(
      agentMutations.mastraAgentSetGrant(
        undefined,
        { _id: 'agent-document-id', grantGroupId: 'human-group' },
        context,
      ),
    ).rejects.toThrow('Agents may only use agent grant profiles');

    expect(updateAgent).not.toHaveBeenCalled();
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it('does not persist the profile when service-user synchronization fails', async () => {
    sendTRPCMessage.mockResolvedValue([
      { _id: 'profile-1', principalType: 'agent' },
    ]);
    syncServiceUserGroup.mockRejectedValue(new Error('core unavailable'));
    const { context, updateAgent } = makeContext();

    await expect(
      agentMutations.mastraAgentSetGrant(
        undefined,
        { _id: 'agent-document-id', grantGroupId: 'profile-1' },
        context,
      ),
    ).rejects.toThrow('core unavailable');

    expect(updateAgent).not.toHaveBeenCalled();
  });

  it('rejects callers without agent-profile or global permission management', async () => {
    canGroup.mockResolvedValue(false);
    const { context, updateAgent } = makeContext();

    await expect(
      agentMutations.mastraAgentSetGrant(
        undefined,
        { _id: 'agent-document-id', grantGroupId: null },
        context,
      ),
    ).rejects.toThrow('Permission required');

    expect(requireScopedAgent).not.toHaveBeenCalled();
    expect(updateAgent).not.toHaveBeenCalled();
  });

  it('clears the profile without looking it up', async () => {
    const { context, updateAgent } = makeContext();

    await agentMutations.mastraAgentSetGrant(
      undefined,
      { _id: 'agent-document-id', grantGroupId: null },
      context,
    );

    expect(sendTRPCMessage).not.toHaveBeenCalled();
    expect(updateAgent).toHaveBeenCalledWith(
      'agent-document-id',
      { grantGroupId: null },
      'creator-1',
    );
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'service-user-1',
      groupId: null,
      subdomain: 'tenant',
    });
  });
});

describe('mastraAgentUpdate protected fields', () => {
  it('rejects direct grant changes', async () => {
    const { context, updateAgent } = makeContext();

    await expect(
      agentMutations.mastraAgentUpdate(
        undefined,
        { _id: 'agent-document-id', doc: { grantGroupId: 'profile-1' } },
        context,
      ),
    ).rejects.toThrow(/dedicated security actions/i);

    expect(updateAgent).not.toHaveBeenCalled();
  });
});
