import type { FilterQuery } from 'mongoose';
import type {
  IUserDocument,
  PermissionScope,
} from 'erxes-api-shared/core-types';
import { ExpectedError, sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { requireActionScope } from '@/_shared/authorization';
import type { IMastraAgentDocument } from '@/agent/@types/agent';

export const resolveAgentAudienceTeamIds = async (
  subdomain: string,
  userId: string,
  scope: PermissionScope,
): Promise<string[]> => {
  if (scope !== 'group') return [];

  const teamIds: unknown = await sendTRPCMessage({
    subdomain,
    pluginName: 'operation',
    module: 'team',
    action: 'memberTeamIds',
    input: { memberId: userId },
    defaultValue: [],
  });

  if (!Array.isArray(teamIds)) return [];

  return [
    ...new Set(
      teamIds
        .filter((teamId): teamId is string => typeof teamId === 'string')
        .map((teamId) => teamId.trim())
        .filter(Boolean),
    ),
  ];
};

export const agentAccessFilter = (
  user: Pick<IUserDocument, '_id' | 'departmentIds'>,
  scope: PermissionScope,
  teamIds: string[] = [],
): FilterQuery<IMastraAgentDocument> => {
  if (scope === 'all') return {};
  if (scope === 'own') return { createdBy: user._id };

  const sharedAudienceFilters: FilterQuery<IMastraAgentDocument>[] = [
    { visibility: 'shared', audienceUserIds: user._id },
  ];
  if (teamIds.length) {
    sharedAudienceFilters.push({
      visibility: 'shared',
      audienceTeamIds: { $in: teamIds },
    });
  }
  if (user.departmentIds?.length) {
    sharedAudienceFilters.push({
      visibility: 'shared',
      audienceDepartmentIds: { $in: user.departmentIds },
    });
  }

  return {
    $or: [
      { createdBy: user._id },
      { visibility: 'organization' },
      { visibility: { $exists: false } },
      ...sharedAudienceFilters,
    ],
  };
};

export const requireScopedAgent = async ({
  models,
  subdomain,
  user,
  action,
  agentId,
}: {
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  action: string;
  agentId: string;
}) => {
  const scope = await requireActionScope({ subdomain, user, action });
  const teamIds = await resolveAgentAudienceTeamIds(subdomain, user._id, scope);
  const agent = await models.MastraAgent.findOne({
    _id: agentId,
    ...agentAccessFilter(user, scope, teamIds),
  });
  if (!agent) throw new ExpectedError('AI team member not found');

  return { agent, scope };
};
