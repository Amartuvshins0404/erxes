import { IUserDocument } from 'erxes-api-shared/core-types';
import { IModels } from '~/connectionResolvers';
import { requireActionScope } from '@/_shared/authorization';
import { getUserUnitIds } from '@/agent/utils';

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
  const [scope, unitIds] = await Promise.all([
    requireActionScope({ subdomain, user, action }),
    getUserUnitIds(models, user._id),
  ]);
  const agent = await models.MastraAgent.getAgent(
    agentId,
    user._id,
    scope,
    user.branchIds ?? [],
    user.departmentIds ?? [],
    unitIds,
  );

  return { agent, scope };
};
