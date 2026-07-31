import { IUserDocument } from 'erxes-api-shared/core-types';
import { IModels } from '~/connectionResolvers';
import { requireActionScope } from '@/_shared/authorization';

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
  const [scope, agent] = await Promise.all([
    requireActionScope({ subdomain, user, action }),
    models.MastraAgent.getAgent(agentId),
  ]);

  return { agent, scope };
};
