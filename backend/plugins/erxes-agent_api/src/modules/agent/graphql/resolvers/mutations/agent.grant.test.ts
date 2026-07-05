// Step 22 — grant wiring through the agent update mutation. Setting/clearing
// grantGroupId validates the group exists (core `permissionGroups.find`), persists
// a normalized value, and eagerly syncs it onto the agent's service user so the
// change takes effect on the next background run. Heavy collaborators are mocked
// so the test stays on the resolver's grant logic.
const sendTRPCMessage = jest.fn();
class ExpectedError extends Error {}
jest.mock('erxes-api-shared/utils', () => ({
  ExpectedError,
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

const syncServiceUserGroup = jest.fn();
const deactivateServiceUser = jest.fn();
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  syncServiceUserGroup: (...args: unknown[]) => syncServiceUserGroup(...args),
  deactivateServiceUser: (...args: unknown[]) => deactivateServiceUser(...args),
}));

jest.mock('@/agent/utils', () => ({
  isAgentAdmin: jest.fn(() => true),
  getAgentQuotaStatus: jest.fn(),
}));

jest.mock('./agentErrors', () => ({
  toUserFacingAgentError: (e: unknown) => e,
}));

import { agentMutations } from './agent';

const makeCtx = (
  updatedAgent: Record<string, unknown>,
  userOverrides: Record<string, unknown> = { isOwner: true },
) => {
  const updateAgent = jest.fn().mockResolvedValue(updatedAgent);
  return {
    updateAgent,
    ctx: {
      models: { MastraAgent: { updateAgent } },
      user: { _id: 'u1', ...userOverrides },
      subdomain: 'os',
      checkPermission: jest.fn().mockResolvedValue(undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
};

beforeEach(() => {
  sendTRPCMessage.mockReset();
  syncServiceUserGroup.mockReset();
  deactivateServiceUser.mockReset();
});

describe('mastraAgentUpdate grant wiring', () => {
  it('validates a set grantGroupId, persists it, and syncs the service user', async () => {
    sendTRPCMessage.mockResolvedValue([{ _id: 'grp-9' }]); // group exists
    const { ctx, updateAgent } = makeCtx({ _id: 'a1', serviceUserId: 'svc-1' });

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: ' grp-9 ' } as any },
      ctx,
    );

    // Validated via core trpc permissionGroups.find.
    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginName: 'core',
        module: 'permissionGroups',
        action: 'find',
        input: { query: { _id: 'grp-9' } },
      }),
    );
    // Persisted normalized (trimmed) onto the agent.
    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ grantGroupId: 'grp-9' }),
      undefined,
    );
    // Synced onto the service user (no models arg → no redundant second write).
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'svc-1',
      groupId: 'grp-9',
      subdomain: 'os',
    });
  });

  it('rejects a grantGroupId that does not exist (no update, no sync)', async () => {
    sendTRPCMessage.mockResolvedValue([]); // group not found
    const { ctx, updateAgent } = makeCtx({ _id: 'a1', serviceUserId: 'svc-1' });

    await expect(
      agentMutations.mastraAgentUpdate(
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: 'a1', doc: { grantGroupId: 'ghost' } as any },
        ctx,
      ),
    ).rejects.toThrow(/not found/i);
    expect(updateAgent).not.toHaveBeenCalled();
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it('clears the grant (empty string) without validation, syncing null', async () => {
    const { ctx, updateAgent } = makeCtx({ _id: 'a1', serviceUserId: 'svc-1' });

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: '' } as any },
      ctx,
    );

    expect(sendTRPCMessage).not.toHaveBeenCalled(); // clearing skips validation
    // Cleared grant persists as null (so mongoose $set actually clears it).
    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ grantGroupId: null }),
      undefined,
    );
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'svc-1',
      groupId: null,
      subdomain: 'os',
    });
  });

  it('does not sync when the agent has no service user yet', async () => {
    sendTRPCMessage.mockResolvedValue([{ _id: 'grp-9' }]);
    const { ctx } = makeCtx({ _id: 'a1' }); // no serviceUserId

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: 'grp-9' } as any },
      ctx,
    );

    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it('leaves the grant untouched when grantGroupId is absent from the doc', async () => {
    const { ctx, updateAgent } = makeCtx({ _id: 'a1', serviceUserId: 'svc-1' });

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { name: 'Renamed' } as any },
      ctx,
    );

    expect(sendTRPCMessage).not.toHaveBeenCalled();
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      { name: 'Renamed' },
      undefined,
    );
  });
});

// F2 — a grant carries the agent's server-side permissions, so binding one is a
// privilege escalation unless the caller already holds top privilege. Only an
// org owner may SET a grant; clearing it (de-escalation) stays open to any
// editor. NOTE: isAgentAdmin is mocked to `true` for every test here, so these
// cases also prove the gate keys on org ownership — NOT agent-admin.
describe('mastraAgentUpdate grant assignment authorization', () => {
  it('denies a non-owner setting grantGroupId (no existence check, no update)', async () => {
    sendTRPCMessage.mockResolvedValue([{ _id: 'grp-9' }]); // would exist if reached
    const { ctx, updateAgent } = makeCtx(
      { _id: 'a1', serviceUserId: 'svc-1' },
      { isOwner: false },
    );

    await expect(
      agentMutations.mastraAgentUpdate(
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: 'a1', doc: { grantGroupId: 'grp-9' } as any },
        ctx,
      ),
    ).rejects.toThrow(/organization owner/i);

    // Guard runs before the existence check → no group leak, no persistence.
    expect(sendTRPCMessage).not.toHaveBeenCalled();
    expect(updateAgent).not.toHaveBeenCalled();
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it('allows an org owner to set grantGroupId', async () => {
    sendTRPCMessage.mockResolvedValue([{ _id: 'grp-9' }]);
    const { ctx, updateAgent } = makeCtx(
      { _id: 'a1', serviceUserId: 'svc-1' },
      { isOwner: true },
    );

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: 'grp-9' } as any },
      ctx,
    );

    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ grantGroupId: 'grp-9' }),
      undefined,
    );
  });

  it('allows a non-owner to CLEAR a grant (de-escalation)', async () => {
    const { ctx, updateAgent } = makeCtx(
      { _id: 'a1', serviceUserId: 'svc-1' },
      { isOwner: false },
    );

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: '' } as any },
      ctx,
    );

    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ grantGroupId: null }),
      undefined,
    );
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'svc-1',
      groupId: null,
      subdomain: 'os',
    });
  });

  it('does not block a non-owner editing unrelated fields (grant untouched)', async () => {
    const { ctx, updateAgent } = makeCtx(
      { _id: 'a1', serviceUserId: 'svc-1' },
      { isOwner: false },
    );

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { name: 'Renamed' } as any },
      ctx,
    );

    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      { name: 'Renamed' },
      undefined,
    );
  });
});
