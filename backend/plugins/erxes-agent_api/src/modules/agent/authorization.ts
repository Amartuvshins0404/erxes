import type { FilterQuery } from 'mongoose';
import type {
  IUserDocument,
  PermissionScope,
} from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { requireActionScope } from '@/_shared/authorization';
import type { IMastraAgentDocument } from '@/agent/@types/agent';

export const agentAccessFilter = (
  user: Pick<IUserDocument, '_id'>,
  scope: PermissionScope,
): FilterQuery<IMastraAgentDocument> => {
  if (scope === 'all') return {};
  if (scope === 'own') return { createdBy: user._id };

  return {
    $or: [
      { createdBy: user._id },
      { visibility: 'organization' },
      { visibility: { $exists: false } },
      { visibility: 'shared', audienceUserIds: user._id },
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
  const agent = await models.MastraAgent.findOne({
    _id: agentId,
    ...agentAccessFilter(user, scope),
  });
  if (!agent) throw new ExpectedError('AI team member not found');

  return { agent, scope };
};
