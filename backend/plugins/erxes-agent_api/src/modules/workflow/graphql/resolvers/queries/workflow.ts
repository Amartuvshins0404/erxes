import { IContext } from '~/connectionResolvers';
import { getGroupActionScope } from 'erxes-api-shared/core-modules';
import { requireUserId } from '@/_shared/auth';
import {
  getWorkflowAgentAccess,
  requireScopedWorkflow,
  requireScopedWorkflowAgent,
} from '@/workflow/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';
import { canUserAccessAgent, getUserUnitIds } from '@/agent/utils';

/** Queries over workflow definitions and their run history. */
export const workflowQueries = {
  mastraWorkflows: async (
    _parent: undefined,
    { agentId }: { agentId?: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.read);
    requireUserId(user);

    if (agentId) {
      await requireScopedWorkflowAgent({
        models,
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.workflow.read,
        agentId,
      });
      return models.MastraWorkflow.getWorkflows({ agentId });
    }

    const { agentIds } = await getWorkflowAgentAccess({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.read,
    });
    return models.MastraWorkflow.getWorkflows({ agentIds });
  },

  mastraWorkflow: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.read);
    requireUserId(user);
    return requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.read,
      workflowId: _id,
    });
  },

  mastraWorkflowRuns: async (
    _parent: undefined,
    {
      workflowId,
      page,
      perPage,
    }: { workflowId: string; page?: number; perPage?: number },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.runsRead);
    requireUserId(user);
    await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.runsRead,
      workflowId,
    });
    return models.MastraWorkflowRun.getRuns({ workflowId, page, perPage });
  },
};

export const workflowCustomResolvers = {
  MastraWorkflow: {
    capabilities: async (
      workflow: { agentId?: string },
      _args: undefined,
      { models, subdomain, user }: IContext,
    ) => {
      const denied = {
        canUpdate: false,
        canRemove: false,
        canRun: false,
        canApprove: false,
        canSchedule: false,
        canReadRuns: false,
      };
      if (!user?._id || !workflow.agentId) return denied;

      const [agent, unitIds] = await Promise.all([
        models.MastraAgent.findOne({ agentId: workflow.agentId }),
        getUserUnitIds(models, user._id),
      ]);
      if (!agent) return denied;

      const canUse = async (action: string) => {
        const scope = await getGroupActionScope(subdomain, action, user);
        return Boolean(
          scope &&
            canUserAccessAgent(
              agent,
              user._id,
              scope,
              user.branchIds ?? [],
              user.departmentIds ?? [],
              unitIds,
            ),
        );
      };

      const [
        canUpdate,
        canRemove,
        canRun,
        canApprove,
        canSchedule,
        canReadRuns,
      ] = await Promise.all([
        canUse(ERXES_AGENT_ACTIONS.workflow.updateDraft),
        canUse(ERXES_AGENT_ACTIONS.workflow.remove),
        canUse(ERXES_AGENT_ACTIONS.workflow.run),
        canUse(ERXES_AGENT_ACTIONS.workflow.approve),
        canUse(ERXES_AGENT_ACTIONS.workflow.schedule),
        canUse(ERXES_AGENT_ACTIONS.workflow.runsRead),
      ]);

      return {
        canUpdate,
        canRemove,
        canRun,
        canApprove,
        canSchedule,
        canReadRuns,
      };
    },
  },
};
