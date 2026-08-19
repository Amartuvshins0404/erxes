import { MongoServerError, type Collection, type Filter } from 'mongodb';
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

const LEGACY_AGENT_ID_INDEX = 'agentId_1';

// MongoDB rejects dropIndexes while any index build is in progress on the
// collection (BackgroundOperationInProgressForNamespace).
const BACKGROUND_BUILD_IN_PROGRESS = 12586;
const DROP_INDEX_MAX_ATTEMPTS = 5;

const agentCollection = (models: IModels): Collection<LegacyAgentProfile> =>
  models.MastraAgent.collection as unknown as Collection<LegacyAgentProfile>;

const dropLegacyAgentIdIndex = async (models: IModels): Promise<void> => {
  // generateModels() just compiled this model; with Mongoose autoIndex its
  // schema indexes build in the background. Await them so the drop below does
  // not race the build and fail with error 12586. A failed build is no longer
  // "in progress", so log and proceed — the drop can still succeed.
  try {
    await models.MastraAgent.init();
  } catch (error) {
    console.error(
      `[erxes-agent:accounts] index build wait failed, attempting drop anyway: ${
        (error as Error).message
      }`,
    );
  }

  const collection = agentCollection(models);
  for (let attempt = 1; ; attempt++) {
    try {
      if (!(await collection.indexExists(LEGACY_AGENT_ID_INDEX))) return;
      await collection.dropIndex(LEGACY_AGENT_ID_INDEX);
      return;
    } catch (error) {
      if (!(error instanceof MongoServerError)) throw error;
      if (error.code === 27) return; // IndexNotFound: already dropped
      if (
        error.code !== BACKGROUND_BUILD_IN_PROGRESS ||
        attempt >= DROP_INDEX_MAX_ATTEMPTS
      ) {
        throw error;
      }
      // Another build (e.g. from a concurrent deploy) is still draining.
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
};

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
  await dropLegacyAgentIdIndex(models);
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
