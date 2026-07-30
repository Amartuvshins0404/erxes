import { ExpectedError } from 'erxes-api-shared/utils';
import type { IContext, IModels } from '~/connectionResolvers';
import { validateDefinition } from '~/mastra/workflows/dsl';
import type { WorkflowDefinition } from '~/mastra/workflows/dsl';
import { buildManualEnvelope } from '~/mastra/workflows/envelope';
import { runWorkflow } from '~/mastra/workflows/runtime';
import { getOperationRegistry } from '~/mastra/tools/operationRegistry';
import { runWithAuth } from '~/mastra/requestContext';
import {
  assertWorkflowSchedulable,
  resolveAgentPrincipal,
} from '~/mastra/auth/backgroundPrincipal';
import type { IMastraWorkflow } from '@/workflow/@types/workflow';
import { requireUserId } from '@/_shared/auth';
import { syncTenantSchedules } from '~/mastra/scheduleSync';
import { getAgentAccount } from '~/mastra/auth/servicePrincipal';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';
import {
  requireScopedWorkflow,
  requireScopedWorkflowAgent,
} from '@/workflow/authorization';

// Every workflow owner is an AI team member: a profile plus an active core
// account. Account deactivation is the background execution kill switch.
const assertOwningAgentExists = async (
  models: IModels,
  subdomain: string,
  agentId: unknown,
) => {
  if (typeof agentId !== 'string' || !agentId.trim()) {
    throw new ExpectedError('A workflow must have an owning AI team member.');
  }
  const userId = agentId.trim();
  const profile = await models.MastraAgent.findOne({ _id: userId });
  if (!profile) {
    throw new ExpectedError(`Owning AI team member "${userId}" was not found.`);
  }
  try {
    await getAgentAccount({ userId, subdomain });
  } catch {
    throw new ExpectedError(
      `Owning AI team member "${userId}" is missing or inactive.`,
    );
  }
  return userId;
};

// Save-time validation runs with the LIVE operation registry, so a definition
// referencing a nonexistent or out-of-policy operation never reaches Mongo.
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

/** Mutations for workflow definitions and manual workflow runs. */
export const workflowMutations = {
  mastraWorkflowCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraWorkflow },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.createDraft);
    const userId = requireUserId(user);
    const agentId = await assertOwningAgentExists(
      models,
      subdomain,
      doc.agentId,
    );
    await requireScopedWorkflowAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.createDraft,
      agentId,
    });
    await validateWithRegistry(models, doc.definition);
    // The owning agent is the workflow's bound background principal — validate
    // the schedule-enable preconditions (from THAT agent) when creating enabled.
    if (doc.isEnabled) {
      await assertWorkflowSchedulable({
        models,
        subdomain,
        agentId,
        definition: doc.definition,
      });
    }
    const created = await models.MastraWorkflow.createWorkflow({
      ...doc,
      agentId,
      createdByUserId: userId,
    });
    await syncTenantSchedules(models, subdomain);
    return created;
  },

  mastraWorkflowUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: Partial<IMastraWorkflow> },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.updateDraft);
    requireUserId(user);
    const existing = await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.updateDraft,
      workflowId: _id,
    });
    // An update may only change agentId to another EXISTING agent (never clear
    // it) — the owning agent is the workflow's identity and can't be dropped.
    if (doc.agentId !== undefined) {
      await assertOwningAgentExists(models, subdomain, doc.agentId);
      await requireScopedWorkflowAgent({
        models,
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.workflow.updateDraft,
        agentId: doc.agentId,
      });
    }
    if (doc.definition) await validateWithRegistry(models, doc.definition);
    // Re-check the schedule-enable preconditions whenever the resulting workflow
    // is enabled — this update may enable it, repoint its trigger to a schedule,
    // reassign the owning agent, or flip the owning agent's destructiveOps.
    const willBeEnabled =
      doc.isEnabled !== undefined ? doc.isEnabled : existing.isEnabled;
    if (willBeEnabled) {
      await assertWorkflowSchedulable({
        models,
        subdomain,
        agentId: doc.agentId ?? existing.agentId,
        definition: (doc.definition ??
          existing.definition) as WorkflowDefinition,
      });
    }
    const updated = await models.MastraWorkflow.updateWorkflow(_id, doc);
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

  mastraWorkflowSetEnabled: async (
    _parent: undefined,
    { _id, isEnabled }: { _id: string; isEnabled: boolean },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    const action = isEnabled
      ? ERXES_AGENT_ACTIONS.workflow.schedule
      : ERXES_AGENT_ACTIONS.workflow.updateDraft;
    await checkPermission(action);
    requireUserId(user);
    const scopedWorkflow = await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action,
      workflowId: _id,
    });
    // Enabling a schedule-triggered workflow makes the cron live — gate it on
    // the secure background preconditions.
    if (isEnabled) {
      const workflow = scopedWorkflow;
      await assertWorkflowSchedulable({
        models,
        subdomain,
        agentId: workflow.agentId,
        definition: workflow.definition,
      });
    }
    const updated = await models.MastraWorkflow.setEnabled(_id, isEnabled);
    await syncTenantSchedules(models, subdomain);
    return updated;
  },

  // Dry validation for the master agent's draft loop — returns structured
  // errors instead of throwing, so the model can iterate. Read-only, so it is
  // gated by the same view permission as reading workflows.
  mastraWorkflowValidate: async (
    _parent: undefined,
    { definition }: { definition: unknown },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.read);
    requireUserId(user);
    const settings = await models.MastraSettings.getSettings();
    const registry = await getOperationRegistry(settings);
    const result = validateDefinition(definition, registry);
    return { ok: result.ok, errors: result.errors };
  },

  // Manual trigger. Allowed even when the workflow is disabled — disabling
  // gates event triggers, not deliberate test runs.
  mastraWorkflowRunStart: async (
    _parent: undefined,
    { _id, input }: { _id: string; input?: Record<string, unknown> },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.workflow.run);
    const initiatorUserId = requireUserId(user);
    const workflow = await requireScopedWorkflow({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.workflow.run,
      workflowId: _id,
    });
    const agentId = workflow.agentId?.trim();
    const agentConfig = agentId
      ? await models.MastraAgent.findOne({ _id: agentId })
      : null;
    const principal = await resolveAgentPrincipal({
      agentConfig,
      subdomain,
      background: false,
    });
    if (!principal.ok) throw new ExpectedError(principal.error);

    // Keep the human initiator in the envelope for auditability, but execute
    // every operation as the workflow's owning AI team-member account.
    const envelope = buildManualEnvelope(input || {}, initiatorUserId);
    return runWithAuth(principal.authCtx, () =>
      runWorkflow({ models, subdomain, workflow, envelope }),
    );
  },
};
