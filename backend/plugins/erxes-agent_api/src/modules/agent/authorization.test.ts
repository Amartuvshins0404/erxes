class ExpectedError extends Error {}

const getPlugin = jest.fn();
const setUserHeader = jest.fn(
  (
    headers: Record<string, string>,
    currentUser: { _id?: string },
  ): void => {
    headers.user = `trusted:${currentUser._id}`;
    headers.userid = currentUser._id ?? '';
  },
);
jest.mock('erxes-api-shared/utils', () => ({
  erxesSubdomainHeaderName: 'erxes-subdomain',
  ExpectedError,
  getPlugin: (...args: unknown[]) => getPlugin(...args),
  setUserHeader: (...args: unknown[]) => setUserHeader(...args),
}));

const fetchRequest = jest.fn();
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  value: fetchRequest,
  writable: true,
});

const requireActionScope = jest.fn();
jest.mock('@/_shared/authorization', () => ({
  requireActionScope: (...args: unknown[]) => requireActionScope(...args),
}));

import type { IUserDocument } from 'erxes-api-shared/core-types';
import type { IModels } from '~/connectionResolvers';
import {
  agentAccessFilter,
  requireScopedAgent,
  resolveAgentAudienceTeamIds,
} from './authorization';

const user = {
  _id: 'user-1',
  departmentIds: ['department-1'],
} as IUserDocument;

describe('agent visibility authorization', () => {
  beforeEach(() => {
    getPlugin.mockReset().mockResolvedValue({
      address: 'http://operation-api',
    });
    setUserHeader.mockClear();
    fetchRequest.mockReset().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: { getTeams: [{ _id: 'team-1' }] },
      }),
    });
  });

  it('gives all-scoped Agent Admins an unrestricted filter', () => {
    expect(agentAccessFilter(user, 'all')).toEqual({});
  });

  it('limits own-scoped management to records created by the caller', () => {
    expect(agentAccessFilter(user, 'own')).toEqual({
      createdBy: user._id,
    });
  });

  it('lets group-scoped users reach owned, shared, and organization agents', () => {
    expect(agentAccessFilter(user, 'group', ['team-1'])).toEqual({
      $or: [
        { createdBy: user._id },
        { visibility: 'organization' },
        { visibility: { $exists: false } },
        { visibility: 'shared', audienceUserIds: user._id },
        {
          visibility: 'shared',
          audienceTeamIds: { $in: ['team-1'] },
        },
        {
          visibility: 'shared',
          audienceDepartmentIds: { $in: ['department-1'] },
        },
      ],
    });
  });

  it('applies visibility in the database selector and hides misses as not found', async () => {
    requireActionScope.mockResolvedValue('group');
    const findOne = jest.fn().mockResolvedValue(null);
    const models = {
      MastraAgent: { findOne },
    } as unknown as IModels;

    await expect(
      requireScopedAgent({
        models,
        subdomain: 'os',
        user,
        action: 'erxesAgentAgentsChat',
        agentId: 'private-agent',
      }),
    ).rejects.toThrow('AI team member not found');

    expect(findOne).toHaveBeenCalledWith({
      _id: 'private-agent',
      ...agentAccessFilter(user, 'group', ['team-1']),
    });
    expect(getPlugin).toHaveBeenCalledWith('operation');
    expect(setUserHeader).toHaveBeenCalledWith(expect.any(Object), user);
    expect(fetchRequest).toHaveBeenCalledWith(
      'http://operation-api/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'erxes-subdomain': 'os',
          user: 'trusted:user-1',
          userid: 'user-1',
        },
      }),
    );
    const requestBody = JSON.parse(fetchRequest.mock.calls[0][1].body);
    expect(requestBody).toEqual({
      operationName: 'MastraAudienceTeams',
      query: expect.stringContaining('getTeams(userId: $userId)'),
      variables: { userId: user._id },
    });
    expect(requestBody.query).not.toContain(user._id);
  });

  it('never calls Operation outside group scope', async () => {
    await expect(
      resolveAgentAudienceTeamIds('os', user, 'all'),
    ).resolves.toEqual([]);

    expect(getPlugin).not.toHaveBeenCalled();
    expect(fetchRequest).not.toHaveBeenCalled();
  });

  it('rejects malformed Operation responses instead of trusting their IDs', async () => {
    fetchRequest.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: { getTeams: [{ _id: 123 }, null, { name: 'missing id' }] },
      }),
    });

    await expect(
      resolveAgentAudienceTeamIds('os', user, 'group'),
    ).resolves.toEqual([]);
  });
});
