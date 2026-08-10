import { ExpectedError } from 'erxes-api-shared/utils';
import { canGroup } from 'erxes-api-shared/core-modules';
import type { IContext, IModels } from '~/connectionResolvers';
import { validateDefinition } from '~/mastra/workflows/dsl';
import { buildManualEnvelope } from '~/mastra/workflows/envelope';
import { runWorkflow } from '~/mastra/workflows/runtime';
import { getOperationRegistry } from '~/mastra/tools/operationRegistry';
import { runWithAuth } from '~/mastra/requestContext';
import { assertWorkflowSchedulable } from '~/mastra/auth/backgroundPrincipal';
import type { IMastraWorkflow } from '@/workflow/@types/workflow';
import { requireUserId } from '@/_shared/auth';
import { syncTenantSchedules } from '~/mastra/scheduleSync';
import {
  requireScopedWorkflow,
  requireScopedWorkflowAgent,
} from '@/workflow/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

const validateWithRegistry = async (models: IModels, definition: unknown) => {
  const settings = await models.MastraSettings.getSettings();
  const registry = await getOperationRegistry(settings);
  const result = validateDefinition(definition, registry);
  if (!result.ok) {
    const lines = result.errors
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('\n');
    throw new ExpectedError(`Workflow definition is invalid:\n${lines}`);
  }
};

export const workflowMutations = {
  mastraWorkflowCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraWorkflow },
    { models, user, checkPermission, subdomain }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.createDraft);
    const userId = requireUserId(user);
    const agentId = doc.agentId?.trim();
    if (!agentId) {
      throw new ExpectedError(
        'A workflow must have an owning agent — set agentId to an existing agent.',
      );
    }

    const { agent } = await requireScopedWorkflowAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.createDraft,
      agentId,
    });
    if (!agent.isEnabled) {
      throw new ExpectedError(
        `Owning agent "${agentId}" is disabled — enable it before creating a workflow.`,
      );
    }

    await validateWithRegistry(models, doc.definition);
    return models.MastraWorkflow.createWorkflow({
      ...doc,
      agentId,
      isEnabled: false,
      approvalStatus: 'draft',
      createdByUserId: userId,
    });
  },

  mastraWorkflowUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: Partial<IMastraWorkflow> },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.updateDraft);
    requireUserId(user);
    await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.updateDraft,
      workflowId: _id,
    });

    const {
      isEnabled,
      approvalStatus,
      approvedByUserId,
      approvedAt,
      createdByUserId,
      ...draft
    } = doc;
    if (
      isEnabled !== undefined ||
      approvalStatus !== undefined ||
      approvedByUserId !== undefined ||
      approvedAt !== undefined ||
      createdByUserId !== undefined
    ) {
      throw new ExpectedError(
        'Workflow approval and scheduling use dedicated actions',
      );
    }

    if (draft.agentId !== undefined) {
      const agentId = draft.agentId.trim();
      if (!agentId)
        throw new ExpectedError('A workflow must have an owning agent');
      const { agent } = await requireScopedWorkflowAgent({
        models,
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.workflow.updateDraft,
        agentId,
      });
      if (!agent.isEnabled) {
        throw new ExpectedError(`Owning agent "${agentId}" is disabled`);
      }
      draft.agentId = agentId;
    }
    if (draft.definition) {
      await validateWithRegistry(models, draft.definition);
    }

    const updated = await models.MastraWorkflow.updateWorkflow(_id, draft);
    await syncTenantSchedules(models, subdomain);
    return updated;
  },

  mastraWorkflowRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.remove);
    requireUserId(user);
    await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.remove,
      workflowId: _id,
    });
    const removed = await models.MastraWorkflow.removeWorkflow(_id);
    await syncTenantSchedules(models, subdomain);
    return removed;
  },

  mastraWorkflowApprove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.approve);
    const userId = requireUserId(user);
    const workflow = await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.approve,
      workflowId: _id,
    });
    await validateWithRegistry(models, workflow.definition);
    await assertWorkflowSchedulable({
      models,
      agentId: workflow.agentId,
      definition: workflow.definition,
    });
    return models.MastraWorkflow.approveWorkflow(
      _id,
      userId,
      workflow.version,
      workflow.updatedAt,
    );
  },

  mastraWorkflowSetEnabled: async (
    _parent: undefined,
    { _id, isEnabled }: { _id: string; isEnabled: boolean },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.schedule);
    requireUserId(user);
    const workflow = await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.schedule,
      workflowId: _id,
    });
    if (isEnabled) {
      if (workflow.approvalStatus !== 'approved') {
        throw new ExpectedError(
          'Workflow must be approved before it can be enabled',
        );
      }
      await assertWorkflowSchedulable({
        models,
        agentId: workflow.agentId,
        definition: workflow.definition,
      });
    }
    const updated = await models.MastraWorkflow.setEnabled(_id, isEnabled);
    await syncTenantSchedules(models, subdomain);
    return updated;
  },

  mastraWorkflowValidate: async (
    _parent: undefined,
    { definition }: { definition: unknown },
    { models, user, subdomain }: IContext,
  ) => {
    const canValidate =
      (await canGroup(
        subdomain,
        ERXES_AGENT_ACTIONS.workflow.createDraft,
        user,
      )) ||
      (await canGroup(
        subdomain,
        ERXES_AGENT_ACTIONS.workflow.updateDraft,
        user,
      ));
    if (!canValidate) throw new ExpectedError('Permission required');
    requireUserId(user);
    const settings = await models.MastraSettings.getSettings();
    const registry = await getOperationRegistry(settings);
    const result = validateDefinition(definition, registry);
    return { ok: result.ok, errors: result.errors };
  },

  mastraWorkflowRunStart: async (
    _parent: undefined,
    { _id, input }: { _id: string; input?: Record<string, unknown> },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.run);
    const userId = requireUserId(user);
    const workflow = await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.run,
      workflowId: _id,
    });
    if (workflow.approvalStatus !== 'approved') {
      throw new ExpectedError('Workflow must be approved before it can run');
    }
    const envelope = buildManualEnvelope(input || {}, userId);

    return runWithAuth(
      {
        userHeader: Buffer.from(JSON.stringify(user)).toString('base64'),
        subdomain,
      },
      () => runWorkflow({ models, subdomain, workflow, envelope }),
    );
  },
};
