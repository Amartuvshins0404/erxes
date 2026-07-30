import type { Collection, Filter } from 'mongodb';
import { getEnv, getSaasOrganizations } from 'erxes-api-shared/utils';
import { generateModels, type IModels } from '~/connectionResolvers';
import {
  adoptLegacyAgentAccount,
  createAgentAccount,
  findCoreUsers,
  getAgentAccount,
  isAdoptableAgentAccount,
  updateAgentAccount,
} from '~/mastra/auth/servicePrincipal';

interface LegacyAgentProfile {
  [key: string]: unknown;
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

const profileCollection = (models: IModels): Collection<LegacyAgentProfile> =>
  models.MastraAgent.collection as unknown as Collection<LegacyAgentProfile>;

const legacyAgentCollection = (
  models: IModels,
): Collection<LegacyAgentProfile> =>
  models.MastraAgent.db.collection(
    'mastra_agents',
  ) as unknown as Collection<LegacyAgentProfile>;

const legacyAccountFor = async (subdomain: string, userId?: string) => {
  if (!userId) return null;
  const [account] = await findCoreUsers(subdomain, { _id: userId });
  return account ?? null;
};

const migrateProfile = async (
  subdomain: string,
  profile: LegacyAgentProfile,
  source: Collection<LegacyAgentProfile>,
  target: Collection<LegacyAgentProfile>,
): Promise<void> => {
  const legacyUserId = profile.serviceUserId || profile.agentUserId;
  const legacyCandidate = await legacyAccountFor(subdomain, legacyUserId);
  const legacyAccount = isAdoptableAgentAccount(legacyCandidate)
    ? legacyCandidate
    : null;
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
    const targetCandidate = await legacyAccountFor(subdomain, profile._id);
    const accountToAdopt = [legacyAccount, targetCandidate].find(
      isAdoptableAgentAccount,
    );
    if (accountToAdopt) {
      await adoptLegacyAgentAccount({
        agentId: profile._id,
        accountId: accountToAdopt._id,
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

  if (source.collectionName === target.collectionName) {
    await target.updateOne({ _id: profile._id }, { $unset: LEGACY_FIELDS });
  } else {
    const { _id, ...runtimeProfile } = profile;
    for (const field of Object.keys(LEGACY_FIELDS)) {
      delete runtimeProfile[field];
    }
    await target.updateOne(
      { _id },
      { $setOnInsert: runtimeProfile },
      { upsert: true },
    );
    await source.deleteOne({ _id });
  }
  console.info(`[erxes-agent:accounts] migrated AI team member ${profile._id}`);
};

const migrateCollection = async (
  subdomain: string,
  source: Collection<LegacyAgentProfile>,
  target: Collection<LegacyAgentProfile>,
  filter: Filter<LegacyAgentProfile>,
): Promise<void> => {
  const cursor = source.find(filter);
  for await (const profile of cursor) {
    try {
      await migrateProfile(subdomain, profile, source, target);
    } catch (error) {
      console.error(
        `[erxes-agent:accounts] migration failed for ${profile._id}: ${
          (error as Error).message
        }`,
      );
    }
  }
};

export async function migrateTenantAgentAccounts(
  models: IModels,
  subdomain: string,
): Promise<void> {
  const target = profileCollection(models);
  await migrateCollection(subdomain, target, target, LEGACY_FILTER);

  const legacy = legacyAgentCollection(models);
  if (legacy.collectionName !== target.collectionName) {
    await migrateCollection(subdomain, legacy, target, {});
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
 * canonical core account link. Failed profiles remain legacy-shaped and retry. */
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
