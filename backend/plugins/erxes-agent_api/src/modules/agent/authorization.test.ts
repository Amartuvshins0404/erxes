class ExpectedError extends Error {}

const sendTRPCMessage = jest.fn();
jest.mock('erxes-api-shared/utils', () => ({
  ExpectedError,
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

const requireActionScope = jest.fn();
jest.mock('@/_shared/authorization', () => ({
  requireActionScope: (...args: unknown[]) => requireActionScope(...args),
}));

import type { IUserDocument } from 'erxes-api-shared/core-types';
import type { IModels } from '~/connectionResolvers';
import { agentAccessFilter, requireScopedAgent } from './authorization';

const user = {
  _id: 'user-1',
  departmentIds: ['department-1'],
} as IUserDocument;

describe('agent visibility authorization', () => {
  beforeEach(() => {
    sendTRPCMessage.mockReset().mockResolvedValue(['team-1']);
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
    expect(sendTRPCMessage).toHaveBeenCalledWith({
      subdomain: 'os',
      pluginName: 'operation',
      module: 'team',
      action: 'memberTeamIds',
      input: { memberId: user._id },
      defaultValue: [],
    });
  });
});
