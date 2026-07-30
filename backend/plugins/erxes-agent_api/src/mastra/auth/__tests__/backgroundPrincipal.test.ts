class ExpectedError extends Error {}

jest.mock('erxes-api-shared/utils', () => ({ ExpectedError }));

const mintRunToken = jest.fn();
const getAgentAccount = jest.fn();

jest.mock('../runToken', () => ({
  mintRunToken: (...args: unknown[]) => mintRunToken(...args),
}));
jest.mock('../servicePrincipal', () => ({
  getAgentAccount: (...args: unknown[]) => getAgentAccount(...args),
}));

import type { WorkflowDefinition } from '../../workflows/dsl';
import {
  assertWorkflowSchedulable,
  backgroundRunEnableError,
  resolveAgentPrincipal,
} from '../backgroundPrincipal';

const USER_ID = 'agent-user-1';
const ACCOUNT_ID = 'core-agent-user-1';
const agent = { _id: USER_ID };

const account = (overrides: Record<string, unknown> = {}) => ({
  _id: ACCOUNT_ID,
  role: 'user',
  isOwner: false,
  isActive: true,
  appId: `erxes-agent:${USER_ID}`,
  permissionGroupIds: ['group-1', 'group-2'],
  customPermissions: [],
  ...overrides,
});

beforeEach(() => {
  mintRunToken.mockReset().mockResolvedValue('MINTED');
  getAgentAccount.mockReset().mockResolvedValue(account());
});

describe('resolveAgentPrincipal', () => {
  it('mints and propagates a bounded token for the canonical team member id', async () => {
    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
      background: false,
    });

    expect(result).toEqual({
      ok: true,
      authCtx: {
        token: 'MINTED',
        subdomain: 'os',
        principalUserId: ACCOUNT_ID,
        userHeader: Buffer.from(
          JSON.stringify({
            _id: ACCOUNT_ID,
            role: 'user',
            isOwner: false,
            isActive: true,
            permissionGroupIds: ['group-1', 'group-2'],
            customPermissions: [],
          }),
        ).toString('base64'),
        background: false,
        agentId: USER_ID,
      },
    });
    expect(getAgentAccount).toHaveBeenCalledWith({
      userId: USER_ID,
      subdomain: 'os',
    });
    expect(mintRunToken).toHaveBeenCalledWith({ account: account() });
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
      background: true,
    });

    expect(result.ok).toBe(true);
  });

  it('fails closed when the account is inactive or missing', async () => {
    getAgentAccount.mockRejectedValue(new Error('inactive'));

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
      background: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.stringMatching(/missing or inactive/i),
      }),
    );
    expect(result).not.toHaveProperty('authCtx');
    expect(mintRunToken).not.toHaveBeenCalled();
  });

  it('fails closed when the team member has no permissions', async () => {
    getAgentAccount.mockResolvedValue(
      account({ permissionGroupIds: [], customPermissions: [] }),
    );

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
      background: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.stringMatching(/no permissions/i),
      }),
    );
    expect(mintRunToken).not.toHaveBeenCalled();
  });

  it('fails closed when run-token minting fails', async () => {
    mintRunToken.mockResolvedValue(undefined);

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
      background: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.stringMatching(/could not mint/i),
      }),
    );
    expect(result).not.toHaveProperty('authCtx');
  });
});

describe('backgroundRunEnableError', () => {
  it('requires team-member permissions', () => {
    expect(
      backgroundRunEnableError({
        destructiveAllow: false,
        subject: 'workflow',
        hasPermissions: false,
      }),
    ).toMatch(/assign permissions/i);
  });

  it('rejects destructive operations and accepts a bounded background run', () => {
    expect(
      backgroundRunEnableError({
        destructiveAllow: true,
        subject: 'workflow',
        hasPermissions: true,
      }),
    ).toMatch(/destructiveOps/);
    expect(
      backgroundRunEnableError({
        destructiveAllow: false,
        subject: 'workflow',
        hasPermissions: true,
      }),
    ).toBeNull();
  });
});

describe('assertWorkflowSchedulable', () => {
  it('requires the owning profile and canonical account for schedules', async () => {
    const findOne = jest.fn().mockResolvedValue({
      _id: USER_ID,
      destructiveOps: 'ask',
    });
    const models = {
      MastraAgent: { findOne },
    } as unknown as IModels;

    await assertWorkflowSchedulable({
      models,
      subdomain: 'os',
      agentId: USER_ID,
      definition: {
        trigger: { type: 'schedule', config: {} },
      } as unknown as WorkflowDefinition,
    });

    expect(findOne).toHaveBeenCalledWith({ _id: USER_ID });
    expect(getAgentAccount).toHaveBeenCalledWith({
      userId: USER_ID,
      subdomain: 'os',
    });
  });
});
