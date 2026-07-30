import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { requireActionScope } from '@/_shared/authorization';

export const getWorkflowAgentAccess = async ({
  models,
  subdomain,
  user,
  action,
}: {
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  action: string;
}): Promise<{
  scope: 'own' | 'group' | 'all';
  agentIds: string[];
}> => {
  const scope = await requireActionScope({ subdomain, user, action });
  const agents = await models.MastraAgent.find(
    scope === 'own' ? { _id: user._id } : {},
  )
    .select({ _id: 1 })
    .lean();

  return {
    scope,
    agentIds: agents.map((agent) => String(agent._id)),
  };
};

export const requireScopedWorkflowAgent = async ({
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
    models.MastraAgent.findById(agentId),
  ]);

  if (!agent || (scope === 'own' && String(agent._id) !== user._id)) {
    throw new ExpectedError('Workflow not found');
  }

  return { agent, scope };
};

export const requireScopedWorkflow = async ({
  models,
  subdomain,
  user,
  action,
  workflowId,
}: {
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  action: string;
  workflowId: string;
}) => {
  const workflow = await models.MastraWorkflow.getWorkflow(workflowId);
  if (!workflow.agentId) throw new ExpectedError('Workflow not found');

  await requireScopedWorkflowAgent({
    models,
    subdomain,
    user,
    action,
    agentId: workflow.agentId,
  });

  return workflow;
};
