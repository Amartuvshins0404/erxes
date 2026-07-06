import { IContext } from '~/connectionResolvers';
import { requireUserId } from '@/_shared/auth';

/** Queries over workflow definitions and their run history. */
export const workflowQueries = {
  mastraWorkflows: async (
    _parent: undefined,
    { agentId }: { agentId?: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsView');
    requireUserId(user);
    // Optional per-agent scoping — step 25's UI lists a single agent's workflows.
    return models.MastraWorkflow.getWorkflows({ agentId });
  },

  mastraWorkflow: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsView');
    requireUserId(user);
    return models.MastraWorkflow.getWorkflow(_id);
  },

  mastraWorkflowRuns: async (
    _parent: undefined,
    {
      workflowId,
      page,
      perPage,
    }: { workflowId: string; page?: number; perPage?: number },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsView');
    requireUserId(user);
    return models.MastraWorkflowRun.getRuns({ workflowId, page, perPage });
  },
};
