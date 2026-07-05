import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext, IModels } from '~/connectionResolvers';
import { validateDefinition, WorkflowDefinition } from '~/mastra/workflows/dsl';
import { buildManualEnvelope } from '~/mastra/workflows/envelope';
import { runWorkflow } from '~/mastra/workflows/runtime';
import { getOperationRegistry } from '~/mastra/tools/operationRegistry';
import { runWithAuth } from '~/mastra/requestContext';
import { assertWorkflowSchedulable } from '~/mastra/auth/backgroundPrincipal';
import { IMastraWorkflow } from '@/workflow/@types/workflow';
import { requireUserId } from '@/_shared/auth';

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
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsCreate');
    const userId = requireUserId(user);
    await validateWithRegistry(models, doc.definition);
    // The creator is the workflow's bound background owner — validate the
    // schedule-enable preconditions when creating already-enabled.
    if (doc.isEnabled) {
      assertWorkflowSchedulable({ owner: userId, definition: doc.definition });
    }
    return models.MastraWorkflow.createWorkflow({
      ...doc,
      createdByUserId: userId,
    });
  },

  mastraWorkflowUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: Partial<IMastraWorkflow> },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsEdit');
    requireUserId(user);
    if (doc.definition) await validateWithRegistry(models, doc.definition);
    // Re-check the schedule-enable preconditions whenever the resulting workflow
    // is enabled — this update may enable it, repoint its trigger to a schedule,
    // or flip destructiveOps on an already-enabled scheduled workflow.
    const existing = await models.MastraWorkflow.getWorkflow(_id);
    const willBeEnabled =
      doc.isEnabled !== undefined ? doc.isEnabled : existing.isEnabled;
    if (willBeEnabled) {
      assertWorkflowSchedulable({
        owner: existing.createdByUserId,
        definition: (doc.definition ?? existing.definition) as WorkflowDefinition,
      });
    }
    return models.MastraWorkflow.updateWorkflow(_id, doc);
  },

  mastraWorkflowRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsRemove');
    requireUserId(user);
    return models.MastraWorkflow.removeWorkflow(_id);
  },

  mastraWorkflowSetEnabled: async (
    _parent: undefined,
    { _id, isEnabled }: { _id: string; isEnabled: boolean },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('workflowsEdit');
    requireUserId(user);
    // Enabling a schedule-triggered workflow makes the cron live — gate it on
    // the secure background preconditions.
    if (isEnabled) {
      const workflow = await models.MastraWorkflow.getWorkflow(_id);
      assertWorkflowSchedulable({
        owner: workflow.createdByUserId,
        definition: workflow.definition,
      });
    }
    return models.MastraWorkflow.setEnabled(_id, isEnabled);
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
