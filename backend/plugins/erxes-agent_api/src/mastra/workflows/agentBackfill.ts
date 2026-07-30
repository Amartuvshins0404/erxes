import { getEnv, getSaasOrganizations } from 'erxes-api-shared/utils';
import { generateModels, IModels } from '../../connectionResolvers';
import type { IMastraWorkflowDocument } from '@/workflow/@types/workflow';
import { getAgentAccount } from '../auth/servicePrincipal';

async function tenants(): Promise<string[]> {
  if (getEnv({ name: 'VERSION' }) === 'saas') {
    const organizations = await getSaasOrganizations();
    return organizations.map(
      (organization: { subdomain: string }) => organization.subdomain,
    );
  }
  return ['os'];
}

function referencedAgentIds(workflow: IMastraWorkflowDocument): string[] {
  const ids = new Set<string>();
  for (const binding of Object.values(workflow.definition?.bindings || {})) {
    if (binding?.kind === 'agent' && binding.id) ids.add(binding.id);
  }
  return [...ids];
}

async function isActiveAgent(
  models: IModels,
  subdomain: string,
  userId: string,
): Promise<boolean> {
  if (!(await models.MastraAgent.exists({ _id: userId }))) return false;
  try {
    await getAgentAccount({ userId, subdomain });
    return true;
  } catch {
    return false;
  }
}

async function oldestActiveAgent(
  models: IModels,
  subdomain: string,
): Promise<string | undefined> {
  const profiles = await models.MastraAgent.find({}).sort({
    createdAt: 1,
    _id: 1,
  });
  for (const profile of profiles) {
    if (await isActiveAgent(models, subdomain, profile._id)) return profile._id;
  }
  return undefined;
}

async function resolveOwningAgent(
  models: IModels,
  subdomain: string,
  workflow: IMastraWorkflowDocument,
): Promise<{ agentId?: string; rule: 'binding' | 'tenant' | 'none' }> {
  const ids = referencedAgentIds(workflow);
  if (ids.length === 1 && (await isActiveAgent(models, subdomain, ids[0]))) {
    return { agentId: ids[0], rule: 'binding' };
  }
  const fallback = await oldestActiveAgent(models, subdomain);
  return fallback ? { agentId: fallback, rule: 'tenant' } : { rule: 'none' };
}

async function backfillOneWorkflow(
  models: IModels,
  subdomain: string,
  workflow: IMastraWorkflowDocument,
): Promise<void> {
  const { agentId, rule } = await resolveOwningAgent(
    models,
    subdomain,
    workflow,
  );
  if (agentId) {
    await models.MastraWorkflow.updateOne(
      { _id: workflow._id },
      { $set: { agentId } },
    );
    console.info(
      `[erxes-agent:workflows] ${workflow._id} assigned to AI member ${agentId} (${rule})`,
    );
    return;
  }
  if (workflow.isEnabled) {
    await models.MastraWorkflow.updateOne(
      { _id: workflow._id },
      { $set: { isEnabled: false } },
    );
  }
  console.warn(
    `[erxes-agent:workflows] ${workflow._id} has no active AI team member; disabled`,
  );
}

export async function backfillTenantWorkflows(
  models: IModels,
  subdomain: string,
): Promise<void> {
  const cursor = models.MastraWorkflow.find({
    $or: [{ agentId: { $exists: false } }, { agentId: null }, { agentId: '' }],
  }).cursor() as AsyncIterable<IMastraWorkflowDocument>;

  for await (const workflow of cursor) {
    try {
      await backfillOneWorkflow(models, subdomain, workflow);
    } catch (error) {
      console.error(
        `[erxes-agent:workflows] backfill failed for ${workflow._id}: ${
          (error as Error).message
        }`,
      );
    }
  }
}

export async function backfillWorkflowAgents(): Promise<void> {
  for (const subdomain of await tenants()) {
    try {
      const models = await generateModels(subdomain);
      await backfillTenantWorkflows(models, subdomain);
    } catch (error) {
      console.error(
        `[erxes-agent:workflows] backfill failed for ${subdomain}: ${
          (error as Error).message
        }`,
      );
    }
  }
}
