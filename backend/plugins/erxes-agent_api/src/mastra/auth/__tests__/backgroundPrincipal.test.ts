class ExpectedError extends Error {}

jest.mock('erxes-api-shared/utils', () => ({ ExpectedError }));

const getAgentAccount = jest.fn();

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
      background: false,
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
            branchIds: ['branch-1'],
            departmentIds: ['department-1'],
            permissionGroupIds: ['group-1', 'group-2'],
            customPermissions: [],
            sessionCode: '',
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
