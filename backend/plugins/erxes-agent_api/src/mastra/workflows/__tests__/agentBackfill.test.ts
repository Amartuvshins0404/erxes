const getAgentAccount = jest.fn();

jest.mock('../../../connectionResolvers', () => ({
  generateModels: jest.fn(),
}));
jest.mock('erxes-api-shared/utils', () => ({
  getEnv: jest.fn(() => ''),
  getSaasOrganizations: jest.fn(() => []),
}));
jest.mock('../../auth/servicePrincipal', () => ({
  getAgentAccount: (...args: unknown[]) => getAgentAccount(...args),
}));

import type { IModels } from '../../../connectionResolvers';
import { backfillTenantWorkflows } from '../agentBackfill';

interface Profile {
  _id: string;
  createdAt?: Date;
}

interface Workflow {
  _id: string;
  agentId?: string | null;
  isEnabled?: boolean;
  definition?: {
    bindings?: Record<string, { kind: string; id: string }>;
  };
}

const asyncCursor = <T>(items: T[]) => ({
  async *[Symbol.asyncIterator]() {
    for (const item of items) yield item;
  },
});

const makeModels = (workflows: Workflow[], profiles: Profile[]) => {
  const updateOne = jest.fn().mockResolvedValue({ acknowledged: true });
  const exists = jest.fn(({ _id }: { _id: string }) =>
    Promise.resolve(profiles.some((profile) => profile._id === _id)),
  );
  const findProfiles = jest.fn(() => ({
    sort: jest.fn(() =>
      Promise.resolve(
        [...profiles].sort(
          (left, right) =>
            (left.createdAt?.getTime() ?? 0) -
              (right.createdAt?.getTime() ?? 0) ||
            left._id.localeCompare(right._id),
        ),
      ),
    ),
  }));
  const pending = workflows.filter((workflow) => !workflow.agentId);
  const findWorkflows = jest.fn(() => ({
    cursor: jest.fn(() => asyncCursor(pending)),
  }));
  return {
    models: {
      MastraWorkflow: { find: findWorkflows, updateOne },
      MastraAgent: { exists, find: findProfiles },
    } as unknown as IModels,
    updateOne,
    exists,
    findProfiles,
  };
};

beforeEach(() => {
  getAgentAccount
    .mockReset()
    .mockImplementation(({ userId }: { userId: string }) =>
      Promise.resolve({
        _id: userId,
        role: 'user',
        isActive: true,
        appId: `erxes-agent:${userId}`,
        permissionGroupIds: ['group-1'],
      }),
    );
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('backfillTenantWorkflows', () => {
  it('assigns the canonical active AI account referenced by one binding', async () => {
    const { models, updateOne, findProfiles } = makeModels(
      [
        {
          _id: 'workflow-1',
          definition: {
            bindings: {
              judge: { kind: 'agent', id: 'account-1' },
            },
          },
        },
      ],
      [{ _id: 'account-1' }, { _id: 'account-2' }],
    );

    await backfillTenantWorkflows(models, 'os');

    expect(getAgentAccount).toHaveBeenCalledWith({
      userId: 'account-1',
      subdomain: 'os',
    });
    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'workflow-1' },
      { $set: { agentId: 'account-1' } },
    );
    expect(findProfiles).not.toHaveBeenCalled();
  });

  it('falls back deterministically to the oldest active canonical account', async () => {
    getAgentAccount.mockImplementation(({ userId }: { userId: string }) =>
      userId === 'inactive-account'
        ? Promise.reject(new Error('inactive'))
        : Promise.resolve({
            _id: userId,
            role: 'user',
            isActive: true,
            appId: `erxes-agent:${userId}`,
            permissionGroupIds: ['group-1'],
          }),
    );
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'workflow-1',
          definition: {
            bindings: {
              judge: { kind: 'agent', id: 'inactive-account' },
            },
          },
        },
      ],
      [
        {
          _id: 'inactive-account',
          createdAt: new Date('2020-01-01'),
        },
        { _id: 'account-2', createdAt: new Date('2021-01-01') },
        { _id: 'account-3', createdAt: new Date('2022-01-01') },
      ],
    );

    await backfillTenantWorkflows(models, 'os');

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'workflow-1' },
      { $set: { agentId: 'account-2' } },
    );
  });

  it('treats multiple agent bindings as ambiguous and uses the oldest active account', async () => {
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'workflow-1',
          definition: {
            bindings: {
              first: { kind: 'agent', id: 'account-2' },
              second: { kind: 'agent', id: 'account-3' },
            },
          },
        },
      ],
      [
        { _id: 'account-1', createdAt: new Date('2020-01-01') },
        { _id: 'account-2', createdAt: new Date('2021-01-01') },
        { _id: 'account-3', createdAt: new Date('2022-01-01') },
      ],
    );

    await backfillTenantWorkflows(models, 'os');

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'workflow-1' },
      { $set: { agentId: 'account-1' } },
    );
  });

  it('disables an enabled workflow when no active AI team member exists', async () => {
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'workflow-1',
          isEnabled: true,
          definition: { bindings: {} },
        },
      ],
      [],
    );

    await backfillTenantWorkflows(models, 'os');

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'workflow-1' },
      { $set: { isEnabled: false } },
    );
  });

  it('does not touch workflows that already have a canonical owner id', async () => {
    const { models, updateOne } = makeModels(
      [{ _id: 'workflow-1', agentId: 'account-1', isEnabled: true }],
      [{ _id: 'account-1' }],
    );

    await backfillTenantWorkflows(models, 'os');

    expect(updateOne).not.toHaveBeenCalled();
    expect(getAgentAccount).not.toHaveBeenCalled();
  });
});
