// ---------------------------------------------------------------------------
// One-time, idempotent backfill: give every legacy workflow an OWNING AGENT.
//
// Step 24 made `agentId` the workflow's identity anchor — but workflows created
// before this step have none. This boot hook assigns one deterministically so
// their background runs have a principal, disabling any that genuinely can't be
// assigned (they can't run without an identity). It is idempotent: workflows
// that already carry an agentId are skipped, so it is safe to run on every boot.
//
// Auto-assign order (Amaraa's decision):
//   a. the single distinct agent referenced inside the definition's bindings;
//   b. else the oldest enabled agent owned/created by the workflow's creator;
//   c. else the tenant's oldest enabled agent;
//   d. else leave it unassigned AND disable it, logging a warning.
// ---------------------------------------------------------------------------

import { getEnv, getSaasOrganizations } from 'erxes-api-shared/utils';
import { generateModels, IModels } from '../../connectionResolvers';
import type { IMastraAgentDocument } from '@/agent/@types/agent';
import type { IMastraWorkflowDocument } from '@/workflow/@types/workflow';

/** Tenants to backfill: every saas org's subdomain, or the pinned 'os'. */
async function tenants(): Promise<string[]> {
  if (getEnv({ name: 'VERSION' }) === 'saas') {
    const orgs = await getSaasOrganizations();
    return orgs.map((org: { subdomain: string }) => org.subdomain);
  }
  return ['os'];
}

/** The distinct agent binding ids ({ kind:'agent' }) named in a definition. */
function referencedAgentBindingIds(
  workflow: IMastraWorkflowDocument,
): string[] {
  const bindings = workflow.definition?.bindings || {};
  const ids = new Set<string>();
  for (const binding of Object.values(bindings)) {
    if (binding?.kind === 'agent' && binding.id) ids.add(binding.id);
  }
  return [...ids];
}

/**
 * Rule (a): the single distinct agent referenced in the definition's bindings.
 * Bindings hold an agent's mongoose `_id`; the workflow's owning agentId is the
 * business id, so resolve _id → agent and return its `agentId`. Only applies
 * when EXACTLY ONE DISTINCT id is REFERENCED — the ambiguity test counts
 * referenced ids, NOT resolved docs. Two distinct referenced ids where one agent
 * was since deleted is still ambiguous (we can't know which the author meant), so
 * it falls through to rule (b); collapsing to the lone survivor would silently
 * pick an owner the definition never singled out.
 */
async function agentFromBindings(
  models: IModels,
  workflow: IMastraWorkflowDocument,
): Promise<string | undefined> {
  const ids = referencedAgentBindingIds(workflow);
  if (ids.length !== 1) return undefined;
  // Exactly one referenced id: resolve it. If that agent was deleted the lookup
  // is empty → undefined → rule (b), never a wrong assignment.
  const agent = await models.MastraAgent.findOne({ _id: ids[0] });
  return agent?.agentId || undefined;
}

/** Rule (b): oldest enabled agent owned or created by the workflow's creator. */
async function agentFromCreator(
  models: IModels,
  workflow: IMastraWorkflowDocument,
): Promise<string | undefined> {
  const creator = workflow.createdByUserId?.trim();
  if (!creator) return undefined;
  const agent = (await models.MastraAgent.findOne({
    isEnabled: true,
    $or: [{ ownerUserId: creator }, { createdBy: creator }],
  }).sort({ createdAt: 1, _id: 1 })) as IMastraAgentDocument | null;
  return agent?.agentId || undefined;
}

/** Rule (c): the tenant's oldest enabled agent. */
async function oldestEnabledAgent(
  models: IModels,
): Promise<string | undefined> {
  const agent = (await models.MastraAgent.findOne({ isEnabled: true }).sort({
    createdAt: 1,
    _id: 1,
  })) as IMastraAgentDocument | null;
  return agent?.agentId || undefined;
}

/**
 * Resolves the owning agentId for one workflow via rules a→c (in order), plus
 * the rule label used for the log line. Undefined agentId → rule (d).
 */
async function resolveOwningAgent(
  models: IModels,
  workflow: IMastraWorkflowDocument,
): Promise<{ agentId?: string; rule: 'binding' | 'creator' | 'tenant' | 'none' }> {
  const fromBinding = await agentFromBindings(models, workflow);
  if (fromBinding) return { agentId: fromBinding, rule: 'binding' };

  const fromCreator = await agentFromCreator(models, workflow);
  if (fromCreator) return { agentId: fromCreator, rule: 'creator' };

  const fromTenant = await oldestEnabledAgent(models);
  if (fromTenant) return { agentId: fromTenant, rule: 'tenant' };

  return { rule: 'none' };
}

/** Assigns (or disables) one pending workflow. Throws on a Mongo failure so the
 *  caller can contain it per workflow. */
async function backfillOneWorkflow(
  models: IModels,
  workflow: IMastraWorkflowDocument,
): Promise<void> {
  const { agentId, rule } = await resolveOwningAgent(models, workflow);

  if (agentId) {
    await models.MastraWorkflow.updateOne(
      { _id: workflow._id },
      { $set: { agentId } },
    );
    // eslint-disable-next-line no-console
    console.log(
      `[erxes-agent:workflows] backfill: workflow ${workflow._id} → agent ${agentId} (rule: ${rule})`,
    );
    return;
  }

  // Rule (d): no agent to assign — a workflow can't run in the background
  // without an identity, so disable it and leave agentId unset for an admin to
  // assign later.
  if (workflow.isEnabled) {
    await models.MastraWorkflow.updateOne(
      { _id: workflow._id },
      { $set: { isEnabled: false } },
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    `[erxes-agent:workflows] backfill: workflow ${workflow._id} has no assignable agent — left unassigned and disabled`,
  );
}

/**
 * Backfills every workflow in ONE tenant that is missing an agentId. Pure over
 * the passed models so it can be unit-tested without a live Mongo. Idempotent:
 * the query only selects workflows without an agentId. Streams the pending set
 * with a cursor rather than loading it all into memory, and contains a
 * per-workflow failure (log + continue) so one bad doc can't abort the rest.
 */
export async function backfillTenantWorkflows(models: IModels): Promise<void> {
  const cursor = models.MastraWorkflow.find({
    $or: [{ agentId: { $exists: false } }, { agentId: null }, { agentId: '' }],
  }).cursor() as AsyncIterable<IMastraWorkflowDocument>;

  for await (const workflow of cursor) {
    try {
      await backfillOneWorkflow(models, workflow);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `[erxes-agent:workflows] backfill: workflow ${workflow._id} failed — skipping: ${(e as Error)?.message}`,
      );
    }
  }
}

/** Boot hook: backfill owning agents across every tenant, isolating failures. */
export async function backfillWorkflowAgents(): Promise<void> {
  for (const tenant of await tenants()) {
    try {
      const models = await generateModels(tenant);
      await backfillTenantWorkflows(models);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `[erxes-agent:workflows] agent backfill failed for ${tenant}: ${e?.message}`,
      );
    }
  }
}
