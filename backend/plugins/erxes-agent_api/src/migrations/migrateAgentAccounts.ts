import type { Collection, Filter } from 'mongodb';
import { getEnv, getSaasOrganizations } from 'erxes-api-shared/utils';
import { generateModels, type IModels } from '~/connectionResolvers';
import {
  adoptLegacyAgentAccount,
  createAgentAccount,
  findCoreUsers,
  getAgentAccount,
  retireLegacyAgentAccount,
  updateAgentAccount,
} from '~/mastra/auth/servicePrincipal';

interface LegacyAgentProfile {
  _id: string;
  name?: string;
  agentId?: string;
  description?: string;
  isEnabled?: boolean;
  serviceUserId?: string;
  agentUserId?: string;
  grantGroupId?: string;
  createdBy?: string;
  visibility?: string;
  teamId?: string;
  departmentId?: string;
  unitId?: string;
}

const LEGACY_FILTER: Filter<LegacyAgentProfile> = {
  $or: [
    { name: { $exists: true } },
    { agentId: { $exists: true } },
    { isEnabled: { $exists: true } },
    { serviceUserId: { $exists: true } },
    { agentUserId: { $exists: true } },
    { grantGroupId: { $exists: true } },
  ],
};

const LEGACY_FIELDS = {
  name: '',
  agentId: '',
  description: '',
  isEnabled: '',
  serviceUserId: '',
  agentUserId: '',
  grantGroupId: '',
  createdBy: '',
  visibility: '',
  teamId: '',
  departmentId: '',
  unitId: '',
} as const;

const agentCollection = (models: IModels): Collection<LegacyAgentProfile> =>
  models.MastraAgent.collection as unknown as Collection<LegacyAgentProfile>;

const legacyAccountFor = async (subdomain: string, userId?: string) => {
  if (!userId) return null;
  const [account] = await findCoreUsers(subdomain, { _id: userId });
  return account ?? null;
};

const migrateProfile = async (
  models: IModels,
  subdomain: string,
  profile: LegacyAgentProfile,
): Promise<void> => {
  const legacyUserId = profile.serviceUserId || profile.agentUserId;
  const legacyAccount = await legacyAccountFor(subdomain, legacyUserId);
  const name =
    profile.name?.trim() ||
    legacyAccount?.details?.fullName?.trim() ||
    profile.agentId?.trim() ||
    'AI team member';
  const description =
    profile.description?.trim() ||
    legacyAccount?.details?.description?.trim() ||
    '';
  const permissionGroupIds = legacyAccount?.permissionGroupIds?.length
    ? legacyAccount.permissionGroupIds
    : profile.grantGroupId
    ? [profile.grantGroupId]
    : [];
  const input = {
    name,
    description,
    permissionGroupIds,
    isActive: profile.isEnabled !== false,
  };

  try {
    await getAgentAccount({
      userId: profile._id,
      subdomain,
      requireActive: false,
    });
    await updateAgentAccount({ userId: profile._id, subdomain, input });
  } catch {
    const targetAccount = await legacyAccountFor(subdomain, profile._id);
    if (targetAccount) {
      await adoptLegacyAgentAccount({
        userId: profile._id,
        subdomain,
        ...input,
        isActive: input.isActive,
      });
    } else {
      await createAgentAccount({
        userId: profile._id,
        subdomain,
        input,
      });
    }
  }

  if (legacyUserId && legacyUserId !== profile._id) {
    await retireLegacyAgentAccount({
      userId: legacyUserId,
      subdomain,
    }).catch((error) => {
      console.warn(
        `[erxes-agent:accounts] kept legacy account ${legacyUserId}: ${
          (error as Error).message
        }`,
      );
    });
  }

  await agentCollection(models).updateOne(
    { _id: profile._id },
    { $unset: LEGACY_FIELDS },
  );
  console.info(`[erxes-agent:accounts] migrated AI team member ${profile._id}`);
};

export async function migrateTenantAgentAccounts(
  models: IModels,
  subdomain: string,
): Promise<void> {
  const cursor = agentCollection(models).find(LEGACY_FILTER);
  for await (const profile of cursor) {
    try {
      await migrateProfile(models, subdomain, profile);
    } catch (error) {
      console.error(
        `[erxes-agent:accounts] migration failed for ${profile._id}: ${
          (error as Error).message
        }`,
      );
    }
  }
}

const tenantSubdomains = async (): Promise<string[]> => {
  if (getEnv({ name: 'VERSION' }) !== 'saas') return ['os'];
  const organizations = await getSaasOrganizations();
  return organizations.map(
    (organization: { subdomain: string }) => organization.subdomain,
  );
};

/** Idempotent startup cutover from legacy agent + service-user pairs to one
 * canonical team-member ID. Failed profiles remain legacy-shaped and retry. */
export async function migrateAgentAccounts(): Promise<void> {
  for (const subdomain of await tenantSubdomains()) {
    try {
      const models = await generateModels(subdomain);
      await migrateTenantAgentAccounts(models, subdomain);
    } catch (error) {
      console.error(
        `[erxes-agent:accounts] tenant migration failed for ${subdomain}: ${
          (error as Error).message
        }`,
      );
    }
  }
}
