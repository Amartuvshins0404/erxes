import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { requireActionScope } from '@/_shared/authorization';
import {
  canUserAccessAgent,
  getUserUnitIds,
  visibilityFilter,
} from '@/agent/utils';

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
  const [scope, unitIds] = await Promise.all([
    requireActionScope({ subdomain, user, action }),
    getUserUnitIds(models, user._id),
  ]);
  const agents = await models.MastraAgent.find(
    visibilityFilter(
      user._id,
      scope,
      user.branchIds ?? [],
      user.departmentIds ?? [],
      unitIds,
    ),
  )
    .select({ agentId: 1 })
    .lean();

  return {
    scope,
    agentIds: agents.flatMap((agent) => (agent.agentId ? [agent.agentId] : [])),
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
  const [scope, unitIds, agent] = await Promise.all([
    requireActionScope({ subdomain, user, action }),
    getUserUnitIds(models, user._id),
    models.MastraAgent.findOne({ agentId }),
  ]);

  if (
    !agent ||
    !canUserAccessAgent(
      agent,
      user._id,
      scope,
      user.branchIds ?? [],
      user.departmentIds ?? [],
      unitIds,
    )
  ) {
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
