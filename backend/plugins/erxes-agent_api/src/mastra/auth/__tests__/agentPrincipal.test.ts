const getAgentAccount = jest.fn();

jest.mock('../servicePrincipal', () => ({
  getAgentAccount: (...args: unknown[]) => getAgentAccount(...args),
}));

import { resolveAgentPrincipal } from '../agentPrincipal';

const USER_ID = 'agent-user-1';
const ACCOUNT_ID = 'core-agent-user-1';
const agent = { _id: USER_ID };

const account = (overrides: Record<string, unknown> = {}) => ({
  _id: ACCOUNT_ID,
  email: 'agent@agents.local',
  username: 'agent-helper',
  details: { fullName: 'Agent Helper' },
  groupIds: ['legacy-group'],
  brandIds: ['brand-1'],
  branchIds: ['branch-1'],
  departmentIds: ['department-1'],
  permissionGroupIds: ['group-1', 'group-2'],
  customPermissions: [],
  ...overrides,
});

beforeEach(() => {
  getAgentAccount.mockReset().mockResolvedValue(account());
});

describe('resolveAgentPrincipal', () => {
  it('propagates the canonical team member through the internal user header', async () => {
    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
    });

    expect(result).toEqual({
      ok: true,
      authCtx: {
        subdomain: 'os',
        principalUserId: ACCOUNT_ID,
        userHeader: Buffer.from(
          JSON.stringify({
            _id: ACCOUNT_ID,
            email: 'agent@agents.local',
            details: { fullName: 'Agent Helper' },
            isOwner: false,
            groupIds: ['legacy-group'],
            brandIds: ['brand-1'],
            username: 'agent-helper',
            code: undefined,
            branchIds: ['branch-1'],
            departmentIds: ['department-1'],
            permissionGroupIds: ['group-1', 'group-2'],
            customPermissions: [],
            sessionCode: '',
          }),
        ).toString('base64'),
        agentId: USER_ID,
      },
    });
  });

  it('accepts custom permissions without a permission group', async () => {
    getAgentAccount.mockResolvedValue(
      account({
        permissionGroupIds: [],
        customPermissions: [
          { plugin: 'sales', module: 'deal', actions: ['dealsView'] },
        ],
      }),
    );

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
    });

    expect(result.ok).toBe(true);
  });

  it('fails closed when the account is inactive or missing', async () => {
    getAgentAccount.mockRejectedValue(new Error('inactive'));

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.stringMatching(/missing or inactive/i),
      }),
    );
    expect(result).not.toHaveProperty('authCtx');
  });

  it('fails closed when the team member has no permissions', async () => {
    getAgentAccount.mockResolvedValue(
      account({ permissionGroupIds: [], customPermissions: [] }),
    );

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.stringMatching(/no permissions/i),
      }),
    );
  });
});
