// Step 22/23 — grant wiring through the agent update mutation. Setting/clearing
// grantGroupId validates the group exists (core `permissionGroups.find`), persists
// a normalized value, eagerly syncs it onto the agent's service user, and (step
// 23) DERIVES the tool filter (toolPolicy/allowedTools) from the group so grant
// and filter update atomically. Heavy collaborators are mocked so the test stays
// on the resolver's grant logic.
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

// The tool-filter derivation pulls the live operation registry + builtins
// (heavy). Mock it so the resolver test asserts only that it is invoked with the
// group's permissions and its result is persisted atomically with the grant.
const deriveGrantAllowedTools = jest.fn();
jest.mock('./grantTools', () => ({
  deriveGrantAllowedTools: (...args: unknown[]) =>
    deriveGrantAllowedTools(...args),
}));

jest.mock('@/agent/utils', () => ({
  isAgentAdmin: jest.fn(() => true),
  getAgentQuotaStatus: jest.fn(),
}));

jest.mock('./agentErrors', () => ({
  toUserFacingAgentError: (e: unknown) => e,
}));

import { agentMutations } from './agent';

const AGENT_ID = 'agent-1';
const DERIVED = ['dealsAdd', 'builtin:calculator'];

const makeCtx = (
  updatedAgent: Record<string, unknown>,
  userOverrides: Record<string, unknown> = { isOwner: true },
  agentConfig: Record<string, unknown> = { _id: 'a1', agentId: AGENT_ID },
) => {
  const updateAgent = jest.fn().mockResolvedValue(updatedAgent);
  const findOne = jest.fn().mockResolvedValue(agentConfig);
  return {
    updateAgent,
    findOne,
    ctx: {
      models: { MastraAgent: { updateAgent, findOne } },
      user: { _id: 'u1', ...userOverrides },
      subdomain: 'os',
      checkPermission: jest.fn().mockResolvedValue(undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
};

// A foreign group (name does NOT match agent-grant:<agentId>).
const foreignGroup = (permissions: unknown[] = []) => [
  { _id: 'grp-9', name: 'Sales team', permissions },
];
// The agent's OWN dedicated group.
const selfGroup = (permissions: unknown[] = []) => [
  { _id: 'grp-self', name: `agent-grant:${AGENT_ID}`, permissions },
];

beforeEach(() => {
  sendTRPCMessage.mockReset();
  syncServiceUserGroup.mockReset();
  deactivateServiceUser.mockReset();
  deriveGrantAllowedTools.mockReset();
  deriveGrantAllowedTools.mockResolvedValue(DERIVED);
});

describe('mastraAgentUpdate grant wiring', () => {
  it('validates a set grantGroupId, derives the tool filter, persists both, and syncs', async () => {
    const perms = [{ plugin: 'sales', module: 'deal', actions: ['dealsAdd'] }];
    sendTRPCMessage.mockResolvedValue(foreignGroup(perms)); // group exists
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
    // Derived from the group's permissions.
    expect(deriveGrantAllowedTools).toHaveBeenCalledWith(ctx.models, perms);
    // Persisted normalized + tool filter atomically onto the agent.
    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({
        grantGroupId: 'grp-9',
        toolPolicy: 'custom',
        allowedTools: DERIVED,
      }),
      undefined,
    );
    // Synced onto the service user (no models arg → no redundant second write).
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'svc-1',
      groupId: 'grp-9',
      subdomain: 'os',
    });
  });

  it('rejects a grantGroupId that does not exist (no update, no sync, no derive)', async () => {
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
    expect(deriveGrantAllowedTools).not.toHaveBeenCalled();
    expect(updateAgent).not.toHaveBeenCalled();
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it('clears the grant (empty string), resetting the filter to all, syncing null', async () => {
    const { ctx, updateAgent } = makeCtx({ _id: 'a1', serviceUserId: 'svc-1' });

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: '' } as any },
      ctx,
    );

    expect(sendTRPCMessage).not.toHaveBeenCalled(); // clearing skips validation
    expect(deriveGrantAllowedTools).not.toHaveBeenCalled(); // nothing to derive
    // Cleared grant persists as null; derived custom filter drops back to 'all'.
    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({
        grantGroupId: null,
        toolPolicy: 'all',
        allowedTools: [],
      }),
      undefined,
    );
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'svc-1',
      groupId: null,
      subdomain: 'os',
    });
  });

  it('does not sync when the agent has no service user yet', async () => {
    sendTRPCMessage.mockResolvedValue(foreignGroup());
    const { ctx } = makeCtx({ _id: 'a1' }); // updated has no serviceUserId

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: 'grp-9' } as any },
      ctx,
    );

    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it('leaves the grant + filter untouched when grantGroupId is absent from the doc', async () => {
    const { ctx, updateAgent, findOne } = makeCtx({
      _id: 'a1',
      serviceUserId: 'svc-1',
    });

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { name: 'Renamed' } as any },
      ctx,
    );

    expect(sendTRPCMessage).not.toHaveBeenCalled();
    expect(findOne).not.toHaveBeenCalled();
    expect(deriveGrantAllowedTools).not.toHaveBeenCalled();
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      { name: 'Renamed' },
      undefined,
    );
  });
});

// F2 — a grant carries the agent's server-side permissions, so binding one is a
// privilege escalation unless the caller already holds top privilege OR the
// group is the agent's OWN dedicated group (authored via permissionsManage).
// Only an org owner may SET a FOREIGN grant; clearing (de-escalation) stays open
// to any editor. NOTE: isAgentAdmin is mocked to `true` for every test here, so
// these cases also prove the gate keys on org ownership — NOT agent-admin.
describe('mastraAgentUpdate grant assignment authorization', () => {
  it('denies a non-owner binding a FOREIGN grant (no update, no derive)', async () => {
    sendTRPCMessage.mockResolvedValue(foreignGroup()); // exists but foreign
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

    expect(deriveGrantAllowedTools).not.toHaveBeenCalled();
    expect(updateAgent).not.toHaveBeenCalled();
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it("allows a non-owner to bind the agent's OWN dedicated group (permissionsManage-authored)", async () => {
    sendTRPCMessage.mockResolvedValue(selfGroup()); // agent-grant:<agentId>
    const { ctx, updateAgent } = makeCtx(
      { _id: 'a1', serviceUserId: 'svc-1' },
      { isOwner: false },
    );

    await agentMutations.mastraAgentUpdate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: 'a1', doc: { grantGroupId: 'grp-self' } as any },
      ctx,
    );

    expect(updateAgent).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({
        grantGroupId: 'grp-self',
        toolPolicy: 'custom',
      }),
      undefined,
    );
  });

  it('allows an org owner to bind a foreign grant', async () => {
    sendTRPCMessage.mockResolvedValue(foreignGroup());
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
      expect.objectContaining({ grantGroupId: null, toolPolicy: 'all' }),
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
