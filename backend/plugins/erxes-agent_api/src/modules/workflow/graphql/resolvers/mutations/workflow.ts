import { ExpectedError } from 'erxes-api-shared/utils';
import type { IContext, IModels } from '~/connectionResolvers';
import { validateDefinition } from '~/mastra/workflows/dsl';
import type { WorkflowDefinition } from '~/mastra/workflows/dsl';
import { buildManualEnvelope } from '~/mastra/workflows/envelope';
import { runWorkflow } from '~/mastra/workflows/runtime';
import { getOperationRegistry } from '~/mastra/tools/operationRegistry';
import { runWithAuth } from '~/mastra/requestContext';
import { assertWorkflowSchedulable } from '~/mastra/auth/backgroundPrincipal';
import type { IMastraWorkflow } from '@/workflow/@types/workflow';
import { requireUserId } from '@/_shared/auth';
import { syncTenantSchedules } from '~/mastra/scheduleSync';

// The owning agent is the workflow's identity anchor (its background principal
// and enable preconditions resolve from this agent). New workflows must name an
// existing enabled agent.
const assertOwningAgentExists = async (models: IModels, agentId: unknown) => {
  if (typeof agentId !== 'string' || !agentId.trim()) {
    throw new ExpectedError(
      'A workflow must have an owning agent — set agentId to an existing agent.',
    );
  }
  // Only an enabled agent may own a workflow; disabling it is the background
  // execution kill switch.
  const agent = await models.MastraAgent.findOne({
    agentId: agentId.trim(),
    isEnabled: true,
  });
  if (!agent) {
    throw new ExpectedError(
      `Owning agent "${agentId}" not found or disabled — enable it or reassign the workflow.`,
    );
  }
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
    await checkPermission('workflowsCreate');
    const userId = requireUserId(user);
    // Every workflow is owned by an agent — required, and it must exist.
    await assertOwningAgentExists(models, doc.agentId);
    await validateWithRegistry(models, doc.definition);
    // The owning agent is the workflow's bound background principal — validate
    // the schedule-enable preconditions (from THAT agent) when creating enabled.
    if (doc.isEnabled) {
      await assertWorkflowSchedulable({
        models,
        agentId: doc.agentId,
        definition: doc.definition,
      });
    }
    const created = await models.MastraWorkflow.createWorkflow({
      ...doc,
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
    await checkPermission('workflowsEdit');
    requireUserId(user);
    // An update may only change agentId to another EXISTING agent (never clear
    // it) — the owning agent is the workflow's identity and can't be dropped.
    if (doc.agentId !== undefined) {
      await assertOwningAgentExists(models, doc.agentId);
    }
    if (doc.definition) await validateWithRegistry(models, doc.definition);
    // Re-check the schedule-enable preconditions whenever the resulting workflow
    // is enabled — this update may enable it, repoint its trigger to a schedule,
    // reassign the owning agent, or flip the owning agent's destructiveOps.
    const existing = await models.MastraWorkflow.getWorkflow(_id);
    const willBeEnabled =
      doc.isEnabled !== undefined ? doc.isEnabled : existing.isEnabled;
    if (willBeEnabled) {
      await assertWorkflowSchedulable({
        models,
        agentId: doc.agentId ?? existing.agentId,
        definition: (doc.definition ?? existing.definition) as WorkflowDefinition,
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
    await checkPermission('workflowsRemove');
    requireUserId(user);
    const removed = await models.MastraWorkflow.removeWorkflow(_id);
    await syncTenantSchedules(models, subdomain);
    return removed;
  },

  mastraWorkflowSetEnabled: async (
    _parent: undefined,
    { _id, isEnabled }: { _id: string; isEnabled: boolean },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsEdit');
    requireUserId(user);
    // Enabling a schedule-triggered workflow makes the cron live — gate it on
    // the secure background preconditions.
    if (isEnabled) {
      const workflow = await models.MastraWorkflow.getWorkflow(_id);
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

  // Dry validation for the master agent's draft loop — returns structured
  // errors instead of throwing, so the model can iterate. Read-only, so it is
  // gated by the same view permission as reading workflows.
  mastraWorkflowValidate: async (
    _parent: undefined,
    { definition }: { definition: unknown },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsView');
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
    await checkPermission('workflowsRun');
    const userId = requireUserId(user);
    const workflow = await models.MastraWorkflow.getWorkflow(_id);
    const envelope = buildManualEnvelope(input || {}, userId);
    // Operation steps execute AS the requesting user (erxes enforces their
    // permissions), not as the privileged app token — that fallback is
    // reserved for background (schedule/automation) runs.
    return runWithAuth(
      {
        userHeader: Buffer.from(JSON.stringify(user)).toString('base64'),
        subdomain,
      },
      () => runWorkflow({ models, subdomain, workflow, envelope }),
    );
  },
};
