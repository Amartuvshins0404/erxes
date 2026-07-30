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

import type { IModels } from '~/connectionResolvers';
import type { WorkflowDefinition } from '../../workflows/dsl';
import {
  assertWorkflowSchedulable,
  backgroundRunEnableError,
  resolveAgentPrincipal,
} from '../backgroundPrincipal';

const APP_TOKEN = 'sk_app-token';
const USER_ID = 'agent-user-1';
const MODELS = {} as IModels;
const agent = { _id: USER_ID };

const account = (overrides: Record<string, unknown> = {}) => ({
  _id: USER_ID,
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
      appToken: APP_TOKEN,
      models: MODELS,
      background: false,
    });

    expect(result).toEqual({
      ok: true,
      authCtx: {
        token: 'MINTED',
        subdomain: 'os',
        principalUserId: USER_ID,
        userHeader: Buffer.from(
          JSON.stringify({
            _id: USER_ID,
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
    expect(mintRunToken).toHaveBeenCalledWith({
      userId: USER_ID,
      subdomain: 'os',
      appToken: APP_TOKEN,
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
      appToken: APP_TOKEN,
      models: MODELS,
      background: true,
    });

    expect(result.ok).toBe(true);
  });

  it('fails closed when the account is inactive or missing', async () => {
    getAgentAccount.mockRejectedValue(new Error('inactive'));

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
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
      appToken: APP_TOKEN,
      models: MODELS,
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

  it('fails closed when the app credential is missing', async () => {
    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
      appToken: undefined,
      models: MODELS,
      background: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.stringMatching(/app token/i),
      }),
    );
    expect(getAgentAccount).not.toHaveBeenCalled();
    expect(mintRunToken).not.toHaveBeenCalled();
  });

  it('never falls back to the app credential when run-token minting fails', async () => {
    mintRunToken.mockResolvedValue(undefined);

    const result = await resolveAgentPrincipal({
      agentConfig: agent,
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
      background: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.stringMatching(/not falling back/i),
      }),
    );
    expect(result).not.toHaveProperty('authCtx');
  });
});

describe('backgroundRunEnableError', () => {
  it('requires an app credential and team-member permissions', () => {
    expect(
      backgroundRunEnableError({
        destructiveAllow: false,
        subject: 'workflow',
        appToken: APP_TOKEN,
        hasPermissions: false,
      }),
    ).toMatch(/assign permissions/i);
    expect(
      backgroundRunEnableError({
        destructiveAllow: false,
        subject: 'workflow',
        appToken: undefined,
        hasPermissions: true,
      }),
    ).toMatch(/app token/i);
  });

  it('rejects destructive operations and accepts a bounded background run', () => {
    expect(
      backgroundRunEnableError({
        destructiveAllow: true,
        subject: 'workflow',
        appToken: APP_TOKEN,
        hasPermissions: true,
      }),
    ).toMatch(/destructiveOps/);
    expect(
      backgroundRunEnableError({
        destructiveAllow: false,
        subject: 'workflow',
        appToken: APP_TOKEN,
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
    const getSettings = jest.fn().mockResolvedValue({
      erxesApiToken: APP_TOKEN,
    });
    const models = {
      MastraAgent: { findOne },
      MastraSettings: { getSettings },
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
